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
