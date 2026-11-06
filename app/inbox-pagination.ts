import {env} from 'cloudflare:workers';
const enc=new TextEncoder();
async function mac(value:string){const secret=env.WHATSAPP_INGEST_SECRET;if(!secret)throw Error('Cursor indisponível');const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function paginateInbox(db:D1Database,url:URL){
 const q=url.searchParams,view=q.get('view')||'pending',order=q.get('order')||'oldest',limit=Number(q.get('limit')||50);
 if(!['pending','history'].includes(view)||!['oldest','newest'].includes(order)||!Number.isInteger(limit)||limit<1||limit>100)throw Error('Filtros inválidos');
 const kind=q.get('kind')||'',project=q.get('project')||'';if(kind&&!['text','audio','image','document'].includes(kind))throw Error('Tipo inválido');
 const filters=JSON.stringify([view,order,kind,project,q.get('received_from'),q.get('received_to'),limit]);
 let snapshot=new Date().toISOString(),position:any=null;
 const cursor=q.get('cursor');if(cursor){if(cursor.length>3000)throw Error('Cursor inválido');const [payload,sig]=cursor.split('.');if(!sig||await mac(payload)!==sig)throw Error('Cursor inválido');let c;try{c=JSON.parse(atob(payload));}catch{throw Error('Cursor inválido');}if(c.filters!==filters||typeof c.snapshot!=='string'||!Array.isArray(c.position)||c.position.length!==2||c.position.some((x:any)=>typeof x!=='string'))throw Error('Cursor incompatível');snapshot=c.snapshot;position=c.position;}
 const where=[view==='pending'?'m.record_id IS NULL':'m.record_id IS NOT NULL','m.received<=?'],args:any[]=[snapshot];
 if(kind){where.push('m.kind=?');args.push(kind);}
 if(project){where.push("COALESCE(CASE WHEN json_valid(m.document) THEN json_extract(m.document,'$.contexto_grupo.project_id') END,CASE WHEN json_valid(m.document) THEN json_extract(m.document,'$.despesa.project') END,'unknown')=?");args.push(project);}
 for(const [name,op] of [['received_from','>='],['received_to','<']]){const value=q.get(name);if(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Data inválida');let d=new Date(value+'T00:00:00-03:00');if(op==='<')d=new Date(d.getTime()+86400000);where.push('m.received'+op+'?');args.push(d.toISOString());}}
 const matching:any=await db.prepare('SELECT count(*) n FROM whatsapp_messages m WHERE '+where.join(' AND ')).bind(...args).first();
 const summary:any=await db.prepare('SELECT count(*) n,min(received) oldest FROM whatsapp_messages WHERE record_id IS NULL').first();
 if(position){const op=order==='oldest'?'>':'<';where.push(`(m.received ${op} ? OR (m.received=? AND m.id ${op} ?))`);args.push(position[0],position[0],position[1]);}
 const rows:any[]=(await db.prepare('SELECT m.id,m.received FROM whatsapp_messages m WHERE '+where.join(' AND ')+` ORDER BY m.received ${order==='oldest'?'ASC':'DESC'},m.id ${order==='oldest'?'ASC':'DESC'} LIMIT ?`).bind(...args,limit+1).all()).results;
 const more=rows.length>limit,items=rows.slice(0,limit);let next=null;if(more){const last=items.at(-1),payload=btoa(JSON.stringify({filters,snapshot,position:[last.received,last.id]}));next=payload+'.'+await mac(payload);}
 return {ids:items.map(x=>x.id),page:{limit,has_more:more,next_cursor:next,snapshot_at:snapshot},summary:{pending_total:summary.n,matching_total:matching.n,oldest_pending_at:summary.oldest,calculated_at:new Date().toISOString()}};
}
