export const MAX_RECEIPT_BYTES=5*1024*1024;
export function imageMime(bytes){
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 return null;
}
export function decodeReceipt(image){
 if(!image||!['image/png','image/jpeg'].includes(image.mime)||typeof image.base64!=='string'||!image.base64.length||image.base64.length>Math.ceil(MAX_RECEIPT_BYTES/3)*4||image.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64))throw Error('Imagem inválida ou maior que 5 MB.');
 let binary;try{binary=atob(image.base64);}catch{throw Error('Imagem inválida');}
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(!bytes.length||bytes.length>MAX_RECEIPT_BYTES||imageMime(bytes)!==image.mime)throw Error('Apenas PNG e JPEG válidos até 5 MB.');
 return {bytes,mime:image.mime};
}
