import {test} from 'node:test';
import assert from 'node:assert/strict';
import {money,canProject,canReview} from '../app/domain.mjs';
const employee={id:'e',role:'employee',projects:'["a"]'},manager={id:'m',role:'manager',projects:'["a"]'},owner={id:'o',role:'owner',projects:'[]'};
test('valores exatos em centavos',()=>{assert.equal(money('123,45'),12345);assert.equal(money('0,01'),1);for(const v of ['-1','NaN','1.001','0','1,234'])assert.throws(()=>money(v));});
test('acesso somente a obras vinculadas',()=>{assert.equal(canProject(employee,'a'),true);assert.equal(canProject(employee,'b'),false);assert.equal(canProject(owner,'b'),true);});
test('bloqueia autoaprovacao para todo cargo',()=>{for(const u of [employee,manager,owner])assert.equal(canReview(u,{author:u.id,project:'a'},u),false);});
test('gerente aprova subordinados somente em sua obra',()=>{assert.equal(canReview(manager,{author:'e',project:'a'},employee),true);assert.equal(canReview(manager,{author:'e',project:'b'},employee),false);assert.equal(canReview(manager,{author:'o',project:'a'},owner),false);assert.equal(canReview(employee,{author:'x',project:'a'},employee),false);});
