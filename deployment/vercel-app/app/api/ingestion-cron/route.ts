import {timingSafeEqual} from 'node:crypto';
import {drainJobs} from '../../../lib/durable-ingestion.mjs';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(r:Request){const actual=Buffer.from(r.headers.get('authorization')||''),expected=Buffer.from('Bearer '+(process.env.INGESTION_CRON_SECRET||''));if(!process.env.INGESTION_CRON_SECRET||actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({error:'Unauthorized'},{status:401});try{return Response.json(await drainJobs({secret:process.env.WHATSAPP_INGEST_SECRET,serviceToken:process.env.BRIDGE_SERVICE_TOKEN,site:process.env.BRIDGE_BACKEND_URL,instanceToken:process.env.EVOLUTION_INSTANCE_TOKEN,groqKey:process.env.GROQ_API_KEY}),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Processing unavailable'},{status:503});}}
