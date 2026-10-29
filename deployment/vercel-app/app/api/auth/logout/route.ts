import {COOKIE} from '../../../../lib/session.mjs';
export function GET(r:Request){return new Response(null,{status:303,headers:{Location:new URL('/acesso',r.url).toString(),'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`,'Cache-Control':'no-store'}});}
