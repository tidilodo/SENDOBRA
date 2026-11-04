import {receiveControl} from '../../../lib/evolution-control.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=45;
export async function POST(request:Request){return receiveControl(request,{secret:process.env.WHATSAPP_INGEST_SECRET,token:process.env.EVOLUTION_INSTANCE_TOKEN});}
