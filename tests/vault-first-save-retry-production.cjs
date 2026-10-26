'use strict';
// WEB 18.51 production first-save retry: real bundled AES-GCM, synthetic data only.
// This test exercises the active immutable modules 309/310/311, not the research prototype.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const path=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path,'Active versioned bundle is required');
const source=fs.readFileSync(path,'utf8');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const empty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model={
  emptyState:empty,
  validateState(s){assert.equal(s.version,4);for(const k of ['accounts','transactions','balanceChecks'])assert.ok(Array.isArray(s[k]));return s;},
  migrate(s){model.validateState(s);return s},
  saveTransaction:(s,row)=>({...s,transactions:[...s.transactions,row]})
};
const synthetic=()=>({version:4,accounts:[{id:'synthetic-only',name:'Test',opening:10000}],transactions:[{id:'expense-1',amount:1250,kind:'expense',accountId:'synthetic-only',date:'2026-10-26'}],balanceChecks:[]});
const sandbox={Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,Buffer,setTimeout,clearTimeout,console,globalThis:{crypto:crypto.webcrypto}};
function factory(id,context=sandbox){
  const rx=new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
  const hits=[...source.matchAll(rx)];
  assert.equal(hits.length,1,'Expected one Metro module '+id);
  const hit=hits[0],start=source.lastIndexOf('__d(function(',hit.index);
  assert.ok(start>=0);
  return {fn:vm.runInNewContext('('+source.slice(start+4,hit.index+1)+')',context),deps:hit[1]?hit[1].split(',').map(Number):[]};
}
const cache=new Map([[205,model]]);
function load(id){
  if(cache.has(id))return cache.get(id);
  const {fn,deps}=factory(id),module={exports:{}};
  cache.set(id,module.exports);
  fn(sandbox.globalThis,load,()=>{},null,module,module.exports,deps);
  cache.set(id,module.exports);return module.exports;
}
const vault=load(310);
function memoryStorage(){
  const data={};let writes=0,fail=null;
  return {
    getItem(k){if(fail?.kind==='read'&&fail.key===k)throw Error('SecurityError');return Object.hasOwn(data,k)?data[k]:null},
    setItem(k,v){
      if(fail?.key===k&&fail.kind!=='read'&&fail.times>0){
        fail.times--;
        if(fail.kind==='after'){data[k]=String(v);writes++}
        throw Error('QuotaExceededError synthetic');
      }
      data[k]=String(v);writes++;
    },
    removeItem(k){delete data[k];writes++},
    get length(){return Object.keys(data).length},
    key(i){return Object.keys(data)[i]??null},
    get writes(){return writes},
    get data(){return data},
    fault(kind,key,times=1){fail={kind,key,times}},
    clearFault(){fail=null}
  };
}
function locks(){
  let tail=Promise.resolve();
  return {request(name,options,fn){
    assert.equal(name,'financial-autonomy.preview.vault.v1');
    assert.equal(options.mode,'exclusive');
    const next=tail.then(fn);tail=next.catch(()=>{});return next;
  }};
}
function tab(storage,lock=locks(),timers=null){
  const handlers=new Map();
  const documentHandlers=new Map();
  const document={visibilityState:'visible',addEventListener(name,fn){const list=documentHandlers.get(name)||[];list.push(fn);documentHandlers.set(name,list)}};
  const globalThis={
    document,localStorage:storage,navigator:{locks:lock},location:{href:'https://example.test/?fa_real=1'},
    history:{state:null,replaceState(){}},
    crypto:{getRandomValues:bytes=>crypto.webcrypto.getRandomValues(bytes),randomUUID:()=>crypto.randomUUID()},
    addEventListener(name,fn){const list=handlers.get(name)||[];list.push(fn);handlers.set(name,list)}
  };
  const {fn,deps}=factory(309,{...sandbox,globalThis,URL,Blob,setTimeout:timers?.setTimeout||setTimeout,clearTimeout:timers?.clearTimeout||clearTimeout});
  const api={};fn(globalThis,id=>id===205?model:vault,()=>{},null,{exports:api},api,deps);
  return {api,emit(name,event={}){for(const fn of handlers.get(name)||[])fn(event)},emitDocument(name,state){document.visibilityState=state;for(const fn of documentHandlers.get(name)||[])fn({type:name,bubbles:false})}};
}
let count=0;
async function test(name,fn){try{await fn();count++;console.log('PASS',name)}catch(err){console.error('FAIL',name,err.stack||err);process.exitCode=1}}
(async()=>{
  await test('First PAYLOAD failure offers bounded explicit retry and authenticates exact ciphertext',async()=>{
    const s=memoryStorage(),t=tab(s);assert.deepEqual(clone(await t.api.load()),empty());
    s.fault('before',PAYLOAD);
    await assert.rejects(t.api.save(synthetic()),/Prima salvare criptată/);
    assert.equal(s.getItem(PAYLOAD),null);assert.ok(s.getItem(KEY));
    assert.equal(t.api.canRetryFirstSave(),true);
    s.clearFault();
    const recovered=await t.api.retryFirstSave();
    assert.deepEqual(clone(recovered),synthetic());
    assert.deepEqual(clone(await t.api.load()),synthetic());
    assert.equal(t.api.canRetryFirstSave(),false);
    await assert.rejects(t.api.retryFirstSave(),/nu mai este disponibilă/);
  });
  await test('Write-then-throw exact ciphertext is authenticated without any second write',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('after',PAYLOAD);
    await assert.rejects(t.api.save(synthetic()),/Prima salvare criptată/);
    const before=s.writes,key=s.getItem(KEY),payload=s.getItem(PAYLOAD);
    assert.ok(key&&payload);s.clearFault();
    assert.deepEqual(clone(await t.api.retryFirstSave()),synthetic());
    assert.equal(s.writes,before);
    assert.equal(s.getItem(KEY),key);assert.equal(s.getItem(PAYLOAD),payload);
  });
  await test('Changed reset epoch blocks retry with zero additional writes',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();s.setItem(RESET,'idle-v2:0123456789abcdef0123456789abcdef');
    const before=s.writes,snapshot=clone(s.data);
    await assert.rejects(t.api.retryFirstSave(),/altă filă|Reîncarcă/);
    assert.equal(s.writes,before);assert.deepEqual(s.data,snapshot);
  });
  await test('Changed KEY or unrelated PAYLOAD blocks retry and never overwrites',async()=>{
    for(const key of [KEY,PAYLOAD]){
      const s=memoryStorage(),t=tab(s);await t.api.load();
      s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
      s.clearFault();s.setItem(key,'unrelated-synthetic-value');
      const before=s.writes,snapshot=clone(s.data);
      await assert.rejects(t.api.retryFirstSave(),/altă filă|Reîncarcă/);
      assert.equal(s.writes,before);assert.deepEqual(s.data,snapshot);
    }
  });
  await test('Pagehide expires volatile handle and leaves orphan KEY-only untouched',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();const before=s.writes,key=s.getItem(KEY);
    t.emit('pagehide');assert.equal(t.api.canRetryFirstSave(),false);
    await assert.rejects(t.api.retryFirstSave(),/nu mai este disponibilă/);
    assert.equal(s.writes,before);assert.equal(s.getItem(KEY),key);assert.equal(s.getItem(PAYLOAD),null);
  });
  await test('Document visibilitychange (non-bubbling) invalidates retry when tab is hidden',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();const before=s.writes,key=s.getItem(KEY);
    assert.equal(t.api.canRetryFirstSave(),true);
    // Real browsers dispatch visibilitychange on document; it does not bubble to window.
    t.emitDocument('visibilitychange','hidden');
    assert.equal(t.api.canRetryFirstSave(),false,'Hidden document must revoke volatile retry authority');
    await assert.rejects(t.api.retryFirstSave(),/nu mai este disponibilă/);
    assert.equal(s.writes,before);assert.equal(s.getItem(KEY),key);assert.equal(s.getItem(PAYLOAD),null);
  });
  await test('Cross-tab vault storage events revoke volatile retry without any writes',async()=>{
    // Storage events arrive in other tabs, not the tab performing the write.
    // Any vault authority change (or clear) must revoke the captured first-save envelope.
    for(const key of [KEY,PAYLOAD,RESET,null]){
      const s=memoryStorage(),t=tab(s);await t.api.load();
      s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
      s.clearFault();const before=s.writes,snapshot=clone(s.data);
      assert.equal(t.api.canRetryFirstSave(),true);
      t.emit('storage',{key});
      assert.equal(t.api.canRetryFirstSave(),false,'Vault storage event must revoke retry for '+String(key));
      await assert.rejects(t.api.retryFirstSave(),/nu mai este disponibilă/);
      assert.equal(s.writes,before,'No writes after storage event for '+String(key));
      assert.deepEqual(s.data,snapshot,'No vault mutation after storage event for '+String(key));
    }
  });
  await test('Unrelated cross-tab storage event does not revoke a valid first-save retry',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();
    t.emit('storage',{key:'unrelated.synthetic.preference'});
    assert.equal(t.api.canRetryFirstSave(),true,'Unrelated storage must not revoke the live handle');
    assert.deepEqual(clone(await t.api.retryFirstSave()),synthetic());
    assert.deepEqual(clone(await t.api.load()),synthetic());
    assert.equal(t.api.canRetryFirstSave(),false,'Successful retry consumes the handle');
  });
  await test('Queued lock + pagehide expires handle before callback without writes',async()=>{
    const s=memoryStorage();
    let release;const gate=new Promise(resolve=>{release=resolve});
    let requests=0;
    const queued={request(name,opts,fn){requests++;return requests===1?Promise.resolve().then(fn):gate.then(fn)}};
    const t=tab(s,queued);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();const before=s.writes;
    const pending=t.api.retryFirstSave();t.emit('pagehide');release();
    await assert.rejects(pending,/expirat|părăsită/);
    assert.equal(s.writes,before);assert.equal(s.getItem(PAYLOAD),null);
  });
  await test('Storage read denied on failed first save prevents speculative retry',async()=>{
    const s=memoryStorage(),t=tab(s);await t.api.load();
    s.fault('before',PAYLOAD);await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.fault('read',RESET);const before=s.writes;
    await assert.rejects(t.api.retryFirstSave(),/SecurityError/);
    assert.equal(s.writes,before);
  });
  await test('120-second expiry timer revokes retained AES key/ciphertext handle without touching local vault',async()=>{
    const callbacks=new Map(),cancelled=new Set();
    let nextId=0;
    const timers={
      setTimeout(fn,delay){assert.equal(delay,120000);const id=++nextId;callbacks.set(id,fn);return id;},
      clearTimeout(id){cancelled.add(id);}
    };
    const s=memoryStorage(),t=tab(s,locks(),timers);
    await t.api.load();
    s.fault('before',PAYLOAD);
    await assert.rejects(t.api.save(synthetic()),/Prima salvare/);
    s.clearFault();
    assert.equal(callbacks.size,1,'Expiry must be scheduled when a key-bearing retry token is created');
    assert.equal(t.api.canRetryFirstSave(),true);
    const before=s.writes,snapshot=clone(s.data);
    callbacks.get(1)();
    assert.equal(t.api.canRetryFirstSave(),false,'Timer must revoke the live handle without user interaction');
    assert.ok(cancelled.has(1),'Revocation must clear its scheduled timeout');
    await assert.rejects(t.api.retryFirstSave(),/nu mai este disponibilă/);
    assert.equal(s.writes,before);
    assert.deepEqual(s.data,snapshot,'Expiry must never alter KEY/PAYLOAD/RESET');
  });
  await test('KEY-only reload cannot distinguish failed first save from deleted authenticated ciphertext',async()=>{
    const s=memoryStorage(),live=tab(s);await live.api.load();
    s.fault('before',PAYLOAD);
    await assert.rejects(live.api.save(synthetic()),/Prima salvare/);
    s.clearFault();
    const orphanSnapshot=clone(s.data);
    assert.ok(orphanSnapshot[KEY]&& !Object.hasOwn(orphanSnapshot,PAYLOAD));
    const afterFailure=tab(s),beforeFailure=s.writes;
    assert.equal(afterFailure.api.canRetryFirstSave(),false);
    await assert.rejects(afterFailure.api.load());
    await assert.rejects(afterFailure.api.save(synthetic()));
    await assert.rejects(afterFailure.api.retryFirstSave(),/nu mai este disponibilă/);
    assert.equal(s.writes,beforeFailure,'Failed first-save reload must not write');
    assert.deepEqual(s.data,orphanSnapshot);

    // The original live tab still has the only bounded authority to commit.
    assert.deepEqual(clone(await live.api.retryFirstSave()),synthetic());
    assert.ok(s.getItem(PAYLOAD),'A complete authenticated ciphertext was committed');
    assert.deepEqual(clone(await tab(s).api.load()),synthetic());
    // External deletion after a real successful save yields IDENTICAL observable
    // KEY/RESET/PAYLOAD values to the interrupted first-save history above.
    s.removeItem(PAYLOAD);
    assert.deepEqual(s.data,orphanSnapshot,'The two histories must be observationally identical');
    const afterLoss=tab(s),beforeLoss=s.writes;
    assert.equal(afterLoss.api.canRetryFirstSave(),false);
    await assert.rejects(afterLoss.api.load());
    await assert.rejects(afterLoss.api.save(synthetic()));
    await assert.rejects(afterLoss.api.retryFirstSave(),/nu mai este disponibilă/);
    assert.equal(s.writes,beforeLoss,'Externally missing ciphertext must not be overwritten');
    assert.deepEqual(s.data,orphanSnapshot,'Original key and reset epoch remain byte-identical');
  });
  console.log(count+'/12 WEB bounded first-save synthetic integration tests passed');
  if(count!==12)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
