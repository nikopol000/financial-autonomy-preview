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
    migrate(x){assert.equal(x?.syntheticFixture,true,'synthetic state only');return x;},
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
const mutatedCiphertext=originalCiphertext.slice(0,mutationIndex)+(originalCiphertext[mutationIndex]==='A'?'B':'A')+originalCiphertext.slice(mutationIndex+1);
assert.notDeepEqual(Buffer.from(mutatedCiphertext,'base64'),Buffer.from(originalCiphertext,'base64'),
  'tamper fixture must change decoded authenticated bytes, not only base64 spelling');
tamperedCiphertext.setItem(PAYLOAD,mutatedCiphertext);
const tamperedBefore=tamperedCiphertext.snapshot();
assert.throws(()=>now.loadWebVault(tamperedCiphertext),'tampered ciphertext must not load');
assert.deepEqual([...tamperedCiphertext.snapshot()],[...tamperedBefore],'failed load must not mutate ciphertext');
assert.throws(()=>now.saveWebVault(tamperedCiphertext,updated,random),'tampered ciphertext must reject overwrite');
assert.deepEqual([...tamperedCiphertext.snapshot()],[...tamperedBefore],'rejected tampered save must preserve exact storage bytes');
const missingKey=storage();
missingKey.setItem(PAYLOAD,persisted.get(PAYLOAD));
const missingBefore=missingKey.snapshot();
assert.throws(()=>now.loadWebVault(missingKey),'payload-only load must fail closed');
assert.deepEqual([...missingKey.snapshot()],[...missingBefore],
  'payload-only rejected load must preserve exact ciphertext');
assert.throws(()=>now.saveWebVault(missingKey,updated,random),'payload-only save must fail closed');
const reloadedMissingKey=modules(active);
assert.throws(()=>reloadedMissingKey.loadWebVault(missingKey),
  'fresh active module must also reject payload-only state');
assert.deepEqual([...missingKey.snapshot()],[...missingBefore],
  'fresh blocked payload-only reload must not mutate ciphertext');
assert.deepEqual([...missingKey.snapshot()],[...missingBefore],'payload-only save must not mutate storage');

// Inject a first-save payload-write denial: localStorage is not transactional.
// Characterization only: KEY-only is an ambiguous blocked state, not recoverable data.
const denied=storage();
const deniedSet=denied.setItem.bind(denied);
denied.setItem=(k,v)=>{if(k===PAYLOAD)throw new Error('synthetic payload write denied');return deniedSet(k,v);};
assert.throws(()=>old.saveWebVault(denied,initial,random), 'payload write denial must surface an error');
assert.match(denied.getItem(KEY),/^[0-9a-f]{64}$/i,'first-save denial leaves an orphan key');
assert.equal(denied.getItem(PAYLOAD),null,'denied payload must not be committed');
const deniedSnapshot=denied.snapshot();
assert.throws(()=>now.loadWebVault(denied),'orphan key must block reload');
assert.deepEqual([...denied.snapshot()],[...deniedSnapshot],'blocked reload must not mutate storage');


 
// Fault matrix: denial at the first KEY write must leave no partial vault.
const deniedKey=storage();
const deniedKeySet=deniedKey.setItem.bind(deniedKey);
deniedKey.setItem=(k,v)=>{if(k===KEY)throw new Error('synthetic key write denied');return deniedKeySet(k,v);};
assert.throws(()=>old.saveWebVault(deniedKey,initial,random), 'key write denial must surface an error');
assert.deepEqual([...deniedKey.snapshot()],[],'first KEY write denial must leave no footprint');

// Existing-vault PAYLOAD denial must preserve the complete authenticated old envelope.
const deniedUpdate=storage();
deniedUpdate.setItem(KEY,persisted.get(KEY));
deniedUpdate.setItem(PAYLOAD,persisted.get(PAYLOAD));
const beforeDeniedUpdate=deniedUpdate.snapshot();
const deniedUpdateSet=deniedUpdate.setItem.bind(deniedUpdate);
deniedUpdate.setItem=(k,v)=>{if(k===PAYLOAD)throw new Error('synthetic update payload denied');return deniedUpdateSet(k,v);};
assert.throws(()=>now.saveWebVault(deniedUpdate,updated,random), 'update write denial must surface an error');
assert.deepEqual([...deniedUpdate.snapshot()],[...beforeDeniedUpdate],
  'denied existing-vault update must preserve exact key and ciphertext');
assert.deepEqual(JSON.parse(JSON.stringify(now.loadWebVault(deniedUpdate))),initial,
  'old authenticated ledger must remain readable after denied update');

// Read-denial fault matrix: fail closed without changing any persisted encrypted bytes.
for (const deniedReadKey of [KEY, PAYLOAD]) {
  const readDenied=storage();
  readDenied.setItem(KEY,persisted.get(KEY));
  readDenied.setItem(PAYLOAD,persisted.get(PAYLOAD));
  const originalGet=readDenied.getItem.bind(readDenied);
  const before=readDenied.snapshot();
  readDenied.getItem=k=>{
    if(k===deniedReadKey)throw new Error('synthetic read denied');
    return originalGet(k);
  };
  assert.throws(()=>now.loadWebVault(readDenied),
    'denied '+deniedReadKey+' read must not load');
  assert.deepEqual([...readDenied.snapshot()],[...before],
    'denied read must preserve exact persisted encrypted bytes');
  assert.throws(()=>now.saveWebVault(readDenied,updated,random),
    'denied '+deniedReadKey+' read must not allow save');
  assert.deepEqual([...readDenied.snapshot()],[...before],
    'denied read must not mutate key or ciphertext');
  // A reload cannot turn a permission/read failure into an empty new vault.
  const freshOnDeniedRead=modules(active);
  assert.throws(()=>freshOnDeniedRead.loadWebVault(readDenied),
    'fresh module must reject denied '+deniedReadKey+' read');
  assert.throws(()=>freshOnDeniedRead.saveWebVault(readDenied,updated,random),
    'fresh module must not overwrite after denied '+deniedReadKey+' read');
  assert.deepEqual([...readDenied.snapshot()],[...before],
    'fresh module denial must preserve exact persisted encrypted bytes');
}

console.log('PASS synthetic archived persisted vault -> active read -> active write -> archived read; KEY-only fail closed');
console.log(JSON.stringify({status:'PASS',archived,active,synthetic:true,realSchemaMigrationTested:false,browserTested:false,twoTabsTested:false,resetTested:false}));
