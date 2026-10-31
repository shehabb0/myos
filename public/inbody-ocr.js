/* InBody photograph import: on-device OCR, never auto-saves unreviewed results. */
(function(){
 'use strict';
 const number = text => {
  const s=String(text||'').replace(/(\d),(\d)/g,'$1.$2');
  const hit=s.match(/(?<![\d.])\d{1,4}(?:\.\d{1,2})?/);
  return hit?Number(hit[0]):null;
 };
 const valid = (key,value) => {
  const ranges={weight:[25,250],bodyFat:[3,65],bodyFatMass:[1,125],muscleMass:[5,85],bmi:[10,70],bmr:[500,3500],visceralFat:[1,40],bodyWater:[10,90],waistHipRatio:[.5,1.5],inbodyScore:[1,100],fatFreeMass:[10,180]};
  return Number.isFinite(value)&&value>=ranges[key][0]&&value<=ranges[key][1];
 };
 const rules=[
  ['bodyFatMass',/^\s*(?:for storing excess energy\s*)?(?:body\s*fat\s*mass|fat\s*mass)\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['muscleMass',/^\s*(?:smm|skeletal\s*muscle\s*mass)\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['bodyFat',/^\s*(?:pbf|percent\s*body\s*fat|body\s*fat\s*\(%\)|percentage\s*body\s*fat)\s*(?:\(?%\)?)?\s*[:\-]?\s*/i],
  ['weight',/^\s*(?:sum\s*of\s*the\s*above\s*)?(?:body\s*)?weight\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['bmi',/^\s*bmi\s*(?:\(?kg\s*\/\s*m2\)?)?\s*[:\-]?\s*/i],
  ['bmr',/^\s*basal\s*metabolic\s*rate\s*(?:\(?kcal\)?)?\s*[:\-]?\s*/i],
  ['visceralFat',/^\s*visceral\s*fat\s*level\s*[:\-]?\s*/i],
  ['bodyWater',/^\s*(?:total\s*body\s*water)\s*(?:\(?l\)?)?\s*[:\-]?\s*/i],
  ['waistHipRatio',/^\s*waist[-\s]*hip\s*ratio\s*[:\-]?\s*/i],
  ['inbodyScore',/^\s*inbody\s*score\s*[:\-]?\s*/i],
  ['fatFreeMass',/^\s*fat[-\s]*free\s*mass\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i]
 ];
 function dateFrom(text){
  const lines=String(text||'').split(/\r?\n/).slice(0,28);
  const header=lines.join(' ');
  const regexes=[
   /\b(20\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})\b/g,
   /\b(\d{1,2})[.\-\/](\d{1,2})[.\-\/](20\d{2})\b/g
  ];
  for(let k=0;k<regexes.length;k++){
   let hit;
   while((hit=regexes[k].exec(header))){
    const [yy,mm,dd]=k===0?[+hit[1],+hit[2],+hit[3]]:[+hit[3],+hit[2],+hit[1]];
    const date=[yy,String(mm).padStart(2,'0'),String(dd).padStart(2,'0')].join('-');
    const d=new Date(date+'T12:00:00Z');
    if(yy>=2020&&yy<=2035&&d.getUTCFullYear()===yy&&d.getUTCMonth()+1===mm&&d.getUTCDate()===dd)return date;
   }
  }
  return null;
 }
 function parse(text){
  const lines=String(text||'').replace(/[|]/g,' ').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const values={date:dateFrom(text)};
  for(const line of lines){
   for(const [key,regex] of rules){
    if(values[key]!=null)continue;
    const match=regex.exec(line);
    if(!match)continue;
    let tail=line.slice(match[0].length).replace(/^[\s:;()\-\t]+/,'');
    const nums=tail.match(/\d+(?:[.,]\d+)?/g)||[];
    if(nums.length>6)continue; // Reject histogram axis ticks.
    const x=number(tail);
    if(x!==null&&valid(key,x))values[key]=x;
   }
  }
  // Photo scans sometimes break the weight row ("Sum of the ... Weight 7 - 62.7").
  // Only take a lone plausible value; never infer it from graph scale ticks or target weight.
  if(values.weight==null){
   for(const line of lines){
    if(!/\bweight\b/i.test(line)||/\b(?:target weight|weight control|weight change|weight reduction)\b/i.test(line))continue;
    const at=line.search(/\bweight\b/i);
    const tail=line.slice(at+6);
    const numbers=(tail.match(/\b\d{2,3}[.,]\d\b/g)||[]).map(t=>Number(t.replace(',','.'))).filter(n=>valid('weight',n));
    if(numbers.length===1){values.weight=numbers[0];break;}
   }
  }
  return values;
 }
 let scriptPromise=null;
 function getTesseract(){
  if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
  if(scriptPromise)return scriptPromise;
  scriptPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
   script.async=true;script.crossOrigin='anonymous';
   script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error('The text scanner could not initialize.'));
   script.onerror=()=>reject(new Error('Could not load the on-device text scanner. Check your internet connection.'));
   document.head.appendChild(script);
  }).catch(error=>{scriptPromise=null;throw error});
  return scriptPromise;
 }
 async function scan(file,onProgress=()=>{}){
  if(!file||!/^image\/(?:jpeg|png|webp|bmp)$/i.test(file.type))throw new Error('Choose a JPG, PNG, or WebP image.');
  if(file.size>20*1024*1024)throw new Error('Please choose an image smaller than 20 MB.');
  onProgress('Loading image reader…');
  const tess=await getTesseract();
  let worker;
  try{
   worker=await tess.createWorker('eng',1,{logger:msg=>{
    if(msg.status==='recognizing text')onProgress('Reading report… '+Math.round((msg.progress||0)*100)+'%');
   }});
   const result=await worker.recognize(file);
   const text=String(result?.data?.text||'');
   const values=parse(text);
   return {values,text,confidence:result?.data?.confidence??null};
  }finally{if(worker)await worker.terminate();}
 }
 window.MYOS_INBODY={parse,scan};
})();