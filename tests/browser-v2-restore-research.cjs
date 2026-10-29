'use strict';
// Issue #4 — RESEARCH ONLY. Disposable localhost origin, two real Chromium tabs,
// Web Locks, WebCrypto AES-GCM, synthetic records. No product module or user data.
// This is a protocol characterization, NOT a production migration or Safari proof.
const assert = require('node:assert/strict');
const http = require('node:http');
const {chromium} = require('playwright');

const LOCK = 'fa.research.v2.restore.lock';
const AUTH = 'fa.research.v2.restore.authority';
const STAGE = 'fa.research.v2.restore.stage.';
const V1KEY = 'fa.research.legacy.key';
const V1PAY = 'fa.research.legacy.payload';

async function install(page) {
  await page.evaluate(({LOCK,AUTH,STAGE,V1KEY,V1PAY}) => {
    const encoder = new TextEncoder(), decoder = new TextDecoder();
    const hex = data => Array.from(data, b => b.toString(16).padStart(2,'0')).join('');
    const fromHex = str => new Uint8Array(str.match(/../g).map(x => parseInt(x,16)));
    const legacy = () => JSON.stringify([localStorage.getItem(V1KEY),localStorage.getItem(V1PAY)]);
    async function digest(value) {
      return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
    }
    async function seal(state) {
      const rawKey=crypto.getRandomValues(new Uint8Array(32));
      const nonce=crypto.getRandomValues(new Uint8Array(12));
      const key=await crypto.subtle.importKey('raw',rawKey,'AES-GCM',false,['encrypt']);
      const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,encoder.encode(JSON.stringify(state)));
      return JSON.stringify({key:hex(rawKey),nonce:hex(nonce),cipher:hex(new Uint8Array(cipher))});
    }
    async function unseal(raw) {
      const value=JSON.parse(raw);
      const key=await crypto.subtle.importKey('raw',fromHex(value.key),'AES-GCM',false,['decrypt']);
      return JSON.parse(decoder.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:fromHex(value.nonce)},key,fromHex(value.cipher))));
    }
    const r=window.__restoreResearch={writes:0,holding:false};
    r.legacy=legacy;
    r.snapshot=() => ({authority:localStorage.getItem(AUTH),legacy:legacy()});
    r.read=async () => {
      const raw=localStorage.getItem(AUTH);
      if(raw===null)return {source:'legacy',authority:null};
      const record=JSON.parse(raw);
      if(record.schema!==2 || !['active','reset'].includes(record.status))
        throw Error('UNKNOWN_AUTHORITY');
      if(record.status==='reset')return {source:'reset',authority:raw};
      if(typeof record.stage!=='string' || !record.stage.startsWith(STAGE))
        throw Error('INVALID_STAGE_REF');
      const staged=localStorage.getItem(record.stage);
      if(staged===null || await digest(staged)!==record.digest)
        throw Error('STAGE_CHANGED');
      return {source:'v2',authority:raw,state:await unseal(staged),
        legacyDiverged:legacy()!==record.legacy};
    };
    r.restore=async (state,expected,confirmed,hold=false,fault=null) => {
      if(!confirmed)return {ok:false,reason:'confirmation-required'};
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
        if(localStorage.getItem(AUTH)!==expected.authority)
          return {ok:false,reason:'stale-authority'};
        if(legacy()!==expected.legacy)
          return {ok:false,reason:'legacy-diverged'};
        if(hold) {
          r.holding=true;
          await new Promise(resolve=>r.release=resolve);
        }
        const stage=STAGE+crypto.randomUUID();
        const sealed=await seal(state);
        localStorage.setItem(stage,sealed);r.writes++;
        if(localStorage.getItem(stage)!==sealed || JSON.stringify(await unseal(sealed))!==JSON.stringify(state))
          throw Error('STAGE_UNVERIFIED');
        if(localStorage.getItem(AUTH)!==expected.authority || legacy()!==expected.legacy)
          return {ok:false,reason:'changed-during-stage'};
        if(fault==='before')throw Error('SYNTHETIC_BEFORE_AUTHORITY');
        const record=JSON.stringify({schema:2,status:'active',stage,
          digest:await digest(sealed),legacy:expected.legacy,epoch:crypto.randomUUID()});
        localStorage.setItem(AUTH,record);r.writes++;
        if(fault==='after')throw Error('SYNTHETIC_AFTER_AUTHORITY');
        return {ok:true,authority:record,stage};
      });
    };
    r.reset=async (expected,confirmed) => {
      if(!confirmed)return {ok:false,reason:'confirmation-required'};
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
        if(localStorage.getItem(AUTH)!==expected)
          return {ok:false,reason:'stale-authority'};
        const current=await r.read();
        if(current.source!=='v2')return {ok:false,reason:'not-active'};
        if(current.legacyDiverged)return {ok:false,reason:'legacy-diverged'};
        const tombstone=JSON.stringify({schema:2,status:'reset',epoch:crypto.randomUUID()});
        localStorage.setItem(AUTH,tombstone);r.writes++;
        return {ok:true,authority:tombstone};
      });
    };
  },{LOCK,AUTH,STAGE,V1KEY,V1PAY});
}

// localStorage notifications can reach another renderer after the writer's
// evaluate() has returned. Synchronize *observation* before asserting a
// cross-tab read; this is NOT a production atomicity guarantee.
async function waitAuthority(page,raw) {
  await page.waitForFunction(({AUTH,raw}) => {
    if(localStorage.getItem(AUTH)!==raw)return false;
    const record=JSON.parse(raw);
    return record.status==='reset' || localStorage.getItem(record.stage)!==null;
  },{AUTH,raw},{timeout:10000});
}
async function waitLegacy(page,value) {
  await page.waitForFunction(({V1PAY,value})=>localStorage.getItem(V1PAY)===value,
    {V1PAY,value},{timeout:10000});
}

async function main() {
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>v2 restore research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    context=await browser.newContext();
    const url='http://127.0.0.1:'+server.address().port+'/';
    const a=await context.newPage(),b=await context.newPage();
    await Promise.all([a.goto(url),b.goto(url)]);
    await Promise.all([install(a),install(b)]);
    assert.equal(await a.evaluate(()=>isSecureContext),true);
    assert.equal(await b.evaluate(()=>typeof navigator.locks?.request),'function');
    await a.evaluate(({V1KEY,V1PAY})=>{
      localStorage.setItem(V1KEY,'synthetic-legacy-key');
      localStorage.setItem(V1PAY,'synthetic-legacy-ciphertext');
    },{V1KEY,V1PAY});
    const original=await a.evaluate(()=>window.__restoreResearch.snapshot());
    assert.equal(original.authority,null);

    const first=a.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['A']},snapshot,true,true),original);
    await a.waitForFunction(()=>window.__restoreResearch.holding);
    const second=b.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['B']},snapshot,true),original);
    await a.waitForFunction(async name=>
      (await navigator.locks.query()).pending.some(lock=>lock.name===name),
      LOCK,{timeout:10000});
    await a.evaluate(()=>window.__restoreResearch.release());
    const [ra,rb]=await Promise.all([first,second]);
    assert.equal(ra.ok,true);
    assert.deepEqual(rb,{ok:false,reason:'stale-authority'});
    assert.equal(await b.evaluate(()=>window.__restoreResearch.writes),0);
    assert.deepEqual((await b.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A']});
    console.log('PASS real Chromium tabs: exclusive restore lock serializes stale writer with zero writes');

    const current=await b.evaluate(()=>window.__restoreResearch.snapshot());
    const replacement=await b.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['A','B']},snapshot,true),current);
    assert.equal(replacement.ok,true);
    await waitAuthority(a,replacement.authority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B']});
    console.log('PASS real Chromium tabs: explicit fresh replacement retains previous stage');

    // A noncooperating cached-v1 writer ignores the v2 Web Lock. A visible
    // legacy mutation during staged restore must prevent authority promotion.
    // The staged ciphertext may remain orphaned; it must not become authoritative.
    await a.evaluate(()=>{window.__restoreResearch.holding=false});
    const beforeLegacyStage=await a.evaluate(()=>window.__restoreResearch.snapshot());
    const stageWritesBefore=await a.evaluate(()=>window.__restoreResearch.writes);
    const paused=a.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['should-not-commit']},snapshot,true,true),beforeLegacyStage);
    await a.waitForFunction(()=>window.__restoreResearch.holding);
    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'legacy-during-stage'),{V1PAY});
    await waitLegacy(a,'legacy-during-stage');
    await a.evaluate(()=>window.__restoreResearch.release());
    assert.deepEqual(await paused,{ok:false,reason:'changed-during-stage'});
    assert.equal(await a.evaluate(()=>window.__restoreResearch.writes),stageWritesBefore+1,
      'A rejected restore may leave one non-authoritative stage but must not commit authority');
    assert.equal((await a.evaluate(()=>window.__restoreResearch.snapshot())).authority,
      beforeLegacyStage.authority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B']});
    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'synthetic-legacy-ciphertext'),{V1PAY});
    await waitLegacy(a,'synthetic-legacy-ciphertext');
    console.log('PASS real Chromium: cached-v1 write during staging rejects authority commit; prior v2 remains');

    const denied=await a.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['not-committed']},snapshot,true,false,'before')
      .then(()=>({ok:true}),e=>({ok:false,message:e.message})),
      await a.evaluate(()=>window.__restoreResearch.snapshot()));
    assert.deepEqual(denied,{ok:false,message:'SYNTHETIC_BEFORE_AUTHORITY'});
    assert.deepEqual((await b.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B']});
    console.log('PASS real Chromium: staged write without authority commit preserves old ledger');

    const beforeAck=await b.evaluate(()=>window.__restoreResearch.snapshot());
    const ack=await b.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['A','B','C']},snapshot,true,false,'after')
      .then(()=>({ok:true}),e=>({ok:false,message:e.message})),beforeAck);
    assert.deepEqual(ack,{ok:false,message:'SYNTHETIC_AFTER_AUTHORITY'});
    const ackAuthority=(await b.evaluate(()=>window.__restoreResearch.snapshot())).authority;
    await waitAuthority(a,ackAuthority);
    const committed=await a.evaluate(()=>window.__restoreResearch.read());
    assert.deepEqual(committed.state,{transactions:['A','B','C']});
    const writesBeforeRetry=await b.evaluate(()=>window.__restoreResearch.writes);
    assert.deepEqual(await b.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['unsafe-retry']},snapshot,true),beforeAck),
      {ok:false,reason:'stale-authority'});
    assert.equal(await b.evaluate(()=>window.__restoreResearch.writes),writesBeforeRetry);
    console.log('PASS real Chromium: commit-then-throw is readable; stale retry writes nothing');

    // RESEARCH-ONLY counterexamples: the current authority pointer is a
    // plain localStorage value. A retained, valid older stage can be replayed
    // by explicit storage rollback; a digest of the stage does not authenticate
    // authority metadata or establish a monotonic epoch.
    const priorAuthority=replacement.authority;
    await b.evaluate(({AUTH,priorAuthority})=>
      localStorage.setItem(AUTH,priorAuthority),{AUTH,priorAuthority});
    await waitAuthority(a,priorAuthority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B']});
    await b.evaluate(({AUTH,ackAuthority})=>
      localStorage.setItem(AUTH,ackAuthority),{AUTH,ackAuthority});
    await waitAuthority(a,ackAuthority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B','C']});
    console.log('PASS KNOWN LIMITATION: valid older authority replay rolls back the visible ledger');

    const alteredAuthority=JSON.stringify({...JSON.parse(ackAuthority),
      epoch:'synthetic-untrusted-epoch'});
    await b.evaluate(({AUTH,alteredAuthority})=>
      localStorage.setItem(AUTH,alteredAuthority),{AUTH,alteredAuthority});
    await waitAuthority(a,alteredAuthority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B','C']});
    assert.equal((await a.evaluate(()=>window.__restoreResearch.read())).authority,
      alteredAuthority);
    await b.evaluate(({AUTH,ackAuthority})=>
      localStorage.setItem(AUTH,ackAuthority),{AUTH,ackAuthority});
    await waitAuthority(a,ackAuthority);
    console.log('PASS KNOWN LIMITATION: unauthenticated authority epoch is accepted after alteration');

    // RESEARCH ONLY: an unauthenticated authority status can be forged into a
    // reset tombstone. This hides a valid committed ledger without deleting it.
    // Do NOT mistake this characterization for a production security feature.
    const retainedStagePath=JSON.parse(ackAuthority).stage;
    const retainedStage=await a.evaluate(path=>localStorage.getItem(path),retainedStagePath);
    const forgedReset=JSON.stringify({schema:2,status:'reset',epoch:'forged-reset'});
    const writesBeforeForgery=await a.evaluate(()=>window.__restoreResearch.writes);
    await b.evaluate(({AUTH,forgedReset})=>
      localStorage.setItem(AUTH,forgedReset),{AUTH,forgedReset});
    await waitAuthority(a,forgedReset);
    assert.equal((await a.evaluate(()=>window.__restoreResearch.read())).source,'reset',
      'A forged reset currently hides the valid stage (KNOWN LIMITATION)');
    assert.equal(await a.evaluate(path=>localStorage.getItem(path),retainedStagePath),
      retainedStage,'The encrypted ledger must remain physically recoverable');
    assert.equal(await a.evaluate(()=>window.__restoreResearch.writes),writesBeforeForgery);
    await b.evaluate(({AUTH,ackAuthority})=>
      localStorage.setItem(AUTH,ackAuthority),{AUTH,ackAuthority});
    await waitAuthority(a,ackAuthority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B','C']});
    console.log('PASS KNOWN LIMITATION: forged unauthenticated reset hides a valid ledger; pointer recovery restores it');

    // Invalid authority must fail closed rather than silently treating v1 as
    // authoritative. A stale mutation attempt must leave all stages untouched.
    const malformedAuthority='{"schema":2,"status":"active"';
    await b.evaluate(({AUTH,malformedAuthority})=>
      localStorage.setItem(AUTH,malformedAuthority),{AUTH,malformedAuthority});
    await a.waitForFunction(({AUTH,malformedAuthority})=>
      localStorage.getItem(AUTH)===malformedAuthority,
      {AUTH,malformedAuthority},{timeout:10000});
    const blockedRead=await a.evaluate(async()=>{
      try {await window.__restoreResearch.read();return 'UNEXPECTED_SUCCESS';}
      catch(error){return error.name;}
    });
    assert.equal(blockedRead,'SyntaxError');
    const writesBeforeMalformed=await a.evaluate(()=>window.__restoreResearch.writes);
    assert.deepEqual(await a.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['must-not-commit']},snapshot,true),
      {authority:ackAuthority,legacy:original.legacy}),
      {ok:false,reason:'stale-authority'});
    assert.equal(await a.evaluate(()=>window.__restoreResearch.writes),writesBeforeMalformed);
    assert.equal(await a.evaluate(path=>localStorage.getItem(path),retainedStagePath),
      retainedStage);
    await b.evaluate(({AUTH,ackAuthority})=>
      localStorage.setItem(AUTH,ackAuthority),{AUTH,ackAuthority});
    await waitAuthority(a,ackAuthority);
    assert.deepEqual((await a.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B','C']});
    console.log('PASS real Chromium: malformed authority fails closed, stale restore writes nothing, valid ledger recovers');


    // Cached legacy reset/deletion can leave a KEY-only v1 tuple. The v2
    // authority must stay readable and must not silently adopt or delete v1.
    await b.evaluate(({V1PAY})=>localStorage.removeItem(V1PAY),{V1PAY});
    await waitLegacy(a,null);
    const v1KeyOnly=await a.evaluate(()=>window.__restoreResearch.read());
    assert.equal(v1KeyOnly.source,'v2');
    assert.equal(v1KeyOnly.legacyDiverged,true);
    assert.deepEqual(v1KeyOnly.state,{transactions:['A','B','C']});
    const writesBeforeKeyOnly=await a.evaluate(()=>window.__restoreResearch.writes);
    assert.deepEqual(await a.evaluate(raw=>window.__restoreResearch.reset(raw,true),
      committed.authority),{ok:false,reason:'legacy-diverged'});
    assert.equal(await a.evaluate(()=>window.__restoreResearch.writes),writesBeforeKeyOnly);
    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'synthetic-legacy-ciphertext'),{V1PAY});
    await waitLegacy(a,'synthetic-legacy-ciphertext');
    console.log('PASS real Chromium: legacy KEY-only divergence preserves v2 and blocks reset');

    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'cached-tab-change'),{V1PAY});
    await waitLegacy(a,'cached-tab-change');
    assert.equal((await a.evaluate(()=>window.__restoreResearch.read())).legacyDiverged,true);
    const beforeDivergedReset=await a.evaluate(()=>window.__restoreResearch.writes);
    assert.deepEqual(await a.evaluate(raw=>window.__restoreResearch.reset(raw,true),
      committed.authority),{ok:false,reason:'legacy-diverged'});
    assert.equal(await a.evaluate(()=>window.__restoreResearch.writes),beforeDivergedReset);
    assert.deepEqual((await b.evaluate(()=>window.__restoreResearch.read())).state,
      {transactions:['A','B','C']});
    console.log('PASS real Chromium: observable cached-v1 drift blocks destructive reset');

    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'synthetic-legacy-ciphertext'),{V1PAY});
    await waitLegacy(a,'synthetic-legacy-ciphertext');
    assert.equal((await a.evaluate(()=>window.__restoreResearch.read())).legacyDiverged,false);
    console.log('PASS KNOWN LIMITATION: v1 byte rollback hides transient edit (ABA is not detectable)');

    const reset=await a.evaluate(raw=>window.__restoreResearch.reset(raw,true),
      committed.authority);
    assert.equal(reset.ok,true);
    await waitAuthority(b,reset.authority);
    await b.evaluate(({V1PAY})=>localStorage.setItem(V1PAY,'cached-tab-resurrection'),{V1PAY});
    assert.equal((await a.evaluate(()=>window.__restoreResearch.read())).source,'reset');
    assert.deepEqual(await b.evaluate(snapshot=>window.__restoreResearch.restore(
      {transactions:['stale-pre-reset']},snapshot,true),{
        authority:committed.authority,legacy:original.legacy
      }),{ok:false,reason:'stale-authority'});
    console.log('PASS real Chromium: durable v2 tombstone refuses cached-v1 resurrection and stale restore');

    const writesBeforeNoLock=await b.evaluate(()=>window.__restoreResearch.writes);
    assert.deepEqual(await b.evaluate(async snapshot=>{
      Object.defineProperty(navigator,'locks',{configurable:true,value:undefined});
      return window.__restoreResearch.restore({transactions:['no-lock']},snapshot,true);
    },await b.evaluate(()=>window.__restoreResearch.snapshot())),
      {ok:false,reason:'locks-unavailable'});
    assert.equal(await b.evaluate(()=>window.__restoreResearch.writes),writesBeforeNoLock);
    console.log('PASS real Chromium: unavailable Web Locks fails closed with zero writes');
  } finally {
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
