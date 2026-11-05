#!/usr/bin/env node
'use strict';
// Research-only synthetic persisted v18.20 vault -> active v18.74 migration.
// Never accesses browser storage, real data, backups, or production endpoints.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const archived='_expo/static/js/web/index-v01820-history-back-navigation-20261014.js';
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(active,'active bundle missing');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
function modules(file){
  const source=fs.readFileSync(file,'utf8'),cache=new Map();
  const state={
    validateState(x){assert.equal(x?.syntheticFixture,true,'synthetic state only');},
    migrate(x){this.validateState(x);return x;},
    emptyState(){return {syntheticFixture:true,entries:[]};}
  };
  const globals={Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
    TextEncoder,TextDecoder,Buffer,console,globalThis:{crypto:crypto.webcrypto}};
  function load(id){
    if(id===205)return state; // Strict test-only state adapter; not production schema migration.
    if(cache.has(id))return cache.get(id);
    const matches=[...source.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
    assert.equal(matches.length,1,file+' module '+id+' ambiguous');
    const match=matches[0],start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,'factory not found '+id);
    const factory=vm.runInNewContext('('+source.slice(start+4,match.index+1)+')',globals);
    const deps=match[1]?match[1].split(',').map(Number):[];
    const module={exports:{}};cache.set(id,module.exports);
    factory(globals.globalThis,load,()=>{},null,module,module.exports,deps);
    cache.set(id,module.exports);return module.exports;
  }
  return load(310);
}
function storage(){
  const data=new Map();
  return {
    getItem(k){return data.has(k)?data.get(k):null;},
    setItem(k,v){data.set(String(k),String(v));},
    removeItem(k){data.delete(k);},
    snapshot(){return new Map(data);}
  };
}
const old=modules(archived),now=modules(active);
assert.equal(old.WEB_VAULT_KEY,KEY);
assert.equal(now.WEB_VAULT_PAYLOAD,PAYLOAD);
const store=storage(),random=n=>new Uint8Array(crypto.randomBytes(n));
const initial={syntheticFixture:true,entries:[{id:'synthetic-1',amountMinor:12345,note:'șțîăâ €'}]};
old.saveWebVault(store,initial,random);
const persisted=store.snapshot();
// Fresh Metro module instances model reloads without changing persistent bytes.
const freshArchived=modules(archived),freshActive=modules(active);
const beforeReload=store.snapshot();
assert.deepEqual(JSON.parse(JSON.stringify(freshArchived.loadWebVault(store))),initial,
  'fresh archived module must decrypt persisted synthetic vault');
assert.deepEqual(JSON.parse(JSON.stringify(freshActive.loadWebVault(store))),initial,
  'fresh active module must decrypt archived persisted synthetic vault');
assert.deepEqual([...store.snapshot()],[...beforeReload],
  'read-only reloads must preserve exact encrypted storage bytes');
assert.match(persisted.get(KEY),/^[0-9a-f]{64}$/i);
assert.ok(persisted.get(PAYLOAD),'archived ciphertext missing');
assert.deepEqual(JSON.parse(JSON.stringify(now.loadWebVault(store))),initial);
const updated={...initial,entries:[...initial.entries,{id:'synthetic-2',amountMinor:-500}]};
now.saveWebVault(store,updated,random);
assert.deepEqual(JSON.parse(JSON.stringify(old.loadWebVault(store))),updated);
const orphan=storage();orphan.setItem(KEY,persisted.get(KEY));
assert.throws(()=>now.loadWebVault(orphan),/cheia|Cheia/i,'KEY-only must fail closed');
assert.throws(()=>now.saveWebVault(orphan,updated,random),/cheia|Cheia/i,'KEY-only overwrite must fail closed');
assert.equal(orphan.getItem(PAYLOAD),null,'orphan must remain untouched');
assert.equal(orphan.getItem(KEY),persisted.get(KEY),'orphan key must be preserved');
assert.equal(store.getItem(RESET),null,'fixture did not initiate reset');

const tamperedCiphertext=storage();
tamperedCiphertext.setItem(KEY,persisted.get(KEY));
const originalCiphertext=persisted.get(PAYLOAD);
assert.ok(originalCiphertext.length>8,'ciphertext fixture unexpectedly short');
// Mutate a non-terminal base64 character: changing the final character may alter only unused padding bits.
const mutationIndex=Math.floor(originalCiphertext.length/2);
assert.match(originalCiphertext[mutationIndex],/[A-Za-z0-9+/]/,'expected interior base64 data character');
tamperedCiphertext.setItem(PAYLOAD,originalCiphertext.slice(0,mutationIndex)+(originalCiphertext[mutationIndex]==='A'?'B':'A')+originalCiphertext.slice(mutationIndex+1));
const tamperedBefore=tamperedCiphertext.snapshot();
assert.throws(()=>now.loadWebVault(tamperedCiphertext),'tampered ciphertext must not load');
assert.deepEqual([...tamperedCiphertext.snapshot()],[...tamperedBefore],'failed load must not mutate ciphertext');
assert.throws(()=>now.saveWebVault(tamperedCiphertext,updated,random),'tampered ciphertext must reject overwrite');
assert.deepEqual([...tamperedCiphertext.snapshot()],[...tamperedBefore],'rejected tampered save must preserve exact storage bytes');
const missingKey=storage();
missingKey.setItem(PAYLOAD,persisted.get(PAYLOAD));
const missingBefore=missingKey.snapshot();
assert.throws(()=>now.saveWebVault(missingKey,updated,random),'payload-only save must fail closed');
assert.deepEqual([...missingKey.snapshot()],[...missingBefore],'payload-only save must not mutate storage');

// Inject a first-save payload-write denial: localStorage is not transactional.
// Characterization only: KEY-only is an ambiguous blocked state, not recoverable data.
const denied=storage();
const deniedSet=denied.setItem.bind(denied);
denied.setItem=(k,v)=>{if(k===PAYLOAD)throw new Error('synthetic payload write denied');return deniedSet(k,v);};
assert.throws(()=>old.saveWebVault(denied,initial,random),/synthetic payload write denied/);
assert.match(denied.getItem(KEY),/^[0-9a-f]{64}$/i,'first-save denial leaves an orphan key');
assert.equal(denied.getItem(PAYLOAD),null,'denied payload must not be committed');
const deniedSnapshot=denied.snapshot();
assert.throws(()=>now.loadWebVault(denied),'orphan key must block reload');
assert.deepEqual([...denied.snapshot()],[...deniedSnapshot],'blocked reload must not mutate storage');


 
// Fault matrix: denial at the first KEY write must leave no partial vault.
const deniedKey=storage();
const deniedKeySet=deniedKey.setItem.bind(deniedKey);
deniedKey.setItem=(k,v)=>{if(k===KEY)throw new Error('synthetic key write denied');return deniedKeySet(k,v);};
assert.throws(()=>old.saveWebVault(deniedKey,initial,random),/synthetic key write denied/);
assert.deepEqual([...deniedKey.snapshot()],[],'first KEY write denial must leave no footprint');

// Existing-vault PAYLOAD denial must preserve the complete authenticated old envelope.
const deniedUpdate=storage();
deniedUpdate.setItem(KEY,persisted.get(KEY));
deniedUpdate.setItem(PAYLOAD,persisted.get(PAYLOAD));
const beforeDeniedUpdate=deniedUpdate.snapshot();
const deniedUpdateSet=deniedUpdate.setItem.bind(deniedUpdate);
deniedUpdate.setItem=(k,v)=>{if(k===PAYLOAD)throw new Error('synthetic update payload denied');return deniedUpdateSet(k,v);};
assert.throws(()=>now.saveWebVault(deniedUpdate,updated,random),/synthetic update payload denied/);
assert.deepEqual([...deniedUpdate.snapshot()],[...beforeDeniedUpdate],
  'denied existing-vault update must preserve exact key and ciphertext');
assert.deepEqual(JSON.parse(JSON.stringify(now.loadWebVault(deniedUpdate))),initial,
  'old authenticated ledger must remain readable after denied update');

console.log('PASS synthetic archived persisted vault -> active read -> active write -> archived read; KEY-only fail closed');
console.log(JSON.stringify({status:'PASS',archived,active,synthetic:true,realSchemaMigrationTested:false,browserTested:false,twoTabsTested:false,resetTested:false}));
