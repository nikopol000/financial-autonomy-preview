'use strict';
// RESEARCH ONLY — executable legacy-compatibility investigation for #4/#29/#35.
// Does NOT change the active WEB vault, storage keys, backup or financial formulas.
// A hypothetical durable reset marker is exercised against the ACTUAL v18.49
// Metro modules 309/310. This is not a shippable recovery implementation.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const nodeCrypto = require('node:crypto');

// Pin the exact legacy build: the active bundle may advance, but the
// compatibility test must keep exercising already-open WEB 18.49 tabs.
const path = '_expo/static/js/web/index-v01849-responsive-nav-wrap-r3-20261026.js';
const bundle = fs.readFileSync(path,'utf8');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const PENDING = 'pending-v2:';
const IDLE = 'idle-v2:';
const copy = value => JSON.parse(JSON.stringify(value));
const ledger = () => ({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model = {
  emptyState:ledger,
  migrate(value){model.validateState(value);return value;},
  validateState(value){
    assert.equal(value?.version,4);
    for(const k of ['accounts','transactions','balanceChecks'])
      assert.ok(Array.isArray(value[k]),'Missing synthetic '+k);
    return value;
  },
  saveTransaction:(s,row)=>({...s,transactions:[...s.transactions,row]})
};
const baseContext = {
  Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
  TextDecoder,TextEncoder,Buffer,console,setTimeout,clearTimeout,URL,Blob,
  globalThis:{crypto:nodeCrypto.webcrypto}
};
function factory(id,context=baseContext){
  const marker='},'+id+',[';
  const at=bundle.indexOf(marker);
  assert.ok(at>=0,'Missing Metro module '+id);
  assert.equal(bundle.indexOf(marker,at+1),-1,'Duplicate Metro module '+id);
  const start=bundle.lastIndexOf('__d(function(',at);
  assert.ok(start>=0,'Missing Metro factory '+id);
  const end=bundle.indexOf(']);',at);
  assert.ok(end>at,'Missing Metro dependency terminator '+id);
  const fn=vm.runInNewContext('('+bundle.slice(start+4,at+1)+')',context);
  const deps=bundle.slice(at+marker.length,end);
  return {fn,deps:deps?deps.split(',').map(Number):[]};
}
const modules=new Map([[205,model],[204,{validateState:model.validateState}]]);
function bundled(id){
  if(modules.has(id))return modules.get(id);
  const {fn,deps}=factory(id);
  const mod={exports:{}};
  modules.set(id,mod.exports);
  fn(baseContext.globalThis,bundled,()=>{},null,mod,mod.exports,deps);
  modules.set(id,mod.exports);
  return mod.exports;
}
const legacyVault=bundled(310);
function store(initial={}){
  const data={...initial},journal=[];
  const fault={read:null,write:null,remove:null};
  return {
    data,journal,fault,
    get writes(){return journal.length;},
    getItem(k){if(fault.read?.(k))throw Error('SecurityError: read '+k);
      return Object.hasOwn(data,k)?data[k]:null;},
    setItem(k,v){if(fault.write?.(k))throw Error('QuotaExceededError: write '+k);
      data[k]=String(v);journal.push(['set',k]);},
    removeItem(k){if(fault.remove?.(k))throw Error('SecurityError: remove '+k);
      delete data[k];journal.push(['remove',k]);},
    get length(){return Object.keys(data).length;},
    key(i){return Object.keys(data)[i]??null;}
  };
}
function serialLocks(){
  let tail=Promise.resolve();
  return {request(name,opts,fn){
    assert.equal(name,'financial-autonomy.preview.vault.v1');
    assert.equal(opts.mode,'exclusive');
    const next=tail.then(fn);
    tail=next.catch(()=>{});
    return next;
  }};
}
function legacyTab(s,locks){
  const root={
    localStorage:s,
    navigator:{locks},
    location:{href:'https://example.test/?fa_real=1'},
    history:{state:null,replaceState(){}},
    crypto:{
      getRandomValues:arr=>nodeCrypto.webcrypto.getRandomValues(arr),
      randomUUID:()=>nodeCrypto.randomUUID()
    }
  };
  const {fn,deps}=factory(309,{...baseContext,globalThis:root});
  const mod={exports:{}};
  fn(root,id=>id===205?model:legacyVault,()=>{},null,mod,mod.exports,deps);
  return mod.exports;
}
const rand=n=>new Uint8Array(nodeCrypto.randomBytes(n));
function revision(s){return {key:s.getItem(KEY),payload:s.getItem(PAYLOAD),reset:s.getItem(RESET)};}
function same(a,b){return a.key===b.key&&a.payload===b.payload&&a.reset===b.reset;}
function parseMarker(value){
  const match=typeof value==='string'&&/^(pending-v2:|idle-v2:)([a-f0-9]{32})$/.exec(value);
  if(!match)throw Error('Unknown reset marker: preserve all bytes');
  return {phase:match[1],id:match[2]};
}
// Hypothetical NEW-client recovery. A PENDING marker is a durable delete intent;
// IDLE is a permanent tombstone, deliberately unknown to the old v18.49 code.
function finishPendingReset(s){
  const {phase,id}=parseMarker(s.getItem(RESET));
  if(phase===IDLE)return;
  assert.equal(phase,PENDING);
  s.removeItem(PAYLOAD);
  s.removeItem(KEY);
  s.setItem(RESET,IDLE+id);
}
function proposedReset(s,expected){
  const before=revision(s);
  if(!same(before,expected))throw Error('Stale snapshot: reload');
  if(before.reset!==null){
    const marker=parseMarker(before.reset);
    if(marker.phase!==IDLE)throw Error('Pending reset must finish first');
  }
  const id=nodeCrypto.randomBytes(16).toString('hex');
  // First write must succeed before ANY destructive deletion.
  s.setItem(RESET,PENDING+id);
  finishPendingReset(s);
}
test('Actual already-open v18.49 empty tab cannot resurrect a hypothetical durable tombstone',async()=>{
  const s=store(),locks=serialLocks(),old=legacyTab(s,locks);
  await old.load();
  const expected=revision(s);
  await locks.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>{
    legacyVault.saveWebVault(s,ledger(),rand);
    // This synthetic new client has loaded the new revision before reset.
    proposedReset(s,revision(s));
  });
  assert.ok(s.getItem(RESET).startsWith(IDLE));
  assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
  const before=copy(s.data),writes=s.writes;
  await assert.rejects(old.save(ledger()),/Resetarea locală|Reîncarcă/i);
  await assert.rejects(old.resetData(),/Resetarea locală|Reîncarcă/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  assert.notDeepEqual(expected,revision(s));
});
test('Actual already-open v18.49 populated tab cannot overwrite or reset after tombstone',async()=>{
  const s=store(),locks=serialLocks();
  legacyVault.saveWebVault(s,ledger(),rand);
  const old=legacyTab(s,locks);await old.load();
  await locks.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>proposedReset(s,revision(s)));
  const before=copy(s.data),writes=s.writes;
  await assert.rejects(old.save(ledger()),/Resetarea locală|Reîncarcă/i);
  await assert.rejects(old.resetData(),/Resetarea locală|Reîncarcă/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Newly loaded v18.49 tab rejects unknown permanent marker without deleting anything',async()=>{
  const s=store({[RESET]:IDLE+'a'.repeat(32)}),locks=serialLocks();
  const old=legacyTab(s,locks),before=copy(s.data);
  await assert.rejects(old.load(),/Marcaj de resetare necunoscut/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,0);
});
test('Denied first marker write preserves all existing ciphertext and does not delete',()=>{
  const s=store();legacyVault.saveWebVault(s,ledger(),rand);
  const before=copy(s.data),writes=s.writes;
  s.fault.write=k=>k===RESET;
  assert.throws(()=>proposedReset(s,revision(s)),/QuotaExceededError/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
test('Interrupted ciphertext deletion leaves PENDING marker; legacy writer stays blocked',async()=>{
  const s=store(),locks=serialLocks();legacyVault.saveWebVault(s,ledger(),rand);
  const old=legacyTab(s,locks);await old.load();
  s.fault.remove=k=>k===PAYLOAD;
  assert.throws(()=>proposedReset(s,revision(s)),/SecurityError/);
  assert.ok(s.getItem(RESET).startsWith(PENDING));
  const before=copy(s.data),writes=s.writes;
  await assert.rejects(old.save(ledger()),/Resetarea locală|Reîncarcă/i);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
  s.fault.remove=null;
  finishPendingReset(s);
  assert.ok(s.getItem(RESET).startsWith(IDLE));
  assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
});
test('Interrupted final IDLE marker write remains recoverable; legacy still blocked',async()=>{
  const s=store();legacyVault.saveWebVault(s,ledger(),rand);
  s.fault.write=k=>k===RESET&&String(s.data[RESET]??'').startsWith(PENDING);
  assert.throws(()=>proposedReset(s,revision(s)),/QuotaExceededError/);
  assert.ok(s.getItem(RESET).startsWith(PENDING));
  assert.equal(s.getItem(KEY),null);assert.equal(s.getItem(PAYLOAD),null);
  s.fault.write=null;
  finishPendingReset(s);
  assert.ok(s.getItem(RESET).startsWith(IDLE));
});
test('Denied revision read and unknown marker fail closed with zero writes',()=>{
  const s=store({[RESET]:'committed-v1'});
  const before=copy(s.data);
  assert.throws(()=>proposedReset(s,revision(s)),/Unknown reset marker/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,0);
  s.fault.read=k=>k===RESET;
  assert.throws(()=>revision(s),/SecurityError/);
  assert.equal(s.writes,0);
});
test('A hypothetical NEW client must reject stale empty snapshot even when ciphertext returns to empty',()=>{
  const s=store(),oldRevision=revision(s);
  legacyVault.saveWebVault(s,ledger(),rand);
  proposedReset(s,revision(s));
  const before=copy(s.data),writes=s.writes;
  assert.throws(()=>proposedReset(s,oldRevision),/Stale snapshot/);
  assert.deepEqual(s.data,before);assert.equal(s.writes,writes);
});
