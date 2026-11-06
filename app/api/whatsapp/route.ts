import {env} from 'cloudflare:workers';
import {decodeReceipt} from '../../receipt-domain.mjs';
import {canProject} from '../../domain.mjs';
import {groupAccess,projectDraft} from '../../group-domain.mjs';
import {validateEvent,parseEvent,verifySignature} from '../../whatsapp-domain.mjs';
export const dynamic='force-dynamic';
const json=(b:any,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function POST(r:Request){
 if(!env.WHATSAPP_INGEST_SECRET)return json({error:'Integração não configurada'},503);
 try{
 if(!r.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON obrigatório'},415);
 const reader=r.body?.getReader();if(!reader)return json({error:'Corpo obrigatório'},400);const chunks:Uint8Array[]=[];let size=0;while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>7*1024*1024){await reader.cancel();return json({error:'Evento excede limite'},413);}chunks.push(v.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}const raw=new TextDecoder().decode(bytes);
 if(!await verifySignature(env.WHATSAPP_INGEST_SECRET,raw,r.headers.get('x-sendobra-timestamp'),r.headers.get('x-sendobra-signature')))return json({error:'Assinatura inválida'},401);
 const b:any=JSON.parse(raw),db=env.DB!,now=new Date().toISOString();
 if(b.event==='connection'){if(!['connecting','connected','disconnected','pairing_required'].includes(b.state))return json({error:'Estado inválido'},400);await db.prepare('INSERT INTO whatsapp_connection VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state, updated=excluded.updated').bind('primary',b.state,now).run();return json({ok:true});}
 const queued:any=b.queue_job===b.group+':'+b.id?await db.prepare("SELECT id FROM ingestion_jobs WHERE id=? AND lease=? AND status='processing' AND lease_until>?").bind(b.queue_job,String(b.queue_lease||''),Date.now()).first():null;
 const e=validateEvent(b,!!queued),access=await groupAccess(db,e.group,e.sender);if(!access)return json({error:'Grupo ou remetente não autorizado'},403);const {group,user:u}=access;
 const flow=b.expense_flow===1||group.mode==='project';
 const projects:any[]=flow?((await db.prepare("SELECT * FROM projects WHERE status='active'").all()).results as any[]).filter(p=>canProject(u,p.id)):[];
 if(flow?!projects.length:!canProject(u,group.project))return json({error:'Remetente sem obra autorizada'},403);
 const groupContext=group.mode==='project'?{mode:'project',project_id:group.project,project_name:group.project_name}:undefined;
 const document=JSON.stringify({versao_schema:'1.1',tipo:e.kind==='image'?'comprovante':e.kind==='audio'?'audio_transcrito':'texto',origem:{canal:'whatsapp',mensagem_id:e.id,grupo_id:e.group,remetente_id:e.sender,usuario_id:u.id,enviado_em:new Date(e.timestamp).toISOString(),recebido_em:now},texto_original:e.text||null,contexto_grupo:groupContext,dados:{obra_id:null},revisao:{status:'pendente',campos_a_confirmar:['obra','dados_do_registro']},...(flow?{despesa:projectDraft(e.text,e.kind,projects,e.timestamp,groupContext)}:{})});
 const messageId=e.group+':'+e.id;const existing:any=await db.prepare('SELECT status, record_id, question FROM whatsapp_messages WHERE id=?').bind(messageId).first();if(existing)return json({ok:true,duplicate:true,status:existing.status,record:existing.record_id});
 if(e.kind==='image'&&b.image){
 const image=decodeReceipt(b.image),receipt=crypto.randomUUID(),correlation=crypto.randomUUID();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',image.bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
 await env.BUCKET!.put(receipt,image.bytes,{httpMetadata:{contentType:image.mime}});
 try{await db.batch([
 db.prepare('INSERT INTO whatsapp_messages(id,group_id,sender_id,kind,status,record_id,received,question,correlation) VALUES(?,?,?,?,?,?,?,?,?)').bind(messageId,e.group,e.sender,e.kind,'awaiting_review',null,now,'Imagem privada recebida. Revise em Comprovantes → Imagens do WhatsApp. Nenhum lançamento criado.',correlation),
 db.prepare('UPDATE whatsapp_messages SET document=? WHERE id=?').bind(document,messageId),
 db.prepare('INSERT INTO whatsapp_receipts(id,message_id,author,mime,size,hash,caption,received,status) VALUES(?,?,?,?,?,?,?,?,?)').bind(receipt,messageId,u.id,image.mime,image.bytes.length,hash,e.text,now,'pending'),
 db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),u.id,'whatsapp.image.received',receipt,null,JSON.stringify({message:messageId,hash,correlation}),now)
 ]);}catch(error){await env.BUCKET!.delete(receipt);const duplicate:any=await db.prepare('SELECT status,record_id FROM whatsapp_messages WHERE id=?').bind(messageId).first();if(duplicate)return json({ok:true,duplicate:true,status:duplicate.status,record:duplicate.record_id});throw error;}
 return json({ok:true,status:'awaiting_review',record:null,receipt,correlation});
 }
 const parsed:any=flow?{question:'Informação organizada para conferência. Confirme obra, valor, data e descrição antes de enviar para aprovação. Nenhum lançamento criado.'}:parseEvent(e);
 const status=parsed.question?'awaiting_clarification':(['owner','manager'].includes(u.role)?'approved':'pending_approval');
 const recordId=parsed.question?null:crypto.randomUUID(),correlation=crypto.randomUUID();
 const q=[db.prepare('INSERT INTO whatsapp_messages(id,group_id,sender_id,kind,status,record_id,received,question,correlation) VALUES(?,?,?,?,?,?,?,?,?)').bind(messageId,e.group,e.sender,e.kind,status,recordId,now,parsed.question||null,correlation)];
 q.push(db.prepare('UPDATE whatsapp_messages SET document=? WHERE id=?').bind(document,messageId));
 if(recordId)q.push(db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(recordId,group.project,u.id,parsed.description,parsed.amount,parsed.type,'Sem categoria',null,parsed.date,status,'unreported',now));
 q.push(db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),u.id,'whatsapp.'+(recordId?'record':'clarification'),messageId,null,JSON.stringify({record:recordId,status,correlation}),now));
 try{await db.batch(q);}catch(err){const duplicate:any=await db.prepare('SELECT status, record_id FROM whatsapp_messages WHERE id=?').bind(messageId).first();if(duplicate)return json({ok:true,duplicate:true,status:duplicate.status,record:duplicate.record_id});throw err;}
 return json({ok:true,status,record:recordId,correlation,reply:parsed.question||(status==='approved'?'Lançamento registrado como aprovado. Não confirma pagamento bancário.':'Lançamento registrado e aguardando aprovação no painel.')});
 }catch{return json({error:'Não foi possível processar o evento com segurança'},400);}
}
