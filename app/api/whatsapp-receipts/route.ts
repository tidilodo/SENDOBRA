import {env} from 'cloudflare:workers';
import {money,canProject} from '../../domain.mjs';
export const dynamic='force-dynamic';
const json=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function owner(r:Request){const identity=r.headers.get('oai-authenticated-user-id');if(!identity)return null;return env.DB!.prepare("SELECT * FROM users WHERE identity=? AND role='owner' AND active=1").bind(identity).first() as Promise<any>;}
export async function GET(r:Request){try{
 const u=await owner(r);if(!u)return json({error:'Somente proprietário autenticado'},403);
 const db=env.DB!,url=new URL(r.url),file=url.searchParams.get('file');
 if(file){const receipt:any=await db.prepare('SELECT * FROM whatsapp_receipts WHERE id=?').bind(file).first();if(!receipt)return json({error:'Imagem não encontrada'},404);const object=await env.BUCKET!.get(receipt.id);if(!object)return json({error:'Imagem indisponível'},404);
 await db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),u.id,'whatsapp.image.read',receipt.id,null,null,new Date().toISOString()).run();
 return new Response(object.body,{headers:{'Content-Type':receipt.mime,'Content-Disposition':'inline; filename="comprovante.'+(receipt.mime==='image/png'?'png':'jpg')+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cross-Origin-Resource-Policy':'same-origin'}});}
 const result=await db.prepare(`SELECT r.*,u.name author_name,(SELECT count(*) FROM whatsapp_receipts other WHERE other.hash=r.hash AND other.id<>r.id) duplicate_count FROM whatsapp_receipts r JOIN users u ON u.id=r.author ORDER BY r.received DESC LIMIT 100`).all();
 return json({receipts:result.results});
 }catch{return json({error:'Não foi possível consultar as imagens'},500);}}
export async function POST(r:Request){try{
 if(r.headers.get('origin')!==new URL(r.url).origin)return json({error:'Origem inválida'},403);
 const u=await owner(r);if(!u)return json({error:'Somente proprietário autenticado'},403);
 const b:any=await r.json();if(!b||typeof b.id!=='string'||b.id.length>100)return json({error:'Imagem inválida'},400);
 const db=env.DB!,receipt:any=await db.prepare('SELECT * FROM whatsapp_receipts WHERE id=?').bind(b.id).first();if(!receipt)return json({error:'Imagem inexistente'},404);if(receipt.status!=='pending')return json({error:'Esta imagem já foi revisada. Atualize a lista.'},409);
 const context:any=await db.prepare("SELECT json_extract(document,'$.contexto_grupo.project_id') project FROM whatsapp_messages WHERE id=?").bind(receipt.message_id).first();
 const now=new Date().toISOString(),attachment=receipt.id;let recordId:string,queries:any[]=[];
 if(b.action==='link'){
 const record:any=await db.prepare('SELECT * FROM records WHERE id=?').bind(String(b.record||'')).first();if(!record||!canProject(u,record.project))return json({error:'Lançamento não autorizado'},403);if(context?.project&&context.project!==record.project)return json({error:'Use Conferência para revisar uma divergência de obra'},409);recordId=record.id;
 }else if(b.action==='create'){
 const project=typeof b.project==='string'&&await db.prepare("SELECT id FROM projects WHERE id=? AND status='active'").bind(b.project).first();if(!project||!canProject(u,b.project))return json({error:'Escolha uma obra válida'},400);
 if(context?.project&&context.project!==b.project)return json({error:'Use Conferência para revisar uma divergência de obra'},409);
 const author:any=await db.prepare('SELECT * FROM users WHERE id=? AND active=1').bind(receipt.author).first();if(!author||!canProject(author,b.project))return json({error:'Remetente sem acesso à obra escolhida'},403);
 const description=typeof b.description==='string'?b.description.trim():'';if(!description||description.length>1000)return json({error:'Descrição obrigatória com até 1.000 caracteres'},400);
 if(typeof b.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||Number.isNaN(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date)return json({error:'Data inválida'},400);
 const amount=money(b.amount),duplicate:any=await db.prepare('SELECT id FROM whatsapp_receipts WHERE hash=? AND id<>?').bind(receipt.hash,receipt.id).first();if(duplicate&&b.confirm_duplicate!==true)return json({error:'Imagem repetida. Vincule ao lançamento existente ou confirme que é uma despesa distinta.'},409);
 recordId=crypto.randomUUID();queries.push(db.prepare("INSERT INTO records SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND status='pending')").bind(recordId,b.project,receipt.author,description,amount,'expense','Sem categoria',null,b.date,'pending_approval','unreported',now,receipt.id));
 }else return json({error:'Ação inválida'},400);
 queries.push(db.prepare("INSERT INTO attachments SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND status='pending')").bind(attachment,recordId,'Comprovante WhatsApp.'+(receipt.mime==='image/png'?'png':'jpg'),receipt.mime,receipt.size,receipt.hash,receipt.author,now,receipt.id));
 queries.push(db.prepare("UPDATE whatsapp_receipts SET status='linked',record_id=?,reviewer=? WHERE id=? AND status='pending'").bind(recordId,u.id,receipt.id));
 queries.push(db.prepare("UPDATE whatsapp_messages SET status=?,record_id=? WHERE id=? AND EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND record_id=?)").bind(b.action==='create'?'pending_approval':'linked',recordId,receipt.message_id,receipt.id,recordId));
 queries.push(db.prepare('INSERT INTO audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND record_id=?)').bind(crypto.randomUUID(),u.id,'whatsapp.image.'+b.action,receipt.id,null,JSON.stringify({record:recordId}),now,receipt.id,recordId));
 const results=await db.batch(queries);if(!results[b.action==='create'?2:1].meta.changes)return json({error:'Imagem revisada em outra sessão. Atualize a lista.'},409);
 return json({ok:true,record:recordId,status:b.action==='create'?'pending_approval':'linked'});
 }catch{return json({error:'Não foi possível revisar a imagem. Confira os dados.'},400);}}
