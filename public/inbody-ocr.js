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
  // Body Fat Mass uses the measured (not reference / chart scale) value.
  // Skeletal muscle mass is read separately from the dedicated graph region.
  // The full line includes chart tick numbers, which are NOT SMM.
  ['bodyFat',/^\s*(?:pbf|percent\s*body\s*fat|body\s*fat\s*\(%\)|body\s*fat\s*percentage|percentage\s*body\s*fat)\s*(?:\(?%\)?)?\s*[:\-]?\s*/i],
  // Body Weight is parsed separately because the measured value shares a row
  // with the 50.9-68.9 kg reference range. Trunk fat is read ONLY from
  // the kg-labelled center of its chart, never from general text.
 ];


function bodyFatMassFromText(text){
 const lines=String(text||'').split(/\r?\n/);
 const graph=lines.findIndex(line=>/muscle[\s-]*fat\s*analysis/i.test(line));
 const head=lines.findIndex(line=>/body\s*composition\s*analysis/i.test(line));
 const begin=head>=0?head:0;
 const end=graph>begin?graph:Math.min(lines.length,begin+20);
 const candidates=[];
 for(let i=begin;i<end;i++){
  const line=lines[i];
  const match=/body\s*fat\s*mass/i.exec(line);
  if(!match)continue;
  let tail=line.slice(match.index+match[0].length);
  // Remove the unit and ignore everything inside reference-range brackets.
  tail=tail.replace(/^\s*\(?\s*k[gq]\s*\)?/i,'').split(/[({|~]/)[0];
  const nums=[...tail.matchAll(/(^|[^\d.])(\d{1,2}[.,]\d{1,2})(?![\d.])/g)]
     .map(m=>Number(m[2].replace(',','.'))).filter(v=>valid('bodyFatMass',v));
  if(nums.length===1)candidates.push(nums[0]);
 }
 return candidates.length?candidates[0]:null;
}
function reconcileBodyFatMass(values){
 const measured=values.bodyFatMass;
 const weight=values.weight,bodyFat=values.bodyFat;
 if(!valid('weight',weight)||!valid('bodyFat',bodyFat))return;
 const estimate=Math.round(weight*bodyFat)/100; // weight * PBF / 100, 2 decimal places.
 const rounded=Math.round(estimate*10)/10;
 if(!valid('bodyFatMass',rounded))return;
 // BIA reports round mass to 0.1 kg. If OCR captured a chart tick or a
 // reference-range value instead, use the consistent rounded calculation.
 if(measured==null||Math.abs(measured-rounded)>.35){
  values.bodyFatMass=rounded;
  values.bodyFatMassCalculated=true;
 }
}
function inBodyLayout(text){
 const t=String(text||'').replace(/\s+/g,'');
 return /inbody120/i.test(t)?'120':/inbody230/i.test(t)?'230':null;
}
function profileRegions(type,width,height){
 const r=(l,t,w,h)=>({left:Math.round(l*width),top:Math.round(t*height),width:Math.round(w*width),height:Math.round(h*height)});
 // Pixel positions were checked against the two photographed reports.
 return type==='120'?
  {fat:r(.210,.237,.345,.024),trunk:r(.425,.671,.068,.0195)}:
  {fat:r(.210,.216,.345,.024),trunk:r(.431,.64375,.072,.024)};
}
function plausibleTrunk(value,totalFat){
 if(value==null||!valid('segmentalFat',value))return false;
 // Trunk mass cannot exceed whole-body fat mass. The lower guard also
 // excludes the much smaller arm values if a neighboring chart was cropped.
 if(valid('bodyFatMass',totalFat)&& (value>totalFat || value<totalFat*.23))return false;
 return true;
}
async function recognizeRegion(worker,bitmap,rect,onProgress,label,psm=7,contrast=false){
 if(!rect||!Number.isFinite(rect.left)||rect.width<25||rect.height<15)return '';
 onProgress(label);
 if(typeof worker.setParameters==='function')
  await worker.setParameters({tessedit_pageseg_mode:String(psm)});
 const canvas=makeRegionCanvas(bitmap,rect,4,contrast);
 if(!canvas)return '';
 const res=await worker.recognize(canvas);
 return String(res?.data?.text||'');
}
async function readCompositionFat(worker,bitmap,fullText,onProgress){
 const layout=inBodyLayout(fullText);
 const types=layout?[layout]:['120','230'];
 for(const type of types){
  const region=profileRegions(type,bitmap.width,bitmap.height).fat;
  for(const psm of [7,6]){
   const text=await recognizeRegion(worker,bitmap,region,onProgress,'Reading Body Fat Mass…',psm,false);
   const value=bodyFatMassFromText('Body Composition Analysis\n'+text);
   if(value!=null)return value;
  }
 }
 return null;
}
async function readTrunkCenter(worker,bitmap,fullText,totalFat,onProgress){
 const layout=inBodyLayout(fullText);
 const types=layout?[layout]:['120','230'];
 for(const type of types){
  const region=profileRegions(type,bitmap.width,bitmap.height).trunk;
  for(const [psm,contrast] of [[7,false],[7,true],[6,false]]){
   const text=await recognizeRegion(worker,bitmap,region,onProgress,'Reading center trunk-fat kg value…',psm,contrast);
   const value=centralFatFromSection(text);
   if(plausibleTrunk(value,totalFat))return value;
  }
 }
 return null;
}

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
  values.bodyFatMass=bodyFatMassFromText(text);
  return values;
 }

// Chart coordinates are calculated from the full-size report and refined by
// headings where available. Both InBody120 and InBody230 put the SMM number
// beside the middle bar of the Muscle-Fat Analysis chart.
function muscleRegion(data,width,height){
 const lines=Array.isArray(data?.lines)?data.lines:[];
 const heading=lines.find(l=>l.bbox&&/muscle[\s-]*fat\s*analysis/i.test(String(l.text||'')));
 const top=heading?Math.round(heading.bbox.y1+height*.045):Math.round(height*.355);
 const left=Math.round(width*.262);
 const w=Math.round(width*.151);
 const h=Math.round(height*.067);
 return {left,top:Math.max(0,Math.min(height-h,top)),width:w,height:h};
}
function smmFromSection(text){
 // Only one plausible decimal value should be present in the targeted SMM row.
 // Ignore graph ticks (integers such as 90, 100, 110) and fat mass (12.0 kg).
 const candidates=[...String(text||'').replace(/,/g,'.').matchAll(/(^|[^\d.])(\d{1,2}\.\d{1,2})(?![\d.])/gm)]
 .map(m=>Number(m[2])).filter(n=>n>=17&&n<=55);
 const values=[...new Set(candidates)];
 return values.length===1?values[0]:null;
}
function centralFatFromSection(text){
 const src=String(text||'').replace(/,/g,'.');
 // The crop contains only the trunk value, NOT the whole segmental chart.
 // Never turn a percentage or a neighboring arm value into kg.
 const values=[...src.matchAll(/(^|[^\d.])(\d{1,2}(?:\.\d{1,2})?)\s*k[gq9o0]\b/gim)]
  .map(m=>Number(m[2])).filter(n=>valid('segmentalFat',n));
 const unique=[...new Set(values)];
 return unique.length===1?unique[0]:null;
}

function makeRegionCanvas(bitmap,rect,scale=3,contrast=false){
 const canvas=document.createElement('canvas');
 canvas.width=Math.round(rect.width*scale);canvas.height=Math.round(rect.height*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return null;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(bitmap,rect.left,rect.top,rect.width,rect.height,0,0,canvas.width,canvas.height);
 if(contrast){
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){
   const g=.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2];
   const level=Math.max(0,Math.min(255,(g-105)*1.7+125));
   pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=level;
  }
  ctx.putImageData(pixels,0,0);
 }
 return canvas;
}
async function readMuscleMass(worker,bitmap,data,onProgress){
 try{
  if(typeof document==='undefined'||!document.createElement)return null;
  onProgress('Reading skeletal muscle mass…');
  const region=muscleRegion(data,bitmap.width,bitmap.height);
  for(const [psm,highContrast] of [[6,false],[11,true]]){
   if(typeof worker.setParameters==='function')await worker.setParameters({tessedit_pageseg_mode:String(psm)});
   const canvas=makeRegionCanvas(bitmap,region,3,highContrast);
   if(!canvas)continue;
   const ocr=await worker.recognize(canvas);
   const value=smmFromSection(ocr?.data?.text);
   if(value!==null)return value;
  }
 }catch(e){return null;}
 return null;
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
  top=Math.round(bitmap.height*.205);
  left=Math.round(bitmap.width*.14);
  width=Math.round(bitmap.width*.47);
  height=Math.round(bitmap.height*.10);
 }
 const canvas=makeRegionCanvas(bitmap,{left,top,width,height},2,false);
 if(!canvas)return null;
 const output=await worker.recognize(canvas);
 return weightFromText(output?.data?.text);
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
     // Use chart-focused OCR rather than the text beside graph scale ticks.
     // Never substitute weight, fat mass, or a body-fat percentage for SMM.
     values.muscleMass=null;
     const muscle=await readMuscleMass(worker,bitmap,result.data,onProgress);
     if(muscle!==null)values.muscleMass=muscle;
     // The chart alone is unreliable for Fat Mass: its labels look like
     // measured kilograms. Re-scan the composition row and cross-check PBF.
     try{
      const composition=await readCompositionFat(worker,bitmap,text,onProgress);
      if(composition!==null)values.bodyFatMass=composition;
     }catch(err){/* Keep previously read values for review. */}
     reconcileBodyFatMass(values);
     try{
      const trunk=await readTrunkCenter(worker,bitmap,text,values.bodyFatMass,onProgress);
      if(trunk!==null)values.segmentalFat=trunk;
     }catch(err){/* Leave trunk fat blank rather than guessing. */}
    }
   }finally{bitmap?.close?.();}
   reconcileBodyFatMass(values);
   return {values,text,confidence:result?.data?.confidence??null};
  }finally{if(worker)await worker.terminate();}
 }
 window.MYOS_INBODY={parse,scan,centralFatFromSection,weightFromText,bodyFatMassFromText,reconcileBodyFatMass,profileRegions,inBodyLayout,plausibleTrunk,muscleRegion,smmFromSection};
})();