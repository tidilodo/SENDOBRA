import {env} from 'cloudflare:workers';
import {verifySignature,validateEvent} from '../../whatsapp-domain.mjs';
import {groupAccess} from '../../group-domain.mjs';
export const dynamic='force-dynamic';
const json=(b:any,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function POST(r:Request){try{
 const raw=await r.text();if(raw.length>8*1024*1024)return json({error:'Too large'},413);
 if(!await verifySignature(env.WHATSAPP_INGEST_SECRET,raw,r.headers.get('x-sendobra-timestamp'),r.headers.get('x-sendobra-signature')))return json({error:'Unauthorized'},401);
 const b=JSON.parse(raw),db=env.DB!,bucket=env.BUCKET!,now=Date.now(),stamp=new Date(now).toISOString();
 const frozen=await db.prepare("SELECT id FROM maintenance_locks WHERE id='backup' AND expires>?").bind(now).first();if(frozen&&b.action!=='enqueue')return json({error:'Backup window'},503);
 if(b.action==='due'){await db.prepare("UPDATE ingestion_jobs SET status='failed',error='attempts_exhausted',updated=? WHERE status='processing' AND lease_until<? AND attempts>=8").bind(stamp,now).run();const rows=(await db.prepare("SELECT id FROM ingestion_jobs WHERE (status IN ('queued','retry') AND available<=? OR status='processing' AND lease_until<?) AND attempts<8 ORDER BY available LIMIT 5").bind(now,now).all()).results;return json({ok:true,jobs:rows});}
 if(typeof b.id!=='string'||b.id.length>310)return json({error:'Invalid id'},400);
 if(b.action==='enqueue'){
  const e=validateEvent(b.event);if(!e||b.id!==e.group+':'+e.id||!await groupAccess(db,e.group,e.sender))return json({error:'Not authorized'},403);
  const known:any=await db.prepare('SELECT status FROM ingestion_jobs WHERE id=?').bind(b.id).first();if(known)return json({ok:true,duplicate:true,status:known.status});
  // Unique key per attempt prevents a concurrent enqueue overwriting the winner.
  const key='ingestion/'+crypto.randomUUID();await bucket.put(key,JSON.stringify({event:e,envelope:b.envelope}),{httpMetadata:{contentType:'application/json'}});
  try{await db.prepare("INSERT INTO ingestion_jobs(id,group_id,sender_id,status,attempts,available,lease_until,payload_key,created,updated) VALUES(?,?,?,'queued',0,?,0,?,?,?)").bind(b.id,e.group,e.sender,now,key,stamp,stamp).run();}catch(error){await bucket.delete(key);if(!await db.prepare('SELECT id FROM ingestion_jobs WHERE id=?').bind(b.id).first())throw error;}
  return json({ok:true,status:'queued'});
 }
 const job:any=await db.prepare('SELECT * FROM ingestion_jobs WHERE id=?').bind(b.id).first();if(!job)return json({error:'Not found'},404);
 if(b.action==='claim'){
  if(!await groupAccess(db,job.group_id,job.sender_id)){await db.prepare("UPDATE ingestion_jobs SET status='blocked',error='authorization',updated=? WHERE id=? AND status<>'done'").bind(stamp,b.id).run();return json({ok:true,claimed:false});}
  const lease=crypto.randomUUID();const result=await db.prepare("UPDATE ingestion_jobs SET status='processing',lease=?,lease_until=?,attempts=attempts+1,updated=? WHERE id=? AND attempts<8 AND ((status IN ('queued','retry') AND available<=?) OR (status='processing' AND lease_until<?))").bind(lease,now+180000,stamp,b.id,now,now).run();
  if(!result.meta.changes)return json({ok:true,claimed:false,status:job.status});
  const object=await bucket.get(job.payload_key);if(!object)throw Error('Payload missing');const payload=JSON.parse(await object.text());const cached=job.cache_key?await bucket.get(job.cache_key):null;
  return json({ok:true,claimed:true,lease,...payload,cached:cached?JSON.parse(await cached.text()):null});
 }
 if(job.status!=='processing'||job.lease!==b.lease||job.lease_until<now)return json({error:'Lease conflict'},409);
 if(b.action==='cache'){
  if(!b.event||b.event.group+':'+b.event.id!==b.id||b.event.group!==job.group_id||b.event.sender!==job.sender_id)return json({error:'Invalid cache'},400);
  const key='ingestion-cache/'+crypto.randomUUID();await bucket.put(key,JSON.stringify(b.event));const result=await db.prepare("UPDATE ingestion_jobs SET cache_key=?,updated=? WHERE id=? AND lease=? AND status='processing'").bind(key,stamp,b.id,b.lease).run();if(!result.meta.changes){await bucket.delete(key);return json({error:'Lease conflict'},409);}if(job.cache_key)await bucket.delete(job.cache_key);return json({ok:true});
 }
 if(b.action==='complete'){
  if(!await db.prepare('SELECT id FROM whatsapp_messages WHERE id=?').bind(b.id).first())return json({error:'Message not persisted'},409);
  await db.prepare("UPDATE ingestion_jobs SET status='done',lease=NULL,lease_until=0,error=NULL,updated=? WHERE id=? AND lease=?").bind(stamp,b.id,b.lease).run();return json({ok:true});
 }
 if(b.action==='fail'){
  await db.prepare("UPDATE ingestion_jobs SET status=?,available=?,error='processing_failed',lease=NULL,lease_until=0,updated=? WHERE id=? AND lease=?").bind(job.attempts>=8?'failed':'retry',now+Math.min(3600000,30000*2**job.attempts),stamp,b.id,b.lease).run();return json({ok:true});
 }
 return json({error:'Invalid action'},400);
 }catch{return json({error:'Queue unavailable'},503);}}
