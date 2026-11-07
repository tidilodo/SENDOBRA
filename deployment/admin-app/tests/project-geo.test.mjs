import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLocation,distanceMeters,suggestProjects} from '../lib/project-geo.mjs';
import {locationHandlers} from '../lib/project-locations-service.mjs';
const a={project:'a',latitude:0,longitude:0,radius:150,enabled:true};
test('coordinates, zero and radius boundaries',()=>{assert.equal(validateLocation(a).latitude,0);for(const v of [{...a,latitude:91},{...a,longitude:NaN},{...a,radius:19},{...a,radius:2001},{...a,latitude:'0'}])assert.throws(()=>validateLocation(v));});
test('distance and longitude wrap',()=>{assert.equal(distanceMeters(a,a),0);assert.ok(Math.abs(distanceMeters(a,{latitude:0,longitude:1})-111195)<2);assert.ok(distanceMeters({latitude:0,longitude:179.999},{latitude:0,longitude:-179.999})<230);});
test('never picks automatically; distinguishes accuracy, overlap and distance',()=>{
 assert.equal(suggestProjects({...a,accuracy:10},[a]).state,'suggested');
 assert.equal(suggestProjects({...a,accuracy:180},[a]).state,'imprecise');
 assert.equal(suggestProjects({...a,accuracy:10},[a,{...a,project:'b'}]).state,'ambiguous');
 assert.equal(suggestProjects({latitude:1,longitude:1,accuracy:10},[a]).state,'outside');
 assert.equal(suggestProjects({...a,accuracy:10},[{...a,enabled:false}]).candidates.length,0);
 assert.equal(suggestProjects({...a,accuracy:NaN},[a]).state,'unavailable');
});
const req=(body,origin='https://app.test')=>new Request('https://app.test/api/project-locations',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('location API enforces authorization, validation, version and scope',async()=>{
 let role='owner',saved=null;
 const handlers=locationHandlers({context:async()=>({user:{id:'u',role},projects:[{id:'a',status:'active'},{id:'old',status:'archived'}]}),read:async id=>id==='a'?saved:null,save:async(id,value)=>{saved={value,version:'v1'};}});
 role='employee';assert.equal((await handlers.POST(req({...a,version:null}))).status,403);
 role='owner';assert.equal((await handlers.POST(req({...a,project:'forged',version:null}))).status,403);
 assert.equal((await handlers.POST(req({...a,project:'old',version:null}))).status,403);
 assert.equal((await handlers.POST(req({...a,version:null},'https://evil.test'))).status,403);
 assert.equal((await handlers.POST(req({...a,radius:0,version:null}))).status,400);
 assert.equal((await handlers.POST(req({...a,version:null}))).status,200);
 assert.equal(saved.value.actor,'u');assert.equal((await handlers.POST(req({...a,version:null}))).status,409);
 role='employee';const list=await(await handlers.GET(new Request('https://app.test/api/project-locations'))).json();assert.equal(list.locations.length,1);assert.equal(list.locations[0].project,'a');assert.equal(list.locations[0].actor,undefined);
});
test('location API refuses expired sessions and storage failures',async()=>{
 const h=locationHandlers({context:async()=>Response.json({error:'login'},{status:401})});assert.equal((await h.GET(new Request('https://app.test'))).status,401);assert.equal((await h.POST(req({...a,version:null}))).status,401);
 const broken=locationHandlers({context:async()=>{throw Error('offline');}});assert.equal((await broken.GET(new Request('https://app.test'))).status,503);
});

test('storage ETag conflict returns 409 instead of overwriting',async()=>{const {BlobPreconditionFailedError}=await import('@vercel/blob');const h=locationHandlers({context:async()=>({user:{id:'u',role:'owner'},projects:[{id:'a',status:'active'}]}),read:async()=>({value:a,version:'v1'}),save:async()=>{throw new BlobPreconditionFailedError();}});assert.equal((await h.POST(req({...a,version:'v1'}))).status,409);});
