import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {hash,sealBackup,openBackup,restoreIsolated} from '../scripts/backup-core.mjs';
const script=(await build({entryPoints:['tests/fixtures/group-worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']})).outputFiles[0].text;
const secret='isolated-integration-secret',base='http://fixture.test',auth={'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@fixture.test',Origin:base,'Content-Type':'application/json'};
const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-05-22',d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{WHATSAPP_INGEST_SECRET:secret,BACKUP_EXPORT_SECRET:secret}});
let target;const createTarget=()=>new Miniflare({modules:true,script:'export default {fetch(){return new Response("isolated")}}',compatibilityDate:'2026-05-22',d1Databases:['DB'],r2Buckets:['BUCKET']});
async function req(path,b,h=auth){const r=await mf.dispatchFetch(base+path,{method:b?'POST':'GET',headers:h,body:b?JSON.stringify(b):undefined});return {status:r.status,data:await r.json()};}
async function job(b){const raw=JSON.stringify(b),time=String(Date.now());return req('/api/whatsapp-jobs',b,{'Content-Type':'application/json','x-sendobra-timestamp':time,'x-sendobra-signature':'v1='+createHmac('sha256',secret).update(time+'.'+raw).digest('hex')});}
try{
 console.log('Starting consolidation fixture');const db=await mf.getD1Database('DB'),bucket=await mf.getR2Bucket('BUCKET');for(const f of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 console.log('Schema ready');assert.equal((await req('/api/data')).status,200);const backupRaw=JSON.stringify({action:'begin'}),backupTime=String(Date.now());const serviceHeaders={Origin:base,'Content-Type':'application/json','x-backup-service-time':backupTime,'x-backup-service-signature':'v1='+createHmac('sha256',secret).update(backupTime+'.POST\n/api/backup\n'+backupRaw).digest('hex')};const serviceBackup=await req('/api/backup',{action:'begin'},serviceHeaders);assert.equal(serviceBackup.status,200,JSON.stringify(serviceBackup.data));const endRaw=JSON.stringify({action:'end'}),endTime=String(Date.now());assert.equal((await req('/api/backup',{action:'end'},{...serviceHeaders,'x-backup-token':serviceBackup.data.token,'x-backup-service-time':endTime,'x-backup-service-signature':'v1='+createHmac('sha256',secret).update(endTime+'.POST\n/api/backup\n'+endRaw).digest('hex')})).status,200);
 const p=(await req('/api/data',{action:'projects',name:'Obra Alfa',code:'ALFA'})).data.id;
 await db.prepare("INSERT INTO users VALUES('employee','Equipe','e@fixture.test',NULL,'employee',1,?)").bind(JSON.stringify([p])).run();
 await db.prepare("INSERT INTO users VALUES('owner2','Outro proprietário','o2@fixture.test','owner2','owner',1,'[]')").run();
 const second={...auth,'oai-authenticated-user-id':'owner2','oai-authenticated-user-email':'o2@fixture.test'};
 await db.prepare("INSERT INTO whatsapp_senders VALUES('100001@lid','employee')").run();await db.prepare("INSERT INTO whatsapp_groups VALUES('123456789001@g.us',?,1)").bind(p).run();await db.prepare("INSERT INTO whatsapp_group_settings VALUES('123456789001@g.us','project','2026-11-05')").run();await db.prepare("INSERT INTO whatsapp_group_senders VALUES('123456789001@g.us','100001@lid')").run();
 const doc=JSON.stringify({origem:{usuario_id:'employee',enviado_em:new Date().toISOString()},texto_original:'Comprei cimento por R$ 30,00 hoje',contexto_grupo:{mode:'project',project_id:p,project_name:'Obra Alfa'}});
 for(let start=0;start<650;start+=50)await db.batch(Array.from({length:Math.min(50,650-start)},(_,i)=>db.prepare("INSERT INTO whatsapp_messages VALUES(?,'123456789001@g.us','100001@lid','text','awaiting_review',NULL,?,NULL,?,?)").bind('msg-'+String(start+i).padStart(4,'0'),'2026-11-05T12:00:00.000Z','correlation-'+(start+i),doc)));
 console.log('650 messages created');const seen=new Set();let cursor=null;do{const r=await req('/api/expense-inbox?version=2&limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.summary.pending_total,650);for(const item of r.data.items){assert.ok(!seen.has(item.id));seen.add(item.id);}cursor=r.data.page.next_cursor;}while(cursor);assert.equal(seen.size,650);
 const page=(await req('/api/expense-inbox?version=2&limit=50')).data;assert.equal((await req('/api/expense-inbox?version=2&limit=50&cursor='+encodeURIComponent(page.page.next_cursor+'bad'))).status,400);
 console.log('Pagination verified');const review={action:'submit',id:'msg-0000',project:p,description:'Cimento de teste',amount:'30,00',date:'2026-11-05',confirm_review:true,confirm_distinct:true};const created=await req('/api/expense-inbox',review);assert.equal(created.status,200,JSON.stringify(created.data));const record=created.data.record;
 const decision={action:'decision',id:record,decision:'approved',operation_id:'operation-approve-1',expected_version:0};
 const race=await Promise.all([req('/api/data',decision),req('/api/data',{...decision,decision:'rejected',reason:'Teste',operation_id:'operation-reject-1'},second)]);assert.deepEqual(race.map(x=>x.status).sort(),[200,409],JSON.stringify(race));
 const winner=race[0].status===200?decision:{...decision,decision:'rejected',reason:'Teste',operation_id:'operation-reject-1'};const winnerAuth=race[0].status===200?auth:second;assert.equal((await req('/api/data',winner,winnerAuth)).data.replayed,true);
 assert.equal((await db.prepare("SELECT count(*) n FROM audit WHERE entity=? AND action IN ('record.approved','record.rejected')").bind(record).first()).n,1);
 // A separate approved fixture makes payment tests independent of race outcome.
 const pay=(await req('/api/data',{action:'record',project:p,description:'Despesa para pagamento',amount:'10,00',type:'expense',date:'2026-11-05'})).data.id;
 const bytes=Buffer.from('89504e470d0a1a0a','hex');await bucket.put('receipt-fixture',bytes);await db.prepare('INSERT INTO attachments VALUES(?,?,?,?,?,?,?,?)').bind('receipt-fixture',pay,'fixture.png','image/png',bytes.length,hash(bytes),'owner','2026-11-05').run();
 assert.equal((await req('/api/data',{action:'payment',id:pay,payment:'payment_evidenced',operation_id:'payment-evidence-1',expected_version:0,attachment_id:'receipt-fixture',confirm_review:true})).status,200);
 assert.equal((await req('/api/data',{action:'payment',id:pay,payment:'payment_reported',operation_id:'payment-regression-1',expected_version:1})).status,409);
 assert.equal((await req('/api/data',{...winner,decision:winner.decision==='approved'?'rejected':'approved'},winnerAuth)).status,409);
 const event={id:'durable-event',group:'123456789001@g.us',sender:'100001@lid',kind:'text',text:'Comprei R$ 3,00 hoje',timestamp:Date.now()},id=event.group+':'+event.id;
 assert.equal((await job({action:'enqueue',id,event,envelope:{data:'synthetic'}})).status,200);
 assert.equal((await job({action:'enqueue',id,event,envelope:{data:'synthetic'}})).data.duplicate,true);
 const claims=await Promise.all([job({action:'claim',id}),job({action:'claim',id})]);assert.equal(claims.filter(x=>x.data.claimed).length,1);const lease=claims.find(x=>x.data.claimed).data.lease;
 assert.equal((await job({action:'cache',id,lease,event:{...event,expense_flow:1}})).status,200);
 assert.equal((await job({action:'complete',id,lease})).status,409);assert.equal((await job({action:'fail',id,lease})).status,200);
 await db.prepare('UPDATE ingestion_jobs SET available=0 WHERE id=?').bind(id).run();const retry=await job({action:'claim',id});assert.equal(retry.data.cached.text,event.text);
 await job({action:'fail',id,lease:retry.data.lease});
 const begin=await req('/api/backup',{action:'begin'});assert.equal(begin.status,200);const backupHeaders={...auth,'x-backup-token':begin.data.token};assert.equal((await req('/api/data',{action:'categories',name:'must not write'})).status,503);assert.equal((await req('/api/backup?action=schema',undefined,backupHeaders)).status,409);
 const during={...event,id:'during-backup'};assert.equal((await job({action:'enqueue',id:during.group+':'+during.id,event:during,envelope:{data:'synthetic'}})).status,200);assert.equal((await job({action:'claim',id:during.group+':'+during.id})).status,503);
 assert.equal((await req('/api/backup',{action:'end'},backupHeaders)).status,200);
 // Restore every table and object to a fresh runtime, then compare every row/hash.
 const schema=(await db.prepare("SELECT name,sql,type FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table','index')").all()).results.filter(x=>!x.name.startsWith('sqlite_')&&!x.name.startsWith('_cf_')&&x.name!=='maintenance_locks');const tables={};for(const t of schema.filter(x=>x.type==='table'))tables[t.name]=(await db.prepare('SELECT * FROM "'+t.name+'"').all()).results;
 const objects=[];for(const o of (await bucket.list()).objects){const bytes=Buffer.from(await(await bucket.get(o.key)).arrayBuffer());objects.push({key:o.key,size:bytes.length,sha256:hash(bytes),base64:bytes.toString('base64')});}
 console.log('Queue verified');target=createTarget();const snap={format:'sendobra-snapshot-v1',schema,tables,objects},password='isolated-password-never-production';const archive=sealBackup(snap,password);assert.throws(()=>openBackup(archive,password+'wrong'));const restored=await restoreIsolated(openBackup(archive,password),await target.getD1Database('DB'),await target.getR2Bucket('BUCKET'));assert.equal(restored.verified,true);
 const damaged=JSON.parse(JSON.stringify(snap));damaged.objects[0].base64='AA==';assert.throws(()=>sealBackup(damaged,password)&&openBackup(sealBackup(damaged,password),password));
 console.log('PASS B01-B05: 650 tied messages paginated, old review, signed cursor, concurrent financial decision, idempotent replay, no payment regression, durable enqueue/lease/cache/retry, encrypted full isolated restore; '+restored.tables+' tables / '+restored.objects+' objects verified.');
}finally{await mf.dispose();if(target)await target.dispose();}
