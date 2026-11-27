import {AUTH_URL,PUBLIC_KEY,COOKIE,sealSession,confirmedUser} from '../../../../lib/session.mjs';
export const runtime='nodejs';

// In-memory rate limiting for login attempts per IP / identifier
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes window
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count += 1;
  return true;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request:Request){
  const reply=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply('Origem inválida',403);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return reply('Muitas tentativas consecutivas. Aguarde 5 minutos antes de tentar novamente.', 429);
  }

  try {
    const raw=await request.text();if(raw.length>4096)return reply('Dados de acesso inválidos',400);
    const body=JSON.parse(raw);
    if(typeof body.email!=='string'||typeof body.password!=='string'||!body.password||body.email.length>254)return reply('Informe e-mail e senha',400);
    const response=await fetch(AUTH_URL+'/token?grant_type=password',{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:body.email.trim().toLowerCase(),password:body.password})});
    if(!response.ok)return reply(response.status===429?'Aguarde alguns minutos antes de tentar novamente.':'E-mail ou senha inválidos.',response.status===429?429:401);
    const session:any=await response.json();
    if(!session.access_token||!await confirmedUser(session.access_token))return reply('Confirme seu e-mail antes de entrar.',401);
    const age=Math.min(Number(session.expires_in),3600);if(!Number.isSafeInteger(age)||age<=0)return reply('Sessão indisponível',503);
    const value=sealSession(session.access_token,Date.now()+age*1000,process.env.ADMIN_SESSION_KEY);
    
    // Login successful: reset rate limit for this IP
    clearRateLimit(ip);

    return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`}});
  } catch{return reply('Não foi possível entrar. Tente novamente.',503);}
}
