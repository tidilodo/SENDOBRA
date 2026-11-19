import {createHash,randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {AUTH_URL,PUBLIC_KEY} from '../../../../lib/session.mjs';

export const runtime='nodejs';
const origin='https://zapiobra-admin.vercel.app';
const verifierCookie='__Host-zapiobra_recovery';
const cookieOptions={path:'/',httpOnly:true,secure:true,sameSite:'lax' as const};
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function auth(path:string,body:object,token?:string){
  return fetch(AUTH_URL+path,{
    method:token?'PUT':'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
    headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify(body),
  });
}

export async function POST(request:Request){
  if(new URL(request.url).origin!==origin||request.headers.get('origin')!==origin)return reply({error:'Origem inválida.'},403);
  try{
    const raw=await request.text();
    if(raw.length>4096)return reply({error:'Dados inválidos.'},400);
    const body=JSON.parse(raw);
    const jar=await cookies();
    if(body.action==='request'){
      const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
      if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply({error:'Informe um e-mail válido.'},400);
      const verifier=randomBytes(32).toString('base64url');
      const challenge=createHash('sha256').update(verifier).digest('base64url');
      const redirect=encodeURIComponent(origin+'/recuperar-senha');
      const response=await auth('/recover?redirect_to='+redirect,{email,code_challenge:challenge,code_challenge_method:'s256'});
      if(response.status===429)return reply({error:'Aguarde alguns minutos e tente novamente.'},429);
      if(response.status>=500)return reply({error:'O envio está indisponível. Tente novamente mais tarde.'},503);
      jar.set(verifierCookie,verifier,{...cookieOptions,maxAge:3600});
      return reply({ok:true});
    }
    if(body.action!=='update'||typeof body.code!=='string'||!body.code||body.code.length>256||
       typeof body.password!=='string'||body.password.length<8||Buffer.byteLength(body.password)>72)
      return reply({error:'Use uma senha de 8 a 72 bytes.'},400);
    const verifier=jar.get(verifierCookie)?.value;
    if(!verifier)return reply({error:'Abra o link no navegador em que solicitou a recuperação ou peça um novo link.'},400);
    const exchange=await auth('/token?grant_type=pkce',{auth_code:body.code,code_verifier:verifier});
    if(!exchange.ok)return reply({error:'Link inválido ou expirado. Solicite outro link.'},400);
    jar.set(verifierCookie,'',{...cookieOptions,maxAge:0});
    const session=await exchange.json();
    if(typeof session.access_token!=='string')return reply({error:'Solicite um novo link de recuperação.'},400);
    const updated=await auth('/user',{password:body.password},session.access_token);
    if(!updated.ok)return reply({error:'A senha não foi alterada. Solicite um novo link e escolha uma senha diferente.'},400);
    return reply({ok:true});
  }catch{
    return reply({error:'Não foi possível concluir. Tente novamente.'},503);
  }
}
