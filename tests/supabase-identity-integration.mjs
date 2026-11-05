import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';

const origin='http://127.0.0.1:8787';
const token='fixture-supabase-access-token';
let subject='11111111-1111-4111-8111-111111111111';
let confirmed=true;
let email='worker@fixture.test';
const script=(await build({entryPoints:['tests/fixtures/group-worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']})).outputFiles[0].text;
const mf=new Miniflare({modules:true,script,host:'127.0.0.1',compatibilityDate:'2026-05-22',d1Databases:['DB'],r2Buckets:['BUCKET'],outboundService:async request=>{
  assert.equal(request.url,'https://kciwsyoebypthsnzraup.supabase.co/auth/v1/user');
  if(request.headers.get('authorization')!=='Bearer '+token)return Response.json({error:'Invalid JWT'},{status:401});
  return Response.json({id:subject,email,email_confirmed_at:confirmed?'2026-11-05T00:00:00Z':null,user_metadata:{role:'owner'}});
}});
const native={'oai-authenticated-user-id':'fixture-owner','oai-authenticated-user-email':'owner@fixture.test',Origin:origin,'Content-Type':'application/json'};
async function call(path,body,headers=native){const r=await mf.dispatchFetch(origin+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});const raw=await r.text();assert.ok(raw,path+' returned empty response '+r.status);return {status:r.status,data:JSON.parse(raw)};}
const supabase={Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+token};
try{
  const db=await mf.getD1Database('DB');
  for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  assert.equal((await call('/api/data')).status,200);
  const project=(await call('/api/data',{action:'projects',name:'Obra autenticada',code:'AUTH-QA'})).data.id;
  await call('/api/data',{action:'users',name:'Funcionário',email,role:'employee',projects:[project]});
  confirmed=false;
  assert.equal((await call('/api/data',undefined,supabase)).status,403);
  confirmed=true;
  const concurrent=await Promise.all([call('/api/data',undefined,supabase),call('/api/data',undefined,supabase)]);
  assert.ok(concurrent.every(x=>x.status===200));
  assert.ok(concurrent.every(x=>x.data.user.role==='employee'));
  assert.equal((await db.prepare('SELECT count(*) n FROM supabase_user_bindings').first()).n,1);
  assert.equal((await db.prepare("SELECT count(*) n FROM audit WHERE action='user.supabase.bind'").first()).n,1);
  for(const path of ['/api/whatsapp-config','/api/expense-inbox','/api/whatsapp-receipts'])assert.equal((await call(path,undefined,supabase)).status,403);
  assert.equal((await call('/api/data',undefined,{...native,Authorization:'Bearer invalid-token-that-cannot-be-used'})).status,403);
  const id=concurrent[0].data.user.id;
  const otherProject=(await call('/api/data',{action:'projects',name:'Outra obra',code:'AUTH-OTHER'})).data.id;
  await call('/api/data',{action:'users',name:'Outra equipe',email:'other@fixture.test',role:'employee',projects:[otherProject]});
  const group='555555555@g.us',sender='555555@lid',message=group+':private-image',receipt='fixture-private-image';
  await db.prepare('INSERT INTO whatsapp_groups VALUES(?,?,1)').bind(group,project).run();
  await db.prepare('INSERT INTO whatsapp_senders VALUES(?,?)').bind(sender,id).run();
  await db.prepare('INSERT INTO whatsapp_messages(id,group_id,sender_id,kind,status,received,correlation) VALUES(?,?,?,?,?,?,?)').bind(message,group,sender,'image','awaiting_review',new Date().toISOString(),'fixture-correlation').run();
  await db.prepare('INSERT INTO whatsapp_receipts(id,message_id,author,mime,size,hash,caption,received,status) VALUES(?,?,?,?,?,?,?,?,?)').bind(receipt,message,id,'image/png',3,'fixture-hash','Fixture only',new Date().toISOString(),'pending').run();
  await (await mf.getR2Bucket('BUCKET')).put(receipt,new Uint8Array([1,2,3]));
  const file=origin+'/api/test-inbox?file='+receipt;
  assert.equal((await mf.dispatchFetch(file,{headers:supabase})).status,200);
  subject='22222222-2222-4222-8222-222222222222';email='other@fixture.test';
  assert.equal((await call('/api/data',undefined,supabase)).status,200);
  assert.equal((await mf.dispatchFetch(file,{headers:supabase})).status,403);
  subject='11111111-1111-4111-8111-111111111111';email='worker@fixture.test';
  await call('/api/data',{action:'access',id,active:false});
  assert.equal((await call('/api/data',undefined,supabase)).status,403);
  email='unregistered@fixture.test';
  assert.equal((await call('/api/data',undefined,supabase)).status,403);
  console.log('PASS: confirmed identity, immutable binding, concurrent first login, database roles, private files by project, revoked access and forged-header rejection. Isolated fixtures.');
}finally{await mf.dispose();}
