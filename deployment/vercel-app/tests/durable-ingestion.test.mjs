import test from 'node:test';
import assert from 'node:assert/strict';
import {processJob} from '../lib/durable-ingestion.mjs';
test('cached media is reused without another model call',async()=>{
 const config={site:'https://backend.test',secret:'fixture',serviceToken:'fixture'},event={id:'m',group:'123456@g.us',sender:'123456@lid',kind:'audio',text:'Transcrição já salva',timestamp:Date.now(),expense_flow:1};const calls=[];
 const fetchImpl=async(url,options)=>{const path=new URL(url).pathname,body=JSON.parse(options.body);calls.push([path,body.action]);if(path==='/api/whatsapp-jobs'){if(body.action==='claim')return Response.json({ok:true,claimed:true,lease:'l',event,envelope:{},cached:event});return Response.json({ok:true});}assert.equal(path,'/api/whatsapp');return Response.json({ok:true});};
 assert.equal((await processJob(config,event.group+':'+event.id,fetchImpl)).ok,true);assert.deepEqual(calls.map(c=>c[1]),['claim',undefined,'complete']);
});
test('backend failure leaves a retryable job rather than reporting delivery',async()=>{
 const actions=[];const fetchImpl=async(url,options)=>{const body=JSON.parse(options.body);if(new URL(url).pathname==='/api/whatsapp')return new Response(null,{status:503});actions.push(body.action);if(body.action==='claim')return Response.json({ok:true,claimed:true,lease:'l',cached:{id:'m',kind:'text'}});return Response.json({ok:true});};
 const r=await processJob({site:'https://backend.test',secret:'fixture',serviceToken:'fixture'},'g:m',fetchImpl);assert.equal(r.pending,true);assert.deepEqual(actions,['claim','fail']);
});
