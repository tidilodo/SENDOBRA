import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {receiveControl} from '../lib/evolution-control.mjs';
const cfg={secret:'isolated-control-key',token:'isolated-provider-token'};
function request(body,secret=cfg.secret){const raw=JSON.stringify(body),time=String(Date.now());return new Request('https://sendobra.fixture/api/evolution-control',{method:'POST',headers:{'Content-Type':'application/json','X-Sendobra-Timestamp':time,'X-Sendobra-Signature':'v1='+createHmac('sha256',secret).update(time+'.'+raw).digest('hex')},body:raw});}
test('control permits only signed, fixed provider queries and returns minimal group metadata',async()=>{
 const noFetch=()=>{throw Error('Unexpected network request');};
 assert.equal((await receiveControl(request({action:'groups'},'wrong'),cfg,noFetch)).status,401);
 assert.equal((await receiveControl(request({action:'disconnect'}),cfg,noFetch)).status,400);
 const mock=async(url,opts)=>{assert.equal(opts.headers.apikey,cfg.token);assert.equal(opts.redirect,'error');if(url.endsWith('/instance/status'))return Response.json({data:{Connected:true,LoggedIn:true}});assert.equal(url,'https://evo.useia.api.br/group/list');return Response.json({data:{Groups:[{JID:'123456@g.us',Name:'Obra Fictícia',Participants:['omit']}]}});};
 assert.deepEqual(await (await receiveControl(request({action:'groups'}),cfg,mock)).json(),{connected:true,loggedIn:true,groups:[{id:'123456@g.us',name:'Obra Fictícia'}]});
});
test('participant discovery preserves the LID and phone returned by the selected group',async()=>{
 const group='123456@g.us';
 const mock=async(url,opts)=>{assert.equal(url,'https://evo.useia.api.br/group/info');assert.deepEqual(JSON.parse(opts.body),{groupJid:group});return Response.json({data:{JID:group,Name:'Obra Fictícia',Participants:[{LID:'1234567@lid',JID:'1234567@lid',PhoneNumber:'550000000001@s.whatsapp.net',DisplayName:'Participante'}]}});};
 assert.deepEqual(await (await receiveControl(request({action:'members',group}),cfg,mock)).json(),{name:'Obra Fictícia',members:[{sender:'1234567@lid',phone:'550000000001',name:'Participante'}]});
});
