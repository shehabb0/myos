/* MYOS — personal training studio, GitHub Pages edition. Notion token entered locally by the user. */
const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
const $ = (sel, root=document)=>root.querySelector(sel);
const esc = value => String(value??'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeUrl = url => /^https:\/\/(?:www\.)?(?:notion\.so|app\.notion\.com)\//i.test(url||'')?url:'#';
const num = value => Number.isFinite(Number(value))?Number(value):0;
const fmt = (value,dec=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:dec}).format(num(value));
const pct=(a,b)=>b>0?Math.round(Math.max(0,num(a)/num(b)*100)):0;
const dateISO = date => {const p=new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return `${p.find(x=>x.type==='year').value}-${p.find(x=>x.type==='month').value}-${p.find(x=>x.type==='day').value}`};
const today = ()=>dateISO(new Date());
const moveDate=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const dateLabel=(d,opts={weekday:'short',month:'short',day:'numeric'})=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{...opts,timeZone:'UTC'});
const weekday = d=>dateLabel(d,{weekday:'long'});
const ICONS={
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 nutrition:'<path d="M3 2v7a4 4 0 0 0 8 0V2M7 2v20M20 22V2c-4 2-6 7-6 11h6"/>',
 dumbbell:'<path d="m6.5 6.5 11 11M4 8.5l4.5-4.5M2 6.5l4.5-4.5m11 15 4.5-4.5m-2.5 7.5 4.5-4.5M7.5 11.5l4-4"/>',
 activity:'<polyline points="3 12 7 12 10 4 14 20 17 12 21 12"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 chart:'<path d="M4 20V4M4 20h17M8 16l4-5 3 2 5-8"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.9 1.9-.06-.06A1.65 1.65 0 0 0 16 18.4a1.65 1.65 0 0 0-1 .6V22h-6v-3a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06-1.9-1.9.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H2v-4h2a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.9-1.9.06.06A1.65 1.65 0 0 0 8 5.6a1.65 1.65 0 0 0 1-.6V2h6v3a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.9 1.9-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 .6 1h2v4h-2a1.65 1.65 0 0 0-.6 1Z"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="M5 12h14m-7-7 7 7-7 7"/>',
 external:'<path d="M14 4h6v6M10 14 20 4M20 13v7H4V4h7"/>',
 water:'<path d="M12 22a8 8 0 0 0 8-8c0-5-8-12-8-12S4 9 4 14a8 8 0 0 0 8 8Z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
 coffee:'<path d="M3 8h15v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm15 1h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
 scale:'<path d="M12 3v18M5 6h14M5 6l-3 7h6L5 6Zm14 0-3 7h6l-3-7ZM7 21h10"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 meal:'<path d="M4 16h16M5 16a7 7 0 0 1 14 0M12 9V6M3 20h18"/>',
 food:'<path d="M7 3c-3 3-4 8-2 12s4 5 7 6c4-2 7-6 7-11-1-5-6-8-12-7Z"/><path d="M7 16c4-4 8-6 12-6"/>',
 edit:'<path d="M12 20h9M16 4l4 4-11 11H5v-4L16 4Z"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>',
 close:'<path d="M5 5l14 14M19 5 5 19"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v7m0-11h.01"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a2 2 0 0 0 0 4h3m8-4h3a2 2 0 0 1 0 4h-3M12 13v6m-4 2h8"/>',
 moon:'<path d="M20.5 14.2A9 9 0 0 1 9.8 3.5 9 9 0 1 0 20.5 14.2Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
 shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>'
};
function icon(name,size=18){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.spark}</svg>`;}
const demoSeed=()=>{
 const d=today();
 const daily=[6,5,4,3,2,1,0].map((offset,i)=>({'id':'demo-day-'+offset,'Date':moveDate(d,-offset),'Entry':'Daily Log','Calories':[1740,2250,1980,2160,1840,2080,1435][i],'Protein':[107,143,115,126,109,133,76][i],'Carbs':[190,255,240,275,215,244,154][i],'Fat':[57,70,60,63,58,68,45][i],'Water (ml)':[2900,3000,2600,3200,2200,2800,1250][i],'Calorie Target (g)':2250,'Protein Target (g)':120,'Carbs Target (g)':295,'Fat Target (g)':65,'Water Target (ml)':3000,'Creatine Taken':i%2===0,'Whey Taken':i===2,'Went to Gym?':[4,5,6,0].includes(new Date(moveDate(d,-offset)+'T12:00:00Z').getUTCDay()),'Foods Eaten':'','Notes':''}));
 daily[daily.length-1]['Foods Eaten']='Breakfast · Oats · 80 g\nLunch · Chicken breast · 150 g';
 const foods=[['Oats',3.89,.169,.663,.069],['Chicken breast, cooked',1.65,.31,0,.036],['Rice, cooked',1.3,.027,.282,.003],['Whole eggs',1.43,.126,.007,.095],['Greek yogurt',.97,.10,.04,.03],['Banana',.89,.011,.228,.003],['Almonds',5.79,.21,.216,.5],['Bread, whole wheat',2.47,.13,.41,.042]].map(([name,cal,protein,carbs,fat],i)=>({id:'demo-food-'+i,'Food Name':name,'Calories / g':cal,'Protein / g':protein,'Carbs / g':carbs,'Fat / g':fat,'Fiber / g':0,'Sugar / g':0,'Sodium / g':0}));
 const exercises=[['Dumbbell Bench Press','Push','Day 1 – Chest','Dumbbell','3 Sets','10-12','12Kg','Overall chest strength'],['Incline Dumbbell Bench Press','Push','Day 1 – Chest','Dumbbell','3 Sets','10-12','12Kg','Upper chest and shoulders'],['Lat Pulldown','Pull','Day 2 – Back','Machine','3 Sets','10-12','35Kg','Build back width'],['Seated Cable Rows','Pull','Day 2 – Back','Machine','3 Sets','10-12','30Kg','Build back thickness'],['Shoulder Press','Push','Day 3 – Shoulders','Machine','3 Sets','10-12','25Kg','Shoulder development'],['Barbell Curl','Pull','Day 4 – Arms','Barbell','5 Sets','12-15','12Kg','Biceps strength'],['Hack Squat','Leg','Day 5 – Legs','Machine','5 Sets','10-12','35Kg','Quad focus'],['Leg Extension','Leg','Day 5 – Legs','Machine','5 Sets','10-12','35Kg','Quad isolation'],['Cable Crunch','Abs','Day 6','Machine','3 Sets','10-12','15Kg','Abdominal strength']].map(([name,ppl,day,equipment,sets,reps,weight,focus],i)=>({id:'demo-ex-'+i,Name:name,PPL:ppl,Days:[day],Equipment:[equipment],Sets:[sets],Reps:reps,Weight:weight,'Main Focus':focus,url:'#'}));
 const goals=['Build stronger abs','Train four days weekly','Eat enough protein','Drink 3 liters of water','Track daily nutrition'].map((name,i)=>({id:'demo-goal-'+i,Goal:name,Category:['Body composition','Consistency','Nutrition','Hydration','Nutrition'][i],Status:'Active',Target:['Core strength and consistency','Four planned gym days','Reach the daily protein target','3,000 ml each day','Log meals and servings'][i]}));
 const body=[['2026-09-20',62.1]].map(([Date,weight],i)=>({id:'demo-body-'+i,Date,'Body Weight':weight,Waist:null,Fat:.219,'Body Fat Mass (kg)':13.6,'Skeletal Muscle Mass (kg)':27.2}));
 const meals=[['Overnight oats',420,22,58,12],['Chicken & rice bowl',625,47,76,12],['Greek yogurt & fruit',260,24,30,5],['Eggs on toast',390,26,32,17]].map(([name,cal,protein,carbs,fat],i)=>({id:'demo-meal-'+i,'Meal Name':name,Calories:cal,Protein:protein,Carbs:carbs,Fat:fat}));
 const planner=[{id:'demo-plan-1',Date:d,Slot:'Breakfast',Meal:['demo-meal-0'],Status:'Planned',Servings:1},{id:'demo-plan-2',Date:d,Slot:'Lunch',Meal:['demo-meal-1'],Status:'Planned',Servings:1},{id:'demo-plan-3',Date:d,Slot:'Dinner',Meal:['demo-meal-3'],Status:'Planned',Servings:1}];
 const targets=[{id:'demo-target',Plan:'Body recomposition — 30 Dec 2026',Status:'Draft',Goal:'Body recomposition','Daily Calories (kcal)':2250,'Protein (g)':120,'Carbs (g)':295,'Fat (g)':65,'Water (ml)':3000}];
 return {daily,foods,exercises,goals,body,meals,planner,targets,supplements:[{Name:'Creatine monohydrate'},{Name:'Whey Protein'}]};
};
const STORAGE='myos-demo-v1';
const PLAN={calories:2250,protein:120,carbs:295,fat:65,water:3000,deadline:'2026-12-30',baselineDate:'2026-09-20',weight:62.1,bodyFat:21.9,fatMass:13.6,skeletalMuscle:27.2,weightMin:60,weightMax:63,goalFat:13,goalFatMass:8,goalMuscleMin:29,goalMuscleMax:32};
function loadDemo(){try{const x=JSON.parse(localStorage.getItem(STORAGE));if(x&&Array.isArray(x.daily)){for(const day of x.daily){if(String(day.id||'').startsWith('demo-day-'))Object.assign(day,{'Calorie Target (g)':2250,'Protein Target (g)':120,'Carbs Target (g)':295,'Fat Target (g)':65,'Water Target (ml)':3000})}if(Array.isArray(x.targets)){for(const row of x.targets){if(String(row.id||'').startsWith('demo-target'))Object.assign(row,{'Daily Calories (kcal)':2250,'Protein (g)':120,'Carbs (g)':295,'Fat (g)':65,'Water (ml)':3000})}}return x;}}catch{}return demoSeed();}
const S={connectionError:'',route:'dashboard',date:today(),mode:'demo',data:loadDemo(),filter:'All',search:'',locked:false,configured:{},busy:false};
const saveDemo=()=>{if(S.mode==='demo'){try{localStorage.setItem(STORAGE,JSON.stringify(S.data));}catch{} }};
const currentDay=()=>S.data.daily.find(d=>d.Date===S.date)||{'Date':S.date,'Entry':'Daily Log','Calories':0,'Protein':0,'Carbs':0,'Fat':0,'Water (ml)':0,'Foods Eaten':'','Notes':'',...Object.fromEntries([['Calorie Target (g)',num(target()['Daily Calories (kcal)'])||PLAN.calories],['Protein Target (g)',num(target()['Protein (g)'])||PLAN.protein],['Carbs Target (g)',num(target()['Carbs (g)'])||PLAN.carbs],['Fat Target (g)',num(target()['Fat (g)'])||PLAN.fat],['Water Target (ml)',3000]])};
const target=()=>S.data.targets.find(x=>x.Status==='Active')||S.data.targets[0]||{};
const tar=(day,field,other,defaultValue)=>num(day[field]??target()[other]??defaultValue);
function getPlans(){const plans=S.data.planner||[];return plans.filter(x=>x.Date===S.date||(!x.Date&&x.Schedule===weekday(S.date)));}
const planMeal=row=>(S.data.meals||[]).find(m=>(row.Meal||[]).includes(m.id));

const planServings=row=>row.Servings==null?1:num(row.Servings);
const plannedMealDiaryLine=(row,meal)=>{
 const portions=planServings(row);
 const mealName=String(meal?.['Meal Name']||row.Entry||'Meal').replace(/[\r\n]+/g,' ').trim();
 return [row.Slot||'Meal',mealName,portions+' serving'+(portions===1?'':'s')].join(' · ');
};
const isPlannedMealAdded=(row,meal,day=currentDay())=>String(day['Foods Eaten']||'').split(/\r?\n/).some(line=>line.trim()===plannedMealDiaryLine(row,meal));

function toast(msg,error=false){const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=msg;$('#toast-container').append(el);setTimeout(()=>el.remove(),3600);}
async function request(url,opts={}){return window.MYOS_NOTION.route(url,opts)}
const post=(url,body)=>request(url,{method:'POST',body:JSON.stringify(body)});
function saveDayDemo(date,patch){let row=S.data.daily.find(x=>x.Date===date);if(!row){row={id:'demo-'+date,Date:date,Entry:'Daily Log',...currentDay()};row.Date=date;S.data.daily.push(row)}Object.assign(row,patch);saveDemo();}
async function updateDay(patch){if(S.busy)return;S.busy=true;try{if(S.mode==='notion'){const r=await post('/api/day',{date:S.date,patch});let ix=S.data.daily.findIndex(d=>d.Date===S.date);if(ix>=0)S.data.daily[ix]=r.day;else S.data.daily.push(r.day);}else saveDayDemo(S.date,patch);render();toast('Saved for '+dateLabel(S.date));}catch(e){toast(e.message,true);}finally{S.busy=false;}}
async function logFood(foodId,grams,slot){if(S.busy)return;S.busy=true;try{if(S.mode==='notion'){const r=await post('/api/food',{date:S.date,foodId,grams,slot});let ix=S.data.daily.findIndex(x=>x.Date===S.date);if(ix>=0)S.data.daily[ix]=r.day;else S.data.daily.push(r.day);}else{const food=S.data.foods.find(x=>x.id===foodId);const day=currentDay();const patch={};for(const [k,src] of Object.entries({Calories:'Calories / g',Protein:'Protein / g',Carbs:'Carbs / g',Fat:'Fat / g',Fiber:'Fiber / g',Sodium:'Sodium / g',Sugar:'Sugar / g'}))patch[k]=Math.round((num(day[k])+num(food[src])*grams)*10)/10;patch['Foods Eaten']=[day['Foods Eaten'],`${slot} · ${food['Food Name']} · ${grams} g`].filter(Boolean).join('\n');saveDayDemo(S.date,patch);}closeModal();render();toast('Food logged and daily totals updated');}catch(e){toast(e.message,true)}finally{S.busy=false;}}

async function addPlannedMeal(planId){
 if(S.busy)return;
 const row=getPlans().find(p=>p.id===planId),meal=row&&planMeal(row);
 if(!row||!meal)return toast('This planned meal is missing its saved recipe.',true);
 if(meal.Calories==null||!Number.isFinite(Number(meal.Calories)))return toast('This meal needs calorie information in Notion before it can be added.',true);
 if(!(planServings(row)>0)||planServings(row)>50)return toast('Please set a valid number of servings for this meal.',true);
 if(isPlannedMealAdded(row,meal))return toast('This meal has already been counted for this day.');
 S.busy=true;
 try{
  if(S.mode==='notion'){
   const result=await post('/api/plan/add',{date:S.date,planId});
   const ix=S.data.daily.findIndex(d=>d.Date===S.date);
   if(ix>=0)S.data.daily[ix]=result.day;else S.data.daily.push(result.day);
   render();
   toast(result.alreadyAdded?'This meal was already counted for this day.':'Meal added to daily nutrients');
  }else{
   const day=currentDay(),patch={};
   for(const field of ['Calories','Protein','Carbs','Fat','Fiber','Sugar','Sodium']){
    patch[field]=Math.round((num(day[field])+num(meal[field])*planServings(row))*10)/10;
   }
   patch['Foods Eaten']=[day['Foods Eaten'],plannedMealDiaryLine(row,meal)].filter(Boolean).join('\n');
   saveDayDemo(S.date,patch);
   render();
   toast('Meal added to daily nutrients');
  }
 }catch(error){toast(error.message,true);}
 finally{S.busy=false;}
}


async function unaddPlannedMeal(planId){
 if(S.busy)return;
 const row=getPlans().find(p=>p.id===planId),meal=row&&planMeal(row);
 if(!row||!meal)return toast('This meal is no longer linked to a saved recipe.',true);
 if(!isPlannedMealAdded(row,meal))return toast('This meal is not counted for the selected day.');
 if(!(planServings(row)>0)||planServings(row)>50)return toast('The serving count is no longer valid. Correct it before removing this meal.',true);
 S.busy=true;
 try{
  if(S.mode==='notion'){
   const result=await post('/api/plan/remove',{date:S.date,planId});
   const ix=S.data.daily.findIndex(d=>d.Date===S.date);
   if(ix>=0)S.data.daily[ix]=result.day;else S.data.daily.push(result.day);
   render();
   toast(result.alreadyRemoved?'This meal was already removed.':'Meal removed from daily nutrients');
  }else{
   const day=currentDay();
   const entry=plannedMealDiaryLine(row,meal);
   const lines=String(day['Foods Eaten']||'').split(/\r?\n/);
   const ix=lines.findIndex(line=>line.trim()===entry);
   if(ix<0)return toast('This meal is not in your diary.');
   const patch={};
   for(const field of ['Calories','Protein','Carbs','Fat','Fiber','Sugar','Sodium']){
    const amount=Number(meal[field]??0)*planServings(row),current=num(day[field]);
    if(!Number.isFinite(amount)||current+0.051<amount)return toast('The logged totals no longer match this meal. Check Daily Nutrients before removing it.',true);
    patch[field]=Math.max(0,Math.round((current-amount)*10)/10);
   }
   lines.splice(ix,1);
   patch['Foods Eaten']=lines.join('\n');
   saveDayDemo(S.date,patch);
   render();
   toast('Meal removed from daily nutrients');
  }
 }catch(error){toast(error.message,true);}
 finally{S.busy=false;}
}

async function deletePlannedMeal(planId){
 if(S.busy)return;
 const row=getPlans().find(p=>p.id===planId);
 if(!row)return toast('Planned meal was not found.',true);
 const meal=planMeal(row),counted=isPlannedMealAdded(row,meal);
 const recurring=!row.Date;
 const msg='Remove this entry from your meal plan?'
 +(recurring?'\n\nThis is a recurring entry and will be removed from future days too.':'')
 +(counted?'\n\nAlready logged nutrition will remain. Click Added first to undo its calories and macros.':'\n\nSaved recipes and logged nutrition will remain.');
 if(!window.confirm(msg))return;
 S.busy=true;
 try {
  if(S.mode==='notion')await post('/api/plan/delete',{date:S.date,planId});
  S.data.planner=(S.data.planner||[]).filter(p=>p.id!==planId);
  if(S.mode!=='notion')saveDemo();
  render();toast('Removed from meal plan');
 }catch(err){toast(err.message,true)}
 finally{S.busy=false}
}
async function addPlan(mealId,slot){try{if(S.mode==='notion'){const r=await post('/api/plan',{date:S.date,mealId,slot});S.data.planner.push(r.entry);}else{S.data.planner.push({id:'demo-plan-'+Date.now(),Date:S.date,Meal:[mealId],Slot:slot,Status:'Planned',Servings:1});saveDemo();}closeModal();render();toast('Meal added to your plan');}catch(e){toast(e.message,true)}}
async function changeGoalStatus(id,status){try{if(S.mode==='notion')await post('/api/goal/status',{id,status});S.data.goals.find(x=>x.id===id).Status=status;saveDemo();render();toast('Goal updated');}catch(e){toast(e.message,true)}}

let inbodyFile=null;
let inbodyPreviewUrl=null;
let inbodyScanning=false;
async function importInbodyPhoto(file){
 const status=$('#inbody-status'),preview=$('#inbody-preview'),submit=$('#weight-form button[type="submit"]');
 if(!status||!preview||!submit)return;
 inbodyFile=file||null;
 if(inbodyPreviewUrl){URL.revokeObjectURL(inbodyPreviewUrl);inbodyPreviewUrl=null;}
 preview.hidden=true;preview.removeAttribute('src');
 if(!file){status.textContent='Choose a photo to prefill your measurements, or enter them manually.';return;}
 if(!/^image\/(?:jpeg|png|webp|bmp)$/i.test(file.type)||file.size>20*1024*1024){
  status.textContent='Choose a JPG, PNG, or WebP image under 20 MB.';inbodyFile=null;return;
 }
 inbodyPreviewUrl=URL.createObjectURL(file);
 preview.src=inbodyPreviewUrl;preview.hidden=false;
 inbodyScanning=true;submit.disabled=true;
 status.textContent='Loading photo reader…';
 try{
  if(!window.MYOS_INBODY)throw new Error('Image reader is unavailable; refresh Myos and try again.');
  const result=await window.MYOS_INBODY.scan(file,msg=>{if(status.isConnected)status.textContent=msg;});
  const fields=['date','weight','bodyFat','bodyFatMass','muscleMass','bmi','bmr','visceralFat','bodyWater','waistHipRatio','inbodyScore','fatFreeMass'];
  let found=0;
  for(const key of fields){
   const input=$('#weight-form [name="'+key+'"]');
   if(input&&result.values[key]!==undefined&&result.values[key]!==null){
    input.value=String(result.values[key]);
    found++;
   }
  }
  status.textContent=found?'Read '+found+' fields. Check all numbers and the scan date against your photo before saving.':'No values were recognized. You can still enter them manually and save your photo.';
 }catch(error){
  status.textContent='Automatic reading failed: '+error.message+' You can enter the results manually.';
 }finally{inbodyScanning=false;if(submit.isConnected)submit.disabled=false;}
}
async function logWeight(values,file,attachPhoto){
 if(S.busy||inbodyScanning)return;
 S.busy=true;
 const submit=$('#weight-form button[type="submit"]');
 if(submit)submit.disabled=true;
 try{
  if(S.mode==='notion'){
   const check=await post('/api/weight/check',{date:values.date});
   if(check.exists)throw new Error('A weigh-in is already saved on '+values.date+'. Open the Notion Weight Tracker to edit it rather than duplicate it.');
   if(file&&attachPhoto){
    try{
     const photo=await window.MYOS_NOTION.uploadBodyPhoto(file);
     values.photoUploadId=photo.id;
     values.photoName=photo.name;
    }catch(err){
     const proceed=window.confirm('The measurements were read, but the original photo could not be attached to Notion:\n\n'+err.message+'\n\nSave the measurements without the photo?');
     if(!proceed)return;
    }
   }
   const result=await post('/api/weight',values);
   S.data.body.push(result.entry);
  }else{
   S.data.body.push({id:'demo-wt-'+Date.now(),Date:values.date,'Body Weight':values.weight,Waist:values.waist??null,Fat:values.bodyFat!=null?values.bodyFat/100:null,'Fat (kg)':values.bodyFatMass??null,'Muscle Mass (kg)':values.muscleMass??null,BMI:values.bmi??null,'BMR (kcal)':values.bmr??null,'Visceral Fat Level':values.visceralFat??null,'Total Body Water (L)':values.bodyWater??null,'Waist-Hip Ratio':values.waistHipRatio??null,'InBody Score':values.inbodyScore??null});
   saveDemo();
  }
  closeModal();render();toast('Weigh-in saved'+(values.photoUploadId?' with InBody photo':'')+'.');
 }catch(error){toast(error.message,true);}
 finally{S.busy=false;const button=$('#weight-form button[type="submit"]');if(button)button.disabled=false;}
}

function pageHeading(title,subtitle,action='',dateControl=true){return `<div class="page-heading"><div><div class="eyebrow">PERSONAL TRAINING STUDIO</div><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="heading-actions">${dateControl?dateSwitcher():''}${action}</div></div>`;}
function dateSwitcher(){return `<div class="date-switcher"><button type="button" data-action="date-prev" aria-label="Previous day">‹</button><span>${esc(dateLabel(S.date,{weekday:'short',month:'short',day:'numeric',year:'numeric'}))}</span><button type="button" data-action="date-next" aria-label="Next day">›</button></div>`;}
function sectionTitle(label,description='',link='',linkText='View all'){return `<div class="section-title"><div>${description?`<div class="section-overline">${description}</div>`:''}<h2>${label}</h2></div>${link?`<button class="text-link" data-route-jump="${link}">${linkText} →</button>`:''}</div>`;}
function progress(value,total,kind=''){return `<div class="progress ${kind}"><span style="width:${Math.min(100,pct(value,total))}%"></span></div>`;}
function statCard(label,current,total,unit,style,iconName){return `<section class="card stat-card"><div class="stat-label"><span>${label}</span><span class="icon-wrap">${icon(iconName,17)}</span></div><div class="stat-number">${fmt(current,1)} <small>${unit}</small></div>${progress(current,total,style)}<div class="stat-meta"><span>${pct(current,total)}% of goal</span><span>${fmt(Math.max(0,total-current),1)} ${unit} left</span></div></section>`;}
function calorieCard(day){const cal=tar(day,'Calorie Target (g)','Daily Calories (kcal)',2250),current=num(day.Calories);const f=Math.min(100,pct(current,cal));return `<section class="card card-dark stat-card kcal-card"><div><div class="stat-label">DAILY CALORIES ${icon('bolt',18)}</div><div class="stat-number">${fmt(current)} <small>kcal</small></div><div class="stat-meta"><span>of ${fmt(cal)} kcal target</span></div><div class="stat-meta"><span>${fmt(Math.max(0,cal-current))} remaining</span></div></div><svg class="kcal-ring" viewBox="0 0 130 130" aria-label="${f}% of calories goal"><circle class="ring-track" cx="65" cy="65" r="49" fill="none" stroke-width="10"/><circle class="ring-main" cx="65" cy="65" r="49" fill="none" stroke-width="10" stroke-dasharray="${49*2*Math.PI*f/100} ${49*2*Math.PI}"/><text x="65" y="65" text-anchor="middle" dominant-baseline="central">${f}%</text><text x="65" y="83" class="ring-sub" text-anchor="middle">COMPLETE</text></svg></section>`;}
function waterPanel(day){let current=num(day['Water (ml)']),total=tar(day,'Water Target (ml)','Water (ml)',3000),parts=Array.from({length:12},(_,i)=>{const fraction=Math.max(0,Math.min(1,(current/total*12)-i));return `<span class="water-step ${fraction>=1?'is-filled':fraction>0?'is-partial':''}" style="--fill:${fraction*100}%"></span>`}).join('');return `<section class="card water-panel">${sectionTitle('Hydration','MAKE IT A HABIT')}<div class="water-top"><div class="water-total">${fmt(current)} <small>/ ${fmt(total)} ml</small></div><span class="pill blue">${pct(current,total)}% completed</span></div><div class="water-meter" aria-label="Hydration progress: ${pct(current,total)} percent">${parts}</div><p class="small muted">${current>=total?'Goal reached! Keep drinking according to thirst.':`${fmt(Math.max(0,total-current))} ml to reach your daily goal`}</p><div class="water-actions"><span class="small">${icon('water',17)} &nbsp; Every sip counts</span><div class="water-button-group"><button class="btn btn-outline btn-sm" data-action="water" data-amount="250">${icon('plus',14)} 250 ml</button><button class="btn btn-light btn-sm" data-action="water" data-amount="500">${icon('plus',14)} 500 ml</button></div></div></section>`;}
function suppPanel(day){const supplements=[{field:'Creatine Taken',name:'Creatine',tip:'Daily supplement',symbol:'bolt'},{field:'Whey Taken',name:'Whey protein',tip:'As needed for protein',symbol:'spark'}];return `<section class="card">${sectionTitle('Your supplements','DAILY ROUTINE')}<div>${supplements.map(s=>`<div class="supp-row"><div class="supp-icon">${icon(s.symbol)}</div><div class="supp-text"><b>${s.name}</b><small>${s.tip}</small></div><button type="button" data-action="toggle" data-field="${s.field}" class="switch ${day[s.field]?'on':''}" role="switch" aria-checked="${!!day[s.field]}" aria-label="Mark ${s.name} taken"></button></div>`).join('')}</div><p class="checkbox-note">Whey's calories still need to be logged as food.</p></section>`;}
function checklistPanel(day){const x=[{name:'Log your food',sub:'Keep track of what you eat',done:num(day.Calories)>0,auto:true},{name:'Reach your water goal',sub:'Aim for 3 liters',done:num(day['Water (ml)'])>=tar(day,'Water Target (ml)','Water (ml)',3000),auto:true},{name:'Take creatine',sub:'Your daily supplement',done:!!day['Creatine Taken'],field:'Creatine Taken'},{name:'Go to the gym',sub:'Only check when you trained',done:!!day['Went to Gym?'],field:'Went to Gym?'}];return `<section class="card">${sectionTitle('Daily checklist','YOUR NON-NEGOTIABLES')}<div class="checklist">${x.map(c=>`<button class="check-row clickable-check" ${c.auto?'data-action="check-info"':`data-action="toggle" data-field="${c.field}"`}><span class="check-label"><span class="check-box ${c.done?'done':''}">${icon('check',13)}</span><span>${c.name}<small>${c.sub}</small></span></span><span class="check-status ${c.done?'done':''}">${c.done?'DONE':'TO DO'}</span></button>`).join('')}</div></section>`;}
function weekPanel(){const d=new Date(S.date+'T12:00:00Z');const dow=d.getUTCDay();const diff=(dow+6)%7;const monday=moveDate(S.date,-diff);const a=Array.from({length:7},(_,i)=>{const date=moveDate(monday,i);const gym=[0,4,5,6].includes(new Date(date+'T12:00:00Z').getUTCDay());return `<button class="day-col ${date===S.date?'selected':''}" data-action="select-date" data-date="${date}" title="${gym?'Gym day':'Home day'}"><div class="d-name">${dateLabel(date,{weekday:'short'}).slice(0,2)}</div><div class="d-num">${Number(date.slice(-2))}</div><div class="d-type ${gym?'gym':''}"></div></button>`}).join('');return `<section class="card">${sectionTitle('Your weekly rhythm','STAY CONSISTENT','exercises','Explore split')}<div class="week-strip">${a}</div><div class="schedule-legend"><span><i></i> Gym · Thu–Sun</span><span><i class="rest"></i> Home · Mon–Wed</span></div></section>`;}
function notePanel(day){return `<section class="card">${sectionTitle('What I ate','YOUR PERSONAL FOOD DIARY')}<textarea id="food-note" class="note-area" placeholder="Write what you ate today — e.g. Breakfast: 2 eggs, toast…">${esc(day['Foods Eaten']||'')}</textarea><div class="note-footer"><span class="small muted">Manual notes, saved to Daily Nutrients</span><button class="btn btn-sm" data-action="save-note">Save diary ${icon('arrow',13)}</button></div></section>`;}

// Goal deadline: midnight in Cairo on December 30 (Egypt's UTC+02 winter offset).
function goalCountdownParts(now=Date.now()){
 const deadline=new Date(PLAN.deadline+'T00:00:00+02:00').getTime();
 const remaining=Math.max(0,deadline-now);
 const total=Math.floor(remaining/1000);
 return {
  days:Math.floor(total/86400),
  hours:Math.floor(total%86400/3600),
  minutes:Math.floor(total%3600/60),
  seconds:total%60,
  complete:remaining<=0
 };
}
function goalCountdownCard(){
 const remaining=goalCountdownParts();
 const units=[['days','DAYS'],['hours','HOURS'],['minutes','MINUTES'],['seconds','SECONDS']];
 return '<section class="hero hero-countdown" aria-label="Countdown to December 30, 2026">'
   +'<div class="goal-countdown-content">'
   +'<div class="hero-eyebrow"><span class="hero-dot"></span>BODY RECOMPOSITION · GOAL COUNTDOWN</div>'
   +'<h2>December 30, 2026</h2>'
   +'<div class="goal-countdown-units" id="goal-countdown" role="timer" aria-label="Time remaining until your goal">'
   +units.map(([key,label])=>'<div class="goal-countdown-unit"><strong data-countdown="'+key+'">'+String(remaining[key]).padStart(2,'0')+'</strong><span>'+label+'</span></div>').join('')
   +'</div>'
   +'<p id="goal-countdown-caption">'+(remaining.complete?'Your target date has arrived. Review your progress!':'Time remaining to your goal date')+'</p></div>'
   +'<button class="hero-chip" data-route-jump="goals">VIEW GOAL & PLAN '+icon('arrow',14)+'</button>'
   +'</section>';
}
function updateGoalCountdown(){
 const display=document.getElementById('goal-countdown');
 if(!display)return;
 const t=goalCountdownParts();
 for(const key of ['days','hours','minutes','seconds']){
  const element=display.querySelector('[data-countdown="'+key+'"]');
  if(element)element.textContent=String(t[key]).padStart(2,'0');
 }
 const caption=document.getElementById('goal-countdown-caption');
 if(caption)caption.textContent=t.complete?'Your target date has arrived. Review your progress!':'Time remaining to your goal date';
}

function dashboard(){const day=currentDay(),p=tar(day,'Protein Target (g)','Protein (g)',PLAN.protein),c=tar(day,'Carbs Target (g)','Carbs (g)',PLAN.carbs),f=tar(day,'Fat Target (g)','Fat (g)',PLAN.fat);return `${pageHeading('Make today count.','Your personal command center for feeling stronger every day.',`<button class="btn btn-accent" data-action="open-food">${icon('plus')} Log food</button>`)}${S.mode!=="notion"?`<section class="connect-banner"><div class="connect-banner-mark">${icon("shield",22)}</div><div class="connect-banner-copy"><strong>Connect your Notion Gym workspace</strong><span>This dashboard is showing sample data. Connect Notion to see your real workouts, nutrition and progress.</span></div><button type="button" class="btn btn-accent" data-action="connect">${icon("settings",15)} Connect Notion</button></section>`:""}<div class="stats-grid">${calorieCard(day)}${statCard('PROTEIN',num(day.Protein),p,'g','blue','bolt')}${statCard('CARBS',num(day.Carbs),c,'g','orange','nutrition')}${statCard('FATS',num(day.Fat),f,'g','pink','spark')}</div>${goalCountdownCard()}<div class="main-grid"><div class="column-stack">${waterPanel(day)}${checklistPanel(day)}</div><div class="column-stack">${weekPanel()}${suppPanel(day)}</div></div>`;}
function planSummaryCard(){return `<section class="card page-wide plan-summary"><div class="section-title"><div><div class="section-overline">YOUR GOAL & PLAN</div><h2>Body recomposition · December 30, 2026</h2></div><span class="pill">INBODY BASELINE · SEP 20</span></div><div class="metric-grid"><div class="info-stat"><span>Weight</span><b>62.1 kg → 60–63 kg</b></div><div class="info-stat"><span>Body fat</span><b>21.9% → 13%</b></div><div class="info-stat"><span>Fat mass</span><b>13.6 → 8 kg</b></div><div class="info-stat"><span>Skeletal muscle mass</span><b>27.2 → 29–32 kg</b></div></div><div class="source-note">Daily plan: 2,250 kcal · 120 g protein · 295 g carbs · 65 g fat · 3,000 ml water. Body composition and December targets are estimates/aspirations, not guaranteed outcomes.</div></section>`;}
function nutrition(){const day=currentDay(),parts=[['Calories',day.Calories,tar(day,'Calorie Target (g)','Daily Calories (kcal)',2250),'kcal',''],['Protein',day.Protein,tar(day,'Protein Target (g)','Protein (g)',PLAN.protein),'g','blue'],['Carbs',day.Carbs,tar(day,'Carbs Target (g)','Carbs (g)',PLAN.carbs),'g','orange'],['Fat',day.Fat,tar(day,'Fat Target (g)','Fat (g)',PLAN.fat),'g','pink']];const plans=getPlans();return `${pageHeading('Fuel the process.','Your daily nutrition plan, logged food and intentional meals.',`<button class="btn btn-accent" data-action="open-food">${icon('plus')} Add food</button>`)}<section class="card" style="margin-bottom:18px"><div class="section-title"><div><div class="section-overline">YOUR CURRENT PLAN</div><h2>Daily nutrition targets</h2></div><span class="pill terra">Gym plan · 30 Dec 2026</span></div><div class="metric-grid">${parts.map(([name,value,goal,unit,cl])=>`<div><div class="info-stat" style="border:0;padding-bottom:6px"><span>${name}</span><b>${fmt(value,1)} / ${fmt(goal)} ${unit}</b></div>${progress(value,goal,cl)}</div>`).join('')}</div><div class="source-note" style="margin-top:21px"><strong>Body recomposition</strong> · ${fmt(tar(day,'Calorie Target (g)','Daily Calories (kcal)',2250))} kcal, ${fmt(tar(day,'Protein Target (g)','Protein (g)',PLAN.protein))} g protein, ${fmt(tar(day,'Carbs Target (g)','Carbs (g)',PLAN.carbs))} g carbohydrates, ${fmt(tar(day,'Fat Target (g)','Fat (g)',PLAN.fat))} g fat. Targets follow your Gym plan. Review progress, recovery and weight trends; estimates and the December deadline are not guarantees.</div></section><div class="section-grid"><div class="column-stack">${waterPanel(day)}${notePanel(day)}</div><div class="column-stack">${suppPanel(day)}<section class="card">${sectionTitle('Plan your meals','BREAKFAST TO DINNER')}<div class="meal-list">${plans.length?plans.map(row=>{let meal=planMeal(row);return `<div class="meal-row planned-meal-row"><button type="button" class="plan-delete-btn" data-action="delete-planned-meal" data-plan-id="${esc(row.id)}" title="Remove from plan" aria-label="Remove from meal plan">&times;</button><div class="meal-circle">🍽️</div><div class="meal-name"><b>${esc(meal?.['Meal Name']||row.Entry||'Meal')}</b><small>${esc(row.Slot||'')} · ${fmt(num(meal?.Calories)*planServings(row))} kcal · ${fmt(planServings(row),1)} serving${planServings(row)===1?"":"s"}</small></div>${isPlannedMealAdded(row,meal,day)?`<button type="button" class="btn btn-light btn-sm" data-action="unadd-planned-meal" data-plan-id="${esc(row.id)}" title="Remove this meal from today’s totals" aria-label="Unadd this meal">✓ Added</button>`:`<button type="button" class="btn btn-accent btn-sm" data-action="add-planned-meal" data-plan-id="${esc(row.id)}" title="Count this meal in your daily nutrients">${icon("plus",13)} Add</button>`}</div>`}).join(''):emptyState('No meals planned','Add a meal below to fill the day.')}</div><button class="btn btn-outline btn-sm" style="margin-top:16px" data-action="open-plan">${icon('plus')} Add planned meal</button></section></div></div><div class="page-wide card">${sectionTitle('Your food library','READY TO LOG')}<div class="filter-row"><div class="search-input">${icon('search')}<input id="food-search-inline" type="search" placeholder="Find foods to log…" value="${esc(S.search)}"/></div></div><div class="meal-list" id="food-library-list">${foodLibraryList()}</div></div>`;}
function foodLibraryList(){const foods=(S.data.foods||[]).filter(x=>(x['Food Name']||'').toLowerCase().includes(S.search.toLowerCase())).slice(0,12);return foods.length?foods.map(f=>`<div class="meal-row"><div class="meal-circle">🥬</div><div class="meal-name"><b>${esc(f['Food Name']||'Food')}</b><small>Per 100 g · ${fmt(num(f['Protein / g'])*100,1)} g protein</small></div><div class="meal-kcal">${fmt(num(f['Calories / g'])*100)} <small>kcal</small></div><button class="btn btn-light btn-sm" data-action="open-food" data-food="${esc(f.id)}">${icon('plus',13)}</button></div>`).join(''):emptyState('No matching foods','Try another food name.');}
function exercises(){const all=(S.data.exercises||[]),filtered=all.filter(x=>(S.filter==='All'||x.PPL===S.filter)&&((x.Name||'').toLowerCase().includes(S.search.toLowerCase())||(x['Main Focus']||'').toLowerCase().includes(S.search.toLowerCase())));return `${pageHeading('Train with purpose.','Your existing Notion exercise library, displayed without changing it.',`<a class="btn btn-outline" href="https://app.notion.com/p/40863193f4578028b3a9ed7ed190779a" target="_blank" rel="noopener noreferrer">${icon('external')} Open in Notion</a>`,false)}<div class="section-grid"><section class="card">${sectionTitle('Your weekly schedule','CONSISTENCY FIRST')}<table class="schedule-table">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(x=>`<tr><td>${x}</td><td><span class="schedule-tag ${['Monday','Tuesday','Wednesday'].includes(x)?'rest':''}">${['Monday','Tuesday','Wednesday'].includes(x)?'Home / rest':'Gym'}</span></td></tr>`).join('')}</table></section><section class="card">${sectionTitle('Training principles','KEEP IT SIMPLE')}<div class="details-stack"><div><span class="pill">01</span><h3 style="margin:12px 0 7px;font-size:13px">Progressive overload</h3><p class="page-subtitle">If your working range is 8–12 reps, improve technique and reach the top of the range before increasing load.</p></div><div class="divider"></div><div><span class="pill">02</span><h3 style="margin:12px 0 7px;font-size:13px">Recover between sessions</h3><p class="page-subtitle">Give trained muscles adequate recovery. The routine in Notion recommends roughly 48 hours for abs.</p></div></div></section></div><div class="page-wide">${sectionTitle(`Exercise library <span class="pill ghost">${filtered.length} of ${all.length}</span>`,'ORGANIZED YOUR WAY')}<div class="filter-row"><div class="search-input">${icon('search')}<input id="exercise-search" placeholder="Search exercises, muscles, focus…" value="${esc(S.search)}"></div>${['All','Push','Pull','Leg','Abs','Cardio'].map(x=>`<button class="filter-chip ${S.filter===x?'selected':''}" data-action="filter" data-filter="${x}">${x}</button>`).join('')}</div><div class="exercise-grid" id="exercise-grid">${exerciseCards(filtered)}</div></div>`;}
function exerciseCards(items){return items.length?items.map(x=>`<article class="card exercise-card"><div class="exercise-top"><div class="equipment-icon">${icon('dumbbell',26)}</div><span class="pill">${esc(x.PPL||'Training')}</span></div><div class="exercise-content"><div class="exercise-title">${esc((x.Name||'').replace(/<[^>]*>/g,'').trim())}</div><p class="exercise-desc">${esc((x['Main Focus']||'').replace(/<[^>]*>/g,'').slice(0,100))||'A great addition to your training.'}</p><div class="exercise-meta"><div><small>SETS</small><strong>${esc((x.Sets||[]).join(', ')||'—')}</strong></div><div><small>REPS</small><strong>${esc(x.Reps||'—')}</strong></div><div><small>WEIGHT</small><strong>${esc(x.Weight||'—')}</strong></div></div>${x.url&&safeUrl(x.url)!=='#'?`<a class="exercise-footer" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">View in Notion ${icon('external',13)}</a>`:`<span class="exercise-footer">READ-ONLY LIBRARY</span>`}</div></article>`).join(''):emptyState('No exercises found','Try a different filter or search.');}
function chartSvg(items,field,options={}){const vals=items.map(x=>({date:x.Date, value:num(x[field])})).filter(x=>x.value>0&&x.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);if(vals.length<2)return `<div class="chart-empty">${icon('chart',27)}Not enough entries to show a trend yet.</div>`;
 const min=Math.min(...vals.map(x=>x.value)),max=Math.max(...vals.map(x=>x.value)),pad=Math.max((max-min)*.3,options.pad||1),lo=Math.max(0,min-pad),hi=max+pad;const w=650,h=224,left=28,right=20,top=19,bottom=30,x=i=>left+(w-left-right)*i/(vals.length-1),y=v=>top+(h-top-bottom)*(1-(v-lo)/(hi-lo||1));const pts=vals.map((v,i)=>`${x(i)},${y(v.value)}`).join(' ');const area=`M${x(0)} ${h-bottom} L${vals.map((v,i)=>`${x(i)} ${y(v.value)}`).join(' L')} L${x(vals.length-1)} ${h-bottom} Z`;
 return `<div class="chart-holder"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(field)} trend"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#a7c9a2" stop-opacity=".35"/><stop offset="100%" stop-color="#a7c9a2" stop-opacity="0"/></linearGradient></defs>${Array.from({length:4},(_,i)=>{const gy=top+i*(h-top-bottom)/3;const vv=hi-i*(hi-lo)/3;return `<line class="chart-gridline" x1="${left}" y1="${gy}" x2="${w-right}" y2="${gy}"/><text x="0" y="${gy+4}" class="chart-label">${fmt(vv,1)}</text>`}).join('')}<path d="${area}" class="chart-area"/><polyline points="${pts}" class="chart-line"/>${vals.map((v,i)=>`<circle class="chart-dot" cx="${x(i)}" cy="${y(v.value)}" r="4"/>`).join('')}${vals.filter((v,i)=>i===0||i===vals.length-1||i===Math.floor((vals.length-1)/2)).map(v=>{const i=vals.indexOf(v);return `<text x="${x(i)}" y="${h-6}" class="chart-label" text-anchor="middle">${dateLabel(v.date,{month:'short',day:'numeric'})}</text>`}).join('')}</svg></div>`;}
function body(){const items=[...(S.data.body||[])].filter(x=>x.Date).sort((a,b)=>a.Date.localeCompare(b.Date)),last=items.at(-1),prev=items.at(-2),delta=last&&prev?num(last['Body Weight'])-num(prev['Body Weight']):0;return `${pageHeading('More than a number.','Track trends, not single weigh-ins. All measurements stay personal.',`<button class="btn btn-accent" data-action="open-weight">${icon('plus')} Add weigh-in</button>`)}<div class="trend-cards"><section class="card"><div class="eyebrow">LATEST WEIGHT</div><div class="trend-number">${last?fmt(last['Body Weight'],1):'—'} <small>kg</small></div><div class="trend-kicker">${last?dateLabel(last.Date):'No readings yet'}</div></section><section class="card"><div class="eyebrow">CHANGE SINCE PREVIOUS</div><div class="trend-number">${last&&prev?(delta>0?'+':'')+fmt(delta,1):'—'} <small>kg</small></div><div class="trend-kicker">Changes can reflect hydration and timing.</div></section><section class="card"><div class="eyebrow">MEASUREMENTS</div><div class="trend-number">${items.length}</div><div class="trend-kicker">Recorded check-ins</div></section></div><section class="card">${sectionTitle('Body weight over time','YOUR LONG-TERM TREND')}${chartSvg(items,'Body Weight',{pad:1})}<div class="source-note">A consistent morning weigh-in routine is more informative than any one day's number. Device body-fat percentages are estimates and can fluctuate.</div></section><section class="card page-wide">${sectionTitle('Measurement history','WHAT YOU HAVE RECORDED')}<div class="meal-list">${items.length?items.slice().reverse().map(x=>`<div class="meal-row"><div class="meal-circle">⚖️</div><div class="meal-name"><b>${dateLabel(x.Date,{year:'numeric',month:'short',day:'numeric'})}</b><small>${x.Waist?fmt(x.Waist,1)+' cm waist · ':''}${x.Fat!=null?fmt(x.Fat*100,1)+'% estimated body fat · ':''}${x['Fat (kg)']!=null?fmt(x['Fat (kg)'],1)+' kg fat mass · ':''}${x['Muscle Mass (kg)']!=null?fmt(x['Muscle Mass (kg)'],1)+' kg skeletal muscle':''}</small></div><div class="meal-kcal">${fmt(x['Body Weight'],1)} <small>kg</small></div></div>`).join(''):emptyState('No measurements yet','Add your first weigh-in to see progress.')}</div></section>`;}
function goals(){const goals=S.data.goals||[],active=goals.filter(g=>g.Status==='Active').length;return `${pageHeading('Keep your eyes on it.','Big results begin with a few meaningful goals.',`<a class="btn btn-outline" target="_blank" rel="noopener noreferrer" href="https://app.notion.com/p/40863193f45780ab952cf68e92610c60">${icon('external')} Edit goals in Notion</a>`,false)}${planSummaryCard()}<div class="trend-cards"><section class="card"><div class="eyebrow">YOUR GOALS</div><div class="trend-number">${goals.length}</div><div class="trend-kicker">Total milestones</div></section><section class="card"><div class="eyebrow">IN PROGRESS</div><div class="trend-number">${active}</div><div class="trend-kicker">Currently active</div></section><section class="card"><div class="eyebrow">ACHIEVED</div><div class="trend-number">${goals.filter(x=>x.Status==='Achieved').length}</div><div class="trend-kicker">Every win counts</div></section></div><div class="section-title"><h2>Your goals</h2><span class="pill">SYNCS WITH NOTION</span></div><div class="metric-grid">${goals.map((g,i)=>`<article class="goal-card"><div class="goal-top"><span class="goal-icon">${icon(['target','bolt','nutrition','water','activity'][i%5])}</span><span class="pill ${g.Status==='Achieved'?'':'ghost'}">${esc(g.Status||'Active')}</span></div><div class="goal-category" style="margin-top:13px">${esc(g.Category||'Personal')}</div><h3>${esc(g.Goal||'Goal')}</h3><p>${esc(g.Target||'Your next milestone.')}</p><label class="form-label" for="goal-${esc(g.id)}">Status</label><select class="select" id="goal-${esc(g.id)}" data-goal-status="${esc(g.id)}">${['Active','Planned','Achieved','Paused'].map(s=>`<option ${g.Status===s?'selected':''}>${s}</option>`).join('')}</select></article>`).join('')}</div>`;}
function analytics(){const ds=S.data.daily||[],days=ds.filter(x=>x.Date&&num(x.Calories)>0),average=days.length?days.reduce((n,x)=>n+num(x.Calories),0)/days.length:0;const prodays=days.filter(x=>num(x.Protein)>=tar(x,'Protein Target (g)','Protein (g)',PLAN.protein)).length;const watery=days.filter(x=>num(x['Water (ml)'])>=tar(x,'Water Target (ml)','Water (ml)',3000)).length;const taken=ds.filter(x=>x['Creatine Taken']).length;return `${pageHeading('Proof in the progress.','A clearer picture of your habits, nutrition and body trends.',`<button class="btn btn-outline" data-action="refresh">${icon('refresh')} Sync now</button>`,false)}<div class="trend-cards"><div class="card"><div class="eyebrow">AVG. DAILY CALORIES</div><div class="trend-number">${days.length?fmt(average):'—'} <small>kcal</small></div><div class="trend-kicker">Days with recorded intake: ${days.length}</div></div><div class="card"><div class="eyebrow">PROTEIN GOAL MET</div><div class="trend-number">${prodays} <small>days</small></div><div class="trend-kicker">Of ${days.length} logged food days</div></div><div class="card"><div class="eyebrow">WATER GOAL MET</div><div class="trend-number">${watery} <small>days</small></div><div class="trend-kicker">Creatine recorded: ${taken} days</div></div></div><div class="section-grid"><section class="card">${sectionTitle('Daily energy intake','CALORIES · KCAL')}${chartSvg(days,'Calories',{pad:100})}</section><section class="card">${sectionTitle('Protein over time','INTAKE · GRAMS')}${chartSvg(days,'Protein',{pad:20})}</section><section class="card">${sectionTitle('Your weight trend','BODY WEIGHT · KG')}${chartSvg(S.data.body||[],'Body Weight',{pad:1})}</section><section class="card">${sectionTitle('Water intake','HYDRATION · ML')}${chartSvg(days,'Water (ml)',{pad:200})}</section></div><div class="source-note page-wide"><strong>How we measure success:</strong> Daily targets are compared only with days that contain data. Missing days are not treated as missed goals. Device body-fat readings are estimates; use long-term weight, waist and strength trends together.</div>`;}
function settings(){
 const links=[['Gym workspace','https://app.notion.com/p/24c63193f457806c97f4df3b768275e7'],['Nutrition','https://app.notion.com/p/52463193f4578295a359819b28734a3e'],['Exercise','https://app.notion.com/p/40863193f4578028b3a9ed7ed190779a'],['Body measurements','https://app.notion.com/p/3d563193f4578091883de26c5842554b'],['Goals','https://app.notion.com/p/40863193f45780ab952cf68e92610c60'],['Analytics','https://app.notion.com/p/40863193f457814586f3f8e6d934bda4']];
 const connected=window.MYOS_NOTION.connected();
 return `${pageHeading('Your studio settings.','Your personal Notion connection and shortcuts.','',false)}<div class="section-grid"><div class="column-stack"><section class="card">${sectionTitle('Notion connection','GITHUB PAGES · JUST LIKE LEXICON')}<div class="settings-item">${icon(connected?'shield':'info')}<div><h3>${connected?'Notion token available':'Demo mode'}</h3><p>${connected?'Your browser has an active Notion token. MYOS contacts Notion directly, without a hosting server.': 'Connect your Notion integration to read and update your personal Gym workspace. Demo entries are fictional and are not synced.'}</p></div></div>${S.connectionError?`<div class="source-note" style="color:#a33c2d">${icon('info',15)} Connection error: ${esc(S.connectionError)}</div>`:''}<div class="settings-item">${icon('refresh')}<div><h3>Sync data</h3><p>Read the latest values directly from the existing Notion databases.</p><button class="btn btn-outline btn-sm" style="margin-top:10px" data-action="refresh">${icon('refresh',14)} Refresh from Notion</button></div></div><div class="settings-item">${icon('lock')}<div><h3>${connected?'Edit or disconnect':'Connect your Gym workspace'}</h3><p>Enter the same kind of integration token you use in Lexicon. MYOS can discover databases shared with its connection.</p><button class="btn btn-accent btn-sm" style="margin-top:10px" data-action="connect">${icon('settings',14)} ${connected?'Edit connection':'Connect Notion'}</button>${connected?` <button class="btn btn-light btn-sm" style="margin-top:10px" data-action="logout">Disconnect</button>`:''}</div></div></section><section class="card">${sectionTitle('Appearance','PERSONALIZE')}<div class="theme-settings-row"><div><h3>Dark mode</h3><p class="page-subtitle">Choose a comfortable display for your workouts and nutrition.</p></div><button class="btn btn-outline" type="button" data-action="theme-toggle" aria-label="Toggle dark mode">${icon('moon',16)} Switch theme</button></div></section><section class="card">${sectionTitle('Privacy & syncing','PLEASE READ')}<p class="page-subtitle">With GitHub Pages, MYOS calls the Notion API <strong>from your browser</strong>. Your token is never committed to GitHub. Unlike a server-backed site, browser-side tokens can be accessed by scripts running on this page, so use this only on a device you trust and grant the Notion integration access to <strong>Gym databases only</strong>. By default the token lasts for your browser session; saving it on the device is optional.</p><p class="page-subtitle" style="margin-top:12px">Food logs from MYOS update <strong>Daily Nutrients</strong> directly and do not trigger Notion's existing Intake buttons. Do not log a serving through both workflows.</p></section></div><section class="card">${sectionTitle('Your Notion pages','QUICK ACCESS')}<div class="meal-list">${links.map(([t,url])=>`<a class="ref-link" href="${url}" target="_blank" rel="noopener noreferrer">${esc(t)} ${icon('external')}</a>`).join('')}</div><p class="page-subtitle" style="margin-top:20px">The exercise library is read-only. MYOS does not change the Exercises database or any schema.</p></section></div>`;
}
function emptyState(head,desc){return `<div class="empty-state"><b>${esc(head)}</b>${esc(desc)}</div>`;}
function modal(html){$('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Form dialog">${html}</div></div>`;$('#modal-root .modal-backdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});$('#modal-root input, #modal-root select')?.focus();}
function closeModal(){$('#modal-root').innerHTML='';if(inbodyPreviewUrl){URL.revokeObjectURL(inbodyPreviewUrl);inbodyPreviewUrl=null;}inbodyFile=null;}
function modalHeading(head,sub=''){return `<div class="modal-header"><div><h2>${head}</h2><p>${sub}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon('close')}</button></div>`;}
function connectModal(){
 const current=window.MYOS_NOTION.sources();
 const names={daily:'Daily Nutrients',exercises:'Exercises',goals:'Fitness Goals',targets:'Nutrition Goals',body:'Weight Tracker',foods:'Food Database',meals:'Meal Database',planner:'Meal Planner',supplements:'Supplements'};
 const advanced=Object.entries(names).map(([key,name])=>`<label class="form-label" style="display:block;margin:8px 0 3px">${esc(name)}<input class="form-control" style="margin-top:4px" name="source-${key}" placeholder="Auto-discovered from Notion" value="${esc(current[key]||'')}"></label>`).join('');
 modal(`${modalHeading('Connect MYOS to Notion','Use the same direct-browser connection approach as Lexicon.')}<form id="connect-form"><div class="form-group"><label class="form-label">Notion integration token</label><input class="form-control" name="token" type="password" autocomplete="off" placeholder="secret_... or ntn_..." required></div><div class="source-note">Connect your Notion integration to the Gym databases first. MYOS will find their data-source IDs automatically, where possible. The token is sent directly from your browser to Notion, never to GitHub. Only use this on a trusted device.</div><label class="form-label" style="display:flex;align-items:center;gap:8px;margin:13px 0"><input type="checkbox" name="remember"> Remember token on this device (less private)</label><details style="margin:12px 0"><summary style="cursor:pointer;font-size:12px;font-weight:700">Advanced · manually edit data source IDs</summary><div style="max-height:230px;overflow:auto;margin-top:8px">${advanced}</div></details><div class="form-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-accent" type="submit">Connect & sync ${icon('arrow')}</button></div></form>`);
}
function foodModal(preferred=''){const foods=S.data.foods||[];if(!foods.length)return toast('Add foods to your Notion Food Database first',true);modal(`${modalHeading('Log your food','Adds the serving to today’s calories and food diary.')}<form id="food-form"><div class="form-group"><label class="form-label">Food</label><select class="select" name="food" required>${foods.map(f=>`<option value="${esc(f.id)}" ${f.id===preferred?'selected':''}>${esc(f['Food Name']||'Food')}</option>`).join('')}</select></div><div class="form-row"><div class="form-group"><label class="form-label">Quantity (grams)</label><input class="form-control" name="grams" inputmode="decimal" type="number" min="1" max="5000" step="1" value="100" required></div><div class="form-group"><label class="form-label">Meal</label><select class="select" name="slot">${['Breakfast','Lunch','Dinner','Snack'].map(x=>`<option>${x}</option>`).join('')}</select></div></div><div class="source-note"><strong>Note:</strong> This logs directly to your Daily Nutrients totals, independent of Notion's existing Intake buttons. Do not log the same food again in Notion.</div><div class="form-actions"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-accent">${icon('plus')} Add food</button></div></form>`);}
function planModal(){const meals=S.data.meals||[];if(!meals.length)return toast('Add meals to your Notion Meal Database first',true);modal(`${modalHeading('Plan a meal',`For ${dateLabel(S.date)}`)}<form id="plan-form"><div class="form-group"><label class="form-label">Saved meal</label><select class="select" name="meal">${meals.map(x=>`<option value="${esc(x.id)}">${esc(x['Meal Name']||'Meal')}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Time of day</label><select class="select" name="slot">${['Breakfast','Lunch','Dinner','Snack'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="source-note">Planning a meal does not add calories to your daily totals. Only foods actually logged count as consumed.</div><div class="form-actions"><button type="button" data-action="close-modal" class="btn btn-outline">Cancel</button><button type="submit" class="btn btn-accent">${icon('calendar')} Add to plan</button></div></form>`);}
function weightModal(){
 closeModal();
 inbodyFile=null;inbodyScanning=false;
 const field=(name,label,min,max,step='0.1',placeholder='')=>'<div class="form-group"><label class="form-label" for="inbody-'+name+'">'+label+'</label><input class="form-control" id="inbody-'+name+'" name="'+name+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" placeholder="'+placeholder+'"></div>';
 modal(
  modalHeading('Add a weigh-in','Upload an InBody scan to prefill the form, or enter measurements manually.')
  +'<form id="weight-form">'
  +'<div class="inbody-upload"><label class="form-label" for="inbody-file">InBody report photo (optional)</label>'
  +'<input id="inbody-file" type="file" accept="image/jpeg,image/png,image/webp" class="form-control inbody-file-input" />'
  +'<div class="inbody-preview-row"><img id="inbody-preview" alt="Selected InBody report" hidden /><p id="inbody-status" role="status" aria-live="polite">Choose a JPG, PNG, or WebP scan to read its results automatically.</p></div></div>'
  +'<div class="source-note inbody-review-note">Please compare every imported value with the photo. OCR can confuse body-fat percentage with fat mass in kilograms. Nothing is saved until you confirm.</div>'
  +'<div class="form-row"><div class="form-group"><label class="form-label" for="inbody-date">Scan date</label><input class="form-control" id="inbody-date" name="date" type="date" value="'+esc(S.date)+'" required></div>'
  +'<div class="form-group"><label class="form-label" for="inbody-weight">Weight (kg) *</label><input class="form-control" id="inbody-weight" name="weight" type="number" step="0.1" min="25" max="250" placeholder="e.g. 62.7" required></div></div>'
  +'<div class="form-row">'+field('bodyFat','Body fat (%)',3,65)+field('bodyFatMass','Body fat mass (kg)',1,125)+'</div>'
  +'<div class="form-row">'+field('muscleMass','Skeletal muscle mass (kg)',5,85)+field('bmi','BMI',10,70)+'</div>'
  +'<div class="form-row">'+field('bmr','Basal metabolic rate (kcal)',500,3500,1)+field('visceralFat','Visceral fat level',1,40,1)+'</div>'
  +'<div class="form-row">'+field('bodyWater','Total body water (L)',10,90)+field('waistHipRatio','Waist-hip ratio',0.5,1.5,'0.01')+'</div>'
  +'<div class="form-row">'+field('inbodyScore','InBody score',1,100,1)+field('fatFreeMass','Fat-free mass (kg)',10,180)+'</div>'
  +'<div class="form-row">'+field('waist','Waist (cm, optional)',20,250)+'</div>'
  +'<label class="inbody-attach-option"><input name="attachPhoto" type="checkbox" checked> Attach original photo to the Notion Weight Tracker (when connected)</label>'
  +'<div class="form-actions"><button type="button" data-action="close-modal" class="btn btn-outline">Cancel</button><button type="submit" class="btn btn-accent">'+icon('check')+' Save weigh-in</button></div>'
  +'</form>'
 );
}

function lockView(){return `<div class="privacy-lock"><section class="card lock-card"><div class="lock-icon">${icon('lock',25)}</div><h1>Your studio is private.</h1><p>Enter the password you configured on the server to unlock your personal Notion data.</p><form id="login-form"><input type="password" class="form-control" placeholder="Studio password" name="password" autocomplete="current-password" required/><button class="btn btn-accent" type="submit">Unlock your studio ${icon('arrow')}</button></form></section></div>`;}
function activeTheme(){return document.documentElement.dataset.theme==='dark'?'dark':'light';}
function syncThemeButtons(){const dark=activeTheme()==='dark';$$('[data-action="theme-toggle"]').forEach(button=>{button.setAttribute('aria-label',dark?'Enable light mode':'Enable dark mode');button.title=dark?'Switch to light mode':'Switch to dark mode';if(button.id==='theme-toggle'){button.innerHTML=icon(dark?'sun':'moon',18)}else{button.innerHTML=icon(dark?'sun':'moon',16)+(dark?' Light mode':' Dark mode')}});}
function toggleTheme(){const next=activeTheme()==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('myos-theme-v1',next)}catch{}syncThemeButtons();}
const routes={dashboard:['Overview',dashboard],nutrition:['Nutrition',nutrition],exercises:['Exercises',exercises],body:['Body progress',body],goals:['Goals',goals],analytics:['Analytics',analytics],settings:['Settings',settings]};
function hydrateIcons(){ $$('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)});}
function render(){const route=routes[S.route]?S.route:'dashboard';$$('.nav-link[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===route));$('#breadcrumb').innerHTML=`<span class="crumb-parent">MY SPACE</span><span class="crumb-sep">/</span><strong>${routes[route][0]}</strong>`;$('#connection-badge').innerHTML=`<span class="green-dot"></span> ${S.connectionError?'Sync error':S.mode==='notion'?'Notion connected':'Demo mode'}`;$('#mode-label').textContent=S.mode==='notion'?'Notion workspace':'Local preview';const quickConnect=$('#quick-connect');if(quickConnect){quickConnect.textContent=S.mode==='notion'?'Notion connected':'Connect Notion';quickConnect.classList.toggle('is-connected',S.mode==='notion');}syncThemeButtons();$('#main-content').innerHTML=S.locked?lockView():routes[route][1]();hydrateIcons();syncThemeButtons();updateGoalCountdown();document.title='Myos';}
async function refresh(){try{const status=await request('/api/status');S.locked=!!(status.authRequired&&!status.authenticated);S.configured=status.configured;if(S.locked){render();return;}const response=await request('/api/bootstrap');S.mode=response.mode;S.connectionError='';S.data=response.mode==='notion'?response.data:loadDemo();if(S.mode==='demo')saveDemo();render();}catch(e){S.connectionError=e.message;toast(e.message,true);render();}}
function changeRoute(route){if(!routes[route])route='dashboard';S.route=route;S.search='';S.filter='All';location.hash=route;$('#sidebar').classList.remove('mobile-open');render();window.scrollTo(0,0);}
document.addEventListener('click',async e=>{const button=e.target.closest('[data-action]');if(!button)return;const a=button.dataset.action;
 if(a==='close-modal'){closeModal();return;}
 if(a==='connect'){connectModal();return;}
 if(a==='theme-toggle'){toggleTheme();return;}
 if(a==='date-prev'||a==='date-next'||a==='select-date'){S.date=a==='select-date'?button.dataset.date:moveDate(S.date,a==='date-prev'?-1:1);render();return;}
 if(a==='open-food')return foodModal(button.dataset.food||'');if(a==='open-plan')return planModal();if(a==='add-planned-meal')return addPlannedMeal(button.dataset.planId);if(a==='unadd-planned-meal')return unaddPlannedMeal(button.dataset.planId);if(a==='delete-planned-meal')return deletePlannedMeal(button.dataset.planId);if(a==='open-weight')return weightModal();
 if(a==='water'){const day=currentDay();const inc=num(button.dataset.amount);if(num(day['Water (ml)'])>=15000)return toast('You have already logged a very large amount today',true);await updateDay({'Water (ml)':num(day['Water (ml)'])+inc});return;}
 if(a==='toggle'){const key=button.dataset.field;await updateDay({[key]:!currentDay()[key]});return;}
 if(a==='save-note'){await updateDay({'Foods Eaten':$('#food-note').value});return;}
 if(a==='check-info'){toast('This checklist item is completed automatically from your daily intake.');return;}
 if(a==='filter'){S.filter=button.dataset.filter;const matched=(S.data.exercises||[]).filter(x=>(S.filter==='All'||x.PPL===S.filter)&&((x.Name||'').toLowerCase().includes(S.search.toLowerCase())||(x['Main Focus']||'').toLowerCase().includes(S.search.toLowerCase())));$$('.filter-chip').forEach(x=>x.classList.toggle('selected',x.dataset.filter===S.filter));$('#exercise-grid').innerHTML=exerciseCards(matched);return;}
 if(a==='refresh'){await refresh();toast('Dashboard synced');return;}
 if(a==='logout'){window.MYOS_NOTION.disconnect();S.connectionError='';await refresh();toast('Disconnected. Showing demo data.');return;}
});
document.addEventListener('click',e=>{const sidebarLink=e.target.closest('a[data-route]');if(sidebarLink){e.preventDefault();changeRoute(sidebarLink.dataset.route);return;}const nav=e.target.closest('[data-route-jump]');if(nav){changeRoute(nav.dataset.routeJump);}});
document.addEventListener('submit',async e=>{if(!['food-form','plan-form','weight-form','login-form','connect-form'].includes(e.target.id))return;e.preventDefault();const form=e.target;const fd=new FormData(form);if(form.id==='food-form')await logFood(fd.get('food'),Number(fd.get('grams')),fd.get('slot'));if(form.id==='plan-form')await addPlan(fd.get('meal'),fd.get('slot'));if(form.id==='weight-form'){
 const measure={date:String(fd.get('date')||''),weight:Number(fd.get('weight')),isInbody:!!inbodyFile};
 for(const key of ['waist','bodyFat','bodyFatMass','muscleMass','bmi','bmr','visceralFat','bodyWater','waistHipRatio','inbodyScore','fatFreeMass']){
  const raw=String(fd.get(key)||'').trim();
  if(raw!=='')measure[key]=Number(raw);
 }
 await logWeight(measure,inbodyFile,fd.get('attachPhoto')==='on');
}if(form.id==='connect-form'){try{const mapping={};for(const k of Object.keys(window.MYOS_NOTION.labels)){const v=String(fd.get('source-'+k)||'').trim();if(v)mapping[k]=v;}await window.MYOS_NOTION.connect(fd.get('token'),mapping,fd.get('remember')==='on');closeModal();await refresh();if(S.mode==='notion')toast('Connected to Notion');}catch(err){toast(err.message,true);}}});
document.addEventListener('change',async e=>{const el=e.target;if(el.id==='inbody-file'){await importInbodyPhoto(el.files?.[0]);return;}if(el.matches('[data-goal-status]'))await changeGoalStatus(el.dataset.goalStatus,el.value);});
document.addEventListener('input',e=>{if(e.target.id==='exercise-search'){S.search=e.target.value;const matched=(S.data.exercises||[]).filter(x=>(S.filter==='All'||x.PPL===S.filter)&&((x.Name||'').toLowerCase().includes(S.search.toLowerCase())||(x['Main Focus']||'').toLowerCase().includes(S.search.toLowerCase())));$('#exercise-grid').innerHTML=exerciseCards(matched);}if(e.target.id==='food-search-inline'){S.search=e.target.value;$('#food-library-list').innerHTML=foodLibraryList();}});
window.addEventListener('hashchange',()=>{const val=location.hash.slice(1)||'dashboard';if(S.route!==val&&routes[val]){S.route=val;S.search='';S.filter='All';render();}});
$('#menu-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('mobile-open'));
$('#refresh-button').addEventListener('click',()=>refresh().then(()=>toast('Dashboard refreshed')));
S.route=routes[location.hash.slice(1)]?location.hash.slice(1):'dashboard';window.setInterval(updateGoalCountdown,1000);refresh();