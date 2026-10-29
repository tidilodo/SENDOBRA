import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export const COOKIE='sendobra_session';
export function codeHash(code){return createHash('sha256').update(code).digest('hex');}
export function validAccess(email,code,env=process.env,now=Date.now()){
 if(typeof email!=='string'||typeof code!=='string'||!/^\S+@\S+\.\S+$/.test(email)||!/^\w{64}$/.test(code)||!env.ACCESS_CODE_HASH||!/^[a-f0-9]{64}$/.test(env.ACCESS_CODE_HASH)||now>=Number(env.ACCESS_EXPIRES_AT)*1000)return false;
 return email.toLowerCase().trim()===env.ACCESS_EMAIL?.toLowerCase()&&timingSafeEqual(Buffer.from(codeHash(code)),Buffer.from(env.ACCESS_CODE_HASH));
}
export function makeSession(env=process.env,now=Date.now()){
 if(!env.SESSION_SIGNING_SECRET||env.SESSION_SIGNING_SECRET.length<32)throw Error('Sessão não configurada');
 const payload=Buffer.from(JSON.stringify({email:env.ACCESS_EMAIL,exp:Math.min(Math.floor(now/1000)+8*3600,Number(env.ACCESS_EXPIRES_AT))})).toString('base64url');
 return payload+'.'+createHmac('sha256',env.SESSION_SIGNING_SECRET).update(payload).digest('base64url');
}
export function readSession(cookie,env=process.env,now=Date.now()){
 try{if(!env.SESSION_SIGNING_SECRET)return null;const token=String(cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token)return null;const parts=token.split('.');if(parts.length!==2)return null;const expected=createHmac('sha256',env.SESSION_SIGNING_SECRET).update(parts[0]).digest(),actual=Buffer.from(parts[1],'base64url');if(actual.length!==expected.length||!timingSafeEqual(expected,actual))return null;const value=JSON.parse(Buffer.from(parts[0],'base64url').toString());if(!Number.isSafeInteger(value.exp)||value.exp*1000<=now||now>=Number(env.ACCESS_EXPIRES_AT)*1000||value.email!==env.ACCESS_EMAIL)return null;return value;}catch{return null;}
}
