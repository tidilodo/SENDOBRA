import {put,get,del,BlobPreconditionFailedError} from '@vercel/blob';
const pathname='verification/geo-'+crypto.randomUUID()+'.json';
try {
 await put(pathname,JSON.stringify({test:1}),{access:'private'});
 const first=await get(pathname,{access:'private',useCache:false});
 if(!first||first.statusCode!==200)throw Error('Private read failed');
 if((await new Response(first.stream).json()).test!==1)throw Error('Readback failed');
 await put(pathname,JSON.stringify({test:2}),{access:'private',allowOverwrite:true,ifMatch:first.blob.etag});
 const second=await get(pathname,{access:'private',useCache:false});
 if(!second||second.statusCode!==200||(await new Response(second.stream).json()).test!==2)throw Error('Consistent read failed');
 let conflict=false;
 try{await put(pathname,'{}',{access:'private',allowOverwrite:true,ifMatch:first.blob.etag});}catch(e){if(e instanceof BlobPreconditionFailedError)conflict=true;else throw e;}
 if(!conflict)throw Error('Concurrent write was not rejected');
 console.log('Private storage: write, consistent read and concurrent-write protection passed.');
} finally {await del(pathname);console.log('Temporary verification file removed.');}
