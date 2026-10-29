import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
const base='http://127.0.0.1:8787',secret='fixture-not-a-live-secret',identity='receipt-qa-'+Date.now(),email=identity+'@local.test';
const headers={'oai-authenticated-user-id':identity,'oai-authenticated-user-email':email,Origin:base,'Content-Type':'application/json'};
async function api(path,body,auth=headers){const r=await fetch(base+path,{method:body?'POST':'GET',headers:auth,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});return {status:r.status,data:await r.json()};}
async function ingest(event){const raw=JSON.stringify(event),time=String(Date.now()),signature='v1='+createHmac('sha256',secret).update(time+'.'+raw).digest('hex');return api('/api/whatsapp',event,{'Content-Type':'application/json','x-sendobra-timestamp':time,'x-sendobra-signature':signature});}
let initial=await api('/api/data');assert.equal(initial.status,200,JSON.stringify(initial));
const project=(await api('/api/data',{action:'projects',name:'QA comprovantes privados',code:identity,address:'Somente teste local'})).data.id;assert.ok(project);
const group='123456789@g.us',sender='5511999999999@s.whatsapp.net';assert.equal((await api('/api/whatsapp-config',{action:'group',group,project,active:true})).status,200);assert.equal((await api('/api/whatsapp-config',{action:'sender',sender,user:initial.data.user.id})).status,200);
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6x8UAAAAASUVORK5CYII=';
const event={id:identity,group,sender,kind:'image',text:'Comprovante fictício',timestamp:Date.now(),image:{mime:'image/png',base64:png}};
const before=(await api('/api/data')).data.records.length,received=await ingest(event);assert.equal(received.status,200,JSON.stringify(received));assert.equal(received.data.record,null);assert.equal((await api('/api/data')).data.records.length,before);
const duplicate=await ingest(event);assert.equal(duplicate.data.duplicate,true);
assert.equal((await api('/api/whatsapp-receipts',undefined,{})).status,403);
const file=await fetch(base+'/api/whatsapp-receipts?file='+received.data.receipt,{headers});assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'image/png');assert.equal(Buffer.from(await file.arrayBuffer()).toString('base64'),png);
assert.equal((await fetch(base+'/api/whatsapp-receipts?file='+received.data.receipt)).status,403);
const invalid=await ingest({...event,id:identity+'bad',image:{mime:'image/jpeg',base64:png}});assert.equal(invalid.status,400);
assert.equal((await ingest({...event,id:identity+'stranger',sender:'5511888888888@s.whatsapp.net'})).status,403);
const badDate=await api('/api/whatsapp-receipts',{action:'create',id:received.data.receipt,project,description:'Despesa QA',amount:'1,00',date:'2026-02-30'});assert.equal(badDate.status,400);
const create={action:'create',id:received.data.receipt,project,description:'Despesa fictícia por imagem',amount:'1,00',date:'2026-10-28'};
const racing=await Promise.all([api('/api/whatsapp-receipts',create),api('/api/whatsapp-receipts',create)]);assert.equal(racing.filter(r=>r.status===200).length,1,JSON.stringify(racing));assert.equal(racing.filter(r=>r.status===409).length,1,JSON.stringify(racing));
const created=racing.find(r=>r.status===200).data,after=await api('/api/data');assert.equal(after.data.records.length,before+1);const record=after.data.records.find(r=>r.id===created.record);assert.equal(record.status,'pending_approval');assert.equal(record.payment,'unreported');assert.equal(after.data.attachments.filter(a=>a.record===record.id).length,1);
assert.equal((await api('/api/data',{action:'decision',id:record.id,decision:'approved'})).status,403);
const repeated=await ingest({...event,id:identity+'again'});assert.equal(repeated.status,200);assert.equal((await api('/api/whatsapp-receipts',{...create,id:repeated.data.receipt})).status,409);
assert.equal((await api('/api/whatsapp-receipts',{action:'link',id:repeated.data.receipt,record:record.id})).status,200);
const final=await api('/api/data');assert.equal(final.data.records.length,before+1);assert.equal(final.data.attachments.filter(a=>a.record===record.id).length,2);assert.equal(final.data.records.find(r=>r.id===record.id).payment,'unreported');
const lower=await api('/api/data',{action:'users',name:'Funcionário QA',email:'employee-'+email,role:'employee',projects:[project]});assert.equal(lower.status,200);const lowHeaders={...headers,'oai-authenticated-user-id':identity+'-employee','oai-authenticated-user-email':'employee-'+email};assert.equal((await api('/api/data',undefined,lowHeaders)).status,200);assert.equal((await api('/api/whatsapp-receipts',undefined,lowHeaders)).status,403);
console.log('PASS: Worker+D1+R2: recebimento sem despesa, assinatura, arquivo privado, MIME, remetente, dedup, revisão concorrente, aprovação pendente, autoaprovação bloqueada, imagem repetida, vínculo sem duplicação e acesso de funcionário negado. Somente dados locais.');
