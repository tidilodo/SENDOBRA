import {COOKIE,AUTH_URL,PUBLIC_KEY} from '../../../../lib/session.mjs';
import {currentSession} from '../../../../lib/current-session';
export async function POST(request:Request){
  if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
  const session=await currentSession();
  if(session){try{await fetch(AUTH_URL+'/logout',{method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+session.token}});}catch{}}
  return new Response(null,{status:303,headers:{Location:'/entrar','Cache-Control':'no-store','Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`}});
}
