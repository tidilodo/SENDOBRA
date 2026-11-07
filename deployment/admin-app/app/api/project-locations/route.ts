import {get,put} from '@vercel/blob';
import {GET as backendData} from '../[...path]/route';
import {locationHandlers} from '../../../lib/project-locations-service.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const pathname=(id:string)=>'project-locations/'+encodeURIComponent(id)+'.json';
const handlers=locationHandlers({
  async context(request:Request){
    const response=await backendData(new Request(new URL('/api/data',request.url),{headers:request.headers}));
    if(!response.ok)return response;
    return response.json();
  },
  async read(id:string){
    const file=await get(pathname(id),{access:'private',useCache:false});
    if(!file)return null;
    if(file.statusCode!==200)throw Error('Storage unavailable');
    return {value:await new Response(file.stream).json(),version:file.blob.etag};
  },
  async save(id:string,value:any,version:string|null){
    await put(pathname(id),JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:version!==null,...(version?{ifMatch:version}:{}),contentType:'application/json',cacheControlMaxAge:60});
  }
});
export const GET=handlers.GET;
export const POST=handlers.POST;
