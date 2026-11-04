import {env} from 'cloudflare:workers';
import {canProject} from '../../domain.mjs';
import {possibleDuplicates} from '../../expense-domain.mjs';
import {messageDraft} from '../../group-domain.mjs';
export const dynamic='force-dynamic';
const json=(body:any,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){try{
 const identity=r.headers.get('oai-authenticated-user-id');if(!identity)return json({error:'Entre no SENDOBRA'},401);
 const db=env.DB!,u:any=await db.prepare('SELECT * FROM users WHERE identity=? AND active=1').bind(identity).first();if(!u)return json({error:'Acesso não autorizado'},403);
 const groups:any[]=(await db.prepare("SELECT g.*,COALESCE(s.mode,'general') mode FROM whatsapp_groups g LEFT JOIN whatsapp_group_settings s ON s.group_id=g.id").all()).results,allowed=groups.filter(g=>canProject(u,g.project));
 const ownSenders:any[]=(await db.prepare('SELECT id FROM whatsapp_senders WHERE user=?').bind(u.id).all()).results;
 const file=new URL(r.url).searchParams.get('file');
 if(file){const receipt:any=await db.prepare('SELECT r.*,m.group_id FROM whatsapp_receipts r JOIN whatsapp_messages m ON m.id=r.message_id WHERE r.id=?').bind(file).first();if(!receipt||!(allowed.some(g=>g.id===receipt.group_id)||(receipt.author===u.id&&groups.some(g=>g.id===receipt.group_id&&g.mode==='general'))))return json({error:'Imagem não autorizada'},403);if(receipt.record_id){const record:any=await db.prepare('SELECT project FROM records WHERE id=?').bind(receipt.record_id).first();if(!record||!canProject(u,record.project))return json({error:'Imagem fora das obras autorizadas'},403);}const object=await env.BUCKET!.get(file);if(!object)return json({error:'Arquivo indisponível'},404);return new Response(object.body,{headers:{'Content-Type':receipt.mime,'Content-Disposition':'inline','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cross-Origin-Resource-Policy':'same-origin'}});}
 const messages:any[]=(await db.prepare('SELECT * FROM whatsapp_messages ORDER BY received DESC LIMIT 200').all()).results;
 const receiptRows:any[]=(await db.prepare('SELECT id,message_id,status,record_id FROM whatsapp_receipts ORDER BY received DESC LIMIT 200').all()).results;
 const projects:any[]=((await db.prepare("SELECT * FROM projects WHERE status='active'").all()).results as any[]).filter(p=>canProject(u,p.id));
 const records:any[]=((await db.prepare('SELECT * FROM records').all()).results as any[]).filter(rec=>canProject(u,rec.project));
 const events=messages.filter(m=>(allowed.some(g=>g.id===m.group_id)||(groups.some(g=>g.id===m.group_id&&g.mode==='general')&&ownSenders.some(s=>s.id===m.sender_id)))&&(!m.record_id||records.some(rec=>rec.id===m.record_id))).map(m=>{
 const attachment=receiptRows.find(f=>f.message_id===m.id),audio=m.kind==='audio'&&m.question?.includes('\n')?m.question.split('\n').slice(1).join('\n'):null;
 const document=m.document?JSON.parse(m.document):{id:m.id,versao_schema:'1.0',tipo:m.kind==='audio'?'audio_transcrito':m.kind==='image'?'comprovante':'texto',origem:{canal:'whatsapp',mensagem_id:m.id,recebido_em:m.received},texto_original:audio,dados:{obra_id:null,lancamento_id:m.record_id,comprovante_id:attachment?.id||null},revisao:{status:m.status,observacao:m.question||null}};
 const draft=m.record_id&&document.despesa?{...document.despesa,project:document.dados?.obra_id,missing:[],questions:[]}:messageDraft({...m,document},projects);
 const expense={...draft,project_name:projects.find(p=>p.id===draft.project)?.name||null,possible_duplicate_count:m.record_id?0:possibleDuplicates(draft,records).length};
 return {id:m.id,kind:m.kind,status:m.status,received:m.received,question:m.question,record:m.record_id,receipt:attachment?.id||null,document,expense};});
 const connection:any=await db.prepare("SELECT state,updated FROM whatsapp_connection WHERE id='primary'").first();
 return json({events,connection:connection&&Date.now()-Date.parse(connection.updated)<120000?connection:{state:'disconnected'}});
 }catch{return json({error:'Não foi possível consultar os testes'},500);}}
