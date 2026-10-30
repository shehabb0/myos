const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ids={daily:'a'.repeat(32),planner:'b'.repeat(32),meals:'c'.repeat(32)};
const text=s=>[{type:'text',plain_text:s,text:{content:s}}];
const prop=(type,value)=>({type,[type]:type==='title'||type==='rich_text'?text(value):type==='relation'?[{id:value}]:type==='date'?{start:value}:type==='select'?{name:value}:value});
const page=(id,properties)=>({object:'page',id,url:'https://app.notion.com/p/'+id,properties});
const day=page('d'.repeat(32),{Entry:prop('title','Daily Log'),Date:prop('date','2026-10-30'),Calories:prop('number',90),Protein:prop('number',12),'Foods Eaten':prop('rich_text','Breakfast · Oats · 100 g')});
const meal=page('e'.repeat(32),{'Meal Name':prop('title','Chicken rice bowl'),Calories:prop('number',620),Protein:prop('number',42),Carbs:prop('number',64),Fat:prop('number',14)});
const planned=page('f'.repeat(32),{Date:prop('date','2026-10-30'),Slot:prop('select','Lunch'),Status:prop('select','Logged'),Servings:prop('number',2),Meal:prop('relation',meal.id)});
const requests=[];
const response=body=>({ok:true,status:200,json:async()=>body});
async function fetch(url,options={}){
 requests.push({url,method:options.method});
 const body=options.body?JSON.parse(options.body):{};
 if(url.endsWith('/search'))return response({results:Object.keys(ids).map(k=>({object:'data_source',id:ids[k],title:text({daily:'Daily Nutrients',planner:'Meal Planner',meals:'Meal Database'}[k])})),has_more:false});
 if(url.endsWith('/query')){const id=url.split('/').at(-2);return response({results:id===ids.daily?[day]:id===ids.planner?[planned]:id===ids.meals?[meal]:[],has_more:false});}
 if(options.method==='PATCH'&&url.endsWith(day.id)){for(const [k,v] of Object.entries(body.properties))day.properties[k]={type:Object.keys(v)[0],...v};return response(day);}
 throw Error('Unexpected request '+url);
}
function storage(){const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
const localStorage=storage(),sessionStorage=storage(),context={window:{localStorage,sessionStorage},localStorage,sessionStorage,fetch,console,setTimeout};
vm.runInNewContext(fs.readFileSync(__dirname+'/../public/notion-browser.js','utf8'),context);
const api=context.window.MYOS_NOTION;
(async()=>{
 await api.connect('ntn_test_token',{},false);
 const add=()=>api.route('/api/plan/add',{method:'POST',body:JSON.stringify({date:'2026-10-30',planId:planned.id})});
 const first=await add();
 assert.equal(first.alreadyAdded,false);
 assert.equal(first.day.Calories,1330);
 assert.equal(first.day.Protein,96);
 assert.match(first.day['Foods Eaten'],/Lunch · Chicken rice bowl · 2 servings/);
 const second=await add();
 assert.equal(second.alreadyAdded,true);
 assert.equal(second.day.Calories,1330);
 assert.equal(requests.filter(r=>r.method==='PATCH').length,1);
 assert.ok(!requests.some(r=>r.url.includes(ids.daily) && r.method==='PATCH'));
 assert.ok(!requests.some(r=>r.url.includes('Exercises') && r.method==='PATCH'));
 const app=fs.readFileSync(__dirname+'/../public/app.js','utf8');
 const overview=app.slice(app.indexOf('function dashboard(){'),app.indexOf('function nutrition(){'));
 assert.ok(!overview.includes('\${notePanel(day)}'));
 assert.ok(!overview.includes('\${mealsPanel()}'));
 assert.ok(app.includes('data-action="add-planned-meal"'));
 assert.ok(!app.includes('data-plan-status='));
 console.log('PASS: planned meal updates nutrients and diary once; overview simplified; statuses replaced by Add.');
})().catch(err=>{console.error(err);process.exitCode=1;});