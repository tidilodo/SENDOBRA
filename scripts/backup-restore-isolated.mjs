import {readFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {Miniflare} from 'miniflare';
import {openBackup,restoreIsolated} from './backup-core.mjs';
// Deliberately no remote destination or production credentials accepted.
const chunks=[];for await(const c of process.stdin)chunks.push(c);const cfg=JSON.parse(Buffer.concat(chunks).toString());
const snapshot=openBackup(await readFile(resolve(cfg.archive),'utf8'),cfg.password);
const root=resolve('outputs','restore-'+Date.now());await mkdir(root,{recursive:false});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("Isolated restore; no external effects")}}',compatibilityDate:'2026-05-22',d1Databases:['DB'],r2Buckets:['BUCKET'],d1Persist:join(root,'d1'),r2Persist:join(root,'r2')});
try{console.log(JSON.stringify({...await restoreIsolated(snapshot,await mf.getD1Database('DB'),await mf.getR2Bucket('BUCKET')),root}));}finally{await mf.dispose();}
