const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('node:vm');
function store(){const d=new Map();return{getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)};}
const ids={daily:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',exercises:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',foods:'cccccccccccccccccccccccccccccccc',targets:'dddddddddddddddddddddddddddddddd',planner:'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',meals:'ffffffffffffffffffffffffffffffff',body:'11111111111111111111111111111111',goals:'22222222222222222222222222222222',supplements:'33333333333333333333333333333333'};
const names={daily:'Daily Nutrients',exercises:'Exercises',foods:'Food Database',targets:'Nutrition Goals',planner:'Meal Planner',meals:'Meal Database',body:'Weight Tracker',goals:'Fitness Goals',supplements:'Supplements'};
const requests=[];const page={id:'abcdef1234567890abcdef1234567890',url:'https://app.notion.com/p/a',object:'page',properties:{Entry:{type:'title',title:[{plain_text:'Daily Log'}]},Date:{type:'date',date:{start:'2026-10-29'}},Calories:{type:'number',number:90},'Water (ml)':{type:'number',number:250},'Foods Eaten':{type:'rich_text',rich_text:[]}}};
function response(x){return {ok:true,status:200,json:async()=>x};}
async function fetch(url,opts){requests.push([url,opts]);let b=opts.body?JSON.parse(opts.body):{};
if(url.endsWith('/search'))return response({results:Object.keys(ids).map(k=>({object:'data_source',id:ids[k],title:[{plain_text:names[k]}]}))});
if(url.includes('/query')){
const id=url.split('/').at(-2);if(id===ids.daily)return response({results:[page],has_more:false});
if(id===ids.foods)return response({results:[{id:'12341234123412341234123412341234',properties:{'Food Name':{type:'title',title:[{plain_text:'Oats'}]},'Calories / g':{type:'number',number:3.89}}}],has_more:false});
return response({results:[],has_more:false});}
if(opts.method==='PATCH'){
for(const [k,v] of Object.entries(b.properties)){page.properties[k]={type:Object.keys(v)[0],...v};}return response(page)}
if(opts.method==='POST'&&url.endsWith('/pages'))return response({...page,id:'bbbbbbbbaaaaaaaabbbbbbbbaaaaaaaa'});
throw Error('Unexpected '+url);
}
const context={window:{},localStorage:store(),sessionStorage:store(),fetch,console,setTimeout};
context.window.localStorage=context.localStorage;context.window.sessionStorage=context.sessionStorage;
vm.runInNewContext(fs.readFileSync(__dirname+'/../public/notion-browser.js','utf8'),context);
const api=context.window.MYOS_NOTION;
(async()=>{
assert.deepEqual((await api.route('/api/bootstrap')).mode,'demo');
const setup=await api.connect('ntn_example_test_secret',{},false);assert.equal(setup.connected,true);assert.equal(setup.sources.daily,true);assert.equal(api.sources().daily,ids.daily);
assert.equal(context.localStorage.getItem('myos_remember_notion_token_v1'),null);assert.ok(context.sessionStorage.getItem('myos_browser_notion_token_v1'));
const boot=await api.route('/api/bootstrap');assert.equal(boot.mode,'notion');assert.equal(boot.data.daily[0].Calories,90);
const changed=await api.route('/api/day',{method:'POST',body:JSON.stringify({date:'2026-10-29',patch:{'Water (ml)':500}})});assert.equal(changed.day['Water (ml)'],500);
const food=await api.route('/api/food',{method:'POST',body:JSON.stringify({date:'2026-10-29',foodId:'12341234123412341234123412341234',grams:100,slot:'Breakfast'})});assert.equal(food.day.Calories,479);assert.match(food.day['Foods Eaten'],/Oats/);
assert.ok(!requests.some(([u,o])=>u.includes(ids.exercises)&&o.method==='PATCH'),'Never write to exercise library');
api.disconnect();assert.equal(api.connected(),false);assert.equal((await api.route('/api/bootstrap')).mode,'demo');
console.log('Static Notion bridge: discovery, bootstrap, daily writes, food logging, disconnect passed.');
})().catch(err=>{console.error(err);process.exitCode=1;});