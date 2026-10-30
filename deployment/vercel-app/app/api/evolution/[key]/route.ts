import {receiveEvolution} from '../../../../lib/evolution.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function webhook(request: Request, context: {params: Promise<{key: string}>}) {
  const {key} = await context.params;
  return receiveEvolution(request, key, {
    key: process.env.EVOLUTION_WEBHOOK_KEY,
    instance: 'tidi',
    group: '120363413918983742@g.us',
    senders: ['140570185994259@lid', '1121137520784@lid'],
    secret: process.env.WHATSAPP_INGEST_SECRET,
    serviceToken: process.env.BRIDGE_SERVICE_TOKEN,
    site: process.env.BRIDGE_BACKEND_URL,
    report: (detail: Record<string, unknown>) => console.info('evolution_ingest', JSON.stringify(detail)),
  });
}
export const POST = webhook;
export const GET = webhook;
