'use strict';
/*
 * RESEARCH ONLY — #35. A bounded same-session retry of an interrupted first
 * encrypted write after a known WEB 18.50 idle-v2 reset epoch.
 *
 * This is an isolated state-machine experiment, NOT active WEB code. It uses
 * synthetic Node AES-GCM ciphertext (not the bundled Metro vault implementation)
 * and a simulated exclusive lock. It does NOT solve virgin KEY-only after reload,
 * old pre-epoch tabs, browser eviction, power loss, or backup recovery.
 *
 * Never automatically delete KEY, PAYLOAD, RESET or replay a reset vault.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const IDLE='idle-v2:'+'a'.repeat(32);
const IDLE_RE=/^idle-v2:[0-9a-f]{32}$/;

function storage(seed={}) {
  const data={...seed},fault={read:null,write:null},events=[];
  return {
    data,fault,events,
    getItem(k){if(fault.read?.(k))throw Error('SecurityError');return Object.hasOwn(data,k)?data[k]:null},
    setItem(k,v){if(fault.write?.(k))throw Error('QuotaExceededError');data[k]=String(v);events.push(['set',k])},
    removeItem(){throw Error('Prototype must never delete encrypted data')}
  };
}
function lock() {
  let tail=Promise.resolve();
  return {request(name,opts,fn){
    assert.equal(name,'financial-autonomy.preview.vault.v1');
    assert.equal(opts.mode,'exclusive');
    const next=tail.then(fn);tail=next.catch(()=>{});return next;
  }};
}
function encrypt(value,key) {
  const nonce=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),nonce);
  const bytes=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return JSON.stringify({nonce:nonce.toString('hex'),data:bytes.toString('hex'),tag:cipher.getAuthTag().toString('hex')});
}
function decrypt(payload,key) {
  const x=JSON.parse(payload),d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(x.nonce,'hex'));
  d.setAuthTag(Buffer.from(x.tag,'hex'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(x.data,'hex')),d.final()]).toString('utf8'));
}
function session(s,l) {
  const pending=new Map();
  const read=()=>({key:s.getItem(KEY),payload:s.getItem(PAYLOAD),reset:s.getItem(RESET)});
  function epoch(v) {
    if(!IDLE_RE.test(v??''))throw Error('No verified idle-v2 epoch: fail closed');
  }
  async function firstWrite(value) {
    return l.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>{
      const before=read();epoch(before.reset);
      if(before.key!==null||before.payload!==null)throw Error('Existing vault footprint: fail closed');
      const key=crypto.randomBytes(32).toString('hex'),payload=encrypt(value,key),handle=Symbol('in-memory-only');
      // Retain pending bytes ONLY inside this still-running session. This is not
      // proof that a previous KEY-only footprint is a new first save.
      pending.set(handle,{key,payload,reset:before.reset});
      try {
        s.setItem(KEY,key);
        s.setItem(PAYLOAD,payload);
        if(s.getItem(KEY)!==key||s.getItem(PAYLOAD)!==payload||s.getItem(RESET)!==before.reset)
          throw Error('Post-write revision mismatch');
        pending.delete(handle);
        return {status:'committed'};
      } catch {
        return {status:'uncertain',handle};
      }
    });
  }
  async function retry(handle) {
    return l.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},()=>{
      const p=pending.get(handle);
      if(!p)throw Error('No in-memory proof: fail closed');
      const now=read();epoch(now.reset);
      if(now.reset!==p.reset||now.key!==p.key||
         (now.payload!==null&&now.payload!==p.payload))
        throw Error('Changed authority: fail closed');
      // A nonconforming write-then-throw shim may already have committed.
      // Authenticate the exact pending bytes before declaring success.
      if(now.payload===p.payload) {
        decrypt(now.payload,now.key);pending.delete(handle);
        return 'already-committed';
      }
      s.setItem(PAYLOAD,p.payload);
      const after=read();
      if(after.reset!==p.reset||after.key!==p.key||after.payload!==p.payload)
        throw Error('Post-retry revision mismatch');
      decrypt(after.payload,after.key);pending.delete(handle);
      return 'committed-on-retry';
    });
  }
  return {firstWrite,retry};
}
const ledger=()=>({version:4,accounts:[],transactions:[{id:'synthetic-only'}],balanceChecks:[]});
const snapshot=s=>JSON.stringify(s.data);
const noMutation=(s,before,writes)=>{assert.equal(snapshot(s),before);assert.equal(s.events.length,writes)};

test('post-reset PAYLOAD quota fault: same live session can retry exact encrypted bytes',async()=>{
  const s=storage({[RESET]:IDLE}),l=lock(),a=session(s,l);
  s.fault.write=k=>k===PAYLOAD;
  const r=await a.firstWrite(ledger());assert.equal(r.status,'uncertain');
  assert.match(s.getItem(KEY),/^[0-9a-f]{64}$/);assert.equal(s.getItem(PAYLOAD),null);
  s.fault.write=null;assert.equal(await a.retry(r.handle),'committed-on-retry');
  assert.deepEqual(decrypt(s.getItem(PAYLOAD),s.getItem(KEY)),ledger());
  assert.equal(s.getItem(RESET),IDLE);
  await assert.rejects(a.retry(r.handle),/No in-memory proof/);
});
test('KEY write denied: do not auto-initialize or replace on retry',async()=>{
  const s=storage({[RESET]:IDLE}),a=session(s,lock());
  s.fault.write=k=>k===KEY;
  const r=await a.firstWrite(ledger());assert.equal(r.status,'uncertain');
  const before=snapshot(s),writes=s.events.length;s.fault.write=null;
  await assert.rejects(a.retry(r.handle),/Changed authority/);
  noMutation(s,before,writes);
});
test('PAYLOAD write-then-throw: authenticated existing payload is recognized without a second write',async()=>{
  const s=storage({[RESET]:IDLE}),a=session(s,lock()),original=s.setItem.bind(s);
  s.setItem=(k,v)=>{original(k,v);if(k===PAYLOAD)throw Error('Nonconforming shim')};
  const r=await a.firstWrite(ledger());assert.equal(r.status,'uncertain');
  const before=snapshot(s),writes=s.events.length;s.setItem=original;
  assert.equal(await a.retry(r.handle),'already-committed');
  noMutation(s,before,writes);
});
test('different KEY or PAYLOAD is dual authority, never overwritten',async()=>{
  for(const key of [KEY,PAYLOAD]){
    const s=storage({[RESET]:IDLE}),a=session(s,lock());
    s.fault.write=k=>k===PAYLOAD;
    const r=await a.firstWrite(ledger());s.fault.write=null;
    s.setItem(key,'external-value');
    const before=snapshot(s),writes=s.events.length;
    await assert.rejects(a.retry(r.handle),/Changed authority/);
    noMutation(s,before,writes);
  }
});
test('changed reset epoch or pending reset forbids replay',async()=>{
  for(const marker of ['idle-v2:'+'b'.repeat(32),'pending-v2:'+'c'.repeat(32),'committed-v1']){
    const s=storage({[RESET]:IDLE}),a=session(s,lock());
    s.fault.write=k=>k===PAYLOAD;const r=await a.firstWrite(ledger());s.fault.write=null;
    s.setItem(RESET,marker);const before=snapshot(s),writes=s.events.length;
    await assert.rejects(a.retry(r.handle),/fail closed/);
    noMutation(s,before,writes);
  }
});
test('denied storage read prevents retry and preserves all bytes',async()=>{
  const s=storage({[RESET]:IDLE}),a=session(s,lock());
  s.fault.write=k=>k===PAYLOAD;const r=await a.firstWrite(ledger());s.fault.write=null;
  const before=snapshot(s),writes=s.events.length;s.fault.read=k=>k===RESET;
  await assert.rejects(a.retry(r.handle),/SecurityError/);
  noMutation(s,before,writes);
});
test('reloaded session has no retry authority for existing KEY-only footprint',async()=>{
  const s=storage({[RESET]:IDLE}),l=lock(),a=session(s,l);
  s.fault.write=k=>k===PAYLOAD;const r=await a.firstWrite(ledger());s.fault.write=null;
  const before=snapshot(s),writes=s.events.length,b=session(s,l);
  await assert.rejects(b.retry(r.handle),/No in-memory proof/);
  await assert.rejects(b.firstWrite(ledger()),/Existing vault footprint/);
  noMutation(s,before,writes);
});
test('no durable epoch or unknown marker cannot start this bounded experiment',async()=>{
  for(const seed of [{}, {[RESET]:'committed-v1'}, {[RESET]:'idle-v2:bad'}]){
    const s=storage(seed),a=session(s,lock()),before=snapshot(s);
    await assert.rejects(a.firstWrite(ledger()),/No verified idle-v2 epoch/);
    noMutation(s,before,0);
  }
});
