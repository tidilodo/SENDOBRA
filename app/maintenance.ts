export async function maintenanceResponse(request:Request,db?:D1Database){
 const url=new URL(request.url);if(!db||!url.pathname.startsWith('/api/')||['/api/backup','/api/whatsapp-jobs','/api/whatsapp-routing'].includes(url.pathname))return null;
 const lock=await db.prepare("SELECT id FROM maintenance_locks WHERE id='backup' AND expires>?").bind(Date.now()).first();
 return lock?Response.json({error:'Janela de backup em andamento. Tente novamente.'},{status:503,headers:{'Retry-After':'180'}}):null;
}
