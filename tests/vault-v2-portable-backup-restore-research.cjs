'use strict';
// Issue #4 — RESEARCH ONLY. No product storage migration or backup format change.
// Executes actual immutable WEB 18.62 Metro module 311 (PBKDF2/AES-GCM backup)
// and module 310 (live v1 vault) against a hypothetical, isolated v2 authority.
// All financial records, passwords, keys and faults are synthetic. This does NOT
// prove browser durability, malicious-code resistance, ABA detection or Safari.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const path=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path&&path.startsWith('_expo/static/js/web/'),'active immutable WEB bundle');
const source=fs.readFileSync(path,'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const random=n=>new Uint8Array(crypto.randomBytes(n));
const hex=x=>Buffer.from(x).toString('hex');
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const AUTH='financial-autonomy.preview.research.restore-authority.v2';
const STAGE='financial-autonomy.preview.research.restore-stage.v2.';
const PASSWORD='Synthetic-Backup-2026!';
const sample=()=>({version:4,
  accounts:[{id:'synthetic-checking',name:'Cont sintetic',opening:10000}],
  transactions:[{id:'synthetic-expense',kind:'expense',amount:2500,accountId:'synthetic-checking',date:'2026-10-28'}],
  balanceChecks:[]});
const model={
  validateState(s){
    assert.ok(s&&s.version===4,'valid v4 synthetic state');
    for(const k of ['accounts','transactions','balanceChecks'])
      assert.ok(Array.isArray(s[k]),'valid '+k);
    return s;
  },
  migrate(s){return this.validateState(s)},
  emptyState:()=>({version:4,accounts:[],transactions:[],balanceChecks:[]})
};
const sandbox={Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
  TextDecoder,TextEncoder,Buffer,setTimeout,clearTimeout,console,
  globalThis:{crypto:crypto.webcrypto}};
const cache=new Map([[204,{validateState:model.validateState}],[205,model]]);
function load(id){
  if(cache.has(id))return cache.get(id);
  const re=new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
  const matches=[...source.matchAll(re)];
  assert.equal(matches.length,1,'one immutable Metro module '+id);
  const hit=matches[0],start=source.lastIndexOf('__d(function(',hit.index);
  assert.ok(start>=0,'module factory '+id);
  const fn=vm.runInNewContext('('+source.slice(start+4,hit.index+1)+')',sandbox);
  const deps=hit[1]?hit[1].split(',').map(Number):[];
  const module={exports:{}};
  cache.set(id,module.exports);
  fn(sandbox.globalThis,load,()=>{},null,module,module.exports,deps);
  cache.set(id,module.exports);
  return module.exports;
}
const crypt=load(311),vault=load(310);
class Store{
  constructor(){this.data=new Map();this.trace=[];this.n=0;this.fault=null;this.writes=0}
  seed(k,v){this.data.set(k,String(v))}
  arm(index,phase){this.trace=[];this.n=0;this.fault={index,phase}}
  disarm(){this.trace=[];this.n=0;this.fault=null}
  call(op,k,fn){
    const n=this.n++;this.trace.push({op,key:k});
    if(this.fault?.index===n&&this.fault.phase==='before')throw Error('INJECTED before '+op);
    const result=fn();
    if(this.fault?.index===n&&this.fault.phase==='after')throw Error('INJECTED after '+op);
    return result;
  }
  getItem(k){return this.call('get',k,()=>this.data.has(k)?this.data.get(k):null)}
  setItem(k,v){return this.call('set',k,()=>{this.writes++;this.seed(k,v)})}
  removeItem(k){return this.call('remove',k,()=>{this.writes++;this.data.delete(k)})}
}
const v1bytes=s=>[KEY,PAYLOAD,RESET].map(k=>s.data.get(k)??null);
function fixture(){
  const s=new Store();
  vault.saveWebVault(s,sample(),random);
  s.disarm();
  return s;
}
function sealStage(value){
  const k=random(32);
  try{return JSON.stringify({key:hex(k),payload:crypt.seal(JSON.stringify(value),k,random)})}
  finally{k.fill(0)}
}
function unsealStage(raw){
  const obj=JSON.parse(raw);
  if(!/^[0-9a-f]{64}$/.test(obj.key)||typeof obj.payload!=='string')throw Error('STAGE_INVALID');
  const k=new Uint8Array(Buffer.from(obj.key,'hex'));
  try{return model.validateState(JSON.parse(crypt.unseal(obj.payload,k)))}
  finally{k.fill(0)}
}
function readAuthority(s){
  const raw=s.getItem(AUTH);
  if(raw===null)return {source:'v1',value:vault.loadWebVault(s)};
  let a;
  try{a=JSON.parse(raw)}catch{throw Error('AUTH_MALFORMED')}
  if(a.schema!==2||typeof a.revision!=='string')throw Error('AUTH_UNKNOWN');
  if(a.state==='reset')return {source:'v2-reset',value:null};
  if(a.state!=='active'||typeof a.stageKey!=='string'||
    !a.stageKey.startsWith(STAGE)||typeof a.stageDigest!=='string')
    throw Error('AUTH_UNKNOWN');
  const staged=s.getItem(a.stageKey);
  if(staged===null||digest(staged)!==a.stageDigest)throw Error('STAGE_MISSING_OR_CHANGED');
  return {source:'v2',value:unsealStage(staged),revision:a.revision};
}
// This prototype is deliberately NOT exported to the product. Explicit
// confirmation, Web Locks availability and an exact expected authority are
// mandatory; v1 is never written or deleted. Real Web Locks are not simulated.
function confirmRestore(s,validated,{confirmed,locksAvailable,expectedAuth,revision,expectedV1}){
  if(!confirmed)throw Error('CONFIRMATION_REQUIRED');
  if(!locksAvailable)throw Error('WEB_LOCKS_REQUIRED');
  model.validateState(validated);
  if(!/^[a-z0-9-]+$/.test(revision))throw Error('INVALID_REVISION');
  if(s.getItem(AUTH)!==expectedAuth)throw Error('STALE_AUTHORITY');
  if(digest(v1bytesFromStore(s))!==digest(expectedV1))throw Error('V1_CHANGED');
  const stageKey=STAGE+revision;
  if(s.getItem(stageKey)!==null)throw Error('STAGE_EXISTS');
  const staged=sealStage(validated);
  s.setItem(stageKey,staged);
  const persisted=s.getItem(stageKey);
  if(persisted!==staged)throw Error('STAGE_MISMATCH');
  assert.deepEqual(clone(unsealStage(persisted)),clone(validated));
  if(s.getItem(AUTH)!==expectedAuth)throw Error('STALE_AUTHORITY');
  if(digest(v1bytesFromStore(s))!==digest(expectedV1))throw Error('V1_CHANGED');
  // The sole authority switch is one localStorage write. If it persists then
  // throws, reload sees the new state; otherwise the old authority survives.
  s.setItem(AUTH,JSON.stringify({schema:2,state:'active',revision,stageKey,stageDigest:digest(staged)}));
}
function v1bytesFromStore(s){return [KEY,PAYLOAD,RESET].map(k=>s.getItem(k))}
function opts(s,revision){
  return {confirmed:true,locksAvailable:true,expectedAuth:s.data.get(AUTH)??null,
    expectedV1:v1bytes(s),revision};
}
async function makeBackup(){
  const text=await crypt.backup(sample(),PASSWORD,random);
  return {text,validated:clone(await crypt.restore(text,PASSWORD))};
}
test('real immutable module-311 portable backup: NFKC, rejection and zero storage mutation',async()=>{
  const {text,validated}=await makeBackup();
  assert.deepEqual(validated,sample());
  assert.ok(!text.includes('synthetic-checking'),'backup ciphertext must not leak ledger identifiers');
  const normalized=await crypt.backup(sample(),'Ｓynthetic-Backup-2026!',random);
  assert.deepEqual(clone(await crypt.restore(normalized,PASSWORD)),sample(),'NFKC password compatibility');
  const env=JSON.parse(text),s=fixture(),before=v1bytes(s),writes=s.writes;
  const invalid=[
    ['wrong password',()=>crypt.restore(text,'Incorrect-Password-2026')],
    ['unsupported version',()=>crypt.restore(JSON.stringify({...env,version:2}),PASSWORD)],
    ['unsupported kdf',()=>crypt.restore(JSON.stringify({...env,kdf:'other'}),PASSWORD)],
    ['truncated salt',()=>crypt.restore(JSON.stringify({...env,salt:env.salt.slice(2)}),PASSWORD)],
    ['truncated nonce',()=>crypt.restore(JSON.stringify({...env,nonce:env.nonce.slice(2)}),PASSWORD)],
    ['tampered ciphertext',()=>crypt.restore(JSON.stringify({...env,data:(env.data[0]==='0'?'1':'0')+env.data.slice(1)}),PASSWORD)],
    ['malformed JSON',()=>crypt.restore('{',PASSWORD)],
    ['oversized file',()=>crypt.restore('x'.repeat(8000001),PASSWORD)]
  ];
  for(const [name,fn] of invalid){
    await assert.rejects(fn(),undefined,name);
    assert.deepEqual(v1bytes(s),before,name+' must not alter v1 bytes');
    assert.equal(s.writes,writes,name+' must not write storage');
  }
  // Independently generate an authentic AES-GCM backup containing invalid v4
  // state to exercise real restore validation, not only GCM tag verification.
  const salt=crypto.randomBytes(16),nonce=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(PASSWORD.normalize('NFKC'),salt,600000,32,'sha256');
  const cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);
  cipher.setAAD(Buffer.from('FinancialAutonomy/backup/1'));
  const invalidState={...sample(),accounts:'invalid-not-array'};
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(invalidState)),cipher.final(),cipher.getAuthTag()]);
  key.fill(0);
  const bad=JSON.stringify({...env,salt:salt.toString('hex'),nonce:nonce.toString('hex'),data:ciphertext.toString('hex')});
  await assert.rejects(crypt.restore(bad,PASSWORD));
  assert.deepEqual(v1bytes(s),before);
  assert.equal(s.writes,writes);
  console.log('PASS RESEARCH ONLY: real module-311 PBKDF2/AES-GCM backup, NFKC, nine invalid inputs, zero writes');
});
test('explicit restore preview and lock/authority gate never write before confirmation',async()=>{
  const {validated}=await makeBackup(),s=fixture(),baseline=v1bytes(s),start=s.writes;
  for(const overrides of [{confirmed:false},{locksAvailable:false},{expectedAuth:'stale'}]){
    assert.throws(()=>confirmRestore(s,validated,{...opts(s,'restore-gate'),...overrides}));
    assert.deepEqual(v1bytes(s),baseline);
    assert.equal(s.writes,start);
  }
  confirmRestore(s,validated,opts(s,'restore-1'));
  assert.equal(readAuthority(s).source,'v2');
  assert.deepEqual(clone(readAuthority(s).value),sample());
  assert.deepEqual(v1bytes(s),baseline,'v1 preserved after v2 commit');
  assert.throws(()=>confirmRestore(s,validated,{...opts(s,'restore-2'),expectedAuth:null}),/STALE_AUTHORITY/);
  console.log('PASS RESEARCH ONLY: preview/confirmation, lock availability, stale authority fail closed');
});
test('initial v1 -> v2 restore faults: only persisted final authority write changes active ledger',async()=>{
  const {validated}=await makeBackup(),reference=fixture();
  confirmRestore(reference,validated,opts(reference,'restore-fault'));
  const operations=reference.trace;
  const final=operations.findLastIndex(x=>x.op==='set'&&x.key===AUTH);
  assert.equal(final,operations.length-1,'final write is authority');
  let cases=0;
  for(let i=0;i<operations.length;i++)for(const phase of operations[i].op==='set'?['before','after']:['before']){
    const s=fixture(),original=v1bytes(s);
    s.arm(i,phase);
    assert.throws(()=>confirmRestore(s,validated,opts(s,'restore-fault')),/INJECTED/);
    s.disarm();
    assert.deepEqual(v1bytes(s),original,'v1 ciphertext/key/reset must remain untouched');
    const current=readAuthority(s);
    const committed=i===final&&phase==='after';
    assert.equal(current.source,committed?'v2':'v1');
    assert.deepEqual(clone(current.value),sample());
    cases++;
  }
  assert.ok(cases>=10,'reads, stage write and authority write covered');
  console.log('PASS RESEARCH ONLY: '+cases+' injected read/write faults; v1 intact; write-then-throw authority recognized');
});
test('v2 reset tombstone: explicit restore commits atomically; stale v1 cannot auto-resurrect',async()=>{
  const {validated}=await makeBackup(),s=fixture(),original=v1bytes(s);
  const tombstone=JSON.stringify({schema:2,state:'reset',revision:'reset-1'});
  s.seed(AUTH,tombstone);
  assert.equal(readAuthority(s).source,'v2-reset');
  s.seed(PAYLOAD,'legacy-stale-tab-recreated-payload');
  assert.equal(readAuthority(s).source,'v2-reset','v1 reappearance ignored');
  const changedV1=v1bytes(s);
  const candidate=opts(s,'restore-after-reset');
  assert.equal(candidate.expectedAuth,tombstone);
  s.arm(0,'before');
  assert.throws(()=>confirmRestore(s,validated,candidate),/INJECTED/);
  s.disarm();
  assert.equal(readAuthority(s).source,'v2-reset');
  confirmRestore(s,validated,candidate);
  assert.equal(readAuthority(s).source,'v2');
  assert.deepEqual(clone(readAuthority(s).value),sample());
  assert.deepEqual(v1bytes(s),changedV1,'divergent v1 remains recoverable, never auto-selected');
  assert.notDeepEqual(v1bytes(s),original,'legacy divergence deliberately retained');
  console.log('PASS RESEARCH ONLY: explicit post-reset restore; legacy resurrection never becomes authority');
});
