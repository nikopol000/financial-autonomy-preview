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
assert.ok(active&&active.includes('v01850'),'Expected WEB 18.50 candidate');
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
  await assert.rejects(a.save(empty()),/nu a putut salva/);
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);
  assert.equal(s.getItem(PAYLOAD),null);
  const before=clone(s.data),writes=s.writes;s.fault.write=null;
  await assert.rejects(newTab(s,l).load(),/Cheia locală există/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
