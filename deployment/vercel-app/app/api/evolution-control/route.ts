import {drainJobs} from '../../../lib/durable-ingestion.mjs';
import {receiveControl} from '../../../lib/evolution-control.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=45;
export async function POST(request:Request){return receiveControl(request,{secret:process.env.WHATSAPP_INGEST_SECRET,token:process.env.EVOLUTION_INSTANCE_TOKEN,drain:()=>drainJobs({secret:process.env.WHATSAPP_INGEST_SECRET,serviceToken:process.env.BRIDGE_SERVICE_TOKEN,site:process.env.BRIDGE_BACKEND_URL,instanceToken:process.env.EVOLUTION_INSTANCE_TOKEN,groqKey:process.env.GROQ_API_KEY})});}
