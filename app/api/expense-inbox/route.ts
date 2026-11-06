import {paginateInbox} from '../../inbox-pagination';
import {env} from 'cloudflare:workers';
import {registeredOwner} from '../../request-actor';
import {money,canProject} from '../../domain.mjs';
import {validDate,possibleDuplicates} from '../../expense-domain.mjs';
import {messageDraft} from '../../group-domain.mjs';
export const dynamic='force-dynamic';
const json=(value:any,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const owner=registeredOwner;
const textOf=(message:any)=>{let document:any={};try{document=message.document?JSON.parse(message.document):{};}catch{}return document.texto_original||(message.kind==='audio'&&message.question?.includes('\n')?message.question.split('\n').slice(1).join('\n'):'');};
async function context(ids?:string[]){
 const db=env.DB!;
 const [p,m,r,f]=await Promise.all([
  db.prepare("SELECT * FROM projects WHERE status='active'").all(),
  db.prepare("SELECT m.*,COALESCE(CASE WHEN json_valid(m.document) THEN json_extract(m.document,'$.origem.usuario_id') END,(SELECT author FROM whatsapp_receipts WHERE message_id=m.id),s.user) author,u.name author_name FROM whatsapp_messages m LEFT JOIN whatsapp_senders s ON s.id=m.sender_id LEFT JOIN users u ON u.id=COALESCE(CASE WHEN json_valid(m.document) THEN json_extract(m.document,'$.origem.usuario_id') END,(SELECT author FROM whatsapp_receipts WHERE message_id=m.id),s.user)"+(ids?" WHERE m.id IN ("+ids.map(()=>"?").join(",")+")":"")+" ORDER BY m.received ASC,m.id ASC").bind(...(ids||[])).all(),
  db.prepare('SELECT * FROM records').all(),
  db.prepare('SELECT * FROM whatsapp_receipts'+(ids?' WHERE message_id IN ('+ids.map(()=>'?').join(',')+')':'')).bind(...(ids||[])).all()
 ]);
 return {projects:p.results as any[],messages:m.results as any[],records:r.results as any[],receipts:f.results as any[]};
}
function safeDraft(m:any,p:any){try{return messageDraft(m,p);}catch{return {questions:['Origem inconsistente. Revisão técnica necessária.'],missing:['origem'],project:null};}}
async function crossPage(data:any){
 const wanted=data.messages.map((m:any)=>{const d=safeDraft(m,data.projects);return {project:d.project,value:d.valor_centavos,date:d.data};});
 const db=env.DB!;
 const extras=(await db.prepare("SELECT m.id,m.document FROM whatsapp_messages m WHERE m.record_id IS NULL AND json_valid(m.document) AND EXISTS(SELECT 1 FROM json_each(?) w WHERE json_extract(m.document,'$.despesa.project')=json_extract(w.value,'$.project') AND json_extract(m.document,'$.despesa.valor_centavos')=json_extract(w.value,'$.value') AND json_extract(m.document,'$.despesa.data')=json_extract(w.value,'$.date'))").bind(JSON.stringify(wanted)).all()).results;
 const hashes=data.receipts.map((r:any)=>r.hash);const matches=hashes.length?(await db.prepare('SELECT * FROM whatsapp_receipts WHERE hash IN (SELECT value FROM json_each(?))').bind(JSON.stringify(hashes)).all()).results:[];
 return {...data,candidates:extras,hashReceipts:matches};
}
function card(message:any,data:any){const draft=safeDraft(message,data.projects),receipt=data.receipts.find((r:any)=>r.message_id===message.id);const others=(data.candidates||data.messages).filter((m:any)=>m.id!==message.id&&!m.record_id).map((m:any)=>({id:m.id,draft:safeDraft(m,data.projects)}));const hashes=receipt?(data.hashReceipts||data.receipts).filter((r:any)=>r.id!==receipt.id&&r.hash===receipt.hash).map((r:any)=>({id:r.record_id||r.message_id,source:r.record_id?'record':'message',description:'Comprovante já recebido'})):[];return {id:message.id,kind:message.kind,status:message.status,received:message.received,author:message.author_name||'Autor não resolvido',record:message.record_id,original:textOf(message),receipt:receipt?.id||null,draft,duplicates:possibleDuplicates(draft,data.records,others,hashes)};}
export async function GET(request:Request){try{if(!await owner(request))return json({error:'Somente proprietário autenticado'},403);const url=new URL(request.url),id=url.searchParams.get('id');if(id){const data=await crossPage(await context([id]));if(!data.messages.length)return json({error:'Mensagem não encontrada'},404);return json({item:card(data.messages[0],data)});}if(url.searchParams.get('version')==='2'){const page=await paginateInbox(env.DB!,url);const data=page.ids.length?await crossPage(await context(page.ids)):{projects:[],messages:[],records:[],receipts:[]};return json({items:page.ids.map(id=>card(data.messages.find((m:any)=>m.id===id),data)),page:page.page,summary:page.summary});}const data=await context();return json({items:data.messages.map(m=>card(m,data))});}catch{return json({error:'Não foi possível consultar as fichas. Confira filtros e cursor.'},400);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida'},403);
 const user=await owner(request);if(!user)return json({error:'Somente proprietário autenticado'},403);
 const raw=await request.text();if(raw.length>8192)return json({error:'Ficha muito grande'},413);const body=JSON.parse(raw);if(typeof body.id!=='string'||body.id.length>310||!['submit','link'].includes(body.action))return json({error:'Ficha inválida'},400);
 const db=env.DB!,data=await context([body.id]),message:any=data.messages.find(m=>m.id===body.id);if(!message)return json({error:'Mensagem não encontrada'},404);if(message.record_id)return json({error:'Esta mensagem já foi revisada. Atualize a lista.'},409);
 const author:any=await db.prepare('SELECT * FROM users WHERE id=? AND active=1').bind(message.author).first();if(!author)return json({error:'Remetente não está ativo'},403);
 const receipt=data.receipts.find(r=>r.message_id===message.id);if(receipt&&receipt.status!=='pending')return json({error:'Comprovante já revisado'},409);
 const before=message.document?JSON.parse(message.document):{},now=new Date().toISOString();let recordId:string,project:string,description:string,amount:number,date:string,category:string,supplier:string|null,queries:any[]=[];
 const proposed=messageDraft(message,data.projects);
 if(proposed.multiplas_obras&&body.confirm_single_project!==true)return json({error:'Confirme a obra correta para esta despesa antes de continuar'},400);
 if(body.action==='link'){
  const record=data.records.find(r=>r.id===body.record);if(!record||record.type!=='expense'||!canProject(user,record.project)||!canProject(author,record.project))return json({error:'Lançamento não autorizado para este remetente'},403);
  recordId=record.id;project=record.project;description=record.description;amount=record.amount;date=record.date;category=record.category;supplier=record.supplier;
  if(proposed.group_project&&project!==proposed.group_project)return json({error:'Escolha um lançamento da obra vinculada ao grupo'},409);
 }else{
  if(body.confirm_review!==true)return json({error:'Confirme a conferência dos dados'},400);
  project=String(body.project||'');if(!data.projects.some(p=>p.id===project)||!canProject(author,project))return json({error:'Escolha uma obra ativa autorizada ao remetente'},403);
  if(proposed.group_project&&project!==proposed.group_project)return json({error:'Use a obra vinculada ao grupo para esta despesa'},409);
  description=typeof body.description==='string'?body.description.trim():'';if(!description||description.length>1000)return json({error:'Descrição obrigatória com até 1.000 caracteres'},400);
  if(!validDate(body.date))return json({error:'Informe uma data existente'},400);date=body.date;amount=money(body.amount);
  const hashes:any[]=receipt?(await db.prepare('SELECT id,message_id,record_id FROM whatsapp_receipts WHERE hash=? AND id<>?').bind(receipt.hash,receipt.id).all()).results as any[]:[];
  const pendingData=await context();const duplicates=possibleDuplicates({project,valor_centavos:amount,data:date},data.records,pendingData.messages.filter(m=>m.id!==message.id&&!m.record_id).map(m=>({id:m.id,draft:safeDraft(m,data.projects)})),hashes.map(r=>({id:r.record_id||r.message_id,source:r.record_id?'record':'message',description:'Comprovante repetido'})));
  if(duplicates.length&&body.confirm_distinct!==true)return json({error:'Possível duplicidade. Vincule ao lançamento existente ou confirme que é uma despesa distinta.',duplicates},409);
  category=typeof body.category==='string'?body.category:'Sem categoria';if(category!=='Sem categoria'&&!await db.prepare('SELECT id FROM categories WHERE name=?').bind(category).first())return json({error:'Categoria inválida'},400);
  supplier=body.supplier?String(body.supplier):null;if(supplier&&!await db.prepare('SELECT id FROM suppliers WHERE id=?').bind(supplier).first())return json({error:'Fornecedor inválido'},400);
  recordId=crypto.randomUUID();
 }
 const available="EXISTS(SELECT 1 FROM whatsapp_messages WHERE id=? AND record_id IS NULL)"+(receipt?" AND EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND status='pending')":'');
 const args=receipt?[message.id,receipt.id]:[message.id];
 if(body.action==='submit')queries.push(db.prepare('INSERT INTO records SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE '+available).bind(recordId,project,message.author,description,amount,'expense',category,supplier,date,'pending_approval','unreported',now,...args));
 const status=body.action==='submit'?'pending_approval':'linked';
 const document={...before,versao_schema:'1.1',texto_original:textOf(message),despesa:{tipo_registro:'despesa',obra:project,valor_centavos:amount,data:date,descricao:description,fornecedor:supplier,categoria:category},dados:{...before.dados,obra_id:project,lancamento_id:recordId},revisao:{status,revisao_id:crypto.randomUUID(),conferido_por:user.id,conferido_em:now,despesa_distinta:body.confirm_distinct===true}};
 const serialized=JSON.stringify(document);
 queries.push(db.prepare('UPDATE whatsapp_messages SET status=?,record_id=?,document=?,question=? WHERE id=? AND record_id IS NULL'+(receipt?" AND EXISTS(SELECT 1 FROM whatsapp_receipts WHERE id=? AND status='pending')":'')).bind(status,recordId,serialized,body.action==='submit'?'Despesa aguardando aprovação. Pagamento não informado.':'Vinculada ao lançamento existente; nenhum novo lançamento criado.',message.id,...(receipt?[receipt.id]:[])));
 const updateIndex=body.action==='submit'?1:0;
 if(receipt){queries.push(db.prepare('INSERT INTO attachments SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM whatsapp_messages WHERE id=? AND record_id=? AND document=?)').bind(receipt.id,recordId,'Comprovante WhatsApp.'+(receipt.mime==='image/png'?'png':'jpg'),receipt.mime,receipt.size,receipt.hash,receipt.author,now,message.id,recordId,serialized));queries.push(db.prepare("UPDATE whatsapp_receipts SET status='linked',record_id=?,reviewer=? WHERE id=? AND EXISTS(SELECT 1 FROM whatsapp_messages WHERE id=? AND record_id=? AND document=?)").bind(recordId,user.id,receipt.id,message.id,recordId,serialized));}
 queries.push(db.prepare('INSERT INTO audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM whatsapp_messages WHERE id=? AND record_id=? AND document=?)').bind(crypto.randomUUID(),user.id,'whatsapp.expense.'+body.action,message.id,JSON.stringify(before),JSON.stringify({record:recordId,project,amount,status,distinct:body.confirm_distinct===true}),now,message.id,recordId,serialized));
 const result=await db.batch(queries);if(!result[updateIndex].meta.changes)return json({error:'Mensagem revisada em outra sessão. Atualize a lista.'},409);
 return json({ok:true,record:recordId,status});
 }catch{return json({error:'Não foi possível revisar a ficha. Confira os dados.'},400);}}
