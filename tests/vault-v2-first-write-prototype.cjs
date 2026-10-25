'use strict';
// RESEARCH-ONLY PROTOTYPE for issue #35. NEVER imported by the product.
// Exercises the ACTUAL immutable WEB AES-GCM implementation (Metro module 311)
// against a hypothetical one-record first write. Does not claim browser durability,
// migration safety, cached-old-tab protection or approval to ship v2.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const html = fs.readFileSync('index.html','utf8');
const bundlePath = html.match(new RegExp('<script src="/financial-autonomy-preview/([^"?]+[.]js)[?]build='))?.[1];
assert.ok(bundlePath, 'Active immutable bundle path required');
const bundle = fs.readFileSync(bundlePath,'utf8');
const sandbox = {Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
  TextDecoder,TextEncoder,Buffer,setTimeout,clearTimeout,console,
  globalThis:{crypto:crypto.webcrypto}};
const modules = new Map();
function bundled(id) {
  if(modules.has(id))return modules.get(id);
  const match=[...bundle.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
  assert.equal(match.length,1,'Metro module '+id+' not unique');
  const start=bundle.lastIndexOf('__d(function(',match[0].index);
  assert.ok(start>=0,'Metro factory missing');
  const factory=vm.runInNewContext('('+bundle.slice(start+4,match[0].index+1)+')',sandbox);
  const deps=match[0][1]?match[0][1].split(',').map(Number):[];
  const module={exports:{}};
  modules.set(id,module.exports);
  factory(sandbox.globalThis,bundled,()=>{},null,module,module.exports,deps);
  modules.set(id,module.exports);
  return module.exports;
}
const aes=bundled(311);
const V1_KEY='financial-autonomy.preview.key.v1';
const V1_PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const V2='financial-autonomy.preview.atomic-prototype.v2'; // NOT a production storage key
const rand=n=>new Uint8Array(crypto.randomBytes(n));
const ledger=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
const model={validateState(s){assert.ok(s&&s.version===4);},migrate(s){this.validateState(s);return s;},emptyState:ledger};
modules.set(204,{validateState:model.validateState});
modules.set(205,model);
const legacyVault=bundled(310); // actual current WEB v1 writer, no v2 awareness
function store(initial={},fault={}) {
  const data={...initial};
  let writes=0;
  return {data,get writes(){return writes},
    getItem(k){if(fault.denyRead?.(k))throw Error('SecurityError: read '+k);return Object.hasOwn(data,k)?data[k]:null;},
    setItem(k,v){if(fault.denyWrite?.(k))throw Error((fault.writeError||'QuotaExceededError')+': write '+k);data[k]=String(v);writes++;},
    removeItem(k){if(fault.denyRemove?.(k))throw Error('SecurityError: remove '+k);delete data[k];writes++;}
  };
}
function requireNoLegacy(s) {
  // Any v1 footprint, including a damaged pair, is authoritative enough to
  // BLOCK new initialization. Do not auto-migrate or delete it.
  const marker=s.getItem(RESET);
  if(marker!==null)throw Error('Reset marker present/unknown: fail closed');
  if(s.getItem(V1_KEY)!==null||s.getItem(V1_PAYLOAD)!==null)
    throw Error('Legacy v1 footprint: migration/dual-authority unresolved');
}
function readV2(s) {
  requireNoLegacy(s);
  const raw=s.getItem(V2);
  if(raw===null)return null;
  let obj;
  try{obj=JSON.parse(raw)}catch{throw Error('Malformed v2 record: fail closed')}
  if(!obj||obj.v!==2||typeof obj.key!=='string'||!/^[0-9a-f]{64}$/.test(obj.key)||
    typeof obj.payload!=='string'||Object.keys(obj).sort().join(',')!=='key,payload,v')
    throw Error('Invalid v2 envelope: fail closed');
  let state;
  try{state=JSON.parse(aes.unseal(obj.payload,new Uint8Array(Buffer.from(obj.key,'hex'))))}
  catch{throw Error('V2 authentication or JSON validation failed: fail closed')}
  if(!state||state.version!==4||!Array.isArray(state.accounts)||
    !Array.isArray(state.transactions)||!Array.isArray(state.balanceChecks))
    throw Error('Invalid ledger: fail closed');
  return {state,revision:raw};
}
function writeV2(s,state,expectedRevision=null) {
  const current=readV2(s); // authenticate before any write
  if((current?.revision??null)!==expectedRevision)
    throw Error('Stale revision: reload before writing');
  if(!state||state.version!==4||!Array.isArray(state.accounts)||
    !Array.isArray(state.transactions)||!Array.isArray(state.balanceChecks))
    throw Error('Invalid ledger: fail closed');
  const key=current
    ?new Uint8Array(Buffer.from(JSON.parse(current.revision).key,'hex'))
    :rand(32);
  const payload=aes.seal(JSON.stringify(state),key,rand);
  // ONE localStorage setItem is the sole first-write commit point.
  // Synchronous API atomicity != guaranteed power-loss durability.
  s.setItem(V2,JSON.stringify({v:2,key:Buffer.from(key).toString('hex'),payload}));
  return s.getItem(V2);
}

test('fresh v2 first write is one key operation; real bundled AES-GCM roundtrip',()=>{
  const s=store(),original=ledger();
  const rev=writeV2(s,original);
  assert.equal(s.writes,1);assert.equal(Object.keys(s.data).length,1);
  assert.equal(s.getItem(V1_KEY),null);assert.equal(s.getItem(V1_PAYLOAD),null);
  assert.ok(!rev.includes('accounts\\":[')); // ciphertext, not plaintext ledger
  assert.deepEqual(readV2(s).state,original);
});
test('quota failure on first v2 write leaves no orphan and permits deliberate retry',()=>{
  let deny=true;const s=store({}, {denyWrite:k=>deny&&k===V2});
  assert.throws(()=>writeV2(s,ledger()),/QuotaExceededError/);
  assert.deepEqual(s.data,{});assert.equal(s.writes,0);
  deny=false;writeV2(s,ledger());assert.deepEqual(readV2(s).state,ledger());
});
test('SecurityError on first v2 write leaves no key or ciphertext',()=>{
  const s=store({}, {denyWrite:k=>k===V2,writeError:'SecurityError'});
  assert.throws(()=>writeV2(s,ledger()),/SecurityError/);
  assert.deepEqual(s.data,{});assert.equal(s.writes,0);
});
test('denied v2 read fails closed with zero writes',()=>{
  const s=store({}, {denyRead:k=>k===V2});
  assert.throws(()=>writeV2(s,ledger()),/SecurityError/);assert.equal(s.writes,0);
});
test('denied reset-marker read fails closed with zero writes',()=>{
  const s=store({}, {denyRead:k=>k===RESET});
  assert.throws(()=>writeV2(s,ledger()),/SecurityError/);assert.equal(s.writes,0);
});
for(const [name,initial] of [
  ['complete legacy v1',{[V1_KEY]:'f'.repeat(64),[V1_PAYLOAD]:'encrypted'}],
  ['key-only legacy v1',{[V1_KEY]:'f'.repeat(64)}],
  ['payload-only legacy v1',{[V1_PAYLOAD]:'encrypted'}],
  ['committed reset marker',{[RESET]:'committed-v1'}],
  ['unknown reset marker',{[RESET]:'corrupt'}]
])test(name+' blocks v2 initialization with zero writes',()=>{
  const s=store(initial),before=JSON.stringify(s.data);
  assert.throws(()=>writeV2(s,ledger()),/Legacy|Reset marker/);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,0);
});
test('malformed v2 record never becomes an empty vault or gets overwritten',()=>{
  const s=store({[V2]:'{broken'}),before=JSON.stringify(s.data);
  assert.throws(()=>readV2(s),/Malformed/);
  assert.throws(()=>writeV2(s,ledger()),/Malformed/);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,0);
});
test('wrong key or tampered ciphertext blocks load and save without writes',()=>{
  const s=store();writeV2(s,ledger());
  for(const mutate of [
    obj=>{obj.key='a'.repeat(64)},
    obj=>{const x=JSON.parse(obj.payload);x.data=(x.data[0]==='0'?'1':'0')+x.data.slice(1);obj.payload=JSON.stringify(x)}
  ]){
    const original=s.data[V2],obj=JSON.parse(original);mutate(obj);s.data[V2]=JSON.stringify(obj);
    const before=s.data[V2],writes=s.writes;
    assert.throws(()=>readV2(s),/authentication/);
    assert.throws(()=>writeV2(s,ledger(),before),/authentication/);
    assert.equal(s.data[V2],before);assert.equal(s.writes,writes);
    s.data[V2]=original;
  }
});
test('stale expected revision cannot overwrite a newer single-record save',()=>{
  const s=store(),first=writeV2(s,ledger());
  const newer=ledger();newer.transactions.push({id:'newer'});
  const second=writeV2(s,newer,first),writes=s.writes;
  assert.throws(()=>writeV2(s,ledger(),first),/Stale revision/);
  assert.equal(s.writes,writes);assert.equal(s.data[V2],second);
  assert.deepEqual(readV2(s).state,newer);
});
test('same-tab subsequent save reuses key but uses a new authenticated nonce',()=>{
  const s=store(),first=writeV2(s,ledger()),next=ledger();
  next.transactions.push({id:'second'});
  const second=writeV2(s,next,first);
  const a=JSON.parse(first),b=JSON.parse(second);
  assert.equal(a.key,b.key);
  assert.notEqual(JSON.parse(a.payload).nonce,JSON.parse(b.payload).nonce);
  assert.equal(s.writes,2);assert.deepEqual(readV2(s).state,next);
});
test('KNOWN BLOCKER: actual WEB v18.44 v1 writer creates dual authority after v2 commit',()=>{
  const s=store();writeV2(s,ledger());
  // Real immutable v18.44 module 310, not a browser/cached-tab reproduction.
  legacyVault.saveWebVault(s,ledger(),rand);
  assert.equal(s.writes,3);
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>readV2(s),/Legacy v1 footprint/);
  assert.throws(()=>writeV2(s,ledger()),/Legacy v1 footprint/);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,writes);
  // Until old-tab fencing/migration is specified, DO NOT ship this prototype.
});


/*
 * Cached-v1-tab fencing research, not a production migration implementation.
 * This intentionally calls the ACTUAL v18.44 module 310. The platform's
 * Web Locks and revision checks are NOT simulated here; direct module calls
 * demonstrate why a storage fence alone cannot be treated as a complete
 * protocol. Do not copy the marker or these steps into a shipped bundle.
 */
const RESEARCH_FENCE='FA_V2_RESEARCH_FENCE_NOT_A_REAL_KEY';
test('RESEARCH: malformed legacy-key sentinel makes actual v18.44 v1 load and save fail closed',()=>{
  const s=store({[V1_KEY]:RESEARCH_FENCE}),before=JSON.stringify(s.data);
  assert.throws(()=>legacyVault.loadWebVault(s),/invalid|Cheia/i);
  assert.throws(()=>legacyVault.saveWebVault(s,ledger(),rand),/invalid|Cheia/i);
  assert.equal(s.writes,0);assert.equal(JSON.stringify(s.data),before);
});
test('RESEARCH: fence before v2 commit blocks direct legacy v1 writer after commit',()=>{
  const s=store(),state=ledger();
  s.setItem(V1_KEY,RESEARCH_FENCE);
  const key=rand(32);
  s.setItem(V2,JSON.stringify({v:2,key:Buffer.from(key).toString('hex'),
    payload:aes.seal(JSON.stringify(state),key,rand)}));
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>legacyVault.saveWebVault(s,ledger(),rand),/invalid|Cheia/i);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,writes);
  // Existing v2 prototype refuses even a deliberate fence; it is NOT ready.
  assert.throws(()=>readV2(s),/Legacy v1 footprint/);
});
test('KNOWN UNSAFE: crash after fence but before v2 commit strands an unsaved first ledger',()=>{
  const s=store(),pending=ledger();pending.transactions.push({id:'not-yet-committed'});
  // Simulate interruption at the only point after the first storage write.
  s.setItem(V1_KEY,RESEARCH_FENCE);
  assert.equal(s.getItem(V2),null);
  assert.equal(s.getItem(V1_PAYLOAD),null);
  assert.throws(()=>legacyVault.saveWebVault(s,pending,rand),/invalid|Cheia/i);
  assert.throws(()=>readV2(s),/Legacy v1 footprint/);
  assert.ok(!JSON.stringify(s.data).includes('not-yet-committed'));
  // There is no encrypted copy of pending data; silent retry with an empty
  // state would falsely imply that the first write had been committed.
});
test('KNOWN UNSAFE: v2-first commit without fence permits legacy writer split brain',()=>{
  const s=store();writeV2(s,ledger());
  legacyVault.saveWebVault(s,ledger(),rand);
  assert.ok(s.getItem(V2));assert.ok(s.getItem(V1_KEY));assert.ok(s.getItem(V1_PAYLOAD));
  assert.throws(()=>readV2(s),/Legacy v1 footprint/);
});
test('KNOWN UNSAFE direct-module reset can remove a proposed fence while leaving v2',()=>{
  const s=store();writeV2(s,ledger());s.setItem(V1_KEY,RESEARCH_FENCE);
  // Direct legacy module call bypasses real platform Web Locks/revision gate.
  // It is a capability/failure-model test, NOT a reproduced old-tab UI reset.
  legacyVault.clearWebVault(s);
  assert.equal(s.getItem(V1_KEY),null);assert.equal(s.getItem(V1_PAYLOAD),null);
  assert.ok(s.getItem(V2),'legacy clear knows nothing about the v2 record');
  legacyVault.saveWebVault(s,ledger(),rand);
  assert.ok(s.getItem(V1_KEY));assert.ok(s.getItem(V1_PAYLOAD));
  assert.throws(()=>readV2(s),/Legacy v1 footprint/);
});
test('RESEARCH: failed fence write leaves no new record and v2 must not start',()=>{
  const s=store({}, {denyWrite:k=>k===V1_KEY});
  assert.throws(()=>s.setItem(V1_KEY,RESEARCH_FENCE),/QuotaExceededError/);
  assert.equal(s.getItem(V1_KEY),null);assert.equal(s.getItem(V2),null);
  assert.equal(s.writes,0);
});


/*
 * Issue #35: encrypted staging -> legacy v1 fence -> recoverable v2 activation.
 * ISOLATED RESEARCH ONLY. Not called by WEB; NOT a migration implementation.
 * This intentionally keeps STAGE and the v1 fence after activation: deleting
 * either without a fully specified cached-tab/reset contract is unsafe.
 */
const STAGE='financial-autonomy.preview.stage-research.v2';
function stagedEnvelope(s) {
  const raw=s.getItem(STAGE);
  if(raw===null)throw Error('Missing encrypted stage: fail closed');
  let env;
  try{env=JSON.parse(raw)}catch{throw Error('Malformed stage: fail closed')}
  if(!env||env.v!==2||typeof env.key!=='string'||!/^[0-9a-f]{64}$/.test(env.key)||
    typeof env.payload!=='string'||Object.keys(env).sort().join(',')!=='key,payload,v')
    throw Error('Invalid stage envelope: fail closed');
  let state;
  try{state=JSON.parse(aes.unseal(env.payload,new Uint8Array(Buffer.from(env.key,'hex'))))}
  catch{throw Error('Stage authentication failed: fail closed')}
  if(!state||state.version!==4||!Array.isArray(state.accounts)||
    !Array.isArray(state.transactions)||!Array.isArray(state.balanceChecks))
    throw Error('Stage ledger validation failed: fail closed');
  return {raw,state};
}
function stageFirst(s,state) {
  // Preflight is NOT atomic with a cached old-tab writer. Requires an actual
  // origin-wide Web Lock/revision contract before any product integration.
  if(s.getItem(RESET)!==null||s.getItem(V1_KEY)!==null||
     s.getItem(V1_PAYLOAD)!==null||s.getItem(V2)!==null||
     s.getItem(STAGE)!==null)
    throw Error('Preexisting vault/reset/stage: fail closed');
  if(!state||state.version!==4||!Array.isArray(state.accounts)||
     !Array.isArray(state.transactions)||!Array.isArray(state.balanceChecks))
    throw Error('Invalid staged ledger');
  const key=rand(32),raw=JSON.stringify({v:2,key:Buffer.from(key).toString('hex'),
    payload:aes.seal(JSON.stringify(state),key,rand)});
  s.setItem(STAGE,raw); // first recoverable encrypted commit; no plaintext.
  return raw;
}
function recoverStaged(s) {
  const {raw,state}=stagedEnvelope(s); // authenticate BEFORE mutations
  if(s.getItem(RESET)!==null)throw Error('Reset marker conflicts with stage');
  const oldKey=s.getItem(V1_KEY),oldPayload=s.getItem(V1_PAYLOAD);
  if(oldPayload!==null||(oldKey!==null&&oldKey!==RESEARCH_FENCE))
    throw Error('Legacy v1 footprint conflicts with stage');
  const active=s.getItem(V2);
  if(active!==null&&active!==raw)
    throw Error('Different active v2 record conflicts with stage');
  if(active!==null&&oldKey!==RESEARCH_FENCE)
    throw Error('Active v2 without legacy fence: fail closed');
  if(oldKey===null) {
    // Crash before fencing is recoverable because STAGE contains the ledger.
    s.setItem(V1_KEY,RESEARCH_FENCE);
  }
  // Crash after fencing is recoverable. A failed V2 write preserves STAGE.
  if(active===null)s.setItem(V2,raw);
  return state;
}

test('RESEARCH staging: encrypted stage is recoverable before legacy fence',()=>{
  const s=store(),pending=ledger();pending.transactions.push({id:'staged-only'});
  const raw=stageFirst(s,pending);
  assert.equal(s.writes,1);assert.equal(s.getItem(V1_KEY),null);
  assert.equal(s.getItem(V2),null);
  assert.ok(!raw.includes('staged-only'),'stage must not expose transaction plaintext');
  assert.deepEqual(stagedEnvelope(s).state,pending);
  assert.deepEqual(recoverStaged(s),pending);
  assert.equal(s.getItem(V1_KEY),RESEARCH_FENCE);
  assert.equal(s.getItem(V2),raw);
  assert.equal(s.getItem(STAGE),raw);
  assert.throws(()=>legacyVault.saveWebVault(s,ledger(),rand),/invalid|Cheia/i);
});
test('RESEARCH staging: crash after fence before activation resumes from authenticated stage',()=>{
  const s=store(),pending=ledger();pending.transactions.push({id:'after-fence'});
  const raw=stageFirst(s,pending);s.setItem(V1_KEY,RESEARCH_FENCE);
  assert.equal(s.getItem(V2),null);
  assert.deepEqual(recoverStaged(s),pending);
  assert.equal(s.getItem(V2),raw);
});
test('RESEARCH staging: crash after activation is idempotent and keeps fence/stage',()=>{
  const s=store();const raw=stageFirst(s,ledger());
  recoverStaged(s);const writes=s.writes;
  assert.deepEqual(recoverStaged(s),ledger());
  assert.equal(s.writes,writes);assert.equal(s.getItem(V2),raw);
  assert.equal(s.getItem(STAGE),raw);assert.equal(s.getItem(V1_KEY),RESEARCH_FENCE);
});
test('RESEARCH staging: stage write denied leaves no footprint, explicit retry works',()=>{
  let denied=true;const s=store({}, {denyWrite:k=>denied&&k===STAGE});
  assert.throws(()=>stageFirst(s,ledger()),/QuotaExceededError/);
  assert.equal(s.writes,0);assert.deepEqual(s.data,{});
  denied=false;stageFirst(s,ledger());assert.deepEqual(recoverStaged(s),ledger());
});
test('RESEARCH staging: fence write denied preserves encrypted stage for retry',()=>{
  let denied=true;const s=store({}, {denyWrite:k=>denied&&k===V1_KEY});
  const raw=stageFirst(s,ledger());
  assert.throws(()=>recoverStaged(s),/QuotaExceededError/);
  assert.equal(s.getItem(V1_KEY),null);assert.equal(s.getItem(V2),null);
  assert.equal(s.getItem(STAGE),raw);assert.equal(s.writes,1);
  denied=false;assert.deepEqual(recoverStaged(s),ledger());
});
test('RESEARCH staging: v2 activation denied preserves encrypted stage and fence',()=>{
  let denied=true;const s=store({}, {denyWrite:k=>denied&&k===V2});
  const raw=stageFirst(s,ledger());
  assert.throws(()=>recoverStaged(s),/QuotaExceededError/);
  assert.equal(s.getItem(V1_KEY),RESEARCH_FENCE);
  assert.equal(s.getItem(V2),null);assert.equal(s.getItem(STAGE),raw);
  denied=false;assert.deepEqual(recoverStaged(s),ledger());
});
test('RESEARCH staging: tampered stage fails closed before fence/activation writes',()=>{
  const s=store();stageFirst(s,ledger());
  const env=JSON.parse(s.data[STAGE]);env.key='a'.repeat(64);
  s.data[STAGE]=JSON.stringify(env);const writes=s.writes;
  assert.throws(()=>recoverStaged(s),/authentication/);
  assert.equal(s.writes,writes);assert.equal(s.getItem(V1_KEY),null);
  assert.equal(s.getItem(V2),null);
});
test('RESEARCH staging: cached v1 write after staging creates conflict; preserve both',()=>{
  const s=store();const raw=stageFirst(s,ledger());
  legacyVault.saveWebVault(s,ledger(),rand);
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>recoverStaged(s),/Legacy v1 footprint/);
  assert.equal(s.getItem(STAGE),raw);assert.equal(JSON.stringify(s.data),before);
  assert.equal(s.writes,writes);
  // This is an UNSOLVED old-tab race, not an acceptable production state.
});
test('RESEARCH staging: payload-only or key-only legacy footprint blocks recovery',()=>{
  for(const key of [V1_KEY,V1_PAYLOAD]){
    const s=store();stageFirst(s,ledger());
    s.data[key]='external-or-partial';
    const writes=s.writes;
    assert.throws(()=>recoverStaged(s),/Legacy v1 footprint/);
    assert.equal(s.writes,writes);assert.equal(s.getItem(V2),null);
  }
});
test('RESEARCH staging: unknown/committed reset marker blocks activation',()=>{
  for(const marker of ['committed-v1','invalid']){
    const s=store();stageFirst(s,ledger());s.data[RESET]=marker;
    const writes=s.writes;
    assert.throws(()=>recoverStaged(s),/Reset marker/);
    assert.equal(s.writes,writes);assert.equal(s.getItem(V2),null);
  }
});
test('RESEARCH staging: denied stage read fails closed with zero recovery writes',()=>{
  let denied=false;const s=store({}, {denyRead:k=>denied&&k===STAGE});
  stageFirst(s,ledger());const writes=s.writes;denied=true;
  assert.throws(()=>recoverStaged(s),/SecurityError/);
  assert.equal(s.writes,writes);assert.equal(s.getItem(V2),null);
});
test('KNOWN UNSAFE staging: direct old-v1 reset removes fence after activation',()=>{
  const s=store();stageFirst(s,ledger());recoverStaged(s);
  legacyVault.clearWebVault(s); // direct module bypasses platform lock/revision
  assert.equal(s.getItem(V1_KEY),null);assert.ok(s.getItem(STAGE));
  const writes=s.writes;
  assert.throws(()=>recoverStaged(s),/without legacy fence/);
  assert.equal(s.writes,writes);
  legacyVault.saveWebVault(s,ledger(),rand);
  assert.throws(()=>recoverStaged(s),/Legacy v1 footprint/);
  // Remains a release blocker; no safe automatic reconciliation.
});


/*
 * Actual active WEB platform module 309, rather than calling module 310
 * directly. These are Node VM simulated tabs with a cooperating Web Locks
 * scheduler, NOT interactive browser tests. The hypothetical stage/fence
 * writes are deliberately outside the legacy platform's revision contract:
 * old v18.44 tabs cannot inspect a storage key that did not exist in v18.44.
 */
function oldPlatformTab(s,locks) {
  const g={
    localStorage:s,location:{href:'https://example.test/?fa_real=1'},
    history:{state:null,replaceState(){}},
    navigator:{locks},
    crypto:{getRandomValues:a=>crypto.webcrypto.getRandomValues(a),
      randomUUID:()=>crypto.randomUUID()}
  };
  const matches=[...bundle.matchAll(new RegExp('\\},309,\\[([^\\]]*)\\]\\);','g'))];
  assert.equal(matches.length,1,'Actual platform module 309 must be unique');
  const match=matches[0],start=bundle.lastIndexOf('__d(function(',match.index);
  assert.ok(start>=0,'Platform factory missing');
  const factory=vm.runInNewContext(
    '('+bundle.slice(start+4,match.index+1)+')',
    {...sandbox,globalThis:g,URL,Blob});
  const deps=match[1]?match[1].split(',').map(Number):[];
  const mod={exports:{}};
  factory(g,id=>id===205?model:legacyVault,()=>{},null,mod,mod.exports,deps);
  return mod.exports;
}
function oldWebLocks() {
  let tail=Promise.resolve(),requests=0;
  return {get requests(){return requests},
    request(name,opts,fn){
      assert.equal(name,'financial-autonomy.preview.vault.v1');
      assert.equal(opts.mode,'exclusive');
      requests++;
      const next=tail.then(fn);
      tail=next.catch(()=>{});
      return next;
    }
  };
}
test('KNOWN UNSAFE actual platform 309: old tab save after stage-only creates v1 dual authority despite Web Locks',async()=>{
  const s=store(),locks=oldWebLocks(),old=oldPlatformTab(s,locks);
  assert.deepEqual(JSON.parse(JSON.stringify(await old.load())),ledger());
  const staged=stageFirst(s,ledger());
  const next=ledger();next.transactions.push({id:'legacy-saved-after-stage'});
  await old.save(next);
  assert.ok(locks.requests>=1,'Actual old platform acquired a Web Lock');
  assert.equal(s.getItem(STAGE),staged);
  assert.ok(s.getItem(V1_KEY));assert.ok(s.getItem(V1_PAYLOAD));
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>recoverStaged(s),/Legacy v1 footprint/);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,writes);
});
test('KNOWN UNSAFE actual platform 309: explicit old reset after stage-only leaves stage, then prototype recovery resurrects it',async()=>{
  const s=store(),locks=oldWebLocks(),old=oldPlatformTab(s,locks);
  await old.load();
  const pending=ledger();pending.transactions.push({id:'staged-before-intentional-reset'});
  const staged=stageFirst(s,pending);
  await old.resetData(); // Actual platform 309 + actual journal module 310.
  assert.ok(locks.requests>=1);
  assert.equal(s.getItem(RESET),null,'Actual reset clears its committed marker');
  assert.equal(s.getItem(V1_KEY),null);assert.equal(s.getItem(V1_PAYLOAD),null);
  assert.equal(s.getItem(STAGE),staged,'Old reset does not know research stage');
  // This is the UNSAFE candidate behavior, NOT a feature or approved recovery:
  assert.deepEqual(recoverStaged(s),pending);
  assert.equal(s.getItem(V2),staged);
});
test('Actual platform 309 stale save and reset are rejected after stage plus legacy fence',async()=>{
  const s=store(),locks=oldWebLocks(),old=oldPlatformTab(s,locks);
  await old.load();
  stageFirst(s,ledger());
  s.setItem(V1_KEY,RESEARCH_FENCE);
  const before=JSON.stringify(s.data),writes=s.writes;
  await assert.rejects(old.save(ledger()),/altă filă|Reîncarcă/i);
  await assert.rejects(old.resetData(),/altă filă|Reîncarcă/i);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,writes);
  const newlyOpened=oldPlatformTab(s,locks);
  await assert.rejects(newlyOpened.load(),/invalid|Cheia/i);
  assert.equal(JSON.stringify(s.data),before);assert.equal(s.writes,writes);
});


/*
 * #35 follow-up: conservative staged-v2 quarantine, RESEARCH ONLY.
 * Unlike recoverStaged above (which deliberately demonstrates a dangerous
 * auto-resurrection), a stage without a legacy fence is AMBIGUOUS:
 * (a) crash after staging, or (b) intentional reset by a cached v18.44 tab.
 * The old reset removes its own marker, so these cases have the same durable
 * storage footprint. No new reader can reconstruct erased intent from it.
 *
 * This proof of a safe default is NOT a deployable migration: the fence can
 * still be removed by direct legacy module calls, browser acceptance is
 * outstanding, and staging under Web Locks is not wired into the product.
 */
function inspectFencedStage(s) {
  const {raw,state}=stagedEnvelope(s); // authenticate before any mutation
  if(s.getItem(RESET)!==null)throw Error('Reset marker: quarantine stage');
  const key=s.getItem(V1_KEY),payload=s.getItem(V1_PAYLOAD);
  if(payload!==null||(key!==null&&key!==RESEARCH_FENCE))
    throw Error('Conflicting legacy v1 authority: quarantine stage');
  // Critical: NEVER auto-create a fence from a stage-only footprint after
  // reload. It may have survived a user's intentional old-tab reset.
  if(key!==RESEARCH_FENCE)
    throw Error('Ambiguous stage-only after crash or old-tab reset: quarantine');
  const active=s.getItem(V2);
  if(active!==null&&active!==raw)
    throw Error('Conflicting active v2: quarantine stage');
  return {raw,state,needsActivation:active===null};
}
function recoverFencedStage(s) {
  const candidate=inspectFencedStage(s);
  if(candidate.needsActivation)s.setItem(V2,candidate.raw);
  return candidate.state;
}

test('SAFE DEFAULT: stage-only crash is quarantined, even with valid authenticated data',()=>{
  const s=store(),pending=ledger();pending.transactions.push({id:'unsaved-stage'});
  const stage=stageFirst(s,pending),before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>recoverFencedStage(s),/Ambiguous stage-only/);
  assert.equal(s.writes,writes);assert.equal(JSON.stringify(s.data),before);
  assert.equal(s.getItem(STAGE),stage);assert.equal(s.getItem(V2),null);
});
test('SAFE DEFAULT: actual old-platform reset after stage-only cannot trigger auto-resurrection',async()=>{
  const s=store(),locks=oldWebLocks(),old=oldPlatformTab(s,locks);
  await old.load();
  const pending=ledger();pending.transactions.push({id:'intentionally-cleared'});
  const stage=stageFirst(s,pending);
  await old.resetData(); // actual bundled 309/310, not a mock reset
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.equal(s.getItem(RESET),null);
  assert.throws(()=>recoverFencedStage(s),/Ambiguous stage-only/);
  assert.equal(s.getItem(V2),null);assert.equal(s.getItem(STAGE),stage);
  assert.equal(s.writes,writes);assert.equal(JSON.stringify(s.data),before);
});
test('SAFE DEFAULT: crash-before-fence and reset-after-stage have indistinguishable footprints',async()=>{
  const pending=ledger();pending.transactions.push({id:'ambiguous'});
  const crashed=store(),reset=store(),old=oldPlatformTab(reset,oldWebLocks());
  await old.load();
  stageFirst(crashed,pending);stageFirst(reset,pending);
  await old.resetData();
  assert.deepEqual(reset.data,crashed.data);
  assert.throws(()=>recoverFencedStage(crashed),/Ambiguous stage-only/);
  assert.throws(()=>recoverFencedStage(reset),/Ambiguous stage-only/);
  // Without a durable reset epoch known to old clients, automatic recovery
  // cannot both preserve the crashed first save and honor the old-tab reset.
});
test('SAFE DEFAULT: fenced authenticated stage can activate and retry idempotently',()=>{
  const s=store(),pending=ledger();pending.transactions.push({id:'fenced'});
  const stage=stageFirst(s,pending);
  s.setItem(V1_KEY,RESEARCH_FENCE); // hypothetical same-lock first-write path
  assert.deepEqual(recoverFencedStage(s),pending);
  assert.equal(s.getItem(V2),stage);
  const writes=s.writes;
  assert.deepEqual(recoverFencedStage(s),pending);assert.equal(s.writes,writes);
});
test('SAFE DEFAULT: denied v2 activation retains fenced encrypted stage for retry',()=>{
  let deny=true;
  const s=store({}, {denyWrite:k=>deny&&k===V2});
  const stage=stageFirst(s,ledger());s.setItem(V1_KEY,RESEARCH_FENCE);
  const writes=s.writes;
  assert.throws(()=>recoverFencedStage(s),/QuotaExceededError/);
  assert.equal(s.writes,writes);assert.equal(s.getItem(V2),null);
  assert.equal(s.getItem(STAGE),stage);assert.equal(s.getItem(V1_KEY),RESEARCH_FENCE);
  deny=false;assert.deepEqual(recoverFencedStage(s),ledger());
});
test('SAFE DEFAULT: lost fence after direct old reset blocks activation without deleting stage',()=>{
  const s=store();const stage=stageFirst(s,ledger());
  s.setItem(V1_KEY,RESEARCH_FENCE);
  legacyVault.clearWebVault(s); // direct old module, bypasses platform guard
  const before=JSON.stringify(s.data),writes=s.writes;
  assert.throws(()=>recoverFencedStage(s),/Ambiguous stage-only/);
  assert.equal(s.getItem(STAGE),stage);assert.equal(s.getItem(V2),null);
  assert.equal(s.writes,writes);assert.equal(JSON.stringify(s.data),before);
});
test('SAFE DEFAULT: corrupted stage, conflicting legacy pair and reset marker fail closed',()=>{
  for(const variant of ['tampered','legacy','reset','different-v2']){
    const s=store();stageFirst(s,ledger());s.setItem(V1_KEY,RESEARCH_FENCE);
    if(variant==='tampered'){
      const env=JSON.parse(s.data[STAGE]);env.key='a'.repeat(64);
      s.data[STAGE]=JSON.stringify(env);
    }else if(variant==='legacy')s.data[V1_PAYLOAD]='unrelated';
    else if(variant==='reset')s.data[RESET]='unknown';
    else s.data[V2]='unrelated';
    const before=JSON.stringify(s.data),writes=s.writes;
    assert.throws(()=>recoverFencedStage(s),/authentication|Conflicting|Reset marker/i);
    assert.equal(s.writes,writes);assert.equal(JSON.stringify(s.data),before);
  }
});
test('SAFE DEFAULT: denied read of fence, stage or reset marker cannot mutate',()=>{
  for(const denied of [STAGE,V1_KEY,RESET,V2]){
    let fail=false;
    const s=store({}, {denyRead:k=>fail&&k===denied});
    stageFirst(s,ledger());s.setItem(V1_KEY,RESEARCH_FENCE);
    const before=JSON.stringify(s.data),writes=s.writes;fail=true;
    assert.throws(()=>recoverFencedStage(s),/SecurityError/);
    assert.equal(s.writes,writes);assert.equal(JSON.stringify(s.data),before);
  }
});
