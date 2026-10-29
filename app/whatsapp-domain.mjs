import {money} from './domain.mjs';
export function validateEvent(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Evento inválido');
 for(const [key,max] of [['id',200],['group',100],['sender',100]])if(typeof b[key]!=='string'||!b[key]||b[key].length>max)throw Error('Identificador inválido');
 if(!/^\d{5,30}@g\.us$/.test(b.group))throw Error('Grupo inválido');
 if(!/^\d{5,30}@(s\.whatsapp\.net|lid)$/.test(b.sender))throw Error('Remetente inválido');
 if(!['text','audio','image','document'].includes(b.kind))throw Error('Tipo inválido');
 if(typeof b.text!=='string'||b.text.length>4000)throw Error('Texto inválido');
 if(typeof b.timestamp!=='number'||!Number.isSafeInteger(b.timestamp)||Math.abs(Date.now()-b.timestamp)>86400000)throw Error('Mensagem fora da janela de 24 horas');
 return {id:b.id,group:b.group,sender:b.sender,kind:b.kind,text:b.text,timestamp:b.timestamp};
}
export function parseText(text){
 const parts=text.split('|').map(s=>s.trim());
 const match=/^\/(despesa|recebimento)\s+(\S+)$/i.exec(parts[0]);
 if(!match||parts.length!==3)return {question:'Envie /despesa VALOR | AAAA-MM-DD | descrição, ou /recebimento VALOR | AAAA-MM-DD | descrição. Exemplo fictício: /despesa 10,50 | 2026-10-22 | material de teste. IA ainda não configurada.'};
 let amount;try{amount=money(match[2]);}catch{return {question:'Informe um valor positivo em reais, com vírgula e até duas casas decimais.'};}
 const date=parts[1];if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return {question:'Informe uma data existente no formato AAAA-MM-DD.'};
 if(!parts[2]||parts[2].length>1000)return {question:'Informe uma descrição com até 1.000 caracteres.'};
 return {type:match[1].toLowerCase()==='despesa'?'expense':'income',amount,date,description:parts[2]};
}
export async function verifySignature(secret,raw,timestamp,signature,now=Date.now()){
 if(!secret||typeof timestamp!=='string'||!/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>300000||!/^v1=[a-f0-9]{64}$/.test(signature||''))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.slice(3).match(/../g).map(h=>parseInt(h,16)));
 return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(timestamp+'.'+raw));
}

export function parseEvent(e){
 if(e.kind==='text')return parseText(e.text);
 if(e.kind==='audio')return {question:e.text.trim()?'Áudio transcrito — aguardando revisão. Nenhum lançamento criado.\n'+e.text:'Áudio recebido sem transcrição disponível. Reenvie os dados em texto. Nenhum lançamento criado.'};
 return {question:'Mídia recebida; processamento de imagem e documento ainda não disponível. Envie os dados em texto. Nenhum arquivo armazenado.'};
}
