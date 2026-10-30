/* MYOS GitHub Pages Notion bridge. Personal-token access only; no token in source code. */
(()=>{
'use strict';
const API='https://api.notion.com/v1';
const VERSION='2025-09-03';
const SETTINGS='myos_browser_notion_sources_v1';
const SESSION='myos_browser_notion_token_v1';
const REMEMBER='myos_remember_notion_token_v1';
const titles={daily:['Daily Nutrients'],exercises:['Exercises'],goals:['Fitness Goals'],targets:['Nutrition Goals','Nutrition Targets'],body:['Weight Tracker','Body Log'],foods:['Food Database'],meals:['Meal Database','Meals Database'],planner:['Meal Planner'],supplements:['Supplements']};
const uuid=s=>String(s||'').replace(/^collection:\/\//,'').replace(/-/g,'').trim();
const dateValid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00Z'));
const rich=t=>{const s=String(t??'');return (s.match(/[\s\S]{1,1800}/g)||[]).map(x=>({type:'text',text:{content:x}}));};
const prop=(type,value)=>type==='number'?{number:value===null||value===''?null:Number(value)}:type==='checkbox'?{checkbox:!!value}:type==='date'?{date:{start:value}}:type==='select'?{select:value?{name:String(value)}:null}:type==='title'?{title:rich(value)}:type==='relation'?{relation:(value||[]).map(id=>({id}))}:{rich_text:rich(value)};
const dailyType={Calories:'number',Protein:'number',Carbs:'number',Fat:'number',Fiber:'number',Sugar:'number',Sodium:'number','Water (ml)':'number','Calorie Target (g)':'number','Protein Target (g)':'number','Carbs Target (g)':'number','Fat Target (g)':'number','Water Target (ml)':'number','Creatine Taken':'checkbox','Whey Taken':'checkbox','Creatine (g)':'number','Whey Powder (g)':'number','Went to Gym?':'checkbox','Gym Day':'select','Foods Eaten':'rich_text',Notes:'rich_text'};
const readValue=p=>{if(!p)return null;switch(p.type){case'title':return (p.title||[]).map(v=>v.plain_text??v.text?.content??'').join('');case'rich_text':return(p.rich_text||[]).map(v=>v.plain_text??v.text?.content??'').join('');case'select':case'status':return p[p.type]?.name||null;case'multi_select':return(p.multi_select||[]).map(v=>v.name);case'relation':return(p.relation||[]).map(v=>v.id);case'date':return p.date?.start?.slice(0,10)||null;case'formula':case'rollup':return p[p.type]?.[p[p.type].type]??null;case'number':return p.number;case'checkbox':return p.checkbox;case'url':return p.url;default:return null;}};
const normalize=p=>({id:p.id,url:p.url,...Object.fromEntries(Object.entries(p.properties||{}).map(([name,v])=>[name,readValue(v)]))});
function getStore(name){try{return window[name]}catch{return null}}
function readStorage(key,name,fallback){try{return getStore(name)?.getItem(key)??fallback;}catch{return fallback;}}
let sources={};try{sources=JSON.parse(readStorage(SETTINGS,'localStorage','{}'))||{};}catch{}
let token=readStorage(SESSION,'sessionStorage','')||readStorage(REMEMBER,'localStorage','');
const configured=()=>Object.fromEntries(Object.keys(titles).map(k=>[k,!!sources[k]]));
async function notion(method,route,body,auth=token){
 if(!auth)throw new Error('Connect your private Notion integration first.');
 for(let attempt=0;attempt<3;attempt++){
  let response;
  try{response=await fetch(API+route,{method,cache:'no-store',headers:{Authorization:'Bearer '+auth,'Notion-Version':VERSION,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
  catch(err){throw new Error('Could not reach Notion. Check network access and your browser: '+err.message);}
  if(response.status===429&&attempt<2){await new Promise(r=>setTimeout(r,850*(attempt+1)));continue;}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`Notion ${response.status}: ${data.message||'Connection failed'}`);
  return data;
 }
}
async function discover(auth){
 const list=[];let cursor;
 do{
  const x=await notion('POST','/search',{filter:{property:'object',value:'data_source'},page_size:100,...(cursor?{start_cursor:cursor}:{})},auth);
  list.push(...(x.results||[]));cursor=x.has_more?x.next_cursor:null;
 }while(cursor&&list.length<400);
 const named=list.map(x=>({id:x.id,title:(x.title||[]).map(t=>t.plain_text||t.text?.content||'').join('').trim(),object:x.object}));
 const matched={};
 for(const [key,choices] of Object.entries(titles)){
  const found=named.filter(x=>choices.some(n=>x.title.toLowerCase()===n.toLowerCase()));
  // Never silently choose among duplicate titles. Ask for the exact source ID instead.
  if(found.length===1)matched[key]=found[0].id;
 }
 return {sources:matched,ambiguous:Object.fromEntries(Object.entries(titles).filter(([key,choices])=>named.filter(x=>choices.some(n=>x.title.toLowerCase()===n.toLowerCase())).length>1).map(([key])=>[key,true]))};
}
async function connect(auth,provided={},remember=false){
 const val=String(auth||'').trim();if(!val)throw new Error('Enter your Notion integration token.');
 const discovered=await discover(val);
 const next={...discovered.sources,...sources};
 for(const [key,id] of Object.entries(provided))if(titles[key]&&String(id||'').trim())next[key]=uuid(id);
 if(!next.daily)throw new Error('Daily Nutrients was not found. Share your Gym databases with the MYOS Notion connection or enter the Daily Nutrients data source ID under Advanced.');
 await notion('POST',`/data_sources/${uuid(next.daily)}/query`,{page_size:1},val);
 token=val;sources=next;
 try{getStore('localStorage')?.setItem(SETTINGS,JSON.stringify(sources));}catch{}
 try{getStore('sessionStorage')?.setItem(SESSION,token);if(remember)getStore('localStorage')?.setItem(REMEMBER,token);else getStore('localStorage')?.removeItem(REMEMBER);}catch{}
 return {connected:true,sources:configured(),ambiguous:discovered.ambiguous};
}
function disconnect(){token='';try{getStore('sessionStorage')?.removeItem(SESSION);getStore('localStorage')?.removeItem(REMEMBER);}catch{}}
async function query(type,max=150){if(!sources[type])return [];const out=[];let cursor;
 do{const x=await notion('POST',`/data_sources/${uuid(sources[type])}/query`,{page_size:100,...(cursor?{start_cursor:cursor}:{})});out.push(...(x.results||[]));cursor=x.has_more?x.next_cursor:null;}while(cursor&&out.length<max);
 return out.slice(0,max).map(normalize);
}
async function bootstrap(){const result={};const keys=Object.keys(titles);
 // Sequential requests respect Notion's 3 req/s guideline; do not misrepresent errors as empty data.
 for(const key of keys){result[key]=await query(key);}
 return result;
}
async function ensureDay(date){let day=(await query('daily',300)).find(d=>d.Date===date);if(day)return day;
 const targets=await query('targets',40),goal=targets.find(t=>t.Status==='Active')||targets[0]||{};
 const fields={Entry:prop('title','Daily Log'),Date:prop('date',date),'Calorie Target (g)':prop('number',goal['Daily Calories (kcal)']||2100),'Protein Target (g)':prop('number',goal['Protein (g)']||125),'Carbs Target (g)':prop('number',goal['Carbs (g)']||265),'Fat Target (g)':prop('number',goal['Fat (g)']||60),'Water Target (ml)':prop('number',goal['Water (ml)']||3000)};
 return normalize(await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(sources.daily)},properties:fields}));
}
async function route(url,options={}){
 const method=options.method||'GET',b=options.body?JSON.parse(options.body):{};
 if(url==='/api/status')return {live:!!token,authRequired:false,authenticated:true,configured:configured()};
 if(url==='/api/bootstrap')return token?{mode:'notion',data:await bootstrap()}:{mode:'demo'};
 if(url==='/api/logout'){disconnect();return {ok:true};}
 if(!token)throw new Error('Connect Notion in Settings first.');
 if(url==='/api/day'){
  if(!dateValid(b.date))throw new Error('Invalid date');const entries=Object.entries(b.patch||{});
  if(!entries.length||entries.some(([key,v])=>!dailyType[key]||(typeof v==='number'&&!Number.isFinite(v))))throw new Error('Invalid fields');
  const day=await ensureDay(b.date);const properties=Object.fromEntries(entries.map(([key,v])=>[key,prop(dailyType[key],v)]));
  return {ok:true,day:normalize(await notion('PATCH',`/pages/${day.id}`,{properties}))};
 }
 if(url==='/api/food'){
  if(!dateValid(b.date)||!b.foodId||!(Number(b.grams)>0)||Number(b.grams)>5000)throw new Error('Choose a valid serving size');
  const food=(await query('foods',400)).find(f=>f.id===b.foodId);if(!food)throw new Error('Food was not found in Food Database');
  const day=await ensureDay(b.date);const grams=Number(b.grams),macro={Calories:'Calories / g',Protein:'Protein / g',Carbs:'Carbs / g',Fat:'Fat / g',Fiber:'Fiber / g',Sodium:'Sodium / g',Sugar:'Sugar / g'};
  const properties=Object.fromEntries(Object.entries(macro).map(([field,key])=>[field,prop('number',Math.round(((Number(day[field])||0)+(Number(food[key])||0)*grams)*10)/10)]));
  const entry=`${b.slot?b.slot+' · ':''}${String(food['Food Name']||'Food')} · ${grams} g`;
  properties['Foods Eaten']=prop('rich_text',[day['Foods Eaten'],entry].filter(Boolean).join('\n'));
  return {ok:true,day:normalize(await notion('PATCH',`/pages/${day.id}`,{properties}))};
 }

 if(url==='/api/plan/add'){
  if(!dateValid(b.date)||!b.planId)throw new Error('Choose a valid day and meal');
  const plan=(await query('planner',400)).find(x=>uuid(x.id)===uuid(b.planId));
  if(!plan)throw new Error('Planned meal not found in Notion');
  const dayOfWeek=new Date(b.date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',timeZone:'UTC'});
  if(!(plan.Date===b.date||(!plan.Date&&plan.Schedule===dayOfWeek)))throw new Error('This meal is not planned for the selected day');
  const servings=plan.Servings==null?1:Number(plan.Servings);
  if(!Number.isFinite(servings)||servings<=0||servings>50)throw new Error('Set a valid serving count in your Meal Planner');
  const linkedId=Array.isArray(plan.Meal)?plan.Meal[0]:null;
  if(!linkedId)throw new Error('This planned entry is not linked to a saved meal');
  const meal=(await query('meals',400)).find(x=>uuid(x.id)===uuid(linkedId));
  if(!meal)throw new Error('Saved meal not found. Check Notion access to Meal Database');
  if(meal.Calories==null||!Number.isFinite(Number(meal.Calories)))throw new Error('This saved meal is missing calorie data');
  const cleanName=String(meal['Meal Name']||plan.Entry||'Meal').replace(/[\r\n]+/g,' ').trim();
  const line=[plan.Slot||'Meal',cleanName,servings+' serving'+(servings===1?'':'s')].join(' · ');
  const day=await ensureDay(b.date);
  if(String(day['Foods Eaten']||'').split(/\r?\n/).some(entry=>entry.trim()===line)){
   return {ok:true,alreadyAdded:true,day};
  }
  const properties={};
  for(const field of ['Calories','Protein','Carbs','Fat','Fiber','Sugar','Sodium']){
   const amount=Number(meal[field]??0);
   if(!Number.isFinite(amount))throw new Error('Invalid '+field+' value in the saved meal');
   properties[field]=prop('number',Math.round(((Number(day[field])||0)+amount*servings)*10)/10);
  }
  properties['Foods Eaten']=prop('rich_text',[day['Foods Eaten'],line].filter(Boolean).join('\n'));
  return {ok:true,alreadyAdded:false,day:normalize(await notion('PATCH','/pages/'+day.id,{properties}))};
 }
 if(url==='/api/plan'){
  if(!dateValid(b.date)||!b.mealId||!['Breakfast','Lunch','Dinner','Snack'].includes(b.slot))throw new Error('Choose a valid meal and date');
  const meal=(await query('meals',250)).find(x=>x.id===b.mealId);if(!meal)throw new Error('Meal not found');
  const properties={Entry:prop('title','Planned '+b.slot),Date:prop('date',b.date),Meal:prop('relation',[meal.id]),Slot:prop('select',b.slot),Status:prop('select','Planned'),Servings:prop('number',1)};
  return {ok:true,entry:normalize(await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(sources.planner)},properties}))};
 }
 if(url==='/api/plan/status'){
  if(!['Planned','Logged','Skipped'].includes(b.status))throw new Error('Invalid plan status');
  await notion('PATCH',`/pages/${uuid(b.id)}`,{properties:{Status:prop('select',b.status)}});return {ok:true};
 }
 if(url==='/api/goal/status'){
  if(!['Active','Planned','Achieved','Paused'].includes(b.status))throw new Error('Invalid goal status');
  await notion('PATCH',`/pages/${uuid(b.id)}`,{properties:{Status:prop('select',b.status)}});return {ok:true};
 }
 if(url==='/api/weight'){
  if(!dateValid(b.date)||Number(b.weight)<25||Number(b.weight)>400)throw new Error('Invalid date or weight');
  const properties={Entry:prop('title','Body Log'),Date:prop('date',b.date),'Body Weight':prop('number',Number(b.weight))};
  if(b.waist!==undefined&&b.waist!=='')properties.Waist=prop('number',Number(b.waist));
  return {ok:true,entry:normalize(await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(sources.body)},properties}))};
 }
 throw new Error('Unknown request');
}
window.MYOS_NOTION={route,connect,disconnect,configured,connected:()=>!!token,sources:()=>({...sources}),labels:titles};
})();