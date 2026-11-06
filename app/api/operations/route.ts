import {env} from 'cloudflare:workers';
import {registeredOwner} from '../../request-actor';
import {evolutionControl} from '../../evolution-control';
export const dynamic='force-dynamic';
const json=(b:any,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){if(!await registeredOwner(r))return json({error:'Somente proprietário'},403);const db=env.DB!;return json({jobs:(await db.prepare('SELECT id,status,attempts,available,error,updated FROM ingestion_jobs ORDER BY updated DESC LIMIT 100').all()).results,counts:(await db.prepare('SELECT status,count(*) count FROM ingestion_jobs GROUP BY status').all()).results});}
export async function POST(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin||!await registeredOwner(r))return json({error:'Acesso negado'},403);try{const b:any=await r.json();if(b.action==='retry'&&typeof b.id==='string'){await env.DB!.prepare("UPDATE ingestion_jobs SET status='queued',attempts=0,available=?,error=NULL,updated=? WHERE id=? AND status IN ('failed','blocked','retry')").bind(Date.now(),new Date().toISOString(),b.id).run();}return json(await evolutionControl({action:'drain'}));}catch{return json({error:'Fila preservada. Não foi possível processar agora.'},503);}}
