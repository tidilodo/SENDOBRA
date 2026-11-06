import {createHmac,timingSafeEqual} from 'node:crypto';
const upstream='https://evo.useia.api.br';
const groupId=s=>typeof s==='string'&&/^\d{5,30}@g\.us$/.test(s);
const senderId=s=>typeof s==='string'&&/^\d{5,30}@(lid|s\.whatsapp\.net)$/.test(s);
const nameOf=g=>typeof g?.Name==='string'?g.Name:typeof g?.name==='string'?g.name:typeof g?.subject==='string'?g.subject:'';
export function groupSummary(g,key){const id=g?.JID??g?.jid??g?.id??key;return groupId(id)?{id,name:nameOf(g).trim().slice(0,160)}:null;}
function listOf(data){const v=data?.Groups??data?.groups??data;return Array.isArray(v)?v.map(g=>groupSummary(g)):Object.entries(v||{}).map(([id,g])=>groupSummary(g,id));}
function membersOf(data){const raw=data?.Participants??data?.participants;const result=new Map();if(!Array.isArray(raw))return [];for(const p of raw){const sender=[p.LID,p.JID,p.PhoneNumber,p.id].find(senderId);if(!sender)continue;const phone=String(p.PhoneNumber||'').split('@')[0];result.set(sender,{sender,phone:/^\d{5,30}$/.test(phone)?phone:'',name:String(p.DisplayName||p.Name||'').slice(0,160)});}return [...result.values()];}
export async function evolutionInfo(action,group,token,fetchImpl=fetch,signal=AbortSignal.timeout(30000)){
 if(!token)throw Error('Unavailable');
 async function call(path,body){const r=await fetchImpl(upstream+path,{method:body?'POST':'GET',redirect:'error',signal,headers:{apikey:token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Provider unavailable');return (await r.json()).data;}
 if(action==='members'||action==='group-name'){
  if(!groupId(group))throw Error('Invalid group');const data=await call('/group/info',{groupJid:group});
  const returned=data?.JID??data?.jid??data?.id;if(returned&&returned!==group)throw Error('Unexpected group');
  const name=nameOf(data).trim().slice(0,160);return action==='group-name'?{name}:{name,members:membersOf(data).slice(0,500)};
 }
 const d=await call('/instance/status'),status={connected:d?.Connected===true,loggedIn:d?.LoggedIn===true};
 if(action==='status')return status;
 if(action!=='groups'||!status.connected||!status.loggedIn)throw Error('Provider not connected');
 const groups=listOf(await call('/group/list')).filter(Boolean);return {...status,groups:[...new Map(groups.map(g=>[g.id,g])).values()].slice(0,500)};
}
export async function receiveControl(request,config,fetchImpl=fetch){
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(!config.secret)return reply({error:'Unavailable'},503);
 if(Number(request.headers.get('content-length')||0)>4096)return reply({error:'Too large'},413);
 const raw=await request.text();if(raw.length>4096)return reply({error:'Too large'},413);
 const time=request.headers.get('x-sendobra-timestamp'),signature=request.headers.get('x-sendobra-signature');
 if(!/^\d{13}$/.test(time||'')||Math.abs(Date.now()-Number(time))>300000||!/^v1=[a-f0-9]{64}$/.test(signature||''))return reply({error:'Unauthorized'},401);
 const expected='v1='+createHmac('sha256',config.secret).update(time+'.'+raw).digest('hex');
 if(!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return reply({error:'Unauthorized'},401);
 try{const b=JSON.parse(raw);if(b.action==='drain'&&config.drain)return reply(await config.drain());if(!['groups','status','members'].includes(b.action)||b.action==='members'&&!groupId(b.group))return reply({error:'Invalid request'},400);return reply(await evolutionInfo(b.action,b.group,config.token,fetchImpl,AbortSignal.timeout(b.action==='groups'?8000:30000)));}catch{return reply({error:'Provider unavailable'},503);}
}
