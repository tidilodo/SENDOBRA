import {env} from 'cloudflare:workers';
import {verifySignature} from '../../whatsapp-domain.mjs';
import * as data from '../data/route';
import * as inbox from '../test-inbox/route';
export const dynamic='force-dynamic';
const json=(body:any,status:number)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(r:Request){
 if(!env.VERCEL_BRIDGE_SECRET||!env.VERCEL_TEST_USER_EMAIL)return json({error:'Ambiente de demonstração não configurado'},503);
 try{
 const raw=await r.text();if(raw.length>131072)return json({error:'Requisição muito grande'},413);
 if(!await verifySignature(env.VERCEL_BRIDGE_SECRET,raw,r.headers.get('x-sendobra-bridge-timestamp'),r.headers.get('x-sendobra-bridge-signature')))return json({error:'Assinatura inválida'},401);
 const b=JSON.parse(raw);if(b.email!==undefined||!['GET','POST'].includes(b.method)||typeof b.path!=='string')return json({error:'Operação inválida'},400);
 const path=new URL(b.path,'https://backend.invalid');if(path.origin!=='https://backend.invalid'||!['/api/data','/api/test-inbox'].includes(path.pathname))return json({error:'Rota fora do piloto'},403);
 const u:any=await env.DB!.prepare("SELECT * FROM users WHERE email=? AND role='employee' AND active=1").bind(env.VERCEL_TEST_USER_EMAIL.toLowerCase()).first();if(!u)return json({error:'Conta de teste não autorizada'},403);
 const demos:any[]=(await env.DB!.prepare("SELECT id FROM projects WHERE code IN ('PILOTO-WA','DEMO-HORIZONTE')").all()).results;const assigned=JSON.parse(u.projects||'[]');const allowed=demos.map(p=>p.id).filter(id=>assigned.includes(id));if(!allowed.length||assigned.some((id:string)=>!allowed.includes(id)))return json({error:'Conta precisa estar limitada às obras de demonstração'},403);
 let body:string|undefined;if(b.method==='POST'){
 if(path.pathname!=='/api/data'||typeof b.body!=='string')return json({error:'Operação fora do piloto'},403);const payload=JSON.parse(b.body);if(payload.action!=='record'||!allowed.includes(payload.project))return json({error:'Somente lançamento na obra de demonstração'},403);body=JSON.stringify(payload);
 }
 const identity=u.identity||'vercel-demo:'+u.id;
 if(!u.identity)await env.DB!.prepare('UPDATE users SET identity=? WHERE id=? AND identity IS NULL').bind(identity,u.id).run();
 const target=new URL(path.pathname+path.search,new URL(r.url).origin),headers=new Headers({'oai-authenticated-user-id':identity,'oai-authenticated-user-email':u.email,Origin:target.origin,'Content-Type':'application/json'});
 const request=new Request(target,{method:b.method,headers,body});
 return path.pathname==='/api/data'?(b.method==='POST'?data.POST(request):data.GET(request)):inbox.GET(request);
 }catch{return json({error:'Não foi possível consultar o ambiente de demonstração'},400);}
}
