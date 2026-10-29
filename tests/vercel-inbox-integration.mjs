import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
const base='http://127.0.0.1:8787',headers={'oai-authenticated-user-id':'migration-owner','oai-authenticated-user-email':'migration-owner@local.test',Origin:base,'Content-Type':'application/json'};
async function request(path,body,auth=headers){const r=await fetch(base+path,{method:body?'POST':'GET',headers:auth,body:body?JSON.stringify(body):undefined});return {status:r.status,data:r.headers.get('content-type')?.includes('json')?await r.json():null};}
async function signed(path,body,secret,bridge=false){const raw=JSON.stringify(body),time=String(Date.now()),signature='v1='+createHmac('sha256',secret).update(time+'.'+raw).digest('hex');return request(path,body,{'Content-Type':'application/json',[bridge?'x-sendobra-bridge-timestamp':'x-sendobra-timestamp']:time,[bridge?'x-sendobra-bridge-signature':'x-sendobra-signature']:signature});}
const bridge=body=>signed('/api/vercel-bridge',body,'fixture-bridge-not-a-live-secret',true);
const state=(await request('/api/data')).data,demo=state.projects.find(p=>p.code==='DEMO-HORIZONTE'),other=state.projects.find(p=>p.code==='QA-PRIVATE');
const group='123456789@g.us',privateGroup='987654321@g.us',sender='5511999999999@s.whatsapp.net';
for(const [id,project] of [[group,demo.id],[privateGroup,other.id]])assert.equal((await request('/api/whatsapp-config',{action:'group',group:id,project,active:true})).status,200);
assert.equal((await request('/api/whatsapp-config',{action:'sender',sender,user:state.user.id})).status,200);
const original={id:'json-test-'+Date.now(),group,sender,kind:'text',text:'Relato fictício para conferir JSON',timestamp:Date.now()};
const send=body=>signed('/api/whatsapp',body,'fixture-not-a-live-secret');
assert.equal((await send(original)).status,200);
assert.equal((await send({...original,id:original.id+'audio',kind:'audio',text:'Transcrição fictícia para o cliente'})).status,200);
const image=await send({...original,id:original.id+'image',kind:'image',image:{mime:'image/png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6x8UAAAAASUVORK5CYII='}});assert.equal(image.status,200,JSON.stringify(image));
assert.equal((await send({...original,id:original.id+'private',group:privateGroup,text:'Não compartilhar'})).status,200);
const inbox=await bridge({method:'GET',path:'/api/test-inbox'});assert.equal(inbox.status,200);assert.ok(inbox.data.events.some(e=>e.document.texto_original===original.text));assert.ok(inbox.data.events.some(e=>e.document.texto_original==='Transcrição fictícia para o cliente'));assert.equal(inbox.data.events.some(e=>e.id.includes('private')),false);assert.ok(inbox.data.events.some(e=>e.receipt===image.data.receipt));
assert.equal((await bridge({method:'GET',path:'/api/test-inbox?file='+image.data.receipt})).status,200);
assert.equal((await bridge({method:'GET',path:'/api/test-inbox?file=other-file'})).status,403);
console.log('PASS: texto original e transcrição em JSON, imagem privada acessível no piloto e eventos de outra obra ocultos.');
