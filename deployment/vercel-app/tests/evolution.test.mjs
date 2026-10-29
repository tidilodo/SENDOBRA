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
 assert.equal((await receiveEvolution(request({padding:'x'.repeat(270000)}),config.key,config,noFetch)).status,413);
 const stale=sample();stale.data.messageTimestamp=1;assert.equal((await receiveEvolution(request(stale),config.key,config,noFetch)).status,400);
});
test('signs delivery and only acknowledges confirmed backend persistence, including duplicates',async()=>{
 const mock=async(url,options)=>{assert.equal(url.href,'https://backend.example/api/whatsapp');const h=options.headers;assert.equal(h['X-Sendobra-Signature'],'v1='+createHmac('sha256',config.secret).update(h['X-Sendobra-Timestamp']+'.'+options.body).digest('hex'));assert.equal(h['OAI-Sites-Authorization'],'Bearer fixture-service');assert.equal(options.redirect,'error');return Response.json({ok:true,duplicate:true});};
 assert.deepEqual(await (await receiveEvolution(request(sample()),config.key,config,mock)).json(),{ok:true,duplicate:true});
 assert.equal((await receiveEvolution(request(sample()),config.key,config,async()=>new Response('',{status:503}))).status,503);
});
