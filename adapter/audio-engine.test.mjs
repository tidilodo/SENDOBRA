import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transcribeAudio,audioEvent} from './audio-engine.mjs';
const response=b=>({ok:true,json:async()=>b});
test('Audio Engine usa contrato multipart e consulta resultado sem interpretar despesa',async()=>{
 const calls=[];const text=await transcribeAudio(Buffer.from('ogg'),{url:'http://127.0.0.1:8000',apiKey:'test-key',id:'test',pollMs:0,fetchImpl:async(url,options)=>{calls.push({url,options});return calls.length===1?response({job_id:'job_test'}):response({status:'completed',result:{text:'/despesa 1 | 2026-10-28 | teste'}});}});
 assert.equal(text,'/despesa 1 | 2026-10-28 | teste');assert.equal(calls[0].options.body.get('language'),'pt');assert.equal(calls[0].options.body.get('audio_file').name,'whatsapp.ogg');assert.equal(calls[0].options.headers.Authorization,'Bearer test-key');assert.equal(calls[0].options.headers['Idempotency-Key'].length,64);
});
test('falha do motor e texto vazio não simulam transcrição',async()=>{
 for(const result of [{status:'failed'},{status:'completed',result:{text:''}}]){let count=0;await assert.rejects(transcribeAudio(Buffer.from('ogg'),{url:'http://localhost:8000',apiKey:'test',id:'x',fetchImpl:async()=>++count===1?response({job_id:'job_test'}):response(result)}));}
});
test('não envia chave por HTTP remoto nem baixa áudio de remetente não permitido',async()=>{
 await assert.rejects(transcribeAudio(Buffer.from('ogg'),{url:'http://example.com',apiKey:'test',id:'x'}));let downloaded=false;const event={kind:'audio',sender:'unknown'};
 assert.equal(await audioEvent(event,{}, {allowedSenders:new Set(),download:()=>{downloaded=true;}}),event);assert.equal(downloaded,false);
});
test('áudio acima do limite não é baixado',async()=>{
 let downloaded=false;await assert.rejects(audioEvent({kind:'audio',sender:'allowed'},{message:{audioMessage:{mimetype:'audio/ogg',seconds:121}}},{allowedSenders:new Set(['allowed']),download:()=>{downloaded=true;}}));assert.equal(downloaded,false);
});
