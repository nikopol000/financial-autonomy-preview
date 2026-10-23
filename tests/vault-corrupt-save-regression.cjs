'use strict';
// Fail-closed encrypted-vault save regression, using the real bundle module
// with synthetic localStorage and a deterministic crypto adapter (NOT AES E2E).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const active = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
const path = process.env.FA_VAULT_TEST_BUNDLE || active;
assert.ok(path && path.startsWith('_expo/static/js/web/'), 'Missing bundle path');
const source = fs.readFileSync(path, 'utf8');
const at = source.indexOf('e.loadWebVault=function(o)');
const start = source.lastIndexOf('__d(function(', at);
const end = source.indexOf('},310,[205,311]);', at);
assert.ok(at >= 0 && start >= 0 && end > start, 'Vault module missing');
const factory = vm.runInNewContext('(' + source.slice(start + 4, end + 1) + ')');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const previous = {version:4,accounts:[{id:'existing'}],transactions:[],balanceChecks:[]};
const incoming = {version:4,accounts:[{id:'new'}],transactions:[],balanceChecks:[]};
let lastKey = null;
let lastRandom = null;
let decryptCalls = 0;
let sealCalls = 0;
const model = {
  emptyState: () => ({version:4,accounts:[],transactions:[],balanceChecks:[]}),
  migrate: x => {if(x.badMigration)throw Error('Migration rejected');return x;},
  validateState: x => {if(x.badState)throw Error('Invalid state');}
};
const crypto = {
  hexToBytes: () => (lastKey = new Uint8Array(32).fill(7)),
  bytesToHex: () => 'b'.repeat(64),
  seal: () => {sealCalls++;return 'valid-envelope';},
  unseal: c => {
    decryptCalls++;
    if(c === 'corrupt')throw Error('Auth tag invalid');
    if(c === 'bad-json')return '{';
    if(c === 'bad-migration')return JSON.stringify({badMigration:true});
    if(c === 'bad-state')return JSON.stringify({badState:true});
    if(c === 'valid-envelope')return JSON.stringify(previous);
    throw Error('Unknown ciphertext');
  }
};
const api = {};
factory({}, id => id === 205 ? model : crypto, () => {}, null, {}, api, [205,311]);
function storage(initial={}, options={}) {
  const data={...initial};
  let writes=0, attempts=0;
  return {
    getItem(k) {
      if(options.failRead)throw Error('Storage read denied');
      return Object.prototype.hasOwnProperty.call(data,k) ? data[k] : null;
    },
    setItem(k,v) {
      attempts++;
      if(options.failPayload && k===PAYLOAD)throw Error('Quota exceeded');
      data[k]=v;writes++;
    },
    get writes(){return writes;},
    get attempts(){return attempts;},
    get data(){return data;}
  };
}
const rand = n => (lastRandom = new Uint8Array(n).fill(9));
function assertZeroized(buffer) {
  assert.ok(buffer && buffer.length === 32 && buffer.every(x => x === 0), 'Key bytes not zeroized');
}
let passed=0;
function test(name, fn) {
  try {fn();passed++;console.log('PASS',name);}
  catch(err) {console.error('FAIL',name,err.stack||err.message);process.exitCode=1;}
}
for(const bad of ['corrupt','bad-json','bad-migration','bad-state']) {
  test('Existing '+bad+' ciphertext blocks direct save without writes',()=>{
    const before={[KEY]:'a'.repeat(64),[PAYLOAD]:bad};
    const s=storage(before), oldSeals=sealCalls;
    assert.throws(()=>api.saveWebVault(s,incoming,rand),/Salvarea este blocată/);
    assert.equal(s.writes,0);
    assert.deepEqual(s.data,before);
    assert.equal(sealCalls,oldSeals,'Must reject before encrypting new data');
    assertZeroized(lastKey);
  });
}
test('Valid existing ciphertext decrypts and updates payload exactly once',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'valid-envelope'});
  const prior=decryptCalls;
  api.saveWebVault(s,incoming,rand);
  assert.equal(decryptCalls,prior+1);
  assert.equal(s.writes,1);
  assert.equal(s.data[KEY],'a'.repeat(64));
  assert.equal(s.data[PAYLOAD],'valid-envelope');
  assertZeroized(lastKey);
});
test('Fresh vault saves one key and one payload with zeroized random key',()=>{
  const s=storage();
  api.saveWebVault(s,incoming,rand);
  assert.equal(s.writes,2);
  assert.equal(s.data[KEY],'b'.repeat(64));
  assert.equal(s.data[PAYLOAD],'valid-envelope');
  assertZeroized(lastRandom);
});
test('Empty ciphertext remains blocked without writing',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:''});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
  assertZeroized(lastKey);
});
test('Whitespace ciphertext remains blocked without writing',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'  '});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
  assertZeroized(lastKey);
});
test('Payload without key remains blocked and preserved',()=>{
  const s=storage({[PAYLOAD]:'corrupt'});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/cheia lor lipsește/);
  assert.equal(s.writes,0);
  assert.equal(s.data[PAYLOAD],'corrupt');
});
test('Orphan key remains blocked and zeroized',()=>{
  const s=storage({[KEY]:'a'.repeat(64)});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
  assertZeroized(lastKey);
});
test('Failed payload update leaves prior ciphertext unchanged',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'valid-envelope'},{failPayload:true});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/nu a putut salva/);
  assert.equal(s.writes,0);
  assert.equal(s.data[PAYLOAD],'valid-envelope');
  assertZeroized(lastKey);
});
test('Storage read denial never causes a fresh initialization',()=>{
  const s=storage({}, {failRead:true});
  assert.throws(()=>api.saveWebVault(s,incoming,rand),/Storage read denied/);
  assert.equal(s.writes,0);
});
test('Invalid incoming state is rejected before storage access',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'valid-envelope'});
  assert.throws(()=>api.saveWebVault(s,{...incoming,badState:true},rand),/Invalid state/);
  assert.equal(s.writes,0);
});
console.log(passed+'/13 corrupt ciphertext preservation tests passed ('+path+')');
if(passed!==13)process.exitCode=1;
