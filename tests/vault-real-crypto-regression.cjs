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
const RESET = 'financial-autonomy.preview.reset.v1';
const clone = value => JSON.parse(JSON.stringify(value));
const empty = () => ({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model = {
  emptyState: empty,
  migrate: value => {model.validateState(value);return value;},
  validateState(value) {
    assert.ok(value && value.version === 4, 'Invalid synthetic ledger version');
    for (const field of ['accounts','transactions','balanceChecks'])
      assert.ok(Array.isArray(value[field]), 'Invalid synthetic '+field);
    return value;
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

function realTab(s,{locks,url='https://example.test/?fa_real=1'}={}){
  const globalThis={localStorage:s,location:{href:url},history:{state:null,replaceState(){}},
    crypto:{getRandomValues:array=>nodeCrypto.webcrypto.getRandomValues(array),randomUUID:()=>nodeCrypto.randomUUID()}};
  if(locks)globalThis.navigator={locks};
  const {factory,dependencies}=moduleFactory(309,{...sandbox,globalThis,URL,Blob}),api={};
  factory(globalThis,id=>id===205?model:vault,()=>{},null,{exports:api},api,dependencies);
  return api;
}
function serialLocks(){
  let tail=Promise.resolve(),requests=0;
  return {
    get requests(){return requests;},
    request(name,options,fn){
      assert.equal(name,'financial-autonomy.preview.vault.v1');
      assert.equal(options.mode,'exclusive');requests++;
      const turn=tail.then(fn);
      tail=turn.catch(()=>{});
      return turn;
    }
  };
}

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
        navigator:{locks:serialLocks()},crypto:{getRandomValues:array=>nodeCrypto.webcrypto.getRandomValues(array),randomUUID:()=>nodeCrypto.randomUUID()}};
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


  await test('Stale second tab is rejected without writes; reload and same-tab repeat saves succeed',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),a=realTab(s,{locks}),b=realTab(s,{locks});
    const aState=clone(await a.load()),bState=clone(await b.load());
    aState.transactions.push({id:'tab-a-synthetic',kind:'expense',amount:111});
    await a.save(aState);
    const afterA=clone(s.data),writesAfterA=s.writes;
    bState.transactions.push({id:'tab-b-synthetic',kind:'income',amount:222});
    await assert.rejects(b.save(bState),/altă filă|Reîncarcă/i);
    assert.deepEqual(s.data,afterA);assert.equal(s.writes,writesAfterA);
    aState.transactions.push({id:'tab-a-second',kind:'expense',amount:333});
    await a.save(aState);
    assert.ok(vault.loadWebVault(s).transactions.some(t=>t.id==='tab-a-second'));
    const freshB=clone(await b.load());
    freshB.transactions.push({id:'tab-b-synthetic',kind:'income',amount:222});
    await b.save(freshB);
    const ids=vault.loadWebVault(s).transactions.map(t=>t.id);
    for(const id of ['tab-a-synthetic','tab-a-second','tab-b-synthetic'])assert.ok(ids.includes(id));
  });
  await test('Exclusive Web Lock serializes concurrent writers and rejects stale loser',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),a=realTab(s,{locks}),b=realTab(s,{locks});
    const x=clone(await a.load()),y=clone(await b.load());
    x.transactions.push({id:'lock-a',kind:'expense',amount:111});
    y.transactions.push({id:'lock-b',kind:'expense',amount:222});
    const writes=s.writes;
    const outcomes=await Promise.allSettled([a.save(x),b.save(y)]);
    assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
    assert.equal(outcomes.filter(o=>o.status==='rejected').length,1);
    assert.match(String(outcomes.find(o=>o.status==='rejected').reason),/altă filă|Reîncarcă/i);
    assert.equal(locks.requests,2);assert.equal(s.writes,writes+1);
    const ids=vault.loadWebVault(s).transactions.map(t=>t.id);
    assert.equal(Number(ids.includes('lock-a'))+Number(ids.includes('lock-b')),1);
  });
  await test('No-Web-Locks real save and reset fail closed with zero writes',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const missing=realTab(s),invalid=realTab(s,{locks:{}});
    const state=clone(await missing.load());await invalid.load();
    state.transactions.push({id:'must-not-write',kind:'expense',amount:123});
    const before=clone(s.data),writes=s.writes;
    for(const tab of [missing,invalid]){
      await assert.rejects(tab.save(state),/Web Locks|browser actualizat/i);
      await assert.rejects(tab.resetData(),/Web Locks|browser actualizat/i);
    }
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
    assert.ok(!vault.loadWebVault(s).transactions.some(t=>t.id==='must-not-write'));
  });
  await test('No-Web-Locks explicit real mode cannot create a vault; demo stays memory-only',async()=>{
    const s=storage();
    const real=realTab(s);
    await real.load();
    await assert.rejects(real.save(sample()),/Web Locks|browser actualizat/i);
    await assert.rejects(real.resetData(),/Web Locks|browser actualizat/i);
    assert.equal(s.writes,0);assert.deepEqual(s.data,{});
    const demo=realTab(s,{url:'https://example.test/'});
    const initial=clone(await demo.load());
    assert.equal(demo.isDemo(),true);
    initial.transactions.push({id:'memory-only',kind:'expense',amount:123});
    await demo.save(initial);
    assert.ok((await demo.load()).transactions.some(t=>t.id==='memory-only'));
    assert.equal(s.writes,0);assert.deepEqual(s.data,{});
  });
  await test('Stale reset refuses deletion; refreshed reset and new real save succeed',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),a=realTab(s,{locks}),b=realTab(s,{locks}),x=clone(await a.load());await b.load();
    x.transactions.push({id:'newer',kind:'income',amount:999});
    await a.save(x);
    const before=clone(s.data),writes=s.writes;
    await assert.rejects(b.resetData(),/altă filă|Reîncarcă/i);
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
    await b.load();await b.resetData();
    assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
    await b.save(sample());
    assert.deepEqual(clone(vault.loadWebVault(s)),sample());
  });
  await test('Externally changed ciphertext after load blocks save with zero writes',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const a=realTab(s,{locks:serialLocks()});const state=clone(await a.load());
    s.data[PAYLOAD]=s.data[PAYLOAD].slice(0,-1)+'x';
    const before=clone(s.data),writes=s.writes;
    await assert.rejects(a.save(state),/altă filă|Reîncarcă/i);
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  });
  await test('Actual DEMO tab rejects edit after another tab creates real encrypted vault',async()=>{
    const s=storage();
    function tab(url){
      const globalThis={localStorage:s,location:{href:url},history:{state:null,replaceState(){}},
        navigator:{locks:serialLocks()},crypto:{getRandomValues:array=>nodeCrypto.webcrypto.getRandomValues(array),randomUUID:()=>nodeCrypto.randomUUID()}};
      const {factory,dependencies}=moduleFactory(309,{...sandbox,globalThis,URL,Blob}),api={};
      factory(globalThis,id=>id===205?model:vault,()=>{},null,{exports:api},api,dependencies);
      return api;
    }
    const demo=tab('https://example.test/'),demoState=clone(await demo.load());
    assert.equal(demo.isDemo(),true);
    const real=tab('https://example.test/?fa_real=1');
    await real.load();
    await real.save(sample());
    const before=clone(s.data),writes=s.writes;
    await assert.rejects(demo.save(demoState),/Local data appeared|storage became inaccessible/i);
    assert.deepEqual(s.data,before);
    assert.equal(s.writes,writes);
  });
  await test('Read-only capability follows the actual Web Locks save gate without storage writes',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const supported=realTab(s,{locks:serialLocks()}),unsupported=realTab(s),invalid=realTab(s,{locks:{}});
    const before=clone(s.data),writes=s.writes;
    assert.equal(supported.canWriteReal(),true);
    assert.equal(unsupported.canWriteReal(),false);
    assert.equal(invalid.canWriteReal(),false);
    await supported.load();await unsupported.load();await invalid.load();
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
    const demoStorage=storage(),demo=realTab(demoStorage,{url:'https://example.test/'});
    await demo.load();
    assert.equal(demo.isDemo(),true);
    assert.equal(demo.canWriteReal(),false);
    assert.equal(demoStorage.writes,0);
  });
  await test('Reconciliation peek sees concurrent vault change but never authorizes stale UI save',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),a=realTab(s,{locks}),b=realTab(s,{locks});
    const stale=clone(await a.load()),newer=clone(await b.load());
    newer.transactions.push({id:'other-tab-newer',kind:'income',amount:1234});
    await b.save(newer);
    const observed=clone(await a.peek());
    assert.ok(observed.transactions.some(t=>t.id==='other-tab-newer'));
    stale.transactions.push({id:'stale-editor-should-not-write',kind:'expense',amount:555});
    const before=clone(s.data),writes=s.writes;
    await assert.rejects(a.save(stale),/altă filă|Reîncarcă/i);
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
    const refreshed=clone(await a.load());
    refreshed.transactions.push({id:'after-explicit-refresh',kind:'expense',amount:555});
    await a.save(refreshed);
    assert.ok(vault.loadWebVault(s).transactions.some(t=>t.id==='other-tab-newer'));
    assert.ok(vault.loadWebVault(s).transactions.some(t=>t.id==='after-explicit-refresh'));
  });
  await test('Reconciliation peek allows unchanged vault and remains memory-only in DEMO',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const tab=realTab(s,{locks:serialLocks()}),state=clone(await tab.load());
    const before=clone(s.data),writes=s.writes;
    assert.deepEqual(clone(await tab.peek()),state);
    assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
    state.transactions.push({id:'valid-after-peek',kind:'income',amount:111});
    await tab.save(state);
    assert.ok(vault.loadWebVault(s).transactions.some(t=>t.id==='valid-after-peek'));
    const emptyStorage=storage(),demo=realTab(emptyStorage,{url:'https://example.test/'});
    const demoState=clone(await demo.load());
    assert.deepEqual(clone(await demo.peek()),demoState);
    assert.equal(emptyStorage.writes,0);
  });
  await test('Actual WEB UI shows pre-edit read-only warning only for real mode without Web Locks',()=>{
    assert.match(source,/const current=await R\.peek\(\);/);
    assert.match(source,/e&&!R\.isDemo\(\)&&!R\.canWriteReal\(\)&&\(0,k\.jsxs\)\(d\.default/);
    assert.match(source,/MOD DOAR CITIRE · SALVAREA BLOCATĂ/);
    assert.match(source,/Nu începe editări aici/);
    assert.match(source,/tranzacțiile, reconcilierea și resetarea nu se pot salva/);
    assert.match(source,/accessibilityRole:"alert",style:\[he\.banner,\{borderWidth:2,borderColor:"#D97706"/);
  });
  await test('Concurrent reset then stale save cannot resurrect an erased ledger',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),resetTab=realTab(s,{locks}),saveTab=realTab(s,{locks});
    await resetTab.load();const stale=clone(await saveTab.load());
    stale.transactions.push({id:'stale-resurrection',kind:'income',amount:999});
    const writes=s.writes;
    const outcomes=await Promise.allSettled([resetTab.resetData(),saveTab.save(stale)]);
    assert.deepEqual(outcomes.map(o=>o.status),['fulfilled','rejected']);
    assert.match(String(outcomes[1].reason),/altă filă|Reîncarcă/i);
    assert.equal(locks.requests,2);assert.equal(s.writes,writes+4);
    assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
    assert.deepEqual(clone(vault.loadWebVault(s)),empty());
  });
  await test('Concurrent save then stale reset cannot erase newer transactions',async()=>{
    const s=storage();vault.saveWebVault(s,sample(),random);
    const locks=serialLocks(),saveTab=realTab(s,{locks}),resetTab=realTab(s,{locks});
    const updated=clone(await saveTab.load());await resetTab.load();
    updated.transactions.push({id:'must-survive-reset',kind:'expense',amount:234});
    const writes=s.writes;
    const outcomes=await Promise.allSettled([saveTab.save(updated),resetTab.resetData()]);
    assert.deepEqual(outcomes.map(o=>o.status),['fulfilled','rejected']);
    assert.match(String(outcomes[1].reason),/altă filă|Reîncarcă/i);
    assert.equal(locks.requests,2);assert.equal(s.writes,writes+1);
    assert.ok(vault.loadWebVault(s).transactions.some(t=>t.id==='must-survive-reset'));
    assert.notEqual(s.getItem(KEY),null);assert.notEqual(s.getItem(PAYLOAD),null);
  });
  await test('Vault revision changing during decrypt fails load and cannot authorize a stale save',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const newer=clone(sample());
    newer.transactions.push({id:'concurrent-valid-write',kind:'income',amount:345});
    let payloadReads=0,changed=false;
    const interleaved={
      getItem(key){
        const value=backing.getItem(key);
        if(key===PAYLOAD&&++payloadReads===2){
          vault.saveWebVault(backing,newer,random);
          changed=true;
        }
        return value;
      },
      setItem:(...args)=>backing.setItem(...args),
      removeItem:(...args)=>backing.removeItem(...args),
      key:i=>backing.key(i),
      get length(){return backing.length}
    };
    const tab=realTab(interleaved,{locks:serialLocks()});
    const before=backing.writes;
    await assert.rejects(tab.load(),/altă filă|Reîncarcă/i);
    assert.equal(changed,true);assert.equal(backing.writes,before+1);
    const latest=clone(backing.data),writes=backing.writes;
    await assert.rejects(tab.save(sample()),/altă filă|Reîncarcă/i);
    assert.deepEqual(backing.data,latest);assert.equal(backing.writes,writes);
    assert.deepEqual(clone(await tab.load()),newer);
    await tab.save(newer);
    assert.deepEqual(clone(vault.loadWebVault(backing)),newer);
  });
  // Committed tombstone is written BEFORE any ciphertext/key deletion.
  // After an interruption, reload resumes deletion; it never restores old data.
  await test('Reset: denied commit marker write leaves original encrypted ledger intact',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const before=clone(backing.data),writes=backing.writes;
    const denied={
      getItem:k=>backing.getItem(k),key:i=>backing.key(i),get length(){return backing.length},
      setItem(k,v){if(k===RESET)throw Error('QuotaExceededError');backing.setItem(k,v)},
      removeItem:k=>backing.removeItem(k)
    };
    const tab=realTab(denied,{locks:serialLocks()});await tab.load();
    await assert.rejects(tab.resetData(),/QuotaExceededError/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
    assert.deepEqual(clone(vault.loadWebVault(backing)),sample());
  });
  await test('Reset: first ciphertext deletion failure leaves committed marker and resumes on reload',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const before=clone(backing.data),writes=backing.writes;
    const failing={
      getItem:k=>backing.getItem(k),setItem:(...args)=>backing.setItem(...args),
      removeItem(){throw Error('Injected first deletion failure');},
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const tab=realTab(failing,{locks:serialLocks()});const stale=clone(await tab.load());
    await assert.rejects(tab.resetData(),/Resetarea a fost întreruptă/);
    assert.equal(backing.writes,writes+1);
    assert.match(backing.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
    assert.equal(backing.getItem(KEY),before[KEY]);assert.equal(backing.getItem(PAYLOAD),before[PAYLOAD]);
    assert.throws(()=>vault.loadWebVault(backing),/Resetarea locală/);
    await assert.rejects(tab.save(stale),/Resetarea locală|Reîncarcă/);
    assert.deepEqual(clone(await realTab(backing,{locks:serialLocks()}).load()),empty());
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);assert.equal(backing.getItem(KEY),null);assert.equal(backing.getItem(PAYLOAD),null);
  });
  await test('Reset: second deletion failure strands key temporarily but reload finishes committed reset',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const before=clone(backing.data),writes=backing.writes;
    let deletes=0;
    const failing={
      getItem:k=>backing.getItem(k),setItem:(...args)=>backing.setItem(...args),
      removeItem(k){if(++deletes===2)throw Error('Injected key deletion failure');backing.removeItem(k)},
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const tab=realTab(failing,{locks:serialLocks()});const stale=clone(await tab.load());
    await assert.rejects(tab.resetData(),/Resetarea a fost întreruptă/);
    assert.equal(deletes,2);assert.equal(backing.writes,writes+2);
    assert.match(backing.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
    assert.equal(backing.getItem(KEY),before[KEY]);assert.equal(backing.getItem(PAYLOAD),null);
    assert.throws(()=>vault.loadWebVault(backing),/Resetarea locală/);
    await assert.rejects(tab.save(stale),/Resetarea locală|Reîncarcă/);
    assert.deepEqual(clone(await realTab(backing,{locks:serialLocks()}).load()),empty());
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);assert.equal(backing.getItem(KEY),null);
  });
  await test('Reset: final idle marker write failure never resurrects deleted ledger',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const failing={
      getItem:k=>backing.getItem(k),
      setItem(k,v){if(k===RESET&&String(v).startsWith('idle-v2:'))throw Error('Injected final marker write failure');backing.setItem(k,v)},
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const tab=realTab(failing,{locks:serialLocks()});await tab.load();
    await assert.rejects(tab.resetData(),/Resetarea a fost întreruptă/);
    assert.match(backing.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
    assert.equal(backing.getItem(KEY),null);assert.equal(backing.getItem(PAYLOAD),null);
    assert.throws(()=>vault.loadWebVault(backing),/Resetarea locală/);
    assert.deepEqual(clone(await realTab(backing,{locks:serialLocks()}).load()),empty());
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
  });
  await test('Reset: failed first recovery can be retried without changing commit intent',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    let fail=true;
    const flaky={
      getItem:k=>backing.getItem(k),setItem:(...args)=>backing.setItem(...args),
      removeItem(k){if(k===PAYLOAD&&fail)throw Error('Storage unavailable');backing.removeItem(k)},
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const tab=realTab(flaky,{locks:serialLocks()});await tab.load();
    await assert.rejects(tab.resetData(),/Resetarea a fost întreruptă/);
    await assert.rejects(realTab(flaky,{locks:serialLocks()}).load(),/Storage unavailable/);
    assert.match(backing.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
    fail=false;
    assert.deepEqual(clone(await realTab(flaky,{locks:serialLocks()}).load()),empty());
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
  });
  await test('Reset: pending marker blocks stale writer even when ciphertext pair remains unchanged',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const locks=serialLocks(),staleTab=realTab(backing,{locks});
    const stale=clone(await staleTab.load()),before=clone(backing.data);
    const failing={
      getItem:k=>backing.getItem(k),setItem:(...args)=>backing.setItem(...args),
      removeItem(){throw Error('Interrupted before first delete')},
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const resetTab=realTab(failing,{locks});await resetTab.load();
    await assert.rejects(resetTab.resetData(),/Resetarea a fost întreruptă/);
    assert.equal(backing.getItem(PAYLOAD),before[PAYLOAD]);
    const writes=backing.writes;
    stale.transactions.push({id:'must-not-resurrect',kind:'income',amount:999});
    await assert.rejects(staleTab.save(stale),/Resetarea locală|Reîncarcă/);
    assert.equal(backing.writes,writes);
    assert.deepEqual(clone(await realTab(backing,{locks}).load()),empty());
  });
  await test('Reset: pending marker cannot be recovered without Web Locks',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    backing.setItem(RESET,'committed-v1');
    const before=clone(backing.data),writes=backing.writes;
    await assert.rejects(realTab(backing).load(),/Web Locks/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });
  await test('Reset: invalid marker fails closed with no deletion or save',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    backing.setItem(RESET,'unknown-marker');
    const before=clone(backing.data),writes=backing.writes;
    assert.throws(()=>vault.loadWebVault(backing),/Resetarea locală/);
    assert.throws(()=>vault.saveWebVault(backing,sample(),random),/Salvarea este blocată/);
    assert.throws(()=>vault.clearWebVault(backing),/Marcaj de resetare necunoscut/);
    await assert.rejects(realTab(backing,{locks:serialLocks()}).load(),/Marcaj de resetare necunoscut/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });
  await test('Reset: successful deletion and new vault creation reject stale pre-reset tab',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const locks=serialLocks(),stale=realTab(backing,{locks}),reset=realTab(backing,{locks});
    const old=clone(await stale.load());await reset.load();
    await reset.resetData();
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
    const fresh=realTab(backing,{locks}),emptyState=clone(await fresh.load());
    emptyState.transactions.push({id:'post-reset-new',kind:'income',amount:321});
    await fresh.save(emptyState);
    assert.ok(vault.loadWebVault(backing).transactions.some(t=>t.id==='post-reset-new'));
    const writes=backing.writes;
    await assert.rejects(stale.save(old),/altă filă|Reîncarcă/);
    assert.equal(backing.writes,writes);
  });

  // SecurityError/permission failures must not be treated as an absent marker
  // or permission to overwrite an existing encrypted ledger.
  await test('Reset: denied marker read before load fails closed with zero writes',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const before=clone(backing.data),writes=backing.writes;
    const denied={
      getItem(k){if(k===RESET)throw Error('SecurityError: reset marker read denied');return backing.getItem(k)},
      setItem:(...args)=>backing.setItem(...args),
      removeItem:(...args)=>backing.removeItem(...args),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    await assert.rejects(realTab(denied,{locks:serialLocks()}).load(),/SecurityError/);
    assert.throws(()=>vault.loadWebVault(denied),/SecurityError/);
    assert.throws(()=>vault.saveWebVault(denied,sample(),random),/SecurityError/);
    assert.throws(()=>vault.clearWebVault(denied),/SecurityError/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
    assert.deepEqual(clone(vault.loadWebVault(backing)),sample());
  });
  await test('Reset: marker read permission revoked after load blocks peek save and reset',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    let deny=false;
    const flaky={
      getItem(k){if(deny&&k===RESET)throw Error('SecurityError: permission revoked');return backing.getItem(k)},
      setItem:(...args)=>backing.setItem(...args),
      removeItem:(...args)=>backing.removeItem(...args),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const tab=realTab(flaky,{locks:serialLocks()});
    const state=clone(await tab.load()),before=clone(backing.data),writes=backing.writes;
    deny=true;
    await assert.rejects(tab.peek(),/SecurityError/);
    await assert.rejects(tab.save(state),/SecurityError/);
    await assert.rejects(tab.resetData(),/SecurityError/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
    deny=false;
    assert.deepEqual(clone(await tab.load()),state);
    await tab.save(state);
    assert.deepEqual(clone(vault.loadWebVault(backing)),state);
  });
  await test('Reset: committed marker with read denial remains pending until permission returns',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const locks=serialLocks(),stale=realTab(backing,{locks});
    const staleState=clone(await stale.load());
    backing.setItem(RESET,'committed-v1');
    let deny=true;
    const flaky={
      getItem(k){if(deny&&k===RESET)throw Error('SecurityError: marker inaccessible');return backing.getItem(k)},
      setItem:(...args)=>backing.setItem(...args),
      removeItem:(...args)=>backing.removeItem(...args),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const before=clone(backing.data),writes=backing.writes;
    await assert.rejects(realTab(flaky,{locks}).load(),/SecurityError/);
    await assert.rejects(stale.save(staleState),/Resetarea locală|Reîncarcă/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
    deny=false;
    assert.deepEqual(clone(await realTab(flaky,{locks}).load()),empty());
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
    assert.equal(backing.getItem(KEY),null);assert.equal(backing.getItem(PAYLOAD),null);
    await assert.rejects(stale.save(staleState),/altă filă|Reîncarcă/);
  });
  await test('Reset: corrupt marker inserted after load blocks stale save and reset without deletion',async()=>{
    const backing=storage();vault.saveWebVault(backing,sample(),random);
    const locks=serialLocks(),tab=realTab(backing,{locks});
    const state=clone(await tab.load());
    backing.setItem(RESET,'corrupt-marker');
    const before=clone(backing.data),writes=backing.writes;
    await assert.rejects(tab.save(state),/Resetarea locală|Reîncarcă/);
    await assert.rejects(tab.resetData(),/Resetarea locală|Reîncarcă/);
    await assert.rejects(realTab(backing,{locks}).load(),/Marcaj de resetare necunoscut/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });
  await test('KNOWN UNSAFE: first vault creation payload-write failure strands an orphan key',()=>{
    const backing=storage();
    const failing={
      getItem:k=>backing.getItem(k),
      setItem(k,v){if(k===PAYLOAD)throw Error('QuotaExceededError: payload write denied');backing.setItem(k,v)},
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(failing,sample(),random),/nu a putut salva/);
    assert.match(backing.getItem(KEY),/^[0-9a-f]{64}$/);
    assert.equal(backing.getItem(PAYLOAD),null);
    assert.throws(()=>vault.loadWebVault(backing),/Cheia locală există, dar datele criptate lipsesc/);
    const before=clone(backing.data),writes=backing.writes;
    assert.throws(()=>vault.saveWebVault(backing,sample(),random),/Salvarea este blocată/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });

  // Synthetic acknowledgement ambiguity: an adapter can mutate backing storage
  // and then report an error. This is fault injection, not an observed browser incident.
  await test('KNOWN UNSAFE: first key write commits then throws and strands an orphan key',()=>{
    const backing=storage();
    const ambiguous={
      getItem:k=>backing.getItem(k),
      setItem(k,v){
        backing.setItem(k,v);
        if(k===KEY)throw Error('Injected key write acknowledged as failure after commit');
      },
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(ambiguous,sample(),random),/nu a putut salva/);
    assert.equal(backing.writes,1,'Payload write must never have started');
    assert.match(backing.getItem(KEY),/^[0-9a-f]{64}$/);
    assert.equal(backing.getItem(PAYLOAD),null);
    const before=clone(backing.data),writes=backing.writes;
    assert.throws(()=>vault.loadWebVault(backing),/Cheia locală există, dar datele criptate lipsesc/);
    assert.throws(()=>vault.saveWebVault(backing,sample(),random),/Salvarea este blocată/);
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });
  await test('First payload write commits then throws: error is ambiguous but encrypted ledger is readable',()=>{
    const backing=storage();
    const ambiguous={
      getItem:k=>backing.getItem(k),
      setItem(k,v){
        backing.setItem(k,v);
        if(k===PAYLOAD)throw Error('Injected payload write acknowledged as failure after commit');
      },
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(ambiguous,sample(),random),/nu a putut salva/);
    assert.equal(backing.writes,2,'Both encrypted entries were committed');
    assert.match(backing.getItem(KEY),/^[0-9a-f]{64}$/);
    assert.ok(backing.getItem(PAYLOAD));
    assert.ok(!backing.getItem(PAYLOAD).includes('synthetic-checking'),'No plaintext leak');
    const before=clone(backing.data),writes=backing.writes;
    assert.deepEqual(clone(vault.loadWebVault(backing)),sample());
    assert.deepEqual(backing.data,before);assert.equal(backing.writes,writes);
  });

  await test('First vault key-write denial leaves no partial vault; later retry succeeds',()=>{
    const backing=storage();
    let deny=true;
    const flaky={
      getItem:k=>backing.getItem(k),
      setItem(k,v){if(deny&&k===KEY)throw Error('SecurityError: key write denied');backing.setItem(k,v)},
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(flaky,sample(),random),/nu a putut salva/);
    assert.equal(backing.getItem(KEY),null);
    assert.equal(backing.getItem(PAYLOAD),null);
    assert.equal(backing.writes,0);
    deny=false;
    vault.saveWebVault(flaky,sample(),random);
    assert.deepEqual(clone(vault.loadWebVault(backing)),sample());
    assert.equal(backing.writes,2);
  });
  await test('Payload-only storage footprint blocks load and save without mutation',()=>{
    const backing=storage();
    vault.saveWebVault(backing,sample(),random);
    const payload=backing.getItem(PAYLOAD);
    const broken=storage({[PAYLOAD]:payload});
    const before=clone(broken.data),writes=broken.writes;
    assert.throws(()=>vault.loadWebVault(broken),/cheia lor lipsește/i);
    assert.throws(()=>vault.saveWebVault(broken,sample(),random),/Nu suprascriem automat/i);
    assert.deepEqual(broken.data,before);
    assert.equal(broken.writes,writes);
  });
  await test('Orphan key from first-save failure blocks stale second tab without writes',async()=>{
    const backing=storage(),locks=serialLocks();
    const a=realTab(backing,{locks}),b=realTab(backing,{locks});
    const aState=clone(await a.load()),bState=clone(await b.load());
    let failPayload=true;
    const flaky={
      getItem:k=>backing.getItem(k),
      setItem(k,v){if(failPayload&&k===PAYLOAD)throw Error('QuotaExceededError');backing.setItem(k,v)},
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(flaky,aState,random),/nu a putut salva/);
    failPayload=false;
    const before=clone(backing.data),writes=backing.writes;
    await assert.rejects(b.save(bState),/altă filă|Reîncarcă/i);
    assert.deepEqual(backing.data,before);
    assert.equal(backing.writes,writes);
    await assert.rejects(realTab(backing,{locks}).load(),/Cheia locală există, dar datele criptate lipsesc/);
  });

  await test('Blocked vault landing retains visible non-destructive guidance and retry',()=>{
    assert.ok(source.includes('O?"Datele locale nu pot fi deschise"'), 'Blocked state needs an explicit heading');
    assert.ok(source.includes('Nu șterge datele site-ului și nu reseta aplicația.'), 'No destructive recovery advice');
    assert.ok(source.includes('reîncercarea deschiderii nu le poate recrea.'), 'Retry cannot recreate missing ciphertext');
    assert.ok(source.includes('Acest ecran nu poate restaura un backup.'), 'No misleading backup-restore promise');
    assert.ok(source.includes('O?"Reîncearcă deschiderea"'), 'Retry should only reload vault');
    assert.ok(source.includes('e&&!R.canRetryFirstSave()&&(0,k.jsx)(h.Button,{label:"\\xcenchide mesajul"'), 'Pending first-save retry must not be dismissed; blocked landing remains protected');
  });
  await test('Orphan key has ambiguous provenance; attempted backup-state save remains fail-closed',()=>{
    const first=storage(),flaky={
      getItem:k=>first.getItem(k),setItem(k,v){if(k===PAYLOAD)throw Error('QuotaExceededError');first.setItem(k,v)},
      removeItem:k=>first.removeItem(k),key:i=>first.key(i),get length(){return first.length}
    };
    assert.throws(()=>vault.saveWebVault(flaky,sample(),random),/nu a putut salva/);
    const orphanKey=first.getItem(KEY);
    const missingCiphertext=storage({[KEY]:orphanKey}); // indistinguishable from externally lost payload
    for(const store of [first,missingCiphertext]){
      const before=clone(store.data),writes=store.writes;
      assert.throws(()=>vault.loadWebVault(store),/Cheia locală există, dar datele criptate lipsesc/);
      assert.throws(()=>vault.saveWebVault(store,sample(),random),/Salvarea este blocată/);
      assert.deepEqual(store.data,before);assert.equal(store.writes,writes);
    }
    assert.deepEqual(first.data,missingCiphertext.data);
  });
  await test('A separate clean synthetic storage can accept validated state without touching blocked KEY-only storage',async()=>{
    const orphan=storage({[KEY]:Buffer.from(random(32)).toString('hex')});
    const orphanBefore=clone(orphan.data),orphanWrites=orphan.writes;
    assert.throws(()=>vault.loadWebVault(orphan),/Cheia locală există, dar datele criptate lipsesc/);
    // This represents a state already decrypted and validated from a separately
    // held backup; it does NOT exercise password decryption or browser-profile UI.
    const independentlyValidated=clone(sample());
    model.validateState(independentlyValidated);
    const clean=storage(),locks=serialLocks();
    const app=realTab(clean,{locks});
    assert.deepEqual(clone(await app.load()),empty());
    await app.save(independentlyValidated);
    assert.deepEqual(clone(await realTab(clean,{locks}).load()),independentlyValidated);
    assert.deepEqual(orphan.data,orphanBefore);
    assert.equal(orphan.writes,orphanWrites);
    assert.throws(()=>vault.loadWebVault(orphan),/Cheia locală există, dar datele criptate lipsesc/);
  });
  await test('Real password-encrypted backup restores into independent clean storage; blocked original remains byte-identical',async()=>{
    const original=storage({[KEY]:Buffer.from(random(32)).toString('hex')});
    const originalBefore=clone(original.data),originalWrites=original.writes;
    assert.throws(()=>vault.loadWebVault(original),/Cheia locală există, dar datele criptate lipsesc/);
    const password='Synthetic-Backup-2026!';
    const synthetic=sample();
    const backupText=await crypt.backup(synthetic,password,random);
    const envelope=JSON.parse(backupText);
    assert.equal(envelope.format,'FinancialAutonomy');
    assert.equal(envelope.version,1);
    assert.equal(envelope.iterations,600000);
    assert.ok(!backupText.includes('synthetic-checking'));
    await assert.rejects(crypt.restore(backupText,'Incorrect-Password-2026'),/Parolă greșită|backup deteriorat/);
    const tampered={...envelope,data:(envelope.data[0]==='0'?'1':'0')+envelope.data.slice(1)};
    await assert.rejects(crypt.restore(JSON.stringify(tampered),password),/Parolă greșită|backup deteriorat/);
    assert.deepEqual(original.data,originalBefore);
    assert.equal(original.writes,originalWrites);
    const restored=clone(await crypt.restore(backupText,password));
    assert.deepEqual(restored,synthetic);
    const clean=storage(),locks=serialLocks();
    const first=realTab(clean,{locks});
    assert.deepEqual(clone(await first.load()),empty());
    await first.save(restored);
    assert.deepEqual(clone(await realTab(clean,{locks}).load()),synthetic);
    assert.deepEqual(original.data,originalBefore);
    assert.equal(original.writes,originalWrites);
    assert.throws(()=>vault.loadWebVault(original),/Cheia locală există, dar datele criptate lipsesc/);
  });
  await test('F03 adversarial payload write-then-throw preserves authenticated first-save ciphertext',()=>{
    // Deliberately NONCONFORMING Storage shim: native setItem failure is atomic.
    // This checks that a caught error never justifies deleting the new key.
    const backing=storage();
    const nonconforming={
      getItem:k=>backing.getItem(k),
      setItem(k,v){
        backing.setItem(k,v);
        if(k===PAYLOAD)throw Error('Injected nonconforming write-then-throw');
      },
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const state=sample();
    assert.throws(()=>vault.saveWebVault(nonconforming,state,random),/nu a putut salva/);
    assert.equal(backing.writes,2);
    assert.match(backing.getItem(KEY),/^[0-9a-f]{64}$/);
    assert.ok(backing.getItem(PAYLOAD));
    const before=clone(backing.data),writes=backing.writes;
    assert.deepEqual(clone(vault.loadWebVault(backing)),state);
    assert.deepEqual(backing.data,before);
    assert.equal(backing.writes,writes);
  });
  await test('F06 unreadable reset marker plus KEY-only first-save failure stays quarantined',async()=>{
    const backing=storage();
    const firstWrite={
      getItem:k=>backing.getItem(k),
      setItem(k,v){
        if(k===PAYLOAD)throw Error('QuotaExceededError: injected payload denial');
        backing.setItem(k,v);
      },
      removeItem:k=>backing.removeItem(k),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    assert.throws(()=>vault.saveWebVault(firstWrite,sample(),random),/nu a putut salva/);
    assert.ok(backing.getItem(KEY));
    assert.equal(backing.getItem(PAYLOAD),null);
    let denyMarker=true;
    const gated={
      getItem(k){
        if(denyMarker&&k===RESET)throw Error('SecurityError: reset marker read denied');
        return backing.getItem(k);
      },
      setItem:(...args)=>backing.setItem(...args),
      removeItem:(...args)=>backing.removeItem(...args),
      key:i=>backing.key(i),get length(){return backing.length}
    };
    const before=clone(backing.data),writes=backing.writes;
    await assert.rejects(realTab(gated,{locks:serialLocks()}).load(),/SecurityError/);
    assert.throws(()=>vault.loadWebVault(gated),/SecurityError/);
    assert.deepEqual(backing.data,before);
    assert.equal(backing.writes,writes);
    denyMarker=false;
    await assert.rejects(realTab(gated,{locks:serialLocks()}).load(),/Cheia locală există, dar datele criptate lipsesc/);
    assert.deepEqual(backing.data,before);
    assert.equal(backing.writes,writes);
  });
  await test('FIXED: durable reset epoch rejects empty-vault ABA stale save without writes',async()=>{
    const backing=storage(),locks=serialLocks();
    const stale=realTab(backing,{locks}),actor=realTab(backing,{locks});
    const staleEmpty=clone(await stale.load());
    await actor.load();
    await actor.save(sample());
    assert.ok(backing.getItem(KEY)&&backing.getItem(PAYLOAD));
    await actor.resetData();
    assert.equal(backing.getItem(KEY),null);
    assert.equal(backing.getItem(PAYLOAD),null);
    assert.match(backing.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
    const before=clone(backing.data),writes=backing.writes;
    staleEmpty.transactions.push({id:'stale-after-reset-aba',kind:'income',amount:777});
    await assert.rejects(stale.save(staleEmpty),/altă filă|Reîncarcă/i);
    assert.equal(backing.writes,writes);
    assert.deepEqual(backing.data,before);
    const fresh=realTab(backing,{locks}),loaded=clone(await fresh.load());
    loaded.transactions.push({id:'post-reset-valid',kind:'income',amount:123});
    await fresh.save(loaded);
    assert.ok(vault.loadWebVault(backing).transactions.some(t=>t.id==='post-reset-valid'));
  });
  console.log(passed+'/46 bundled AES-GCM and cross-tab synthetic regression tests passed ('+path+')');
  if(passed!==46)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
