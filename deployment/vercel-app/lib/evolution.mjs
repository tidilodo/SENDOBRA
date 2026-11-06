import {queueCall,processJob} from './durable-ingestion.mjs';
import {createHmac, timingSafeEqual} from 'node:crypto';
import {enrichMedia, MediaError} from './evolution-media.mjs';
import {evolutionInfo,groupSummary} from './evolution-control.mjs';

const senderId=value=>typeof value==='string'&&/^\d{5,30}@(s\.whatsapp\.net|lid)$/.test(value);
const groupId=value=>typeof value==='string'&&/^\d{5,30}@g\.us$/.test(value);
async function signedRequest(config,path,body,signal,fetchImpl){
 const base=new URL(config.site);if(base.protocol!=='https:')throw Error('HTTPS required');
 const payload=JSON.stringify(body),time=String(Date.now());
 return fetchImpl(new URL(path,base),{method:'POST',redirect:'error',signal,headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+config.serviceToken,'X-Sendobra-Timestamp':time,'X-Sendobra-Signature':'v1='+createHmac('sha256',config.secret).update(time+'.'+payload).digest('hex')},body:payload});
}

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
  const candidates = info ? [info.Sender, info.SenderAlt] : [key.participant,key.participantAlt];
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
  if (request.method === 'GET') return reply({ok: true, service: 'SENDOBRA webhook', media: config.instanceToken && config.groqKey ? 'reading-enabled' : 'metadata-only'});
  if (!config.secret || !config.serviceToken || !config.site || !config.dynamicRouting&&(!config.group||!config.senders?.length)) return reply({error: 'Receiver unavailable'}, 503);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error: 'JSON required'}, 415);
  const reader = request.body?.getReader();
  if (!reader) return reply({error: 'Body required'}, 400);
  let raw;
  try {
    const chunks = []; let size = 0;
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.length;
      if (size > 4 * 1024 * 1024) { await reader.cancel(); config.report?.({outcome:'oversized'}); return reply({error: 'Payload too large'}, 413); }
      chunks.push(part.value);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  } catch { return reply({error: 'Invalid body'}, 400); }
  let event, body, candidates, directory;
  try {
    body = JSON.parse(raw); const data = body?.data, info = data?.Info, key = data?.key;
    const type = String(body?.event ?? body?.type ?? '').toLowerCase();
    const chat = info?.Chat ?? key?.remoteJid;
    const content = data?.Message ?? data?.message;
    const marker = content?.conversation ?? content?.extendedTextMessage?.text;
    // Log only fixed classifications and booleans. Never log payloads, IDs, tokens or text.
    const senders=config.senders||[];
    config.report?.({outcome:'received', bytes:Buffer.byteLength(raw), event:['message','messages.upsert'].includes(type)?'message':'other',
      envelope:info?'whatsmeow':key?'api':'other',
      instanceMatch:(body?.instance ?? body?.instanceName ?? config.instance) === config.instance,
      chatShape:typeof chat,
      chatType:typeof chat === 'string' ? chat.endsWith('@g.us')?'group':chat.endsWith('@newsletter')?'newsletter':'direct' : 'unknown',
      testMarker:typeof marker === 'string' && /teste\s+(?:final\s+)?evolution/i.test(marker),
      groupMatch:chat === config.group,
      senderMatch:senders.includes(info?.Sender ?? key?.participant),
      alternateMatch:senders.includes(info?.SenderAlt),
      own:(info?.IsFromMe ?? key?.fromMe) === true});
    if(config.dynamicRouting){
      if((body?.instance??body?.instanceName??config.instance)!==config.instance)return reply({ok:true,ignored:true});
      if(['group','groupinfo','joinedgroup','groups.upsert','groups.update'].includes(type))directory=groupSummary(data?.GroupInfo??data,data?.groupJid);
      if(!directory){candidates=[info?.Sender??key?.participant,info?.SenderAlt??key?.participantAlt].filter(senderId);if(!groupId(chat)||!candidates.length)return reply({ok:true,ignored:true});event=normalizeEvolution(body,{...config,group:chat,senders:candidates});}
    }else event = normalizeEvolution(body, config);
  }
  catch { config.report?.({outcome:'invalid'}); return reply({error: 'Invalid event'}, 400); }
  if (!event&&!directory) { config.report?.({outcome:'ignored'}); return reply({ok: true, ignored: true}); }
  const signal=AbortSignal.timeout(50000);
  if(config.dynamicRouting){
    try{
      const metadata=directory?{group:directory.id,name:directory.name}:{group:event.group,sender:candidates[0],alternate:candidates[1]};
      const r=await signedRequest(config,'/api/whatsapp-routing',metadata,signal,fetchImpl);
      if(!r.ok)throw Error('Routing unavailable');const result=await r.json();if(result.ok!==true)throw Error('Routing unavailable');
      if(directory||result.authorized!==true||!candidates.includes(result.sender)){
        // The first event can reveal the name of a group before it is authorized.
        // This reads only group metadata, never downloads or sends message media.
        if(!directory&&result.discoverName===true&&config.instanceToken){try{const info=await evolutionInfo('group-name',event.group,config.instanceToken,fetchImpl,AbortSignal.timeout(6000));if(info.name)await signedRequest(config,'/api/whatsapp-routing',{group:event.group,name:info.name},signal,fetchImpl);}catch{}}
        config.report?.({outcome:directory?'group-discovered':'routing-denied'});return reply({ok:true,ignored:true});
      }
      event={...event,sender:result.sender};
    }catch{config.report?.({outcome:'routing-failed'});return reply({error:'Routing pending'},503);}
  }
  if(config.durable){
    const id=event.group+':'+event.id;
    try{const saved=await queueCall(config,{action:'enqueue',id,event,envelope:body},fetchImpl);if(saved.status!=='done')await processJob(config,id,fetchImpl).catch(()=>{});return reply({ok:true,accepted:true,duplicate:saved.duplicate===true});}catch{return reply({error:'Durable delivery unavailable'},503);}
  }
  if(['audio','image'].includes(event.kind)) {
    try {event=await enrichMedia(event,body,config,fetchImpl,signal);config.report?.({outcome:'media-read',kind:event.kind});}
    catch(error){
      if(error instanceof MediaError&&!error.retry)event={...event,text:error.message+'. Nenhum lançamento criado.'};
      else {config.report?.({outcome:'media-retry',kind:event.kind});return reply({error:'Media processing pending'},503);}
    }
  }
  // Expense interpretation stays inside the backend; no new external text processing.
  event={...event,expense_flow:1};
  try {
    const response = await signedRequest(config,'/api/whatsapp',event,signal,fetchImpl);
    if (!response.ok) { config.report?.({outcome:'backend-rejected',status:response.status}); return reply({error: 'Delivery pending'}, response.status === 403 ? 403 : 503); }
    const result = await response.json();
    if (result.ok !== true) return reply({error: 'Delivery pending'}, 503);
    config.report?.({outcome:'persisted',duplicate:result.duplicate === true,kind:event.kind});
    return reply({ok: true, duplicate: result.duplicate === true});
  } catch { config.report?.({outcome:'delivery-failed'}); return reply({error: 'Delivery pending'}, 503); }
}
