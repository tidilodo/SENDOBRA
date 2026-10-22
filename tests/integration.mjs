import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787',headers={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'qa@local.test',Origin:base,'Content-Type':'application/json'};
async function req(body,h=headers){const r=await fetch(base+'/api/data',{method:body?'POST':'GET',headers:h,body:body?JSON.stringify(body):undefined});const d=await r.json();return {status:r.status,d};}
assert.equal((await req(null,{})).status,401);
assert.equal((await req()).status,200);
const p=await req({action:'projects',name:'QA local only',code:'QA-'+Date.now(),address:'Ambiente local'});assert.equal(p.status,200);
const rec=await req({action:'record',project:p.d.id,type:'expense',description:'Despesa QA local',amount:'12,34',date:'2026-10-22',category:'QA'});assert.equal(rec.status,200);
const state=await req();assert.equal(state.d.records.find(r=>r.id===rec.d.id).amount,1234);assert.equal(state.d.records.find(r=>r.id===rec.d.id).status,'approved');
assert.equal((await req({action:'decision',id:rec.d.id,decision:'approved'})).status,403);
assert.equal((await req({action:'payment',id:rec.d.id,payment:'payment_evidenced'})).status,400);
assert.equal((await req({action:'payment',id:rec.d.id,payment:'payment_reported'})).status,200);
assert.equal((await req({action:'record',project:p.d.id,type:'expense',description:'Invalid',amount:'1.234',date:'2026-10-22'})).status,400);
assert.equal((await req({action:'categories',name:'CSRF'},{...headers,Origin:'https://invalid.test'})).status,403);
assert.equal((await req(null,{...headers,'oai-authenticated-user-id':'unknown','oai-authenticated-user-email':'unknown@local.test'})).status,403);
assert.ok((await req()).d.audit.length>=3);console.log('PASS: API real D1 — auth, cadastro, financeiro, autoaprovação, evidência, CSRF, acesso e auditoria. Dados somente locais.');
