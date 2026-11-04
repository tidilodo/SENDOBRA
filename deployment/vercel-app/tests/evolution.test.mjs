import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {normalizeEvolution, receiveEvolution} from '../lib/evolution.mjs';
const config = {key:'fixture-webhook-key-at-least-32-characters', instance:'tidi', group:'120363413918983742@g.us',senders:['140570185994259@lid'],secret:'fixture-hmac',serviceToken:'fixture-service',site:'https://backend.example'};
const sample = () => ({event:'Message',instance:'tidi',data:{key:{id:'TEST-ID',remoteJid:config.group,participant:config.senders[0],fromMe:false},messageTimestamp:Math.floor(Date.now()/1000),message:{conversation:'Teste do webhook'}}});
const request = (body) => new Request('https://receiver.example/api/evolution/fixture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('filters own messages, other groups, senders and instances before delivery', () => {
 for (const edit of [b=>b.data.key.fromMe=true,b=>delete b.data.key.fromMe,b=>b.data.key.remoteJid='999999@g.us',b=>b.data.key.participant='999999@lid',b=>b.instance='other']) {const b=sample();edit(b);assert.equal(normalizeEvolution(b,config),null);}
});
test('preserves provider message identity and accepts Whatsmeow envelopes', () => {
 const b=sample(); const e=normalizeEvolution(b,config);assert.equal(e.id,'TEST-ID');assert.equal(e.kind,'text');
 const native={event:'Message',data:{Info:{ID:e.id,Chat:e.group,Sender:e.sender,IsFromMe:false,Timestamp:new Date(e.timestamp).toISOString()},Message:{conversation:e.text}}};
 assert.deepEqual(normalizeEvolution(native,config),e);
});
test('media metadata never masquerades as a transcribed or decoded file', () => {
 for (const [name,kind] of [['audioMessage','audio'],['imageMessage','image'],['documentMessage','document']]) {const b=sample();b.data.message={[name]:{url:'https://untrusted.example/file',caption:'Legenda'}};const e=normalizeEvolution(b,config);assert.equal(e.kind,kind);assert.equal(e.image,undefined);if(kind==='audio')assert.equal(e.text,'');}
});
test('rejects invalid secret, oversized input and stale events without upstream calls',async()=>{
 const noFetch=()=>{throw Error('Must not call');};
 assert.equal((await receiveEvolution(request(sample()),'bad',config,noFetch)).status,401);
 assert.equal((await receiveEvolution(request({padding:'x'.repeat(4200000)}),config.key,config,noFetch)).status,413);
 const stale=sample();stale.data.messageTimestamp=1;assert.equal((await receiveEvolution(request(stale),config.key,config,noFetch)).status,400);
});
test('maps the provider alternate LID only to an existing authorized sender', () => {
 const b=sample(), e=normalizeEvolution(b,config);
 const native={event:'Message',instanceName:'tidi',data:{Info:{ID:e.id,Chat:e.group,Sender:'5511999999999@s.whatsapp.net',SenderAlt:e.sender,IsFromMe:false,Timestamp:new Date(e.timestamp).toISOString()},Message:{conversation:e.text}}};
 assert.deepEqual(normalizeEvolution(native,config),e);
 native.data.Info.SenderAlt='999999@lid';assert.equal(normalizeEvolution(native,config),null);
});
test('signs delivery and only acknowledges confirmed backend persistence, including duplicates',async()=>{
 const mock=async(url,options)=>{assert.equal(url.href,'https://backend.example/api/whatsapp');const h=options.headers;assert.equal(h['X-Sendobra-Signature'],'v1='+createHmac('sha256',config.secret).update(h['X-Sendobra-Timestamp']+'.'+options.body).digest('hex'));assert.equal(h['OAI-Sites-Authorization'],'Bearer fixture-service');assert.equal(options.redirect,'error');return Response.json({ok:true,duplicate:true});};
 assert.deepEqual(await (await receiveEvolution(request(sample()),config.key,config,mock)).json(),{ok:true,duplicate:true});
 assert.equal((await receiveEvolution(request(sample()),config.key,config,async()=>new Response('',{status:503}))).status,503);
});
test('group routing is checked before downloading audio or sending it to transcription',async()=>{
 const b=sample(),group='987654321@g.us';b.data.key.remoteJid=group;b.data.message={audioMessage:{url:'https://mmg.whatsapp.net/private'}};
 const calls=[];const mock=async(url,options)=>{calls.push(url.pathname);const metadata=JSON.parse(options.body);assert.deepEqual(metadata,{group,sender:config.senders[0]});assert.match(options.headers['X-Sendobra-Signature'],/^v1=[a-f0-9]{64}$/);return Response.json({ok:true,authorized:false});};
 const {group:_,senders:__,...dynamic}=config;
 assert.deepEqual(await (await receiveEvolution(request(b),config.key,{...dynamic,dynamicRouting:true},mock)).json(),{ok:true,ignored:true});
 assert.deepEqual(calls,['/api/whatsapp-routing']);
});
test('two distinct groups use the canonical sender returned by the live routing policy',async()=>{
 const {group:_,senders:__,...dynamic}=config;
 for(const group of ['987654321@g.us','987654322@g.us']){
  const b=sample(),alternate=config.senders[0];b.data.key.remoteJid=group;b.data.key.participant='5511999999999@s.whatsapp.net';b.data.key.participantAlt=alternate;
  const mock=async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.group,group);if(url.pathname==='/api/whatsapp-routing'){assert.equal(body.alternate,alternate);assert.equal(body.text,undefined);return Response.json({ok:true,authorized:true,sender:alternate});}assert.equal(url.pathname,'/api/whatsapp');assert.equal(body.sender,alternate);assert.equal(body.expense_flow,1);return Response.json({ok:true});};
  assert.equal((await receiveEvolution(request(b),config.key,{...dynamic,dynamicRouting:true},mock)).status,200);
 }
});
test('group announcements record discovery metadata without persisting a message',async()=>{
 const {group:_,senders:__,...dynamic}=config;
 const b={event:'JoinedGroup',instanceName:'tidi',data:{JID:'987654321@g.us',Name:'Obra QA',Participants:[{private:'never forwarded'}]}};
 const mock=async(url,options)=>{assert.equal(url.pathname,'/api/whatsapp-routing');assert.deepEqual(JSON.parse(options.body),{group:'987654321@g.us',name:'Obra QA'});return Response.json({ok:true,authorized:false});};
 assert.deepEqual(await (await receiveEvolution(request(b),config.key,{...dynamic,dynamicRouting:true},mock)).json(),{ok:true,ignored:true});
});
