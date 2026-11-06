import {env} from 'cloudflare:workers';
import {verifySignature} from '../../whatsapp-domain.mjs';
import {groupId,senderCandidates,groupAccess} from '../../group-domain.mjs';
export const dynamic='force-dynamic';
const json=(b:any,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
// Service-only routing metadata. This endpoint cannot create records or act as an owner.
export async function POST(r:Request){try{
 const raw=await r.text();if(raw.length>4096)return json({error:'Request too large'},413);
 if(!await verifySignature(env.WHATSAPP_INGEST_SECRET,raw,r.headers.get('x-sendobra-timestamp'),r.headers.get('x-sendobra-signature')))return json({error:'Unauthorized'},401);
 const b=JSON.parse(raw);if(!groupId(b.group))return json({error:'Invalid group'},400);
 const now=new Date().toISOString(),name=typeof b.name==='string'?b.name.trim().slice(0,160):'';
 const seen:any=await env.DB!.prepare('SELECT name,seen FROM whatsapp_group_directory WHERE id=?').bind(b.group).first();
 const frozen=await env.DB!.prepare("SELECT id FROM maintenance_locks WHERE id='backup' AND expires>?").bind(Date.now()).first();
 if(!frozen)await env.DB!.prepare("INSERT INTO whatsapp_group_directory VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=CASE WHEN excluded.name<>'' THEN excluded.name ELSE name END,seen=excluded.seen").bind(b.group,name,now).run();
 for(const sender of senderCandidates(b.sender,b.alternate))if(await groupAccess(env.DB!,b.group,sender))return json({ok:true,authorized:true,sender});
 return json({ok:true,authorized:false,...(!name&&!seen?{discoverName:true}:{})});
 }catch{return json({error:'Routing unavailable'},503);}}
