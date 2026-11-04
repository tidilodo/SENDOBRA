import {env} from 'cloudflare:workers';
import {canProject} from './domain.mjs';
import {groupId,senderId} from './group-domain.mjs';
import {evolutionControl} from './evolution-control';
const json=(b:any,s=200)=>Response.json(b,{status:s,headers:{'Cache-Control':'no-store'}});
export async function groupStats(){
 const db=env.DB!;
 return (await db.prepare("SELECT g.*,d.name,COALESCE(s.mode,'general') mode,MAX(m.received) last_received,SUM(CASE WHEN m.id IS NOT NULL AND m.record_id IS NULL THEN 1 ELSE 0 END) pending FROM whatsapp_groups g LEFT JOIN whatsapp_group_directory d ON d.id=g.id LEFT JOIN whatsapp_group_settings s ON s.group_id=g.id LEFT JOIN whatsapp_messages m ON m.group_id=g.id GROUP BY g.id").all()).results;
}
export async function groupSettings(){
 const db=env.DB!;
 return {groups:await groupStats(),directory:(await db.prepare('SELECT * FROM whatsapp_group_directory ORDER BY name').all()).results,permissions:(await db.prepare('SELECT * FROM whatsapp_group_senders').all()).results};
}
export async function configureGroup(b:any,u:any){
 const db=env.DB!,now=new Date().toISOString();let queries:any[]=[],before:any=null,after:any;
 if(b.action==='discover'||b.action==='status'){
  const result=await evolutionControl({action:b.action==='discover'?'groups':'status'});
  if(b.action==='discover')for(const g of result.groups||[])if(groupId(g.id)&&typeof g.name==='string')queries.push(db.prepare('INSERT INTO whatsapp_group_directory VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,seen=excluded.seen').bind(g.id,g.name.slice(0,160),now));
  queries.push(db.prepare("INSERT INTO whatsapp_connection VALUES('primary',?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,updated=excluded.updated").bind(result.connected&&result.loggedIn?'connected':'disconnected',now));
  await db.batch(queries);return json({ok:true,count:result.groups?.length,connected:result.connected&&result.loggedIn});
 }
 if(!groupId(b.group))return json({error:'Escolha um grupo do WhatsApp'},400);
 if(b.action==='members'){
  if(!await db.prepare('SELECT id FROM whatsapp_group_directory WHERE id=? UNION SELECT id FROM whatsapp_groups WHERE id=?').bind(b.group,b.group).first())return json({error:'Atualize a lista e escolha um grupo'},400);
  const result=await evolutionControl({action:'members',group:b.group});
  queries.push(db.prepare('DELETE FROM whatsapp_group_members WHERE group_id=?').bind(b.group));
  for(const m of result.members||[])if(senderId(m.sender))queries.push(db.prepare('INSERT INTO whatsapp_group_members VALUES(?,?,?,?,?)').bind(b.group,m.sender,String(m.phone||'').slice(0,30),String(m.name||'').slice(0,160),now));
  if(result.name)queries.push(db.prepare('INSERT INTO whatsapp_group_directory VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,seen=excluded.seen').bind(b.group,String(result.name).slice(0,160),now));
  await db.batch(queries);return json({ok:true,members:result.members||[]});
 }
 if(b.action==='connect_group'){
  const project:any=await db.prepare("SELECT * FROM projects WHERE id=? AND status='active'").bind(String(b.project||'')).first();if(!project)return json({error:'Escolha uma obra ativa'},400);
  if(!await db.prepare('SELECT id FROM whatsapp_group_directory WHERE id=?').bind(b.group).first())return json({error:'Atualize os grupos antes de conectar'},400);
  before=await db.prepare("SELECT g.*,COALESCE(s.mode,'general') mode FROM whatsapp_groups g LEFT JOIN whatsapp_group_settings s ON s.group_id=g.id WHERE g.id=?").bind(b.group).first();
  if(before&&(before.project!==project.id||before.mode!=='project'))return json({error:'Este grupo já tem outro vínculo. Use outro grupo para preservar o histórico.'},409);
  if(!Array.isArray(b.senders)||!b.senders.length||b.senders.length>50)return json({error:'Escolha ao menos uma pessoa autorizada a enviar'},400);
  const seen=new Set();
  for(const permission of b.senders){
   if(!senderId(permission.sender)||seen.has(permission.sender))return json({error:'Remetente inválido ou repetido'},400);seen.add(permission.sender);
   const member:any=await db.prepare('SELECT seen FROM whatsapp_group_members WHERE group_id=? AND sender_id=?').bind(b.group,permission.sender).first();
   if(!member||Date.now()-Date.parse(member.seen)>3600000)return json({error:'Atualize os participantes antes de salvar'},409);
   const person:any=await db.prepare('SELECT * FROM users WHERE id=? AND active=1').bind(String(permission.user||'')).first();if(!person||!canProject(person,project.id))return json({error:'A pessoa escolhida precisa ter acesso à obra'},403);
   const mapping:any=await db.prepare('SELECT user FROM whatsapp_senders WHERE id=?').bind(permission.sender).first();if(mapping&&mapping.user!==person.id)return json({error:'Este WhatsApp já pertence a outra pessoa cadastrada'},409);
   if(!mapping)queries.push(db.prepare('INSERT INTO whatsapp_senders VALUES(?,?)').bind(permission.sender,person.id));
  }
  // Existing paused groups stay paused when their sender list is edited.
  if(!before)queries.unshift(db.prepare('INSERT INTO whatsapp_groups VALUES(?,?,1)').bind(b.group,project.id));
  queries.push(db.prepare("INSERT INTO whatsapp_group_settings VALUES(?,'project',?) ON CONFLICT(group_id) DO UPDATE SET updated=excluded.updated").bind(b.group,now));
  queries.push(db.prepare('DELETE FROM whatsapp_group_senders WHERE group_id=?').bind(b.group));
  for(const permission of b.senders)queries.push(db.prepare('INSERT INTO whatsapp_group_senders VALUES(?,?)').bind(b.group,permission.sender));
  after={group:b.group,project:project.id,mode:'project',active:before?!!before.active:true,senders:b.senders};
 }else if(b.action==='pause'){
  if(typeof b.active!=='boolean')return json({error:'Estado de recebimento inválido'},400);
  before=await db.prepare('SELECT * FROM whatsapp_groups WHERE id=?').bind(b.group).first();if(!before)return json({error:'Grupo não encontrado'},404);
  if(b.active&&!await db.prepare("SELECT id FROM projects WHERE id=? AND status='active'").bind(before.project).first())return json({error:'Reative a obra antes de receber mensagens'},400);
  queries.push(db.prepare('UPDATE whatsapp_groups SET active=? WHERE id=?').bind(b.active?1:0,b.group));after={...before,active:b.active};
 }else return json({error:'Ação inválida'},400);
 queries.push(db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),u.id,'whatsapp.configure',b.group,before?JSON.stringify(before):null,JSON.stringify(after),now));await db.batch(queries);return json({ok:true});
}
