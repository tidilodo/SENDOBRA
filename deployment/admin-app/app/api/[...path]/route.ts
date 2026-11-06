import {currentSession} from '../../../lib/current-session';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const allowed=new Set(['/api/backup','/api/operations','/api/data','/api/test-inbox','/api/expense-inbox','/api/whatsapp-config','/api/whatsapp-receipts']);
async function proxy(request:Request){
  const url=new URL(request.url);
  if(!allowed.has(url.pathname))return Response.json({error:'Rota indisponível'},{status:404});
  if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return Response.json({error:'Origem inválida'},{status:403});
  const session=await currentSession();if(!session)return Response.json({error:'Entre novamente no SENDOBRA.'},{status:401});
  const backend=process.env.ADMIN_BACKEND_URL,service=process.env.ADMIN_BACKEND_SERVICE_TOKEN;
  if(!backend||!service)return Response.json({error:'Conexão administrativa em configuração.'},{status:503});
  const upstream=new URL(url.pathname+url.search,backend);
  if(upstream.origin!=='https://sendobra-pst.bergsonchatgpt.chatgpt.site')return Response.json({error:'Destino indisponível'},{status:503});
  try {
    let body:Uint8Array|undefined;
    if(request.method==='POST'){
      const chunks:Uint8Array[]=[];let size=0;const reader=request.body?.getReader();
      if(reader){while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4200000){await reader.cancel();return Response.json({error:'Envie um arquivo de até 4 MB.'},{status:413});}chunks.push(part.value);}}
      body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
    }
    const headers=new Headers({Origin:upstream.origin,Authorization:'Bearer '+session.token,'OAI-Sites-Authorization':'Bearer '+service});
    const backupToken=request.headers.get('x-backup-token');if(backupToken)headers.set('x-backup-token',backupToken);const type=request.headers.get('content-type');if(type)headers.set('Content-Type',type);
    const response=await fetch(upstream,{method:request.method,headers,body:body as BodyInit|undefined,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(50000)});
    const returned=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    for(const name of ['content-type','content-disposition','content-security-policy']){const value=response.headers.get(name);if(value)returned.set(name,value);}
    return new Response(response.body,{status:response.status,headers:returned});
  }catch{return Response.json({error:'Não foi possível acessar a operação. Tente novamente.'},{status:503});}
}
export const GET=proxy;
export const POST=proxy;
