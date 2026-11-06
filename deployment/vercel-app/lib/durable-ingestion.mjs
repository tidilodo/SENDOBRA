import {createHmac} from 'node:crypto';
import {enrichMedia,MediaError} from './evolution-media.mjs';
export async function queueCall(config,body,fetchImpl=fetch){
 const raw=JSON.stringify(body),time=String(Date.now());const r=await fetchImpl(new URL('/api/whatsapp-jobs',config.site),{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+config.serviceToken,'X-Sendobra-Timestamp':time,'X-Sendobra-Signature':'v1='+createHmac('sha256',config.secret).update(time+'.'+raw).digest('hex')},body:raw});
 if(!r.ok)throw Error('Queue unavailable');const result=await r.json();if(result.ok!==true)throw Error('Queue unavailable');return result;
}
export async function processJob(config,id,fetchImpl=fetch){
 const job=await queueCall(config,{action:'claim',id},fetchImpl);if(!job.claimed)return {ok:true,skipped:true};
 try{
  let event=job.cached;
  if(!event){event=job.event;if(['audio','image'].includes(event.kind)){try{event=await enrichMedia(event,job.envelope,config,fetchImpl,AbortSignal.timeout(35000));}catch(error){if(error instanceof MediaError&&!error.retry)event={...event,text:error.message+'. Nenhum lançamento criado.'};else throw error;}}
   event={...event,expense_flow:1};await queueCall(config,{action:'cache',id,lease:job.lease,event},fetchImpl);
  }
  const raw=JSON.stringify({...event,queue_job:id,queue_lease:job.lease}),time=String(Date.now());const r=await fetchImpl(new URL('/api/whatsapp',config.site),{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+config.serviceToken,'X-Sendobra-Timestamp':time,'X-Sendobra-Signature':'v1='+createHmac('sha256',config.secret).update(time+'.'+raw).digest('hex')},body:raw});
  if(!r.ok||!(await r.json()).ok)throw Error('Delivery failed');await queueCall(config,{action:'complete',id,lease:job.lease},fetchImpl);return {ok:true};
 }catch{await queueCall(config,{action:'fail',id,lease:job.lease},fetchImpl);return {ok:false,pending:true};}
}
export async function drainJobs(config,fetchImpl=fetch){const due=await queueCall(config,{action:'due'},fetchImpl);const results=await Promise.all(due.jobs.slice(0,5).map(job=>processJob(config,job.id,fetchImpl)));return {ok:true,processed:results.length,pending:results.filter(r=>!r.ok).length};}
