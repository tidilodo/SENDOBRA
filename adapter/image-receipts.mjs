import {imageMime,MAX_RECEIPT_BYTES} from '../app/receipt-domain.mjs';
export async function imageEvent(event,message,{allowedSenders,download}){
 if(event.kind!=='image'||!allowedSenders.has(event.sender))return event;
 const image=(message.message?.ephemeralMessage?.message||message.message)?.imageMessage;
 if(!image||!['image/jpeg','image/png'].includes(image.mimetype)||Number(image.fileLength)>MAX_RECEIPT_BYTES)throw Error('Imagem fora dos limites');
 const chunks=[];let size=0;for await(const chunk of await download(image)){size+=chunk.length;if(size>MAX_RECEIPT_BYTES)throw Error('Imagem excede limite');chunks.push(chunk);}
 const bytes=Buffer.concat(chunks);if(imageMime(bytes)!==image.mimetype)throw Error('Formato de imagem inválido');
 return {...event,image:{mime:image.mimetype,base64:bytes.toString('base64')}};
}
