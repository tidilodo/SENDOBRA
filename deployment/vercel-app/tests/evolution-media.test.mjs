import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeMedia,enrichMedia,receiptSummary} from '../lib/evolution-media.mjs';
import {receiveEvolution} from '../lib/evolution.mjs';
const image=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const ogg=Buffer.from('OggSfixture-audio');
const config={instanceToken:'fixture-evolution',groqKey:'fixture-groq'};
const event={id:'TEST',group:'120363413918983742@g.us',sender:'140570185994259@lid',kind:'audio',timestamp:Date.now(),text:''};
const body=(kind='audio')=>({data:{Message:{[kind+'Message']:{mimetype:kind==='audio'?'audio/ogg':'image/png',seconds:10,fileLength:16,url:'https://mmg.whatsapp.net/fixture',contextInfo:{quotedMessage:{conversation:'must not be sent'}}}}}});
test('rejects incorrect bytes, untrusted URLs and oversized audio before sending credentials',async()=>{
 assert.throws(()=>decodeMedia('data:image/jpeg;base64,'+ogg.toString('base64'),'image'));
 assert.throws(()=>decodeMedia('data:audio/ogg;base64,'+image.toString('base64'),'audio'));
 const b=body();b.data.Message.audioMessage.url='https://attacker.example/file';let calls=0;
 await assert.rejects(enrichMedia(event,b,config,()=>{calls++;}));assert.equal(calls,0);
 b.data.Message.audioMessage.url='https://mmg.whatsapp.net/file';b.data.Message.audioMessage.seconds=121;
 await assert.rejects(enrichMedia(event,b,config,()=>{calls++;}));assert.equal(calls,0);
});
test('audio is downloaded only via the fixed provider, then transcribed without exposing the instance token to Groq',async()=>{
 const calls=[];const mock=async(url,options)=>{calls.push(url);assert.equal(options.redirect,'error');if(calls.length===1){assert.equal(options.headers.apikey,'fixture-evolution');assert.equal(JSON.parse(options.body).message.audioMessage.contextInfo,undefined);return Response.json({data:{base64:'data:audio/ogg;base64,'+ogg.toString('base64')}});}assert.equal(options.headers.apikey,undefined);assert.equal(options.headers.Authorization,'Bearer fixture-groq');assert.equal(options.body.get('model'),'whisper-large-v3-turbo');return Response.json({text:'/despesa 10 | 2026-10-30 | teste',duration:10});};
 const result=await enrichMedia(event,body(),config,mock);assert.equal(result.kind,'audio');assert.match(result.text,/despesa/);assert.deepEqual(calls,['https://evo.useia.api.br/message/downloadmedia','https://api.groq.com/openai/v1/audio/transcriptions']);
});
test('image retains private original and formats validated OCR without inventing payment',async()=>{
 let calls=0;const mock=async(url,options)=>{calls++;if(calls===1)return Response.json({data:{base64:'data:image/png;base64,'+image.toString('base64')}});const input=JSON.parse(options.body);assert.equal(input.model,'qwen/qwen3.8-27b');assert.equal(options.headers.apikey,undefined);return Response.json({choices:[{message:{content:JSON.stringify({fornecedor:'Loja fictícia',descricao:'Cimento',valor_total:'R$ 780,00',data:null,numero_documento:null,observacoes:null})}}]});};
 const result=await enrichMedia({...event,kind:'image',text:'Legenda'},body('image'),config,mock);assert.equal(result.image.mime,'image/png');assert.match(result.text,/R\$ 780,00/);assert.match(result.text,/Pagamento e aprovação não confirmados/);assert.doesNotMatch(result.text,/null/);
 assert.throws(()=>receiptSummary({valor_total:780}));
});
test('transient service failure is retried; permanent OCR failure still preserves the receipt',async()=>{
 await assert.rejects(enrichMedia(event,body(),config,async()=>new Response('',{status:503})),error=>error.retry===true);
 let calls=0;const result=await enrichMedia({...event,kind:'image'},body('image'),config,async()=>++calls===1?Response.json({data:{base64:'data:image/png;base64,'+image.toString('base64')}}):new Response('',{status:400}));assert.ok(result.image);assert.match(result.text,/Leitura automática indisponível/);
});
test('unapproved sender cannot trigger download or paid model requests',async()=>{
 const request=new Request('https://receiver.example',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event:'Message',instance:'tidi',data:{Info:{ID:'X',Chat:event.group,Sender:'999999@lid',IsFromMe:false,Timestamp:new Date().toISOString()},...body().data}})});
 const c={...config,key:'fixture-key-at-least-32-characters-long',instance:'tidi',group:event.group,senders:[event.sender],secret:'fixture-hmac',serviceToken:'fixture-service',site:'https://backend.example'};
 let calls=0;const result=await receiveEvolution(request,c.key,c,()=>{calls++;throw Error('Must not fetch');});assert.equal(result.status,200);assert.equal(calls,0);
});
