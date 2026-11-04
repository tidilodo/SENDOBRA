import {localExpense} from './expense-domain.mjs';
import {canProject} from './domain.mjs';
export const groupId=value=>typeof value==='string'&&/^\d{5,30}@g\.us$/.test(value);
export const senderId=value=>typeof value==='string'&&/^\d{5,30}@(lid|s\.whatsapp\.net)$/.test(value);
// Preserve the previously deployed pilot restrictions while new groups use stored permissions.
const pilotGroup='120363413918983742@g.us';
const pilotSenders=new Set(['140570185994259@lid','1121137520784@lid','226632707125480@lid']);
export function senderCandidates(primary,alternate){return [...new Set([primary,alternate].filter(senderId))];}
export async function groupAccess(db,group,sender){
 const g=await db.prepare("SELECT g.*,COALESCE(s.mode,'general') mode,s.group_id IS NOT NULL scoped,p.name project_name,p.code project_code,p.status project_status FROM whatsapp_groups g LEFT JOIN whatsapp_group_settings s ON s.group_id=g.id JOIN projects p ON p.id=g.project WHERE g.id=? AND g.active=1").bind(group).first();
 if(!g)return null;
 const user=await db.prepare('SELECT u.* FROM users u JOIN whatsapp_senders s ON s.user=u.id WHERE s.id=? AND u.active=1').bind(sender).first();
 if(!user)return null;
 if(!g.scoped&&group===pilotGroup&&!pilotSenders.has(sender))return null;
 if(g.scoped&&!await db.prepare('SELECT sender_id FROM whatsapp_group_senders WHERE group_id=? AND sender_id=?').bind(group,sender).first())return null;
 if(g.mode==='project'&&(g.project_status!=='active'||!canProject(user,g.project)))return null;
 return {group:g,user};
}
export function messageDraft(message,projects){
 const doc=typeof message.document==='string'?JSON.parse(message.document):message.document||{};
 const text=doc.texto_original||(message.kind==='audio'&&message.question?.includes('\n')?message.question.split('\n').slice(1).join('\n'):'');
 return projectDraft(text,message.kind,projects,Date.parse(doc.origem?.enviado_em||message.received),doc.contexto_grupo);
}
export function projectDraft(text,kind,projects,timestamp,context){
 const draft=localExpense(text,kind,projects,timestamp);
 if(context?.mode!=='project')return draft;
 const bound=projects.find(p=>p.id===context.project_id&&p.status==='active');
 if(!bound)return {...draft,project:null,missing:[...new Set([...draft.missing,'obra'])],questions:['A obra vinculada ao grupo está inativa ou fora do seu acesso.'],group_conflict:true,multiplas_obras:true};
 if(draft.multiplas_obras||(draft.obra&&draft.project!==bound.id))return {...draft,project:null,group_conflict:true,multiplas_obras:true,missing:[...new Set([...draft.missing,'obra'])],questions:[`A mensagem cita outra obra ou um nome diferente de ${bound.name}, vinculada ao grupo. Confirme a obra antes de registrar.`,...draft.questions.filter(q=>!q.includes('obra'))]};
 return {...draft,obra:bound.name,project:bound.id,group_project:bound.id,missing:draft.missing.filter(field=>field!=='obra'),questions:draft.questions.filter(q=>!q.includes('obra'))};
}
