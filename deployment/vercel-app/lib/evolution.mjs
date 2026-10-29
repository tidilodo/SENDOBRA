import {createHmac, timingSafeEqual} from 'node:crypto';

export function validWebhookKey(actual, expected) {
  if (typeof expected !== 'string' || expected.length < 32 || typeof actual !== 'string') return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Evolution Go versions expose either the API envelope or a Whatsmeow Message event.
export function normalizeEvolution(body, config, now = Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('Invalid envelope');
  const instance = body.instance ?? body.instanceName;
  if (instance !== undefined && instance !== config.instance) return null;
  const type = String(body.event ?? body.type ?? '').toLowerCase();
  if (!['message', 'messages.upsert'].includes(type)) return null;
  const data = body.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Invalid message');
  const info = data.Info;
  const key = data.key;
  if (!info && !key) throw Error('Unsupported message envelope');
  const own = info ? info.IsFromMe : key.fromMe;
  // Require an explicit false; missing provenance must never create records.
  if (own !== false) return null;
  const group = info ? info.Chat : key.remoteJid;
  // Go may swap the phone JID into Sender and preserve the original LID in SenderAlt.
  // Resolve only to an already-authorized identity; never enroll a new sender here.
  const candidates = info ? [info.Sender, info.SenderAlt] : [key.participant];
  const sender = candidates.find(value => config.senders.includes(value));
  if (group !== config.group || !config.senders.includes(sender)) return null;
  const id = info ? info.ID : key.id;
  if (typeof id !== 'string' || !id || id.length > 200) throw Error('Invalid id');
  let timestamp = info ? Date.parse(info.Timestamp) : Number(data.messageTimestamp) * 1000;
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 86400000) throw Error('Invalid timestamp');
  let message = info ? data.Message : data.message;
  for (let depth = 0; depth < 3; depth++) {
    const nested = message?.ephemeralMessage?.message ?? message?.viewOnceMessage?.message ?? message?.viewOnceMessageV2?.message;
    if (!nested) break;
    message = nested;
  }
  if (!message || typeof message !== 'object') throw Error('Invalid content');
  let kind = 'text', text = message.conversation ?? message.extendedTextMessage?.text ?? '';
  if (message.audioMessage) { kind = 'audio'; text = ''; }
  else if (message.imageMessage) { kind = 'image'; text = message.imageMessage.caption ?? ''; }
  else if (message.documentMessage) { kind = 'document'; text = message.documentMessage.caption ?? ''; }
  else if (!text) return null;
  if (typeof text !== 'string' || text.length > 4000) throw Error('Invalid text');
  return {id, group, sender, timestamp, kind, text};
}

export async function receiveEvolution(request, key, config, fetchImpl = fetch) {
  const reply = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}});
  if (!validWebhookKey(key, config.key)) return reply({error: 'Unauthorized'}, 401);
  if (request.method === 'GET') return reply({ok: true, service: 'SENDOBRA webhook', media: 'metadata-only'});
  if (!config.secret || !config.serviceToken || !config.site || !config.group || !config.senders?.length) return reply({error: 'Receiver unavailable'}, 503);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error: 'JSON required'}, 415);
  const reader = request.body?.getReader();
  if (!reader) return reply({error: 'Body required'}, 400);
  let raw;
  try {
    const chunks = []; let size = 0;
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.length;
      if (size > 2 * 1024 * 1024) { await reader.cancel(); config.report?.({outcome:'oversized'}); return reply({error: 'Payload too large'}, 413); }
      chunks.push(part.value);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  } catch { return reply({error: 'Invalid body'}, 400); }
  let event;
  try {
    const body = JSON.parse(raw), data = body?.data, info = data?.Info, key = data?.key;
    const type = String(body?.event ?? body?.type ?? '').toLowerCase();
    // Log only fixed classifications and booleans. Never log payloads, IDs, tokens or text.
    config.report?.({outcome:'received', bytes:Buffer.byteLength(raw), event:['message','messages.upsert'].includes(type)?'message':'other',
      envelope:info?'whatsmeow':key?'api':'other',
      groupMatch:(info?.Chat ?? key?.remoteJid) === config.group,
      senderMatch:config.senders.includes(info?.Sender ?? key?.participant),
      alternateMatch:config.senders.includes(info?.SenderAlt),
      own:(info?.IsFromMe ?? key?.fromMe) === true});
    event = normalizeEvolution(body, config);
  }
  catch { config.report?.({outcome:'invalid'}); return reply({error: 'Invalid event'}, 400); }
  if (!event) { config.report?.({outcome:'ignored'}); return reply({ok: true, ignored: true}); }
  try {
    const base = new URL(config.site);
    if (base.protocol !== 'https:') throw Error('HTTPS required');
    const payload = JSON.stringify(event), time = String(Date.now());
    const response = await fetchImpl(new URL('/api/whatsapp', base), {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
      headers: {'Content-Type': 'application/json', 'OAI-Sites-Authorization': 'Bearer ' + config.serviceToken,
        'X-Sendobra-Timestamp': time, 'X-Sendobra-Signature': 'v1=' + createHmac('sha256', config.secret).update(time + '.' + payload).digest('hex')},
      body: payload,
    });
    if (!response.ok) { config.report?.({outcome:'backend-rejected',status:response.status}); return reply({error: 'Delivery pending'}, response.status === 403 ? 403 : 503); }
    const result = await response.json();
    if (result.ok !== true) return reply({error: 'Delivery pending'}, 503);
    config.report?.({outcome:'persisted',duplicate:result.duplicate === true,kind:event.kind});
    return reply({ok: true, duplicate: result.duplicate === true, media: event.kind === 'text' ? undefined : 'metadata-only'});
  } catch { config.report?.({outcome:'delivery-failed'}); return reply({error: 'Delivery pending'}, 503); }
}
