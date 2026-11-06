import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {sealBackup,hash} from '../scripts/backup-core.mjs';
test('isolated restore CLI works in a fresh checkout without outputs directory',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sendobra-cli-'));const password='synthetic-test-password-only';
 try{const bytes=Buffer.from('synthetic file');const snapshot={format:'sendobra-snapshot-v1',schema:[{name:'sample',type:'table',sql:'CREATE TABLE sample(id TEXT PRIMARY KEY,value TEXT)'}],tables:{sample:[{id:'fixture',value:'Synthetic'}]},objects:[{key:'sample-object',base64:bytes.toString('base64'),size:bytes.length,sha256:hash(bytes)}]};const archive=join(root,'fixture.enc');await writeFile(archive,sealBackup(snapshot,password));
 const result=spawnSync(process.execPath,[resolve('scripts/backup-restore-isolated.mjs')],{cwd:root,input:JSON.stringify({archive,password}),encoding:'utf8',timeout:90000});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).verified,true);
 }finally{if(!root.startsWith(join(tmpdir(),'sendobra-cli-')))throw Error('Unexpected temporary path');await rm(root,{recursive:true,force:true});}
});
