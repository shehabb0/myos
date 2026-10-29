import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Tiny local .env reader, intentionally no dependency. Hosted env variables take priority.
try {
  const raw = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}
const cfg = {
  token: process.env.NOTION_TOKEN || '',
  notionVersion: process.env.NOTION_VERSION || '2025-09-03',
  password: process.env.APP_PASSWORD || '',
  secret: process.env.SESSION_SECRET || '',
  sources: {
    daily: process.env.NOTION_DAILY_SOURCE,
    exercises: process.env.NOTION_EXERCISES_SOURCE,
    goals: process.env.NOTION_GOALS_SOURCE,
    targets: process.env.NOTION_TARGETS_SOURCE,
    body: process.env.NOTION_BODY_SOURCE,
    foods: process.env.NOTION_FOODS_SOURCE,
    meals: process.env.NOTION_MEALS_SOURCE,
    planner: process.env.NOTION_PLANNER_SOURCE,
    supplements: process.env.NOTION_SUPPLEMENTS_SOURCE,
  },
};
const live = !!cfg.token;
if (live && (!cfg.password || !cfg.secret || cfg.secret.length < 20)) {
  console.error('SECURITY: NOTION_TOKEN requires APP_PASSWORD and SESSION_SECRET (at least 20 characters).');
  process.exit(1);
}
const cache = { at: 0, data: null };
const API = 'https://api.notion.com/v1';
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const rich = text => [{type:'text',text:{content:String(text??'').slice(0,1800)}}];
const uuid = id => String(id||'').replace(/^collection:\/\//,'').replace(/-/g,'');
const dateValid = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d+'T12:00:00Z'));
const readValue = p => {
  if (!p) return null;
  if (p.type === 'title') return (p.title||[]).map(v=>v.plain_text??v.text?.content??'').join('');
  if (p.type === 'rich_text') return (p.rich_text||[]).map(v=>v.plain_text??v.text?.content??'').join('');
  if (p.type === 'select') return p.select?.name ?? null;
  if (p.type === 'multi_select') return (p.multi_select||[]).map(v=>v.name);
  if (p.type === 'relation') return (p.relation||[]).map(v=>v.id);
  if (p.type === 'date') return p.date?.start?.slice(0,10)||null;
  if (p.type === 'formula') return p.formula?.[p.formula.type]??null;
  if (p.type === 'rollup') return p.rollup?.[p.rollup.type]??null;
  if (p.type === 'number') return p.number;
  if (p.type === 'checkbox') return p.checkbox;
  if (p.type === 'url') return p.url;
  return null;
};
const normalize = page => ({id: page.id, url: page.url, ...Object.fromEntries(Object.entries(page.properties||{}).map(([k,p])=>[k,readValue(p)]))});
async function notion(method, route, body) {
  if (!cfg.token) throw new Error('Notion connection not configured');
  for(let attempt=0; attempt<3; attempt++) {
    let res;
    try {
      res=await fetch(API+route,{method,headers:{Authorization:`Bearer ${cfg.token}`,'Notion-Version':cfg.notionVersion,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    } catch(err){ if(attempt<2) {await new Promise(r=>setTimeout(r,400*(attempt+1)));continue;} throw err; }
    if(res.status===429 && attempt<2){await new Promise(r=>setTimeout(r,800*(attempt+1)));continue;}
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(`Notion ${res.status}: ${data.message||'Request failed'}`);
    return data;
  }
}
async function query(type, max=150) {
  const ds=cfg.sources[type]; if(!ds) return [];
  const results=[]; let cursor;
  do {
    const page=await notion('POST',`/data_sources/${uuid(ds)}/query`,{page_size:100,...(cursor?{start_cursor:cursor}:{})});
    results.push(...(page.results||[])); cursor=page.has_more?page.next_cursor:null;
  } while(cursor && results.length < max);
  return results.slice(0,max).map(normalize);
}
async function bootstrap() {
  if(cache.data && Date.now()-cache.at < 40000) return cache.data;
  const names=Object.keys(cfg.sources);
  const result={};
  // Preserve Notion's ~3 req/s average by fetching only two databases at a time.
  for(let i=0;i<names.length;i+=2){
    const pair=names.slice(i,i+2);
    const responses=await Promise.all(pair.map(key=>query(key)));
    pair.forEach((key,j)=>result[key]=responses[j]);
  }
  cache.data=result;cache.at=Date.now();return result;
}
const clearCache=()=>{cache.data=null;cache.at=0};
function prop(type, v) {
  if(type==='number') return {number:v===null||v===''?null:Number(v)};
  if(type==='checkbox') return {checkbox:!!v};
  if(type==='date') return {date:{start:v}};
  if(type==='select') return {select:v?{name:String(v)}:null};
  if(type==='title') return {title:rich(v)};
  if(type==='relation') return {relation:(v||[]).map(id=>({id}))};
  return {rich_text:rich(v)};
}
const dailyType={'Calories':'number','Protein':'number','Carbs':'number','Fat':'number','Fiber':'number','Sugar':'number','Sodium':'number','Water (ml)':'number','Calorie Target (g)':'number','Protein Target (g)':'number','Carbs Target (g)':'number','Fat Target (g)':'number','Water Target (ml)':'number','Creatine Taken':'checkbox','Whey Taken':'checkbox','Creatine (g)':'number','Whey Powder (g)':'number','Went to Gym?':'checkbox','Gym Day':'select','Foods Eaten':'rich_text','Notes':'rich_text'};
async function dayForDate(date) {
  const days=await query('daily',100);
  return days.find(d=>d.Date===date)||null;
}
async function ensureDay(date) {
  let day=await dayForDate(date); if(day) return day;
  const targets=(await query('targets',30)).find(t=>t.Status==='Active')||(await query('targets',30))[0]||{};
  const fields={'Entry':prop('title','Daily Log'),'Date':prop('date',date),'Calorie Target (g)':prop('number',targets['Daily Calories (kcal)']||2300),'Protein Target (g)':prop('number',targets['Protein (g)']||140),'Carbs Target (g)':prop('number',targets['Carbs (g)']||280),'Fat Target (g)':prop('number',targets['Fat (g)']||69),'Water Target (ml)':prop('number',targets['Water (ml)']||3000)};
  const created=await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(cfg.sources.daily)},properties:fields});
  clearCache();return normalize(created);
}
function authCookie(req){ const raw=req.headers.cookie||''; return (raw.match(/(?:^|; )gym_session=([^;]+)/)||[])[1]||''; }
function signedSession(){const exp=Date.now()+7*24*60*60*1000;const nonce=randomBytes(12).toString('hex'); const value=`${exp}.${nonce}`;return `${value}.${createHmac('sha256',cfg.secret).update(value).digest('hex')}`;}
function authenticated(req){if(!live)return true;const value=authCookie(req);const [exp,nonce,signature]=value.split('.');if(!exp||!nonce||!signature||Date.now()>Number(exp))return false;const valid=createHmac('sha256',cfg.secret).update(`${exp}.${nonce}`).digest('hex');return signature.length===valid.length && timingSafeEqual(Buffer.from(signature),Buffer.from(valid));}
function send(res,status,payload,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(payload));}
async function bodyJson(req) {let buf='';for await(const chunk of req){buf+=chunk;if(buf.length>75000) throw new Error('Request too large');}return buf?JSON.parse(buf):{};}
function safeSameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
async function api(req,res,url){
  if(req.method==='GET' && url.pathname==='/api/status') return send(res,200,{live,authRequired:live,authenticated:authenticated(req),configured:Object.fromEntries(Object.entries(cfg.sources).map(([k,v])=>[k,!!v]))});
  if(req.method==='POST' && url.pathname==='/api/login'){
    if(!live)return send(res,200,{ok:true});
    const b=await bodyJson(req);const input=Buffer.from(String(b.password||''));const expected=Buffer.from(cfg.password);
    if(input.length!==expected.length||!timingSafeEqual(input,expected))return send(res,401,{error:'Incorrect password'});
    return send(res,200,{ok:true},{'Set-Cookie':`gym_session=${signedSession()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.NODE_ENV==='production'?'; Secure':''}`});
  }
  if(req.method==='POST' && url.pathname==='/api/logout')return send(res,200,{ok:true},{'Set-Cookie':'gym_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  if(!authenticated(req))return send(res,401,{error:'Please unlock your private dashboard'});
  if(req.method==='GET' && url.pathname==='/api/bootstrap'){
    if(!live)return send(res,200,{mode:'demo'});
    return send(res,200,{mode:'notion',data:await bootstrap()});
  }
  if(!live)return send(res,400,{error:'Demo changes are stored in this browser. Configure Notion to sync.'});
  if(req.method==='POST' && url.pathname==='/api/day'){
    const {date,patch}=await bodyJson(req);if(!dateValid(date))return send(res,400,{error:'Invalid date'});
    const entries=Object.entries(patch||{});if(!entries.length||entries.length>15||entries.some(([k,v])=>!dailyType[k]||(typeof v==='number'&&!Number.isFinite(v))))return send(res,400,{error:'Invalid fields'});
    const day=await ensureDay(date);const properties=Object.fromEntries(entries.map(([k,v])=>[k,prop(dailyType[k],v)]));
    const updated=await notion('PATCH',`/pages/${day.id}`,{properties});clearCache();return send(res,200,{ok:true,day:normalize(updated)});
  }
  if(req.method==='POST' && url.pathname==='/api/food'){
    const {date,foodId,grams,slot}=await bodyJson(req);if(!dateValid(date)||!foodId||!(Number(grams)>0)||Number(grams)>5000)return send(res,400,{error:'Choose a food and a valid serving size'});
    // The website adds macros directly to Daily Nutrients; it does NOT trigger the original Intake buttons.
    // This avoids accidental double-counting in Notion's existing button workflow.
    const foods=await query('foods',300);const food=foods.find(f=>f.id===foodId);if(!food)return send(res,404,{error:'Food not found'});
    const day=await ensureDay(date);const n=Number(grams);const macro={Calories:'Calories / g',Protein:'Protein / g',Carbs:'Carbs / g',Fat:'Fat / g',Fiber:'Fiber / g',Sodium:'Sodium / g',Sugar:'Sugar / g'};
    const patch=Object.fromEntries(Object.entries(macro).map(([field,src])=>[field,prop('number',Math.round(((Number(day[field])||0)+(Number(food[src])||0)*n)*10)/10)]));
    const name=String(food['Food Name']||'Food');const entry=`${slot?slot+' · ':''}${name} · ${n} g`;
    patch['Foods Eaten']=prop('rich_text',[day['Foods Eaten'],entry].filter(Boolean).join('\n'));
    const updated=await notion('PATCH',`/pages/${day.id}`,{properties:patch});clearCache();return send(res,200,{ok:true,day:normalize(updated)});
  }
  if(req.method==='POST' && url.pathname==='/api/plan'){
    const {date,mealId,slot}=await bodyJson(req);if(!dateValid(date)||!mealId||!['Breakfast','Lunch','Dinner','Snack'].includes(slot))return send(res,400,{error:'Choose a meal, date and slot'});
    const meal=(await query('meals',200)).find(m=>m.id===mealId);if(!meal)return send(res,404,{error:'Meal not found'});
    const properties={Entry:prop('title','Planned '+slot),Date:prop('date',date),Meal:prop('relation',[meal.id]),Slot:prop('select',slot),Status:prop('select','Planned'),Servings:prop('number',1)};
    const created=await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(cfg.sources.planner)},properties});clearCache();return send(res,200,{ok:true,entry:normalize(created)});
  }
  if(req.method==='POST' && url.pathname==='/api/plan/status'){
    const {id,status}=await bodyJson(req);if(!['Planned','Logged','Skipped'].includes(status))return send(res,400,{error:'Invalid status'});
    const row=(await query('planner',150)).find(x=>x.id===id);if(!row)return send(res,404,{error:'Plan not found'});
    await notion('PATCH',`/pages/${id}`,{properties:{Status:prop('select',status)}});clearCache();return send(res,200,{ok:true});
  }
  if(req.method==='POST' && url.pathname==='/api/goal/status'){
    const {id,status}=await bodyJson(req);if(!['Active','Planned','Achieved','Paused'].includes(status))return send(res,400,{error:'Invalid status'});
    const row=(await query('goals',100)).find(x=>x.id===id);if(!row)return send(res,404,{error:'Goal not found'});
    await notion('PATCH',`/pages/${id}`,{properties:{Status:prop('select',status)}});clearCache();return send(res,200,{ok:true});
  }
  if(req.method==='POST' && url.pathname==='/api/weight'){
    const {date,weight,waist}=await bodyJson(req);if(!dateValid(date)||Number(weight)<25||Number(weight)>400)return send(res,400,{error:'Invalid date or weight'});
    const properties={Entry:prop('title','Body Log'),Date:prop('date',date),'Body Weight':prop('number',Number(weight))};
    if(waist!==undefined&&waist!=='')properties.Waist=prop('number',Number(waist));
    const created=await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:uuid(cfg.sources.body)},properties});clearCache();return send(res,200,{ok:true,entry:normalize(created)});
  }
  return send(res,404,{error:'Unknown API route'});
}
const server=http.createServer(async(req,res)=>{
  try {
    if(!safeSameOrigin(req))return send(res,403,{error:'Cross-origin request denied'});
    const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
    if(url.pathname.startsWith('/api/'))return await api(req,res,url);
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});
    const requested=url.pathname==='/'?'/index.html':url.pathname;
    const clean=path.posix.normalize(requested).replace(/^\/+/, '');
    const filename=path.resolve(ROOT,'public',clean);
    if(!filename.startsWith(path.resolve(ROOT,'public')+path.sep))return send(res,403,{error:'Forbidden'});
    const data=await fs.readFile(filename).catch(()=>null);
    if(!data){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"});
    if(req.method==='HEAD')return res.end();res.end(data);
  } catch(err) {console.error('Request error:',err.message);if(!res.headersSent)send(res,500,{error:process.env.NODE_ENV==='production'?'Unable to complete request':err.message});}
});
if(process.env.NODE_ENV!=='test') server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Gym Studio running on http://localhost:${process.env.PORT||3000} (${live?'Notion mode':'local demo mode'})`));
export {server,normalize,prop,dateValid};