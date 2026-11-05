import test from 'node:test';
import assert from 'node:assert/strict';
import {sealSession,openSession} from '../lib/session.mjs';
const key='a'.repeat(64);
test('encrypted sessions reject tampering, expiry and other server keys',()=>{
  const value=sealSession('private-access-token',2000,key);
  assert.equal(value.includes('private-access-token'),false);
  assert.equal(openSession(value,key,1000).token,'private-access-token');
  assert.equal(openSession(value,key,3000),null);
  assert.equal(openSession(value,'b'.repeat(64),1000),null);
  assert.equal(openSession('a'+value.slice(1),key,1000),null);
});
