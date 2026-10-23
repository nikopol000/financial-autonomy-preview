'use strict';
// Real bundled AES-256-GCM + encrypted-vault integration on synthetic data only.
// Unlike vault-corrupt-save-regression.cjs, crypto is NOT mocked: load the actual
// Metro modules 310..322 from the immutable bundle, and cross-check with Node OpenSSL.
// This is a Node VM/browser-like integration test, NOT a real interactive browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const nodeCrypto = require('node:crypto');
const html = fs.readFileSync('index.html', 'utf8');
const path = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path && path.startsWith('_expo/static/js/web/'), 'Active WEB bundle missing');
const source = fs.readFileSync(path, 'utf8');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const clone = value => JSON.parse(JSON.stringify(value));
const empty = () => ({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model = {
  emptyState: empty,
  migrate: value => {model.validateState(value);return value;},
  validateState(value) {
    assert.ok(value && value.version === 4, 'Invalid synthetic ledger version');
    for (const field of ['accounts','transactions','balanceChecks'])
      assert.ok(Array.isArray(value[field]), 'Invalid synthetic '+field);
  },
  saveTransaction: (state,row) => ({...state,transactions:[...state.transactions,row]})
};
const sandbox = {
  Uint8Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer, DataView,
  TextDecoder, TextEncoder, Buffer, setTimeout, clearTimeout, console,
  globalThis: {crypto: nodeCrypto.webcrypto}
};
const cache = new Map([[204,{validateState:model.validateState}],[205,model]]);
function moduleFactory(id,context=sandbox) {
  const pattern = new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
  const matches = [...source.matchAll(pattern)];
  assert.equal(matches.length,1,'Expected one Metro module '+id);
  const match = matches[0];
  const start = source.lastIndexOf('__d(function(',match.index);
  assert.ok(start >= 0 && match.index > start,'Metro factory missing '+id);
  const factorySource = '('+source.slice(start+4,match.index+1)+')';
  const dependencies = match[1] ? match[1].split(',').map(Number) : [];
  return {factory:vm.runInNewContext(factorySource,context),dependencies};
}
function load(id) {
  if (cache.has(id)) return cache.get(id);
  const {factory,dependencies} = moduleFactory(id);
  const module = {exports:{}};
  cache.set(id,module.exports);
  factory(sandbox.globalThis,load,()=>{},null,module,module.exports,dependencies);
  cache.set(id,module.exports);
  return module.exports;
}
const crypt = load(311);
const vault = load(310);
function storage(initial={},options={}) {
  const data = {...initial};
  let writes = 0;
  return {
    get length(){return Object.keys(data).length;},
    key(index){return Object.keys(data)[index]??null;},
    getItem(key){if(options.denyRead)throw Error('Storage read denied');return Object.hasOwn(data,key)?data[key]:null;},
    setItem(key,value){if(options.denyWrite)throw Error('Storage write denied');writes++;data[key]=String(value);},
    removeItem(key){writes++;delete data[key];},
    get data(){return data;},get writes(){return writes;}
  };
}
const random = length => new Uint8Array(nodeCrypto.randomBytes(length));
const sample = () => ({
  version:4,accounts:[{id:'synthetic-checking',name:'Synthetic',opening:123456}],
  transactions:[{id:'synthetic-expense',accountId:'synthetic-checking',kind:'expense',amount:1250,date:'2026-10-23'}],
  balanceChecks:[]
});
let passed = 0;
async function test(name,fn) {
  try {await fn();passed++;console.log('PASS',name);}
  catch(error){console.error('FAIL',name,error.stack||error);process.exitCode=1;}
}
(async () => {
  await test('Bundled AES-GCM envelope round-trips Unicode without plaintext leakage',()=>{
    const key=random(32),plaintext='Date fictive: 1250 RON — șțîăâ';
    const envelope=crypt.seal(plaintext,key,random);
    assert.equal(crypt.unseal(envelope,key),plaintext);
    const parsed=JSON.parse(envelope);
    assert.equal(parsed.v,1);
    assert.match(parsed.nonce,/^[0-9a-f]{24}$/);
    assert.match(parsed.data,/^[0-9a-f]+$/);
    assert.ok(!envelope.includes(plaintext));
  });
  await test('Bundled AES-GCM ciphertext authenticates with independent Node/OpenSSL',()=>{
    const key=random(32),plaintext='Cross implementation AES-256-GCM';
    const {nonce,data}=JSON.parse(crypt.seal(plaintext,key,random));
    const raw=Buffer.from(data,'hex'),dec=nodeCrypto.createDecipheriv('aes-256-gcm',Buffer.from(key),Buffer.from(nonce,'hex'));
    dec.setAuthTag(raw.subarray(-16));
    assert.equal(Buffer.concat([dec.update(raw.subarray(0,-16)),dec.final()]).toString('utf8'),plaintext);
  });
  await test('Bundled AES-GCM decrypts independent Node/OpenSSL ciphertext',()=>{
    const key=random(32),nonce=random(12),plaintext='Independent encryptor';
    const enc=nodeCrypto.createCipheriv('aes-256-gcm',Buffer.from(key),Buffer.from(nonce));
    const raw=Buffer.concat([enc.update(plaintext,'utf8'),enc.final(),enc.getAuthTag()]);
    const envelope=JSON.stringify({v:1,nonce:Buffer.from(nonce).toString('hex'),data:raw.toString('hex')});
    assert.equal(crypt.unseal(envelope,key),plaintext);
  });
  await test('Tampered ciphertext, nonce and wrong key fail authentication',()=>{
    const key=random(32),envelope=JSON.parse(crypt.seal('synthetic',key,random));
    const flipped={...envelope,data:(envelope.data[0]==='0'?'1':'0')+envelope.data.slice(1)};
    assert.throws(()=>crypt.unseal(JSON.stringify(flipped),key));
    const badNonce={...envelope,nonce:(envelope.nonce[0]==='0'?'1':'0')+envelope.nonce.slice(1)};
    assert.throws(()=>crypt.unseal(JSON.stringify(badNonce),key));
    assert.throws(()=>crypt.unseal(JSON.stringify(envelope),random(32)));
  });
  await test('Actual vault saves only ciphertext, reloads synthetic ledger and retains key on edit',()=>{
    const s=storage(),first=sample();
    vault.saveWebVault(s,first,random);
    assert.equal(s.writes,2);
    assert.match(s.data[KEY],/^[0-9a-f]{64}$/);
    assert.ok(!s.data[PAYLOAD].includes('synthetic-checking'));
    assert.deepEqual(clone(vault.loadWebVault(s)),first);
    const priorKey=s.data[KEY],priorPayload=s.data[PAYLOAD];
    const updated=clone(first);updated.transactions.push({id:'synthetic-income',kind:'income',amount:7000});
    vault.saveWebVault(s,updated,random);
    assert.equal(s.writes,3);
    assert.equal(s.data[KEY],priorKey);
    assert.notEqual(s.data[PAYLOAD],priorPayload);
    assert.deepEqual(clone(vault.loadWebVault(s)),updated);
  });
  await test('Actual vault rejects corrupted existing authentication tag without overwriting',()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const envelope=JSON.parse(s.data[PAYLOAD]);
    envelope.data=(envelope.data[0]==='0'?'1':'0')+envelope.data.slice(1);
    s.data[PAYLOAD]=JSON.stringify(envelope);
    const before=clone(s.data),writes=s.writes;
    assert.throws(()=>vault.loadWebVault(s),/deteriorate|citite/i);
    assert.throws(()=>vault.saveWebVault(s,sample(),random),/Salvarea este blocată/);
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  });
  await test('Actual vault write failure leaves previous encrypted ledger unchanged',()=>{
    const base=storage();vault.saveWebVault(base,sample(),random);
    const initial=clone(base.data),s=storage(initial,{denyWrite:true});
    assert.throws(()=>vault.saveWebVault(s,sample(),random),/nu a putut salva/);
    assert.deepEqual(s.data,initial);assert.equal(s.writes,0);
  });
  await test('Actual platform explicit real mode persists through reload with bundled AES-GCM',async()=>{
    const s=storage();
    function platform(url){
      const globalThis={localStorage:s,location:{href:url},history:{state:null,replaceState(){}},
        crypto:{getRandomValues:array=>nodeCrypto.webcrypto.getRandomValues(array),randomUUID:()=>nodeCrypto.randomUUID()}};
      const {factory,dependencies}=moduleFactory(309,{...sandbox,globalThis,URL,Blob}),api={};
      factory(globalThis,id=>id===205?model:vault,()=>{},null,{exports:api},api,dependencies);
      return api;
    }
    const first=platform('https://example.test/?fa_real=1');
    assert.deepEqual(clone(await first.load()),empty());
    await first.save(sample());
    const second=platform('https://example.test/?fa_real=1');
    assert.equal(second.isDemo(),false);
    assert.deepEqual(clone(await second.load()),sample());
    assert.equal(s.writes,2);
  });
  console.log(passed+'/8 bundled AES-GCM synthetic vault integration tests passed ('+path+')');
  if(passed!==8)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
