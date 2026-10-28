'use strict';
// P1 #4 — RESEARCH ONLY. Synthetic AES-GCM fault matrix for a proposed v2
// single-key authority commit. NOT a production migration or safety proof.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {webcrypto,createHash}=require('node:crypto');
const subtle=webcrypto.subtle;
const enc=new TextEncoder(),dec=new TextDecoder();
const V1K='financial-autonomy.preview.key.v1';
const V1P='financial-autonomy.preview.payload.v1';
const V1R='financial-autonomy.preview.reset.v1';
const STAGE='financial-autonomy.preview.research.stage.v2';
const AUTH='financial-autonomy.preview.research.authority.v2';
const tuple=s=>[V1K,V1P,V1R].map(k=>s.getItem(k));
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const b64=x=>Buffer.from(x).toString('base64');
const bytes=x=>new Uint8Array(Buffer.from(x,'base64'));
const rand=n=>webcrypto.getRandomValues(new Uint8Array(n));
async function seal(value){
  const raw=rand(32),iv=rand(12);
  const key=await subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
  const ciphertext=await subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(value)));
  return JSON.stringify({key:b64(raw),iv:b64(iv),ciphertext:b64(ciphertext)});
}
async function open(envelope){
  const parsed=JSON.parse(envelope);
  const key=await subtle.importKey('raw',bytes(parsed.key),'AES-GCM',false,['decrypt']);
  return JSON.parse(dec.decode(await subtle.decrypt({name:'AES-GCM',iv:bytes(parsed.iv)},key,bytes(parsed.ciphertext))));
}
class Store {
  constructor(){this.data=new Map();this.trace=[];this.fault=null;this.n=0;}
  seed(k,v){this.data.set(k,v)}
  arm(index,phase='before'){this.trace=[];this.n=0;this.fault={index,phase}}
  clear(){this.fault=null;this.n=0;this.trace=[]}
  call(op,key,fn){
    const index=this.n++;
    this.trace.push({op,key});
    if(this.fault?.index===index&&this.fault.phase==='before')throw Error('INJECTED BEFORE '+op+' '+key);
    const result=fn();
    if(this.fault?.index===index&&this.fault.phase==='after')throw Error('INJECTED AFTER '+op+' '+key);
    return result;
  }
  getItem(k){return this.call('get',k,()=>this.data.has(k)?this.data.get(k):null)}
  setItem(k,v){return this.call('set',k,()=>this.data.set(k,String(v)))}
}
const ledger={version:4,accounts:[],transactions:[{id:'synthetic-v1',amount:37}],balanceChecks:[]};
async function fixture(){
  const s=new Store(),e=JSON.parse(await seal(ledger));
  s.seed(V1K,e.key);s.seed(V1P,JSON.stringify({iv:e.iv,ciphertext:e.ciphertext}));
  return s;
}
async function readV1(s){
  const [key,payload,reset]=tuple(s);
  if(!key||!payload||reset!==null)throw Error('V1_UNVERIFIED');
  const p=JSON.parse(payload);
  return open(JSON.stringify({key,iv:p.iv,ciphertext:p.ciphertext}));
}
async function migratePrototype(s){
  if(s.getItem(AUTH)!==null)throw Error('AUTH_ALREADY_PRESENT');
  const baseline=tuple(s),value=await readV1FromTuple(baseline);
  const stage=await seal(value);
  s.setItem(STAGE,stage);
  const stored=s.getItem(STAGE);
  if(digest(stored)!==digest(stage))throw Error('STAGE_MISMATCH');
  assert.deepEqual(await open(stored),value,'AES-GCM round-trip before cutover');
  if(digest(tuple(s))!==digest(baseline))throw Error('V1_CHANGED_DURING_STAGING');
  // The sole authority transition is one localStorage setItem.
  // If setItem persists then throws, reload must recognize the committed record.
  const authority={schema:2,state:'active',epoch:'synthetic-epoch-1',
    stageDigest:digest(stage),v1Baseline:digest(baseline)};
  s.setItem(AUTH,JSON.stringify(authority));
}
async function readV1FromTuple([key,payload,reset]){
  if(!key||!payload||reset!==null)throw Error('V1_UNVERIFIED');
  const p=JSON.parse(payload);
  return open(JSON.stringify({key,iv:p.iv,ciphertext:p.ciphertext}));
}
async function readAuthority(s){
  const marker=s.getItem(AUTH);
  if(marker===null)return {source:'v1',value:await readV1(s)};
  let a;
  try{a=JSON.parse(marker)}catch{throw Error('AUTH_MALFORMED')}
  if(a.schema!==2||a.epoch!=='synthetic-epoch-1'||!['active','reset'].includes(a.state))
    throw Error('AUTH_UNKNOWN');
  if(a.state==='reset')return {source:'v2-reset',value:null};
  if(typeof a.stageDigest!=='string'||typeof a.v1Baseline!=='string')
    throw Error('AUTH_INCOMPLETE');
  const stage=s.getItem(STAGE);
  if(!stage||digest(stage)!==a.stageDigest)throw Error('V2_STAGE_INVALID');
  const value=await open(stage); // authenticated AES-GCM, no v1 fallback
  const divergence=digest(tuple(s))!==a.v1Baseline;
  return {source:'v2',value,divergence};
}
async function resetPrototype(s){
  const current=await readAuthority(s);
  if(current.source!=='v2')throw Error('NOT_V2');
  s.setItem(AUTH,JSON.stringify({schema:2,state:'reset',epoch:'synthetic-epoch-1'}));
}
const v1raw=s=>[V1K,V1P,V1R].map(k=>s.data.get(k)??null);

test('PROTOTYPE: single-key authority, observable v1 drift, durable reset tombstone',async()=>{
  const s=await fixture(),v1=v1raw(s);
  await migratePrototype(s);
  const current=await readAuthority(s);
  assert.equal(current.source,'v2');assert.deepEqual(current.value,ledger);
  assert.equal(current.divergence,false);
  s.seed(V1P,'legacy-cached-tab-divergent-ciphertext');
  const changed=await readAuthority(s);
  assert.equal(changed.source,'v2');assert.equal(changed.divergence,true);
  assert.deepEqual(changed.value,ledger,'v1 edits must not replace v2 ledger');
  await resetPrototype(s);
  assert.equal((await readAuthority(s)).source,'v2-reset');
  s.seed(V1P,v1[1]);
  assert.equal((await readAuthority(s)).source,'v2-reset','v1 resurrection must not override tombstone');
  console.log('PASS RESEARCH ONLY: v2 commit/reset isolated; observable v1 drift flagged');
});

test('PROTOTYPE: every migration storage operation fails before/after persistence',async()=>{
  const reference=await fixture();
  await migratePrototype(reference);
  const operations=reference.trace;
  assert.ok(operations.length>=9,'trace includes stage and commit');
  const commitIndex=operations.findIndex(x=>x.op==='set'&&x.key===AUTH);
  assert.ok(commitIndex>0,'authority set must be final persistent write');
  let cases=0;
  for(let i=0;i<operations.length;i++){
    const phases=operations[i].op==='set'?['before','after']:['before'];
    for(const phase of phases){
      const s=await fixture(),before=v1raw(s);
      s.arm(i,phase);
      await assert.rejects(migratePrototype(s),/INJECTED/);
      s.clear();
      assert.deepEqual(v1raw(s),before,'never mutate original v1 bytes');
      const state=await readAuthority(s);
      const committed=i===commitIndex&&phase==='after';
      assert.equal(state.source,committed?'v2':'v1',
        'only persisted authority commit may switch source');
      assert.deepEqual(state.value,ledger);
      if(!committed)assert.equal(s.data.has(AUTH),false);
      cases++;
    }
  }
  console.log('PASS RESEARCH ONLY: '+cases+' injected failures; v1 preserved; write-then-throw commit recognized');
});

test('PROTOTYPE: malformed authority, missing stage and corrupted ciphertext fail closed',async()=>{
  const s=await fixture();
  await migratePrototype(s);
  const original=s.data.get(AUTH),stage=s.data.get(STAGE);
  for(const invalid of ['{','{}',JSON.stringify({schema:999,state:'active'})]){
    s.seed(AUTH,invalid);
    await assert.rejects(readAuthority(s));
  }
  s.seed(AUTH,original);
  s.data.delete(STAGE);
  await assert.rejects(readAuthority(s),/V2_STAGE_INVALID/);
  s.seed(STAGE,stage.slice(0,-5)+'xxxxx');
  await assert.rejects(readAuthority(s),/V2_STAGE_INVALID/);
  s.seed(STAGE,stage);
  assert.equal((await readAuthority(s)).source,'v2');
  console.log('PASS RESEARCH ONLY: corrupt authority/stage never falls back to v1');
});
