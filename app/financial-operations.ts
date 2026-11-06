import {canProject,canReview} from './domain.mjs';

const conflict=(message:string)=>{throw Error('409:'+message);};
export async function financialOperation(db:D1Database,u:any,b:any){
 const rec:any=await db.prepare('SELECT * FROM records WHERE id=?').bind(String(b.id||'')).first();
 if(!rec)throw Error('404:Registro inexistente');
 if(!canProject(u,rec.project))throw Error('403:Acesso negado');
 const author:any=await db.prepare('SELECT * FROM users WHERE id=?').bind(rec.author).first();
 if(b.action==='decision'&&(!author||!canReview(u,rec,author)))throw Error('403:Decisão não permitida, inclusive autoaprovação');
 if(b.action==='payment'&&!['owner','manager'].includes(u.role))throw Error('403:Pagamento não permitido');
 const op=typeof b.operation_id==='string'?b.operation_id:crypto.randomUUID();
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(op))throw Error('400:Identificação da operação inválida');
 const reason=String(b.reason||'').trim();if(reason.length>1000)throw Error('400:Motivo muito longo');
 const target=b.action==='decision'?b.decision:b.payment;
 const fingerprint=JSON.stringify([b.action,rec.id,target,reason,b.attachment_id||null]);
 async function replay(){const p:any=await db.prepare('SELECT * FROM financial_operations WHERE id=?').bind(op).first();if(!p)return null;if(p.actor!==u.id||p.fingerprint!==fingerprint)conflict('Esta identificação já foi usada em outra operação.');return {...JSON.parse(p.result),replayed:true};}
 const prior=await replay();if(prior)return prior;
 const version=Number((await db.prepare('SELECT version FROM financial_versions WHERE record_id=?').bind(rec.id).first<any>())?.version||0);
 if(b.expected_version!==undefined&&(!Number.isSafeInteger(b.expected_version)||b.expected_version!==version))conflict('O registro mudou. Atualize antes de continuar.');
 let attachment:any=null;
 if(b.action==='decision'){
  if(rec.status!=='pending_approval')conflict('Este lançamento já foi decidido.');
  if(!['approved','rejected'].includes(target))throw Error('400:Decisão inválida');
  if(target==='rejected'&&!reason)throw Error('400:Informe o motivo da rejeição');
 }else{
  if(rec.status!=='approved'||!['expense','income'].includes(rec.type))throw Error('403:Pagamento exige lançamento financeiro aprovado');
  if(!['payment_reported','payment_evidenced'].includes(target))throw Error('400:Estado inválido');
  if(rec.payment==='payment_evidenced'||rec.payment===target)conflict('Este estado já foi registrado. A revisão não pode ser rebaixada.');
  if(target==='payment_evidenced'){
   if(!b.attachment_id||b.confirm_review!==true)throw Error('400:Selecione e confirme a revisão do comprovante');
   attachment=await db.prepare('SELECT id,hash FROM attachments WHERE id=? AND record=?').bind(b.attachment_id,rec.id).first();
   if(!attachment)throw Error('400:Comprovante não pertence ao lançamento');
  }
 }
 const now=new Date().toISOString(),after={...rec,...(b.action==='decision'?{status:target}:{payment:target}),version:version+1};
 const result={ok:true,operation_id:op,id:rec.id,version:version+1,status:after.status,payment:after.payment,replayed:false};
 // Every statement belongs to one D1 transaction. The operation row is the unique
 // witness of the winning transition; no-op updates cannot create success audit.
 const access="EXISTS(SELECT 1 FROM users a WHERE a.id=? AND a.active=1 AND (a.role='owner' OR EXISTS(SELECT 1 FROM json_each(a.projects) WHERE value=?)) AND "+(b.action==='decision'?"a.id<>? AND (a.role='owner' OR (a.role='manager' AND EXISTS(SELECT 1 FROM users au WHERE au.id=? AND au.role IN ('employee','foreman'))))":"a.role IN ('owner','manager')")+")";
 const accessArgs=b.action==='decision'?[u.id,rec.project,rec.author,rec.author]:[u.id,rec.project];
 const guard="EXISTS(SELECT 1 FROM financial_operations WHERE id=? AND actor=? AND fingerprint=?)";
 try{await db.batch([
  db.prepare('INSERT OR IGNORE INTO financial_versions(record_id,version) VALUES(?,0)').bind(rec.id),
  db.prepare('INSERT INTO financial_operations(id,actor,record_id,fingerprint,result,created) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM records r JOIN financial_versions v ON v.record_id=r.id WHERE r.id=? AND v.version=? AND r.status=? AND r.payment=?) AND '+access).bind(op,u.id,rec.id,fingerprint,JSON.stringify(result),now,rec.id,version,rec.status,rec.payment,...accessArgs),
  db.prepare('UPDATE records SET '+(b.action==='decision'?'status':'payment')+'=? WHERE id=? AND '+guard).bind(target,rec.id,op,u.id,fingerprint),
  db.prepare('UPDATE financial_versions SET version=version+1 WHERE record_id=? AND '+guard).bind(rec.id,op,u.id,fingerprint),
  db.prepare('INSERT INTO audit SELECT ?,?,?,?,?,?,? WHERE '+guard).bind(crypto.randomUUID(),u.id,b.action==='decision'?'record.'+target:'record.payment',rec.id,JSON.stringify({...rec,version}),JSON.stringify({...after,reason,operation_id:op,attachment:attachment||null}),now,op,u.id,fingerprint)
 ]);}catch(error){const retry=await replay();if(retry)return retry;throw error;}
 const saved=await replay();if(!saved)conflict('O registro ou seu acesso mudou. Atualize a lista.');
 return {...saved,replayed:false};
}
