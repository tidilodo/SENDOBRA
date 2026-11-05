import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export const COOKIE='__Host-sendobra_admin';
export const AUTH_URL='https://kciwsyoebypthsnzraup.supabase.co/auth/v1';
export const PUBLIC_KEY='sb_publishable_RKQ_TNR6oAkUf4OMHvmVWw_DKCHZpPm';

export function sealSession(token,expiresAt,secret) {
  if (!/^[a-f0-9]{64}$/i.test(secret||'')) throw Error('Session configuration unavailable');
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',Buffer.from(secret,'hex'),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify({token,expiresAt}),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
}

export function openSession(value,secret,now=Date.now()) {
  try {
    if (!/^[a-f0-9]{64}$/i.test(secret||'')||typeof value!=='string'||value.length>12000) return null;
    const bytes=Buffer.from(value,'base64url');
    const decipher=createDecipheriv('aes-256-gcm',Buffer.from(secret,'hex'),bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(12,28));
    const data=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8'));
    return typeof data.token==='string'&&Number.isSafeInteger(data.expiresAt)&&data.expiresAt>now?data:null;
  } catch { return null; }
}

export async function confirmedUser(token,fetchImpl=fetch) {
  const response=await fetchImpl(AUTH_URL+'/user',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token}});
  if(!response.ok)return null;
  const user=await response.json();
  return user.id&&user.email&&user.email_confirmed_at?{id:user.id,email:user.email}:null;
}
