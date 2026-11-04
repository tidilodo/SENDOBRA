import {env} from 'cloudflare:workers';
export async function evolutionControl(body:any){
 if(!env.WHATSAPP_INGEST_SECRET)throw Error('Integração não configurada.');
 const raw=JSON.stringify(body),time=String(Date.now()),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.WHATSAPP_INGEST_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(time+'.'+raw)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const response=await fetch('https://sendobra.vercel.app/api/evolution-control',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(35000),headers:{'Content-Type':'application/json','X-Sendobra-Timestamp':time,'X-Sendobra-Signature':'v1='+signature},body:raw});
 if(!response.ok)throw Error('Não foi possível consultar o WhatsApp. Verifique a conexão e tente novamente.');
 return await response.json() as any;
}
