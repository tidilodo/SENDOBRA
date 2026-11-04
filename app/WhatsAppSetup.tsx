'use client';
import {useEffect,useState} from 'react';
import {MessageCircle,RefreshCw,Pause,Play,Plus,X} from 'lucide-react';
type Link={sender:string;user:string};
type Member={sender:string;phone:string;name:string};
const date=(value:string)=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});
const memberLabel=(m:Member)=>[m.name,m.phone?'+'+m.phone:''].filter(Boolean).join(' · ')||'Participante sem nome';
const stateLabel:Record<string,string>={connected:'WhatsApp conectado',connecting:'Conectando',pairing_required:'Pareamento necessário',disconnected:'WhatsApp desconectado',unknown:'Conexão ainda não verificada'};

export default function WhatsAppSetup({data,initialProject='',onSaved,onReview}:{data:any;initialProject?:string;onSaved?:()=>Promise<void>;onReview?:()=>void}){
 const [state,S]=useState<any>(),[error,E]=useState(''),[notice,N]=useState(''),[busy,B]=useState(''),[show,Show]=useState(!!initialProject);
 const [project,P]=useState(initialProject),[group,G]=useState(''),[editing,Editing]=useState(false),[members,M]=useState<Member[]>([]),[links,L]=useState<Link[]>([]),[sender,Sender]=useState(''),[person,Person]=useState('');
 const personName=(id:string)=>data.users.find((u:any)=>u.id===id)?.name||'Pessoa cadastrada';
 const projectName=(id:string)=>data.projects.find((p:any)=>p.id===id)?.name||'Obra cadastrada';
 const displayGroup=(g:any)=>g.name||(g.mode==='general'?'Grupo piloto geral':'Grupo de '+projectName(g.project));
 async function load(){const r=await fetch('/api/whatsapp-config',{cache:'no-store'}),value:any=await r.json();if(!r.ok)throw Error(value.error);S(value);return value;}
 useEffect(()=>{load().catch(e=>E(e.message));},[]);
 async function call(action:string,body:any={}){const r=await fetch('/api/whatsapp-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...body})}),value:any=await r.json();if(!r.ok)throw Error(value.error);return value;}
 async function discover(){const next=await load();if(next.directory.some((g:any)=>!next.groups.some((saved:any)=>saved.id===g.id))){N('Lista de grupos detectados atualizada.');return;}try{await call('discover');await load();N('Lista de grupos atualizada.');}catch{N('A lista do WhatsApp não respondeu. Envie uma mensagem de identificação no grupo e atualize a lista.');}}
 async function run(action:string,work:()=>Promise<void>){B(action);E('');N('');try{await work();}catch(e:any){E(e.message||'Não foi possível concluir. Tente novamente.');}finally{B('');}}
 function reset(g='',p=initialProject,edit=false){G(g);P(p);Editing(edit);M([]);L([]);Sender('');Person('');}
 async function participants(g:string,edit:boolean){const value=await call('members',{group:g});const next=await load();M(value.members);if(edit)L(next.permissions.filter((x:any)=>x.group_id===g&&value.members.some((m:Member)=>m.sender===x.sender_id)).map((x:any)=>({sender:x.sender_id,user:next.senders.find((s:any)=>s.id===x.sender_id)?.user})).filter((x:Link)=>x.user));}
 function addSender(){if(!sender||!person||links.some(l=>l.sender===sender))return;L([...links,{sender,user:person}]);Sender('');Person('');}
 const directory=(state?.directory||[]).filter((g:any)=>!state.groups.some((saved:any)=>saved.id===g.id));
 const selected=state?.senders.find((s:any)=>s.id===sender);
 return <section className="panel settings whatsapp-setup" aria-labelledby="groups-title">
  <div className="wa-groups-head"><div><h2 id="groups-title"><MessageCircle size={19}/> Grupos do WhatsApp por obra</h2><p>Conecte os grupos que a equipe já usa. As mensagens autorizadas chegam à conferência da obra.</p></div><button type="button" disabled={!!busy} onClick={()=>run('status',async()=>{await call('status');await load();N('Conexão verificada.');})}><RefreshCw size={15}/>{busy==='status'?'Verificando…':'Verificar conexão'}</button></div>
  {error&&<div role="alert" className="alert error">{error}</div>}{notice&&<div role="status" className="alert success">{notice}</div>}
  {!state&&!error&&<p role="status">Carregando grupos…</p>}{!state&&error&&<button disabled={!!busy} onClick={()=>run('reload',async()=>{await load();})}>Atualizar painel</button>}
  {state&&<>
   <div className="wa-connection"><span className={'badge '+(state.connection.state==='connected'?'approved':'')}>{stateLabel[state.connection.state]||stateLabel.unknown}</span>{state.connection.updated&&<small>Verificado em {date(state.connection.updated)}</small>}</div>
   <div className="wa-groups-list" aria-label="Grupos vinculados">
    {state.groups.length===0&&<p>Adicione o número dedicado ao primeiro grupo da obra e conecte-o abaixo.</p>}
    {state.groups.map((g:any)=><article key={g.id} className="wa-group-row"><div><strong>{displayGroup(g)}</strong><small>{g.mode==='general'?'Grupo geral de teste':projectName(g.project)}</small></div><div><span className={'badge '+(g.active?'approved':'')}>{g.active?'Recebimento ativo':'Pausado'}</span><small>{g.last_received?'Último recebimento: '+date(g.last_received):'Aguardando a primeira mensagem'}</small></div><div><strong>{g.pending||0}</strong><small>em conferência</small></div><div className="wa-group-actions">{!!g.pending&&onReview&&<button type="button" onClick={onReview}>Conferir</button>}{g.mode==='project'&&<button type="button" disabled={!!busy} onClick={()=>{reset(g.id,g.project,true);Show(true);run('members',()=>participants(g.id,true));}}>Editar remetentes</button>}<button type="button" disabled={!!busy} onClick={()=>run('pause',async()=>{await call('pause',{group:g.id,active:!g.active});await load();await onSaved?.();N(g.active?'Recebimento pausado. O histórico foi preservado.':'Recebimento reativado.');})}>{g.active?<Pause size={14}/>:<Play size={14}/>} {g.active?'Pausar':'Reativar'}</button></div></article>)}
   </div>
   {!show&&<button type="button" className="primary" disabled={!!busy} onClick={()=>{reset();Show(true);}}><Plus size={16}/>Conectar grupo à obra</button>}
   {show&&<form className="wa-link-form" onSubmit={e=>{e.preventDefault();run('save',async()=>{await call('connect_group',{group,project,senders:links});await load();await onSaved?.();Show(false);reset();N(editing?'Remetentes atualizados.':'Grupo vinculado à obra. Recebimento ativado.');});}}>
    <div className="wa-link-heading"><h3>{editing?'Editar remetentes autorizados':'Conectar grupo à obra'}</h3><button type="button" disabled={!!busy} onClick={()=>{Show(false);reset();}}>Fechar</button></div>
    <p>Adicione o número dedicado ao grupo no WhatsApp. Depois atualize a lista, escolha a obra e autorize quem envia informações.</p>
    <div className="wa-fields"><label>Obra<select required value={project} disabled={editing||!!busy} onChange={e=>P(e.target.value)}><option value="">Escolha a obra</option>{data.projects.filter((p:any)=>p.status==='active').map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Grupo do WhatsApp<select required value={group} disabled={editing||!!busy} onChange={e=>{G(e.target.value);M([]);L([]);Sender('');Person('');}}><option value="">Escolha o grupo</option>{editing?<option value={group}>{displayGroup(state.groups.find((g:any)=>g.id===group))}</option>:directory.map((g:any)=><option key={g.id} value={g.id}>{g.name||'Grupo detectado em '+date(g.seen)}</option>)}</select></label></div>
    <div className="wa-group-actions"><button type="button" disabled={!!busy||editing} onClick={()=>run('discover',discover)}><RefreshCw size={15}/>{busy==='discover'?'Buscando grupos…':'Atualizar lista de grupos'}</button><button type="button" disabled={!!busy||!group} onClick={()=>run('members',()=>participants(group,editing))}>{busy==='members'?'Carregando participantes…':'Carregar participantes'}</button></div>
    {!editing&&<p>Se o grupo não aparecer, confirme que o número dedicado está nele, envie uma mensagem de identificação e atualize a lista.</p>}
    {members.length>0&&<><div className="wa-fields"><label>Participante do WhatsApp<select value={sender} disabled={!!busy} onChange={e=>{Sender(e.target.value);Person(state.senders.find((s:any)=>s.id===e.target.value)?.user||'');}}><option value="">Escolha pelo nome ou número</option>{members.filter(m=>!links.some(l=>l.sender===m.sender)).map(m=><option key={m.sender} value={m.sender}>{memberLabel(m)}</option>)}</select></label><label>Pessoa no SENDOBRA<select value={person} disabled={!!busy||!sender||!!selected} onChange={e=>Person(e.target.value)}><option value="">Selecione a pessoa cadastrada</option>{data.users.filter((u:any)=>u.active).map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label></div><button type="button" disabled={!!busy||!sender||!person} onClick={addSender}><Plus size={15}/>Adicionar remetente autorizado</button></>}
    {links.length>0&&<ul className="wa-senders" aria-label="Remetentes autorizados">{links.map(l=><li key={l.sender}><span>{personName(l.user)}<small>{members.find(m=>m.sender===l.sender)?.phone?'+'+members.find(m=>m.sender===l.sender)?.phone:''}</small></span><button type="button" aria-label={'Remover '+personName(l.user)} disabled={!!busy} onClick={()=>L(links.filter(x=>x.sender!==l.sender))}><X size={16}/></button></li>)}</ul>}
    <p>Participar do grupo não dá acesso ao painel. O SENDOBRA não envia respostas nesse grupo.</p>
    <button className="primary" disabled={!!busy||!group||!project||!links.length}>{busy==='save'?'Salvando…':editing?'Salvar remetentes':'Vincular e ativar recebimento'}</button>
   </form>}
   <details className="wa-technical"><summary>Remetentes vinculados · acesso técnico</summary><p>Vínculos já cadastrados. Nos grupos de obra, autorize cada pessoa separadamente acima.</p>{state.senders.map((s:any)=><div className="setting-row" key={s.id}><b>{personName(s.user)}</b><small>{s.id}</small></div>)}</details>
  </>}
 </section>;
}
