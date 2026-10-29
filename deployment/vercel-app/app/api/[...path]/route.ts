import {createHmac} from 'node:crypto';
import {readSession} from '../../../lib/session.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
async function proxy(r:Request){
 if(!readSession(r.headers.get('cookie')))return Response.json({error:'Entre no SENDOBRA'},{status:401});
 const url=new URL(r.url);if(!['/api/data','/api/test-inbox'].includes(url.pathname))return Response.json({error:'Área administrativa indisponível neste ambiente'},{status:403});
 if(r.method==='POST'&&r.headers.get('origin')!==url.origin)return Response.json({error:'Origem inválida'},{status:403});
 try{const backend=new URL(process.env.BRIDGE_BACKEND_URL||'');if(backend.protocol!=='https:')throw Error('Backend inválido');const body=r.method==='POST'?await r.text():undefined;if(body&&body.length>65536)return Response.json({error:'Use o grupo WhatsApp para enviar arquivos'},{status:413});const raw=JSON.stringify({method:r.method,path:url.pathname+url.search,body}),time=String(Date.now());const signature='v1='+createHmac('sha256',process.env.BRIDGE_SIGNING_SECRET||'').update(time+'.'+raw).digest('hex');const upstream=await fetch(new URL('/api/vercel-bridge',backend),{method:'POST',headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+process.env.BRIDGE_SERVICE_TOKEN,'x-sendobra-bridge-timestamp':time,'x-sendobra-bridge-signature':signature},body:raw,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(50000)});const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Cookie'});for(const name of ['content-type','content-disposition','content-security-policy']){const value=upstream.headers.get(name);if(value)headers.set(name,value);}return new Response(upstream.body,{status:upstream.status,headers});}catch{return Response.json({error:'Backend temporariamente indisponível'},{status:503});}
}
export const GET=proxy;export const POST=proxy;
