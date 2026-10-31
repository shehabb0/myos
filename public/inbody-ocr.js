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
  // Body Weight is parsed separately because the measured value shares a row
  // with the 50.9-68.9 kg reference range. Trunk fat is read ONLY from
  // the kg-labelled center of its chart, never from general text.
 ];

function weightFromText(text){
 const lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const graphStart=lines.findIndex(line=>/muscle[\s-]*fat\s+analysis/i.test(line));
 const candidates=[];
 for(let index=0;index<lines.length;index++){
  const line=lines[index];
  const weight=/\bweight\b/i.exec(line);
  if(!weight||/\b(?:target\s*weight|weight\s*control|weight\s*change|weight\s*history|body\s*weight\s+is|fat\s*free)\b/i.test(line))continue;
  const tail=line.slice(weight.index+weight[0].length);
  const numbers=[...tail.matchAll(/\b(\d{2,3}[.,]\d{1,2})\b/g)];
  const measured=numbers.find(match=>{
   const pos=match.index, before=tail.slice(0,pos);
   // Bracketed (50.9 - 68.9) values are reference intervals, not results.
   if(before.lastIndexOf('(')>before.lastIndexOf(')'))return false;
   return valid('weight',Number(match[1].replace(',','.')));
  });
  if(!measured)continue;
  const value=Number(measured[1].replace(',','.'));
  const isBodyTable=graphStart<0||index<graphStart;
  const isSumRow=/sum\s+of\s+the|sum\s+of\s+the\s+above|sum\s+of\s+the\s+bove/i.test(line);
  const score=(isSumRow?10:0)+(isBodyTable?5:0)+(weight.index<line.length*.55?1:0);
  candidates.push({value,score,index});
 }
 candidates.sort((a,b)=>b.score-a.score||a.index-b.index);
 return candidates.length?candidates[0].value:null;
}
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
  values.weight=weightFromText(text);
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

// Crop ONLY the middle, upper line of the Segmental Fat Analysis diagram.
// The row below contains a percentage and must never be used as kg.
function trunkFatRectangle(data,width,height){
 const blocks=Array.isArray(data?.blocks)?data.blocks:[];
 const lines=Array.isArray(data?.lines)&&data.lines.length?data.lines:
  blocks.flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const heading=lines.find(line=>line.bbox&&/segmental\s*fat\s*analysis/i.test(clean(line.text)));
 if(!heading||!Number.isFinite(heading.bbox.x0)||!Number.isFinite(heading.bbox.y1))return null;
 // The trunk label is centered below this heading in both InBody120 and 230.
 const mid=heading.bbox.x0+width*.098;
 const left=Math.max(0,Math.round(mid-width*.064));
 const top=Math.max(0,Math.round(heading.bbox.y1+height*.005));
 const w=Math.min(width-left,Math.round(width*.128));
 const h=Math.min(height-top,Math.round(height*.028));
 return w>=45&&h>=22?{left,top,width:w,height:h}:null;
}
function centralFatFromSection(text){
 const src=String(text||'').replace(/,/g,'.');
 // A value without a readable kg unit is deliberately left blank.
 // Even if OCR reads "22.8" or "165.6", it cannot become trunk-fat kg.
 const found=[...src.matchAll(/(^|[^\d.])(\d{1,2}(?:\.\d{1,2})?)\s*k[gq9o0]\b/gim)]
  .map(m=>Number(m[2])).filter(value=>valid('segmentalFat',value));
 if(!found.length)return null;
 const largest=Math.max(...found);
 return found.filter(x=>x===largest).length===1?largest:null;
}

async function readBodyWeight(worker,bitmap,data){
 const lines=Array.isArray(data?.lines)?data.lines:[];
 const hasBodyHeading=lines.find(line=>line.bbox&&/body\s*composition\s*analysis/i.test(String(line.text||'')));
 let top, left, width, height;
 if(hasBodyHeading){
  top=Math.max(0,Math.round(hasBodyHeading.bbox.y1+bitmap.height*.086));
  left=Math.round(bitmap.width*.17);
  width=Math.round(bitmap.width*.43);
  height=Math.round(bitmap.height*.066);
 }else{
  // Broad enough for InBody120 and InBody230 table layouts. Reject values
  // when the cropped text does not actually contain a Weight row.
  top=Math.round(bitmap.height*.205);
  left=Math.round(bitmap.width*.14);
  width=Math.round(bitmap.width*.47);
  height=Math.round(bitmap.height*.10);
 }
 const c=document.createElement('canvas');
 c.width=width*2;c.height=height*2;
 const ctx=c.getContext('2d');if(!ctx)return null;
 ctx.drawImage(bitmap,left,top,width,height,0,0,c.width,c.height);
 const output=await worker.recognize(c);
 return weightFromText(output?.data?.text);
}

async function readSegmentalFat(worker,file,data,onProgress,bitmap){
 try{
  if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
  const rect=trunkFatRectangle(data,bitmap.width,bitmap.height);
  if(!rect)return null;
  const canvas=document.createElement('canvas');
  const scale=3;
  canvas.width=rect.width*scale;canvas.height=rect.height*scale;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(bitmap,rect.left,rect.top,rect.width,rect.height,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  // Increase contrast to help with angled / blue-tinted phone photos.
  for(let i=0;i<pixels.data.length;i+=4){
   const gray=.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2];
   const level=Math.max(0,Math.min(255,(gray-105)*1.9+115));
   pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=level;
  }
  ctx.putImageData(pixels,0,0);
  onProgress('Reading the center trunk-fat kg value…');
  const scanned=await worker.recognize(canvas);
  return centralFatFromSection(scanned?.data?.text);
 }catch(error){return null;}
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
   // For photos that lose the weight row in the full-page OCR, check a
   // dedicated composition-table crop before leaving the field blank.
   let bitmap=null;
   try{
    if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(file);
    if(bitmap){
     if(values.weight==null){
      onProgress('Double-checking Body Weight…');
      const wt=await readBodyWeight(worker,bitmap,result.data);
      if(wt!==null)values.weight=wt;
     }
     const trunk=await readSegmentalFat(worker,file,result.data,onProgress,bitmap);
     if(trunk!==null)values.segmentalFat=trunk;
    }
   }finally{bitmap?.close?.();}
   return {values,text,confidence:result?.data?.confidence??null};
  }finally{if(worker)await worker.terminate();}
 }
 window.MYOS_INBODY={parse,scan,centralFatFromSection,trunkFatRectangle,weightFromText,fatAnalysisRectangle};
})();