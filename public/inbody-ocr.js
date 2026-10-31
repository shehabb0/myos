/* InBody photograph import: on-device OCR, never auto-saves unreviewed results. */
(function(){
 'use strict';
 const number = text => {
  const s=String(text||'').replace(/(\d),(\d)/g,'$1.$2');
  const hit=s.match(/(?<![\d.])\d{1,4}(?:\.\d{1,2})?/);
  return hit?Number(hit[0]):null;
 };
 const valid = (key,value) => {
  const ranges={weight:[25,250],bodyFat:[3,65],bodyFatMass:[1,125],muscleMass:[5,85],segmentalFat:[0.1,30]};
  return Number.isFinite(value)&&value>=ranges[key][0]&&value<=ranges[key][1];
 };
 const rules=[
  ['bodyFatMass',/^\s*(?:for storing excess energy\s*)?(?:body\s*fat\s*mass|fat\s*mass)\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['muscleMass',/^\s*(?:smm|skeletal\s*muscle\s*mass)\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['bodyFat',/^\s*(?:pbf|percent\s*body\s*fat|body\s*fat\s*\(%\)|body\s*fat\s*percentage|percentage\s*body\s*fat)\s*(?:\(?%\)?)?\s*[:\-]?\s*/i],
  ['weight',/^\s*(?:sum\s*of\s*the\s*above\s*)?(?:body\s*)?weight\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i],
  ['segmentalFat',/^\s*(?:segmental\s*fat\s*analysis\s*[\–-]\s*center|trunk\s*fat\s*mass)\s*(?:\(?kg\)?)?\s*[:\-]?\s*/i]
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

// Find the RIGHT Segmental Fat Analysis panel, not Segmental Lean Analysis.
function fatAnalysisRectangle(data,width,height){
 const blocks=Array.isArray(data?.blocks)?data.blocks:[];
 const blockLines=blocks.flatMap(block=>(block.paragraphs||[]).flatMap(p=>p.lines||[]));
 const lines=Array.isArray(data?.lines)&&data.lines.length?data.lines:blockLines;
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
 let title=lines.find(line=>/segmental\s*fat\s*analysis/i.test(clean(line.text))&&line.bbox);
 if(!title){
  title=lines.find((line,i)=>{
   if(!line.bbox||!/segmental\s*fat/i.test(clean(line.text)))return false;
   return /analysis/i.test(clean(line.text))||lines.slice(i+1,i+3).some(n=>/analysis/i.test(clean(n.text))&&n.bbox&&Math.abs(n.bbox.y0-line.bbox.y0)<height*.04);
  });
 }
 if(!title)return null;
 const bbox=title.bbox;
 if(!Number.isFinite(bbox.x0)||!Number.isFinite(bbox.y1))return null;
 const left=Math.max(0,Math.floor(bbox.x0-width*.014));
 const top=Math.min(height-1,Math.max(0,Math.floor(bbox.y1+height*.003)));
 const w=Math.min(width-left,Math.ceil(width*.32));
 const h=Math.min(height-top,Math.ceil(height*.24));
 if(w<60||h<90)return null;
 return {top,left,width:w,height:h};
}
// This crop contains the five Segmental Fat Analysis masses: two arms,
// the large central trunk mass, then two legs. Never use the percentage.
function centralFatFromSection(text){
 const src=String(text||'').replace(/,/g,'.');
 const kg=[...src.matchAll(/(^|[^\d.])(\d{1,2}\.\d{1,2})\s*k[gq]\b/gim)]
  .map(m=>Number(m[2])).filter(v=>v>=.1&&v<=30);
 // All five kg values share this chart; the middle trunk is the largest.
 if(kg.length>=2){
  const max=Math.max(...kg);
  return max>=2&&kg.filter(v=>v===max).length===1?max:null;
 }
 // Some photos lose the "kg" glyph. Only infer from multiple decimal
 // masses in this tightly bounded panel, and NEVER from percentage values.
 const withoutPercents=src.replace(/\b\d{1,3}(?:\.\d+)?\s*%/g,' ');
 const decimals=[...withoutPercents.matchAll(/(^|[^\d.])(\d{1,2}\.\d{1,2})(?![\d.])/gm)]
  .map(m=>Number(m[2])).filter(v=>v>=.1&&v<=15);
 if(decimals.length<3)return null;
 const max=Math.max(...decimals);
 if(max<2||decimals.filter(v=>v===max).length!==1)return null;
 return max;
}
async function readSegmentalFat(worker,file,data,onProgress){
 let bitmap=null;
 try{
  if(typeof createImageBitmap!=='function')return null;
  bitmap=await createImageBitmap(file);
  const rectangle=fatAnalysisRectangle(data,bitmap.width,bitmap.height);
  if(!rectangle)return null;
  onProgress('Reading the center Segmental Fat Analysis value…');
  const scanned=await worker.recognize(file,{rectangle});
  return centralFatFromSection(scanned?.data?.text);
 }catch(error){return null}
 finally{bitmap?.close?.()}
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
   // A second, localized OCR pass avoids mixing the trunk measurement with
   // arm/leg lean-mass values elsewhere on the report.
   const center=await readSegmentalFat(worker,file,result.data,onProgress);
   if(center!==null)values.segmentalFat=center;
   return {values,text,confidence:result?.data?.confidence??null};
  }finally{if(worker)await worker.terminate();}
 }
 window.MYOS_INBODY={parse,scan,centralFatFromSection,fatAnalysisRectangle};
})();