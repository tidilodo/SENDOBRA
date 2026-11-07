import {BlobPreconditionFailedError} from '@vercel/blob';
import {validateLocation} from './project-geo.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function locationHandlers({context,read,save}) {
  return {
    async GET(request) {
      try{
        const ctx=await context(request);if(ctx instanceof Response)return ctx;
        const allowed=ctx.projects.filter(p=>p.status==='active');
        const rows=await Promise.all(allowed.map(async p=>{const r=await read(p.id);return r?{project:p.id,...validateLocation(r.value),enabled:r.value.enabled!==false,version:r.version}:null;}));
        return json({locations:rows.filter(Boolean)});
      }catch{return json({error:'Não foi possível consultar os pontos das obras. Você pode selecionar a obra manualmente.'},503);}
    },
    async POST(request) {
      if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origem inválida.'},403);
      try{
        const ctx=await context(request);if(ctx instanceof Response)return ctx;
        if(ctx.user.role!=='owner')return json({error:'Somente o proprietário pode configurar o local da obra.'},403);
        const raw=await request.text();if(raw.length>2048)return json({error:'Dados muito grandes.'},413);
        let body;try{body=JSON.parse(raw);}catch{return json({error:'Dados inválidos.'},400);}
        if(typeof body.project!=='string'||!ctx.projects.some(p=>p.id===body.project&&p.status==='active'))return json({error:'Obra não autorizada ou inativa.'},403);
        let coords;try{coords=validateLocation(body);}catch(e){return json({error:e.message},400);}
        if(typeof body.enabled!=='boolean'||!(body.version===null||typeof body.version==='string'&&body.version.length<=300))return json({error:'Configuração inválida.'},400);
        const previous=await read(body.project);
        if((previous?.version||null)!==body.version)return json({error:'O local foi alterado em outra sessão. Atualize os dados antes de salvar.'},409);
        const value={...coords,enabled:body.enabled,updated:new Date().toISOString(),actor:ctx.user.id,history:[...(previous?.value.history||[]).slice(-19),...(previous?[{...previous.value,history:undefined}]:[])]};
        await save(body.project,value,body.version);
        return json({ok:true});
      }catch(e){if(e instanceof BlobPreconditionFailedError||e?.name==='BlobAlreadyExistsError')return json({error:'O local mudou em outra sessão. Atualize antes de salvar.'},409);return json({error:'Não foi possível salvar o local da obra. Tente novamente.'},503);}
    }
  };
}
