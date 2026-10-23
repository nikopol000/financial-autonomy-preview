'use strict';
// Tests the proposed demo eligibility gate, NOT a deployed demo feature.
const assert=require('node:assert/strict');
const { inspectDemoEligibility }=require('../src/demo-eligibility.cjs');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
function storage(initial={},fault=null) {
  const data={...initial};let writes=0;
  return {
    get length(){if(fault==='length')throw Error('denied');return Object.keys(data).length;},
    key:i=>{if(fault==='key')throw Error('denied');return Object.keys(data)[i]??null;},
    getItem:k=>{if(fault==='get')throw Error('denied');return data[k]??null;},
    setItem:()=>{writes++;throw Error('Demo eligibility must never write');},
    removeItem:()=>{writes++;throw Error('Demo eligibility must never delete');},
    get writes(){return writes;}
  };
}
let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS',name)}
  catch(e){console.error('FAIL',name,e.stack||e.message);process.exitCode=1}}
test('Truly fresh localStorage is eligible without writing',()=>{
  const s=storage();assert.deepEqual(inspectDemoEligibility(s),{eligible:true,reason:'fresh-browser'});
  assert.equal(s.writes,0);
});
test('Populated encrypted vault is not demo eligible',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'ciphertext'});
  assert.equal(inspectDemoEligibility(s).eligible,false);assert.equal(s.writes,0);
});
test('Intentionally empty saved ledger still counts as real data',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'encrypted-empty-ledger'});
  assert.equal(inspectDemoEligibility(s).reason,'vault-present');
});
test('Orphan encryption key blocks demo',()=>{
  assert.equal(inspectDemoEligibility(storage({[KEY]:'a'.repeat(64)})).eligible,false);
});
test('Payload without key blocks demo',()=>{
  assert.equal(inspectDemoEligibility(storage({[PAYLOAD]:'ciphertext'})).eligible,false);
});
test('Even empty or corrupt key and payload values block demo',()=>{
  assert.equal(inspectDemoEligibility(storage({[KEY]:''})).eligible,false);
  assert.equal(inspectDemoEligibility(storage({[PAYLOAD]:''})).eligible,false);
});
test('Unknown and legacy keys block demo instead of being migrated or cleared',()=>{
  const s=storage({'financial-autonomy-legacy':'old data'});
  assert.equal(inspectDemoEligibility(s).reason,'other-storage-present');
  assert.equal(s.writes,0);
});
test('Unrelated same-origin keys conservatively block demo',()=>{
  assert.equal(inspectDemoEligibility(storage({'other-app-key':'1'})).eligible,false);
});
test('Unavailable or non-enumerable storage never activates demo',()=>{
  assert.equal(inspectDemoEligibility(null).eligible,false);
  assert.equal(inspectDemoEligibility({getItem:()=>null}).eligible,false);
  assert.equal(inspectDemoEligibility(storage({},'get')).reason,'storage-unavailable');
  assert.equal(inspectDemoEligibility(storage({},'length')).reason,'storage-unavailable');
});
test('Failed key enumeration blocks demo and never writes',()=>{
  const s=storage({'legacy':'value'},'key');
  assert.equal(inspectDemoEligibility(s).eligible,false);
  assert.equal(s.writes,0);
});
console.log(passed+'/10 demo eligibility contract tests passed');
if(passed!==10)process.exitCode=1;
