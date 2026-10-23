'use strict';
// Vault presence safety contract. Runs against active HTML by default, or an
// explicitly named immutable candidate via FA_VAULT_TEST_BUNDLE.
// No browser storage or user financial data is accessed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\\/financial-autonomy-preview\\/([^"?]+\\.js)\\?build=/)?.[1];
const path=process.env.FA_VAULT_TEST_BUNDLE||active;
assert.ok(path&&path.startsWith('_expo/static/js/web/'),'Vault bundle path missing');
const source=fs.readFileSync(path,'utf8');
const marker='e.loadWebVault=function(o)';
const at=source.indexOf(marker),start=source.lastIndexOf('__d(function(',at);
const end=source.indexOf('},310,[205,311]);',at);
assert.ok(at>=0&&start>=0&&end>start,'Vault module not found');
const factory=vm.runInNewContext('('+source.slice(start+4,end+1)+')');
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1';
const saved={version:4,accounts:[{id:'synthetic'}],transactions:[],balanceChecks:[]};
const fresh={version:4,accounts:[],transactions:[],balanceChecks:[]};
const model={emptyState:()=>fresh,migrate:x=>x,validateState:()=>{}};
const crypto={
  hexToBytes:()=>new Uint8Array(32),
  bytesToHex:()=> 'b'.repeat(64),
  seal:()=> 'valid-envelope',
  unseal:c=>{if(c!=='valid-envelope')throw Error('Invalid ciphertext');return JSON.stringify(saved)}
};
const api={};
factory({},id=>id===205?model:crypto,()=>{},null,{},api,[205,311]);
function storage(initial={}){
  const data={...initial};let writes=0;
  return {getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
    setItem:(k,v)=>{writes++;data[k]=v},removeItem:k=>{delete data[k]},
    get writes(){return writes},get data(){return data}};
}
const rand=n=>new Uint8Array(n).fill(9);
let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS',name)}
catch(e){console.error('FAIL',name,e.stack||e.message);process.exitCode=1}}
test('Truly absent keys load fresh and first save creates exactly two values',()=>{
  const s=storage();assert.equal(api.loadWebVault(s),fresh);
  api.saveWebVault(s,saved,rand);assert.equal(s.writes,2);
  assert.equal(s.data[PAYLOAD],'valid-envelope');
  assert.deepEqual(JSON.parse(JSON.stringify(api.loadWebVault(s))),saved);
});
test('Complete encrypted vault updates only ciphertext, retaining the key',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'valid-envelope'});
  assert.deepEqual(JSON.parse(JSON.stringify(api.loadWebVault(s))),saved);
  api.saveWebVault(s,saved,rand);
  assert.equal(s.writes,1);assert.equal(s.data[KEY],'a'.repeat(64));
});
test('Present but empty key with absent payload cannot initialize or save',()=>{
  const s=storage({[KEY]:''});
  assert.throws(()=>api.loadWebVault(s));
  assert.throws(()=>api.saveWebVault(s,saved,rand));
  assert.equal(s.writes,0);assert.equal(s.data[KEY],'');
});
test('Present but empty payload with absent key cannot initialize or save',()=>{
  const s=storage({[PAYLOAD]:''});
  assert.throws(()=>api.loadWebVault(s));
  assert.throws(()=>api.saveWebVault(s,saved,rand));
  assert.equal(s.writes,0);assert.equal(s.data[PAYLOAD],'');
});
test('Empty ciphertext with valid key is never silently overwritten',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:''});
  assert.throws(()=>api.loadWebVault(s));
  assert.throws(()=>api.saveWebVault(s,saved,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
});
test('Whitespace-only ciphertext is never silently overwritten',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'  '});
  assert.throws(()=>api.loadWebVault(s));
  assert.throws(()=>api.saveWebVault(s,saved,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
});
test('Whitespace-only ciphertext without key remains protected',()=>{
  const s=storage({[PAYLOAD]:'  '});
  assert.throws(()=>api.loadWebVault(s));
  assert.throws(()=>api.saveWebVault(s,saved,rand));
  assert.equal(s.writes,0);
});
test('Empty key with present ciphertext is invalid and never replaced',()=>{
  const s=storage({[KEY]:'',[PAYLOAD]:'valid-envelope'});
  assert.throws(()=>api.loadWebVault(s),/invalidă/);
  assert.throws(()=>api.saveWebVault(s,saved,rand),/invalidă/);
  assert.equal(s.writes,0);
});
test('Orphan valid key remains guarded on both load and save',()=>{
  const s=storage({[KEY]:'a'.repeat(64)});
  assert.throws(()=>api.loadWebVault(s),/Cheia locală există/);
  assert.throws(()=>api.saveWebVault(s,saved,rand),/Salvarea este blocată/);
  assert.equal(s.writes,0);
});
test('Nonempty corrupt ciphertext does not load as a new ledger',()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'corrupt'});
  assert.throws(()=>api.loadWebVault(s),/nu pot fi citite/);
  assert.equal(s.writes,0);
});
console.log(passed+'/10 vault presence safety tests passed ('+path+')');
if(passed!==10)process.exitCode=1;
