'use strict';
// Product-candidate integration: actual active WEB modules and cached immutable WEB 18.49.
// Synthetic financial state only; Node VM/Web Locks simulation, not Safari/browser proof.
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(active&&active.startsWith('_expo/static/js/web/index-v0'),'Expected an active immutable WEB bundle with durable reset epoch');
const current=fs.readFileSync(active,'utf8');
const legacy=fs.readFileSync('_expo/static/js/web/index-v01849-responsive-nav-wrap-r3-20261026.js','utf8');
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1',RESET='financial-autonomy.preview.reset.v1';
const clone=v=>JSON.parse(JSON.stringify(v));
const empty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model={
  emptyState:empty,
  migrate(v){model.validateState(v);return v;},
  validateState(v){assert.equal(v?.version,4);for(const k of ['accounts','transactions','balanceChecks'])assert.ok(Array.isArray(v[k]))},
  saveTransaction:(s,t)=>({...s,transactions:[...s.transactions,t]})
};
const context={Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,TextDecoder,TextEncoder,Buffer,console,setTimeout,clearTimeout,URL,Blob,globalThis:{crypto:crypto.webcrypto}};
function factory(bundle,id,ctx=context){
  const re=new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
  const matches=[...bundle.matchAll(re)];
  assert.equal(matches.length,1,'Metro module '+id+' unique');
  const at=matches[0].index,start=bundle.lastIndexOf('__d(function(',at);
  assert.ok(start>=0);
  return {fn:vm.runInNewContext('('+bundle.slice(start+4,at+1)+')',ctx),deps:matches[0][1].split(',').filter(Boolean).map(Number)};
}
function loadVault(bundle){
  const cache=new Map([[205,model]]);
  function get(id){
    if(cache.has(id))return cache.get(id);
    const {fn,deps}=factory(bundle,id),mod={exports:{}};
    cache.set(id,mod.exports);
    fn(context.globalThis,get,()=>{},null,mod,mod.exports,deps);
    cache.set(id,mod.exports);return mod.exports;
  }
  return get(310);
}
const newVault=loadVault(current),oldVault=loadVault(legacy);
const random=n=>new Uint8Array(crypto.randomBytes(n));
function store(initial={}){
  const data={...initial},fault={read:null,write:null,remove:null},events=[];
  return {data,fault,events,get writes(){return events.length;},
    getItem(k){if(fault.read?.(k))throw Error('SecurityError: read '+k);return Object.hasOwn(data,k)?data[k]:null},
    setItem(k,v){if(fault.write?.(k,String(v)))throw Error('QuotaExceededError: write '+k);data[k]=String(v);events.push(['set',k])},
    removeItem(k){if(fault.remove?.(k))throw Error('SecurityError: remove '+k);delete data[k];events.push(['remove',k])},
    get length(){return Object.keys(data).length},key(i){return Object.keys(data)[i]??null}
  };
}
function locks(){
  let tail=Promise.resolve();
  return {request(name,options,fn){
    assert.equal(name,'financial-autonomy.preview.vault.v1');assert.equal(options.mode,'exclusive');
    const next=tail.then(fn);tail=next.catch(()=>{});return next;
  }};
}
function tab(bundle,vault,s,lock,url='https://example.test/?fa_real=1'){
  const root={localStorage:s,navigator:{locks:lock},location:{href:url},
    history:{state:null,replaceState(){}},
    crypto:{getRandomValues:a=>crypto.webcrypto.getRandomValues(a),randomUUID:()=>crypto.randomUUID()}};
  const {fn,deps}=factory(bundle,309,{...context,globalThis:root}),mod={exports:{}};
  fn(root,id=>id===205?model:vault,()=>{},null,mod,mod.exports,deps);
  return mod.exports;
}
const newTab=(s,l,url)=>tab(current,newVault,s,l,url),oldTab=(s,l,url)=>tab(legacy,oldVault,s,l,url);
const isIdle=s=>assert.match(s.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
const isPending=s=>assert.match(s.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
test('New reset retains non-sensitive durable epoch; new tab can save AES-GCM vault',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);
  await a.load();await a.save(empty());await a.resetData();isIdle(s);
  assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
  const b=newTab(s,l),state=clone(await b.load());
  state.transactions.push({id:'new-safe',kind:'income',amount:123});
  await b.save(state);isIdle(s);
  assert.deepEqual(clone(newVault.loadWebVault(s)),state);
});
test('Already-open legacy WEB 18.49 empty tab cannot resurrect after create-reset ABA',async()=>{
  const s=store(),l=locks(),old=oldTab(s,l),newer=newTab(s,l);
  const stale=clone(await old.load());await newer.load();await newer.save(empty());await newer.resetData();
  isIdle(s);const before=clone(s.data),writes=s.writes;
  stale.transactions.push({id:'unsafe',kind:'income',amount:999});
  await assert.rejects(old.save(stale),/Resetarea locală|Reîncarcă/i);
  await assert.rejects(old.resetData(),/Resetarea locală|Reîncarcă/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Already-open legacy populated tab and fresh legacy load both fail closed',async()=>{
  const s=store(),l=locks();oldVault.saveWebVault(s,empty(),random);
  const old=oldTab(s,l);await old.load();
  const newer=newTab(s,l);await newer.load();await newer.resetData();isIdle(s);
  const before=clone(s.data),writes=s.writes;
  await assert.rejects(old.save(empty()),/Resetarea locală|Reîncarcă/i);
  await assert.rejects(oldTab(s,l).load(),/Marcaj de resetare necunoscut/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Denied initial reset marker write preserves ciphertext byte-for-byte',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);
  await a.load();await a.save(empty());const before=clone(s.data),writes=s.writes;
  s.fault.write=k=>k===RESET;
  await assert.rejects(a.resetData(),/QuotaExceededError/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Interrupted first deletion remains pending and can finish on reload',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);
  await a.load();await a.save(empty());const prior=clone(s.data);
  s.fault.remove=k=>k===PAYLOAD;
  await assert.rejects(a.resetData(),/Resetarea a fost întreruptă/);isPending(s);
  assert.equal(s.getItem(PAYLOAD),prior[PAYLOAD]);
  s.fault.remove=null;assert.deepEqual(clone(await newTab(s,l).load()),empty());isIdle(s);
  assert.equal(s.getItem(PAYLOAD),null);assert.equal(s.getItem(KEY),null);
});
test('Interrupted final idle marker write keeps pending intent and never restores ciphertext',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);await a.load();await a.save(empty());
  s.fault.write=(k,v)=>k===RESET&&v.startsWith('idle-v2:');
  await assert.rejects(a.resetData(),/Resetarea a fost întreruptă/);isPending(s);
  assert.equal(s.getItem(PAYLOAD),null);assert.equal(s.getItem(KEY),null);
  s.fault.write=null;await newTab(s,l).load();isIdle(s);
});
test('Legacy committed-v1 reset journal upgrades to permanent v2 tombstone',async()=>{
  const s=store(),l=locks();oldVault.saveWebVault(s,empty(),random);
  s.setItem(RESET,'committed-v1');
  assert.deepEqual(clone(await newTab(s,l).load()),empty());isIdle(s);
  assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
});
test('Unknown marker and denied marker read block new load/save without any writes',async()=>{
  for(const marker of ['unrecognized','idle-v2:bad','pending-v2:bad']){
    const s=store({[RESET]:marker}),l=locks(),before=clone(s.data);
    await assert.rejects(newTab(s,l).load(),/Marcaj de resetare necunoscut/i);
    assert.deepEqual(s.data,before);assert.equal(s.writes,0);
  }
  const s=store(),l=locks(),a=newTab(s,l);await a.load();
  const before=clone(s.data),writes=s.writes;s.fault.read=k=>k===RESET;
  await assert.rejects(a.save(empty()),/SecurityError/);
  await assert.rejects(a.resetData(),/SecurityError/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Repeated resets rotate generation, and stale pre-reset tab cannot save',async()=>{
  const s=store(),l=locks(),a=newTab(s,l),stale=newTab(s,l);
  await a.load();await stale.load();await a.resetData();
  const first=s.getItem(RESET);await a.resetData();const second=s.getItem(RESET);
  assert.notEqual(first,second);isIdle(s);
  const before=clone(s.data),writes=s.writes;
  await assert.rejects(stale.save(empty()),/altă filă|Reîncarcă/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Post-reset marker prevents implicit fresh-browser demo eligibility',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);
  await a.load();await a.resetData();isIdle(s);
  const b=newTab(s,l,'https://example.test/');
  assert.equal(b.isDemo(),false);
  assert.deepEqual(clone(await b.load()),empty());
  assert.equal(b.isDemo(),false);
});
test('First-save orphan key is still preserved and blocked; issue #35 remains open',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);await a.load();
  s.fault.write=k=>k===PAYLOAD;
  await assert.rejects(a.save(empty()),/Prima salvare criptată/);
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);
  assert.equal(s.getItem(PAYLOAD),null);
  const before=clone(s.data),writes=s.writes;s.fault.write=null;
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});


/* #35: NEW v18.50 reset epoch + first-write fault boundaries.
 * These are actual bundled WEB modules with synthetic state and injected
 * Storage faults. They characterize fail-closed behavior, NOT recovery.
 * A Storage write-then-throw shim below is intentionally nonconforming:
 * native Storage normally either completes setItem or throws without writing.
 */
test('P1 #35: first PAYLOAD failure after idle-v2 reset preserves epoch and blocks cached 18.49',async()=>{
  const s=store(),l=locks(),resetter=newTab(s,l);
  await resetter.load();await resetter.resetData();isIdle(s);
  const marker=s.getItem(RESET),stale=newTab(s,l),cached=oldTab(s,l);
  await stale.load();
  s.fault.write=k=>k===PAYLOAD;
  await assert.rejects(stale.save(empty()),/Prima salvare criptată/);
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);
  assert.equal(s.getItem(PAYLOAD),null);
  assert.equal(s.getItem(RESET),marker);
  const snapshot=clone(s.data),writes=s.writes;
  s.fault.write=null;
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/);
  await assert.rejects(cached.load(),/Marcaj de resetare necunoscut/);
  await assert.rejects(stale.save(empty()),/altă filă|Reîncarcă/);
  await assert.rejects(stale.resetData(),/altă filă|Reîncarcă/);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
});
test('P1 #35: synthetic KEY write-then-throw remains ambiguous, never silently reinitialized',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);await a.load();
  const original=s.setItem.bind(s);
  s.setItem=(key,value)=>{
    original(key,value);
    if(key===KEY)throw Error('Synthetic write-then-throw after KEY commit');
  };
  await assert.rejects(a.save(empty()),/Prima salvare criptată/);
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);
  assert.equal(s.getItem(PAYLOAD),null);
  const snapshot=clone(s.data),writes=s.writes;
  s.setItem=original;
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/);
  await assert.rejects(a.save(empty()),/altă filă|Reîncarcă/);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
});
test('P1 #35: synthetic PAYLOAD write-then-throw after reset keeps decryptable ciphertext',async()=>{
  const s=store(),l=locks(),resetter=newTab(s,l);
  await resetter.load();await resetter.resetData();isIdle(s);
  const a=newTab(s,l),pending=clone(await a.load());
  pending.transactions.push({id:'synthetic-committed-after-throw',kind:'income',amount:700});
  const original=s.setItem.bind(s);
  s.setItem=(key,value)=>{
    original(key,value);
    if(key===PAYLOAD)throw Error('Synthetic write-then-throw after PAYLOAD commit');
  };
  await assert.rejects(a.save(pending),/Prima salvare criptată/);
  isIdle(s);
  assert.deepEqual(clone(newVault.loadWebVault(s)),pending);
  const snapshot=clone(s.data),writes=s.writes;
  s.setItem=original;
  await assert.rejects(a.save(pending),/altă filă|Reîncarcă/);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
  assert.deepEqual(clone(await newTab(s,l).load()),pending);
});
test('P1 #35: denied RESET read on post-reset first save rejects before any write',async()=>{
  const s=store(),l=locks(),a=newTab(s,l);
  await a.load();await a.resetData();isIdle(s);
  const b=newTab(s,l);await b.load();
  const snapshot=clone(s.data),writes=s.writes;
  s.fault.read=k=>k===RESET;
  await assert.rejects(b.save(empty()),/SecurityError/);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
});


/*
 * RESEARCH ONLY (#35): same-live-session first-write retry with the ACTUAL
 * WEB 18.50 module 309/310/311 encryption and exclusive lock path.
 *
 * This is a test-only proof-of-concept, NOT a production recovery function.
 * A pending ciphertext handle exists only because this test intercepts the
 * original active-bundle PAYLOAD setItem call before its injected failure.
 * An arbitrary KEY-only vault after reload provides NO such authority.
 * Native Storage atomicity, power-loss durability and real Safari are not
 * proven. Never delete a KEY, replay a reset, or silently migrate a vault.
 */
async function makeLiveOrphanWithCapturedCiphertext(s,l){
  const a=newTab(s,l),value=empty();
  value.transactions.push({id:'synthetic-retry-only',kind:'expense',amount:17});
  await a.load();
  const original=s.setItem.bind(s);
  let ciphertext=null;
  s.setItem=(k,v)=>{
    if(k===PAYLOAD){ciphertext=String(v);throw Error('Synthetic PAYLOAD quota failure')}
    return original(k,v);
  };
  try{await assert.rejects(a.save(value),/Prima salvare criptată/i)}
  finally{s.setItem=original}
  assert.equal(typeof ciphertext,'string');
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);
  assert.equal(s.getItem(PAYLOAD),null);
  return {handle:{live:true,key:s.getItem(KEY),payload:ciphertext,epoch:s.getItem(RESET)},value};
}
function retryCapturedCiphertextUnderLock(s,l,handle){
  return l.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>{
    if(!handle||handle.live!==true||typeof handle.key!=='string'||typeof handle.payload!=='string')
      throw Error('No live in-memory proof: fail closed');
    const epoch=s.getItem(RESET),key=s.getItem(KEY),payload=s.getItem(PAYLOAD);
    if(!/^idle-v2:[0-9a-f]{32}$/.test(epoch??'')||epoch!==handle.epoch||
       key!==handle.key||(payload!==null&&payload!==handle.payload))
      throw Error('Changed vault authority: fail closed');
    // Authenticate the exact captured bytes using the REAL bundled vault
    // before allowing any write, not a synthetic encryption replacement.
    const isolated=store({[KEY]:handle.key,[PAYLOAD]:handle.payload,[RESET]:handle.epoch});
    const value=clone(newVault.loadWebVault(isolated));
    if(payload===handle.payload)return {status:'already-committed',value};
    s.setItem(PAYLOAD,handle.payload);
    if(s.getItem(RESET)!==handle.epoch||s.getItem(KEY)!==handle.key||
       s.getItem(PAYLOAD)!==handle.payload)
      throw Error('Post-retry mismatch: fail closed');
    return {status:'committed-on-retry',value};
  });
}
async function resetToIdle(s,l){
  const a=newTab(s,l);await a.load();await a.resetData();isIdle(s);
}

test('RESEARCH #35 real WEB 18.50 AES-GCM: bounded post-reset orphan retry restores exact captured ciphertext',async()=>{
  const s=store(),l=locks();await resetToIdle(s,l);
  const {handle,value}=await makeLiveOrphanWithCapturedCiphertext(s,l);
  const cached=oldTab(s,l),before=s.writes;
  await assert.rejects(cached.load(),/Marcaj de resetare necunoscut/i);
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/i);
  assert.equal(s.writes,before);
  const r=await retryCapturedCiphertextUnderLock(s,l,handle);
  assert.equal(r.status,'committed-on-retry');
  assert.deepEqual(r.value,value);
  assert.deepEqual(clone(newVault.loadWebVault(s)),value);
  assert.deepEqual(clone(await newTab(s,l).load()),value);
  await assert.rejects(cached.save(empty()),/Resetarea locală|Reîncarcă/i);
  assert.equal(s.getItem(RESET),handle.epoch);
});

test('RESEARCH #35 real WEB: changed reset epoch or key forbids retry with zero writes',async()=>{
  for(const changed of ['epoch','pending','key']){
    const s=store(),l=locks();await resetToIdle(s,l);
    const {handle}=await makeLiveOrphanWithCapturedCiphertext(s,l);
    if(changed==='epoch')s.setItem(RESET,'idle-v2:'+'b'.repeat(32));
    if(changed==='pending')s.setItem(RESET,'pending-v2:'+'c'.repeat(32));
    if(changed==='key')s.setItem(KEY,'f'.repeat(64));
    const snapshot=clone(s.data),writes=s.writes;
    await assert.rejects(retryCapturedCiphertextUnderLock(s,l,handle),/Changed vault authority/);
    assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
  }
});

test('RESEARCH #35 real WEB: competing ciphertext and tampered pending ciphertext never overwrite',async()=>{
  for(const changed of ['external-payload','tampered-handle']){
    const s=store(),l=locks();await resetToIdle(s,l);
    const {handle}=await makeLiveOrphanWithCapturedCiphertext(s,l);
    if(changed==='external-payload')s.setItem(PAYLOAD,'another-ciphertext');
    else handle.payload=handle.payload.slice(0,-1)+'!';
    const snapshot=clone(s.data),writes=s.writes;
    await assert.rejects(retryCapturedCiphertextUnderLock(s,l,handle));
    assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
  }
});

test('RESEARCH #35 real WEB: denied retry write retains orphan and later bounded retry succeeds',async()=>{
  const s=store(),l=locks();await resetToIdle(s,l);
  const {handle,value}=await makeLiveOrphanWithCapturedCiphertext(s,l);
  const snapshot=clone(s.data),writes=s.writes;
  s.fault.write=k=>k===PAYLOAD;
  await assert.rejects(retryCapturedCiphertextUnderLock(s,l,handle),/QuotaExceededError/);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
  s.fault.write=null;
  assert.equal((await retryCapturedCiphertextUnderLock(s,l,handle)).status,'committed-on-retry');
  assert.deepEqual(clone(newVault.loadWebVault(s)),value);
});

test('RESEARCH #35 real WEB: read denial and lost live handle fail closed, no recovery after reload',async()=>{
  const s=store(),l=locks();await resetToIdle(s,l);
  const {handle}=await makeLiveOrphanWithCapturedCiphertext(s,l);
  const snapshot=clone(s.data),writes=s.writes;
  s.fault.read=k=>k===RESET;
  await assert.rejects(retryCapturedCiphertextUnderLock(s,l,handle),/SecurityError/);
  s.fault.read=null;
  await assert.rejects(retryCapturedCiphertextUnderLock(s,l,null),/No live in-memory proof/);
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/i);
  assert.deepEqual(s.data,snapshot);assert.equal(s.writes,writes);
});

test('RESEARCH #35 expired in-memory retry handle after pagehide never writes orphan vault',async()=>{
  // Simulate a conservative pagehide/lifecycle boundary. This is a test-only
  // token, NOT a browser lifecycle listener or shipped recovery feature.
  const s=store(),l=locks();await resetToIdle(s,l);
  const {handle}=await makeLiveOrphanWithCapturedCiphertext(s,l);
  const before=clone(s.data),writes=s.writes;
  handle.live=false;handle.payload=null;
  await assert.rejects(retryCapturedCiphertextUnderLock(s,l,handle),/No live in-memory proof/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});

test('RESEARCH #35 lifecycle invalidation while Web Lock is queued rejects before any write',async()=>{
  const s=store(),l=locks();await resetToIdle(s,l);
  const {handle}=await makeLiveOrphanWithCapturedCiphertext(s,l);
  let release;
  const gate=new Promise(resolve=>{release=resolve});
  const holding=l.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>gate);
  const queued=retryCapturedCiphertextUnderLock(s,l,handle);
  // A pagehide-like event invalidates the still-live operation before it
  // acquires the lock; the guard MUST execute INSIDE the lock callback.
  handle.live=false;handle.payload=null;
  const before=clone(s.data),writes=s.writes;
  release();await holding;
  await assert.rejects(queued,/No live in-memory proof/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/i);
});
