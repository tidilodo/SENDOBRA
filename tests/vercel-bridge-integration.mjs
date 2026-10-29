import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
const base='http://127.0.0.1:8787',headers={'oai-authenticated-user-id':'migration-owner','oai-authenticated-user-email':'migration-owner@local.test',Origin:base,'Content-Type':'application/json'};
async function api(path,body,auth=headers){const r=await fetch(base+path,{method:body?'POST':'GET',headers:auth,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const type=r.headers.get('content-type');return {status:r.status,data:type?.includes('json')?await r.json():null};}
async function bridge(body,secret='fixture-bridge-not-a-live-secret',time=String(Date.now())){const raw=JSON.stringify(body),signature='v1='+createHmac('sha256',secret).update(time+'.'+raw).digest('hex');return api('/api/vercel-bridge',body,{'Content-Type':'application/json','x-sendobra-bridge-timestamp':time,'x-sendobra-bridge-signature':signature});}
const owner=await api('/api/data');assert.equal(owner.status,200);
const demo=await api('/api/data',{action:'projects',name:'QA Demo Vercel',code:'DEMO-HORIZONTE',address:'Fictício'});assert.equal(demo.status,200);
const real=await api('/api/data',{action:'projects',name:'QA não autorizado',code:'QA-PRIVATE',address:'Não compartilhar'});assert.equal(real.status,200);
const client=await api('/api/data',{action:'users',name:'Cliente QA',email:'tidilodo@gmail.com',role:'employee',projects:[demo.data.id]});assert.equal(client.status,200);
const visible=await bridge({method:'GET',path:'/api/data'});assert.equal(visible.status,200,JSON.stringify(visible));assert.equal(visible.data.user.role,'employee');assert.equal(visible.data.projects.length,1);assert.equal(visible.data.projects[0].id,demo.data.id);
assert.equal((await bridge({method:'GET',path:'/api/data'},'wrong')).status,401);
assert.equal((await bridge({method:'GET',path:'/api/data'},undefined,String(Date.now()-400000))).status,401);
assert.equal((await bridge({method:'GET',path:'/api/data',email:headers['oai-authenticated-user-email']})).status,400);
for(const path of ['/api/whatsapp-config','/api/whatsapp-receipts','https://evil.invalid/api/data'])assert.equal((await bridge({method:'GET',path})).status,403);
assert.equal((await bridge({method:'POST',path:'/api/data',body:JSON.stringify({action:'users',name:'Intruso',email:'intruso@local.test',role:'owner'})})).status,403);
assert.equal((await bridge({method:'POST',path:'/api/data',body:JSON.stringify({action:'record',project:real.data.id})})).status,403);
const created=await bridge({method:'POST',path:'/api/data',body:JSON.stringify({action:'record',project:demo.data.id,type:'expense',description:'Teste fictício Vercel',amount:'1,00',date:'2026-10-29'})});assert.equal(created.status,200,JSON.stringify(created));
const read=await bridge({method:'GET',path:'/api/data'});assert.equal(read.data.records.length,1);assert.equal(read.data.records[0].status,'pending_approval');assert.equal(read.data.records[0].payment,'unreported');assert.equal((await bridge({method:'POST',path:'/api/data',body:JSON.stringify({action:'decision',id:created.data.id,decision:'approved'})})).status,403);
assert.equal((await bridge({method:'GET',path:'/api/test-inbox'})).status,200);
console.log('PASS: ponte fixa no cliente, somente obra fictícia, HMAC/replay, identidade forjada negada, rotas administrativas negadas e despesa pendente sem pagamento.');
