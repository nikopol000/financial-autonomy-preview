'use strict';
// Issue #4: isolated sealed-authority contract RESEARCH, not a production migration.
// No browser, user data, archived client, backup, or production vault is accessed.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {webcrypto} = require('node:crypto');
const {subtle} = webcrypto;
const enc = new TextEncoder(), dec = new TextDecoder();
const A='research.v2.authority', K='research.v2.key', S='research.v2.stage.';
const V1='financial-autonomy.preview.payload.v1';
const hex=b=>Buffer.from(b).toString('hex');
const bytes=s=>Buffer.from(s,'hex');
const digest=async s=>hex(await subtle.digest('SHA-256',enc.encode(s)));

class Store {
  constructor(){this.m=new Map();this.writes=0;this.fault=null;}
  getItem(k){return this.m.has(k)?this.m.get(k):null;}
  setItem(k,v){
    if(this.fault?.key===k && this.fault.when==='before')throw Error('INJECTED_BEFORE');
    this.m.set(k,String(v));this.writes++;
    if(this.fault?.key===k && this.fault.when==='after')throw Error('INJECTED_AFTER');
  }
  removeItem(k){this.m.delete(k);this.writes++;}
}
async function seal(key,object){
  const nonce=webcrypto.getRandomValues(new Uint8Array(12));
  const cipher=await subtle.encrypt({name:'AES-GCM',iv:nonce},key,enc.encode(JSON.stringify(object)));
  return JSON.stringify({nonce:hex(nonce),cipher:hex(cipher)});
}
async function unseal(key,raw){
  const e=JSON.parse(raw);
  if(typeof e.nonce!=='string'||typeof e.cipher!=='string'||e.nonce.length!==24)throw Error('INVALID_ENVELOPE');
  return JSON.parse(dec.decode(await subtle.decrypt({name:'AES-GCM',iv:bytes(e.nonce)},key,bytes(e.cipher))));
}
async function keyFor(store){
  const raw=store.getItem(K);
  if(!raw)throw Error('MISSING_AUTHORITY_KEY');
  return subtle.importKey('raw',bytes(raw),'AES-GCM',false,['encrypt','decrypt']);
}
async function initialize(store){
  if(store.getItem(K)!==null || store.getItem(A)!==null)throw Error('NOT_FRESH');
  store.setItem(K,hex(webcrypto.getRandomValues(new Uint8Array(32))));
}
async function read(store){
  const raw=store.getItem(A);
  if(raw===null){if(store.getItem(K)!==null)throw Error('AUTHORITY_MISSING');return {status:'legacy'};}
  const key=await keyFor(store);
  const record=await unseal(key,raw);
  if(record.schema!==2 || !['active','reset'].includes(record.status) ||
     !Number.isSafeInteger(record.revision)||record.revision<1 ||
     typeof record.epoch!=='string'||!record.epoch)throw Error('INVALID_AUTHORITY');
  if(record.status==='reset'){
    if(record.stage!==null || record.digest!==null)throw Error('INVALID_RESET');
    return {status:'reset',record};
  }
  if(typeof record.stage!=='string'||!record.stage.startsWith(S)||
     typeof record.digest!=='string')throw Error('INVALID_STAGE');
  const rawStage=store.getItem(record.stage);
  if(rawStage===null||await digest(rawStage)!==record.digest)throw Error('STAGE_MISSING_OR_CHANGED');
  return {status:'active',record,state:await unseal(key,rawStage)};
}
async function commit(store,state,expectedAuthority,options={}){
  if(store.getItem(A)!==expectedAuthority)throw Error('STALE_AUTHORITY');
  const key=await keyFor(store);
  const old=expectedAuthority===null?null:await read(store);
  const revision=old?old.record.revision+1:1;
  const stage=S+webcrypto.randomUUID();
  const stageRaw=await seal(key,state);
  store.setItem(stage,stageRaw);
  const record={schema:2,status:'active',stage,digest:await digest(stageRaw),
    revision,epoch:webcrypto.randomUUID()};
  const sealed=await seal(key,record);
  if(store.getItem(A)!==expectedAuthority)throw Error('STALE_AUTHORITY');
  store.setItem(A,sealed);
  return sealed;
}
async function reset(store,expectedAuthority){
  if(store.getItem(A)!==expectedAuthority)throw Error('STALE_AUTHORITY');
  const old=await read(store);
  if(old.status!=='active')throw Error('NOT_ACTIVE');
  const record={schema:2,status:'reset',stage:null,digest:null,
    revision:old.record.revision+1,epoch:webcrypto.randomUUID()};
  const sealed=await seal(await keyFor(store),record);
  if(store.getItem(A)!==expectedAuthority)throw Error('STALE_AUTHORITY');
  store.setItem(A,sealed); // one-key authority commit; prior stage retained
  return sealed;
}
async function fixture(){
  const store=new Store();store.setItem(V1,'original-legacy-ciphertext');
  await initialize(store);
  const a=await commit(store,{transactions:['A','B']},null);
  return {store,a};
}

test('sealed status: forged plain reset fails closed and retains stage + v1',async()=>{
  const {store,a}=await fixture();
  const stage=(await read(store)).record.stage, original=store.getItem(stage);
  store.setItem(A,JSON.stringify({schema:2,status:'reset',epoch:'forged'}));
  await assert.rejects(read(store));
  assert.equal(store.getItem(stage),original);
  assert.equal(store.getItem(V1),'original-legacy-ciphertext');
  store.setItem(A,a);
  assert.deepEqual((await read(store)).state.transactions,['A','B']);
});

test('sealed metadata: bit-flipped authority fails closed; no fallback to legacy',async()=>{
  const {store,a}=await fixture();
  const envelope=JSON.parse(a);envelope.cipher=(envelope.cipher[0]==='a'?'b':'a')+envelope.cipher.slice(1);
  store.setItem(A,JSON.stringify(envelope));
  const writes=store.writes;
  await assert.rejects(read(store));
  assert.equal(store.writes,writes);
  store.setItem(A,a);
  assert.equal((await read(store)).status,'active');
});

test('sealed stage digest detects altered staged data and preserves ciphertext',async()=>{
  const {store}=await fixture();
  const stage=(await read(store)).record.stage;
  store.setItem(stage,JSON.stringify({transactions:['injected']}));
  await assert.rejects(read(store),/STAGE_MISSING_OR_CHANGED/);
  assert.equal(store.getItem(V1),'original-legacy-ciphertext');
});

test('write-then-throw on reset: durable reset survives reload; legacy cannot resurrect',async()=>{
  const {store,a}=await fixture();
  const oldStage=(await read(store)).record.stage;
  store.fault={key:A,when:'after'};
  await assert.rejects(reset(store,a),/INJECTED_AFTER/);
  store.fault=null;
  assert.equal((await read(store)).status,'reset');
  store.setItem(V1,'cached-legacy-new-data');
  assert.equal((await read(store)).status,'reset');
  assert.notEqual(store.getItem(oldStage),null);
  await assert.rejects(commit(store,{transactions:['stale']},a),/STALE_AUTHORITY/);
});

test('pre-commit failure retains old authority; orphan stage never authoritative',async()=>{
  const {store,a}=await fixture();
  const before=await read(store);
  store.fault={key:A,when:'before'};
  await assert.rejects(commit(store,{transactions:['C']},a),/INJECTED_BEFORE/);
  store.fault=null;
  assert.equal(store.getItem(A),a);
  assert.deepEqual((await read(store)).state,before.state);
});

test('KNOWN LIMITATION: replay of an older *valid* sealed authority still rolls back visible ledger',async()=>{
  const {store,a}=await fixture();
  const b=await commit(store,{transactions:['A','B','C']},a);
  assert.deepEqual((await read(store)).state.transactions,['A','B','C']);
  store.setItem(A,a); // same-origin full-record rollback; not a normal archived-client write
  assert.deepEqual((await read(store)).state.transactions,['A','B']);
  store.setItem(A,b);
  assert.deepEqual((await read(store)).state.transactions,['A','B','C']);
});
