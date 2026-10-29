import {createHmac} from 'node:crypto';
export async function deliver(event,config){
 const raw=JSON.stringify(event),timestamp=String(Date.now());
 const headers={'Content-Type':'application/json','X-Sendobra-Timestamp':timestamp,'X-Sendobra-Signature':'v1='+createHmac('sha256',config.secret).update(timestamp+'.'+raw).digest('hex')};
 if(config.serviceToken)headers['OAI-Sites-Authorization']='Bearer '+config.serviceToken;
 const response=await fetch(new URL('/api/whatsapp',config.site),{method:'POST',headers,body:raw,signal:AbortSignal.timeout(event.image?60000:15000),redirect:'error'});
 if(!response.ok){const error=new Error('Backend rejeitou evento: HTTP '+response.status);error.retry=response.status>=500||response.status===429;throw error;}
 return await response.json();
}
export function eventFromMessage(m,group){
 if(m.key?.fromMe||m.key?.remoteJid!==group||!m.key?.participant||!m.key?.id)return null;
 const message=m.message?.ephemeralMessage?.message||m.message;let kind='text',text=message?.conversation||message?.extendedTextMessage?.text||'';
 if(message?.audioMessage)kind='audio';else if(message?.imageMessage){kind='image';text=message.imageMessage.caption||'';}else if(message?.documentMessage)kind='document';else if(!text)return null;
 return {id:m.key.id,group,sender:m.key.participant,kind,text:String(text).slice(0,4000),timestamp:Number(m.messageTimestamp)*1000};
}
