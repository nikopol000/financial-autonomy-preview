'use strict';
// RESEARCH ONLY: actual Chromium tabs, origin-wide Web Locks, localStorage and
// browser AES-GCM. A disposable localhost origin and synthetic ledger are used.
// This does NOT load the production WEB bundle, migrate data or prove Safari safety.
const assert = require('node:assert/strict');
const http = require('node:http');
const {chromium} = require('playwright');

const LOCK = 'financial-autonomy.preview.v2-research-lock';
const V2 = 'financial-autonomy.preview.atomic-browser-research.v2';
const V1_KEY = 'financial-autonomy.preview.key.v1';
const V1_PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const UNSAFE = 'financial-autonomy.preview.unguarded-browser-research.v2';
const EPOCH = 'financial-autonomy.preview.epoch-browser-research.v2';
const EPOCH_V2 = 'financial-autonomy.preview.epoch-record-browser-research.v2';

async function install(page) {
  await page.evaluate(({LOCK,V2,V1_KEY,V1_PAYLOAD,UNSAFE,EPOCH,EPOCH_V2}) => {
    const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2,'0')).join('');
    const fromHex = s => new Uint8Array(s.match(/../g).map(x => parseInt(x,16)));
    const enc = new TextEncoder(), dec = new TextDecoder();
    async function seal(state) {
      const key = crypto.getRandomValues(new Uint8Array(32));
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const imported = await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
      const cipher = new Uint8Array(await crypto.subtle.encrypt(
        {name:'AES-GCM',iv:nonce},imported,enc.encode(JSON.stringify(state))));
      return JSON.stringify({v:2,key:hex(key),nonce:hex(nonce),cipher:hex(cipher)});
    }
    async function unseal(raw) {
      const env = JSON.parse(raw);
      if(env.v!==2)throw Error('Invalid research envelope');
      const key = await crypto.subtle.importKey('raw',fromHex(env.key),'AES-GCM',false,['decrypt']);
      return JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:fromHex(env.nonce)},key,fromHex(env.cipher))));
    }
    window.__research = {
      writes:0,epochWrites:0,events:[],holding:false,unsafeHolding:false,
      async read(key=V2) {
        const raw = localStorage.getItem(key);
        return raw===null ? null : {raw,state:await unseal(raw)};
      },
      async save(state,expected,hold=false,fault=null) {
        if(!navigator.locks || typeof navigator.locks.request!=='function')
          return {ok:false,reason:'lock-unavailable'};
        return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
          const current=localStorage.getItem(V2);
          if(current!==expected)return {ok:false,reason:'stale'};
          if(hold) {
            window.__research.holding=true;
            await new Promise(resolve => window.__research.release=resolve);
          }
          const raw=await seal(state);
          if(fault==='before')throw Error('synthetic-v2-write-rejected-before-commit');
          localStorage.setItem(V2,raw);
          window.__research.writes++;
          if(fault==='after')throw Error('synthetic-v2-ack-lost-after-commit');
          return {ok:true,raw};
        });
      },
      // Hypothetical epoch contract ONLY. Does not modify production storage.
      // A reset must not return a revision to null without a generation check.
      async epochRead() {
        const epoch=localStorage.getItem(EPOCH);
        const raw=localStorage.getItem(EPOCH_V2);
        if(epoch===null)return {ok:false,reason:'epoch-missing'};
        if(localStorage.getItem(V1_KEY)!==null || localStorage.getItem(V1_PAYLOAD)!==null)
          return {ok:false,reason:'legacy-footprint'};
        if(raw===null)return {ok:true,epoch,raw:null,state:null};
        try {
          const state=await unseal(raw);
          if(state.__epoch!==epoch)return {ok:false,reason:'epoch-mismatch'};
          return {ok:true,epoch,raw,state};
        } catch(_error) {
          return {ok:false,reason:'unauthenticated'};
        }
      },
      async epochSave(state,expectedEpoch,expectedRaw) {
        if(!navigator.locks?.request)return {ok:false,reason:'lock-unavailable'};
        return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
          const epoch=localStorage.getItem(EPOCH);
          if(epoch===null || epoch!==expectedEpoch)
            return {ok:false,reason:'stale-epoch'};
          if(localStorage.getItem(V1_KEY)!==null || localStorage.getItem(V1_PAYLOAD)!==null)
            return {ok:false,reason:'legacy-footprint'};
          if(localStorage.getItem(EPOCH_V2)!==expectedRaw)
            return {ok:false,reason:'stale-revision'};
          const raw=await seal({...state,__epoch:epoch});
          localStorage.setItem(EPOCH_V2,raw);
          window.__research.epochWrites++;
          return {ok:true,raw};
        });
      },
      async epochReset(faultAfterEpoch=false) {
        if(!navigator.locks?.request)return {ok:false,reason:'lock-unavailable'};
        return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
          if(localStorage.getItem(EPOCH)===null)
            return {ok:false,reason:'epoch-missing'};
          const next=crypto.randomUUID();
          localStorage.setItem(EPOCH,next);
          if(faultAfterEpoch)throw Error('synthetic-reset-interrupted-after-epoch');
          localStorage.removeItem(EPOCH_V2);
          return {ok:true,epoch:next};
        });
      },
      async unsafeSave(state,expected,hold=false) {
        // Deliberately UNSAFE: check-then-async-write is not atomic across tabs.
        if(localStorage.getItem(UNSAFE)!==expected)return {ok:false,reason:'stale'};
        if(hold) {
          window.__research.unsafeHolding=true;
          await new Promise(resolve => window.__research.unsafeRelease=resolve);
        }
        const raw=await seal(state);
        localStorage.setItem(UNSAFE,raw);
        window.__research.writes++;
        return {ok:true,raw};
      },
      async guardedRead() {
        // This is a research guard, not an approved migration contract.
        if(localStorage.getItem(V1_KEY)!=='synthetic-v2-fence')
          return {ok:false,reason:'fence-absent-or-reset-ambiguous'};
        const current=await window.__research.read();
        return {ok:true,state:current.state};
      }
    };
    window.addEventListener('storage',e => {
      if(e.key===V2)window.__research.events.push({key:e.key,newValue:e.newValue});
    });
  },{LOCK,V2,V1_KEY,V1_PAYLOAD,UNSAFE,EPOCH,EPOCH_V2});
}

async function main() {
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><title>Disposable Web Locks research</title>');
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

    // Keep an actual pre-reset in-memory draft and its null revision in tab B.
    // A later reset can return storage to null (ABA) even under Web Locks.
    const staleNullRevision=await b.evaluate(()=>localStorage.getItem(
      'financial-autonomy.preview.atomic-browser-research.v2'));
    assert.equal(staleNullRevision,null);
    await b.evaluate(()=>{window.__research.preResetDraft={transactions:['draft-before-reset']};});

    // Real browser queue: both tabs start from the same empty revision.
    const first=a.evaluate(()=>window.__research.save({transactions:['A']},null,true));
    await a.waitForFunction(()=>window.__research.holding);
    const second=b.evaluate(()=>window.__research.save({transactions:['B']},null));
    await a.waitForFunction(async name =>
      (await navigator.locks.query()).pending.some(x=>x.name===name),
      LOCK,{timeout:10000});
    await a.evaluate(()=>window.__research.release());
    const [ra,rb]=await Promise.all([first,second]);
    assert.equal(ra.ok,true);
    assert.deepEqual(rb,{ok:false,reason:'stale'});
    assert.deepEqual((await b.evaluate(()=>window.__research.read())).state,
      {transactions:['A']});
    assert.equal(await b.evaluate(()=>window.__research.writes),0,
      'Stale tab must not write ciphertext');
    await b.waitForFunction(()=>window.__research.events.length>0);
    console.log('PASS Chromium real tabs: exclusive Web Lock queues, rechecks and rejects stale write with zero writes');
    console.log('PASS Chromium real tabs: native StorageEvent reports committed v2 bytes');

    const next=await b.evaluate(raw =>
      window.__research.save({transactions:['A','B']},raw),ra.raw);
    assert.equal(next.ok,true);
    assert.deepEqual((await a.evaluate(()=>window.__research.read())).state,
      {transactions:['A','B']});
    console.log('PASS Chromium real tabs: current revision can save after stale rejection');

    // Browser-native AES-GCM and localStorage fault matrix. An exception is
    // NOT proof that setItem did or did not commit; never blindly replay.
    const writesBeforeFaults=await a.evaluate(()=>window.__research.writes);
    const denied=await a.evaluate(raw=>window.__research.save(
      {transactions:['A','B','not-committed']},raw,false,'before'
    ).then(()=>({ok:true}),e=>({ok:false,message:e.message})),next.raw);
    assert.deepEqual(denied,{ok:false,message:'synthetic-v2-write-rejected-before-commit'});
    assert.equal(await a.evaluate(()=>window.__research.writes),writesBeforeFaults);
    assert.equal(await b.evaluate(()=>localStorage.getItem(
      'financial-autonomy.preview.atomic-browser-research.v2')),next.raw);
    console.log('PASS Chromium v2 fault: pre-commit error preserves authenticated bytes with zero write');

    const ambiguous=await a.evaluate(raw=>window.__research.save(
      {transactions:['A','B','C']},raw,false,'after'
    ).then(()=>({ok:true}),e=>({ok:false,message:e.message})),next.raw);
    assert.deepEqual(ambiguous,{ok:false,message:'synthetic-v2-ack-lost-after-commit'});
    assert.equal(await a.evaluate(()=>window.__research.writes),writesBeforeFaults+1);
    const committed=await b.evaluate(()=>window.__research.read());
    assert.deepEqual(committed.state,{transactions:['A','B','C']});
    assert.notEqual(committed.raw,next.raw);
    const writesBeforeRetry=await a.evaluate(()=>window.__research.writes);
    const staleRetry=await a.evaluate(raw=>window.__research.save(
      {transactions:['A','B','C']},raw),next.raw);
    assert.deepEqual(staleRetry,{ok:false,reason:'stale'});
    assert.equal(await a.evaluate(()=>window.__research.writes),writesBeforeRetry);
    assert.equal((await a.evaluate(()=>window.__research.read())).raw,committed.raw);
    console.log('PASS Chromium v2 fault: post-commit error authenticates current bytes; stale retry performs zero writes');

    // Known-unsafe counterexample: both pass a check before either writes.
    const ua=a.evaluate(()=>window.__research.unsafeSave({transactions:['A']},null,true));
    const ub=b.evaluate(()=>window.__research.unsafeSave({transactions:['B']},null,true));
    await Promise.all([
      a.waitForFunction(()=>window.__research.unsafeHolding),
      b.waitForFunction(()=>window.__research.unsafeHolding)
    ]);
    await b.evaluate(()=>window.__research.unsafeRelease());
    const rbUnsafe=await ub;
    await a.evaluate(()=>window.__research.unsafeRelease());
    const raUnsafe=await ua;
    assert.equal(rbUnsafe.ok,true);
    assert.equal(raUnsafe.ok,true);
    assert.deepEqual((await a.evaluate(()=>window.__research.read(
      'financial-autonomy.preview.unguarded-browser-research.v2'))).state,
      {transactions:['A']});
    console.log('PASS KNOWN UNSAFE Chromium: unguarded async check/write loses tab B transaction (hazard, not fix)');

    // Cached legacy reset does not know the hypothetical v2 key.
    await a.evaluate(key=>localStorage.setItem(key,'synthetic-v2-fence'),V1_KEY);
    assert.equal((await a.evaluate(()=>window.__research.guardedRead())).ok,true);
    await b.evaluate(keys=>keys.forEach(k=>localStorage.removeItem(k)),
      [V1_KEY,V1_PAYLOAD,RESET]);
    assert.equal((await a.evaluate(()=>window.__research.guardedRead())).reason,
      'fence-absent-or-reset-ambiguous');
    assert.deepEqual((await a.evaluate(()=>window.__research.read())).state,
      {transactions:['A','B','C']},
      'Naive v2-only reader could still resurrect intentionally reset data');
    console.log('PASS KNOWN UNSAFE Chromium: cached-v1-style reset removes fence, leaves decryptable v2; guarded reader quarantines');

    // KNOWN UNSAFE: the same null revision exists before the first write AND
    // after a naive v2 reset that removes the only v2 key. Exclusive Web Locks
    // serialize these calls, but cannot distinguish the two generations.
    const beforeReset=await a.evaluate(()=>window.__research.read());
    assert.deepEqual(beforeReset.state,{transactions:['A','B','C']});
    await a.evaluate(async ({LOCK,V2})=>navigator.locks.request(
      LOCK,{mode:'exclusive'},()=>localStorage.removeItem(V2)),{LOCK,V2});
    assert.equal(await b.evaluate(()=>window.__research.read()),null);
    const staleAfterReset=await b.evaluate(expected=>window.__research.save(
      window.__research.preResetDraft,expected),staleNullRevision);
    assert.equal(staleAfterReset.ok,true,
      'KNOWN UNSAFE: stale null revision can create a ledger after reset');
    assert.deepEqual((await a.evaluate(()=>window.__research.read())).state,
      {transactions:['draft-before-reset']});
    assert.equal((await a.evaluate(()=>window.__research.guardedRead())).reason,
      'fence-absent-or-reset-ambiguous',
      'Research-only fence guard must still quarantine the unsafe new record');
    console.log('PASS KNOWN UNSAFE Chromium: null-revision ABA after locked reset accepts pre-reset draft; fence guard quarantines (hazard, not fix)');
    // RESEARCH ONLY: persistent epoch distinguishes an initial null revision
    // from the identical null revision after an intentional reset (ABA).
    await a.evaluate(async ({LOCK,EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD}) =>
      navigator.locks.request(LOCK,{mode:'exclusive'},() => {
        localStorage.removeItem(V1_KEY);
        localStorage.removeItem(V1_PAYLOAD);
        localStorage.removeItem(EPOCH_V2);
        localStorage.setItem(EPOCH,crypto.randomUUID());
      }),{LOCK,EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD});
    const oldEpochSnapshot=await b.evaluate(()=>window.__research.epochRead());
    assert.equal(oldEpochSnapshot.ok,true);
    assert.equal(oldEpochSnapshot.raw,null);
    const epochSaved=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['before-reset']},snapshot.epoch,snapshot.raw),oldEpochSnapshot);
    assert.equal(epochSaved.ok,true);
    const resetEpoch=await a.evaluate(()=>window.__research.epochReset());
    assert.equal(resetEpoch.ok,true);
    assert.notEqual(resetEpoch.epoch,oldEpochSnapshot.epoch);
    const epochWritesBeforeStale=await b.evaluate(()=>window.__research.epochWrites);
    const staleEpochAttempt=await b.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['draft-before-reset']},snapshot.epoch,snapshot.raw),oldEpochSnapshot);
    assert.deepEqual(staleEpochAttempt,{ok:false,reason:'stale-epoch'});
    assert.equal(await b.evaluate(()=>window.__research.epochWrites),epochWritesBeforeStale);
    const freshEpochSnapshot=await a.evaluate(()=>window.__research.epochRead());
    assert.equal(freshEpochSnapshot.ok,true);
    assert.equal(freshEpochSnapshot.raw,null);
    assert.equal(freshEpochSnapshot.epoch,resetEpoch.epoch);
    console.log('PASS Chromium research epoch: reset changes null generation; stale pre-reset tab rejected with zero writes');

    const newGeneration=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['new-generation-only']},snapshot.epoch,snapshot.raw),freshEpochSnapshot);
    assert.equal(newGeneration.ok,true);
    assert.deepEqual((await b.evaluate(()=>window.__research.epochRead())).state.transactions,
      ['new-generation-only']);
    console.log('PASS Chromium research epoch: current-generation new ledger authenticates after reset');

    const beforeInterruptedWrites=await a.evaluate(()=>window.__research.epochWrites);
    const interrupted=await a.evaluate(()=>window.__research.epochReset(true)
      .then(()=>({ok:true}),error=>({ok:false,message:error.message})));
    assert.deepEqual(interrupted,{ok:false,message:'synthetic-reset-interrupted-after-epoch'});
    assert.equal((await b.evaluate(()=>window.__research.epochRead())).reason,
      'epoch-mismatch','Old ciphertext must be quarantined after partial reset');
    const staleInterrupted=await a.evaluate(({epoch,raw})=>window.__research.epochSave(
      {transactions:['replay']},epoch,raw),{epoch:freshEpochSnapshot.epoch,raw:newGeneration.raw});
    assert.deepEqual(staleInterrupted,{ok:false,reason:'stale-epoch'});
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),beforeInterruptedWrites);
    console.log('PASS Chromium research epoch: interrupted reset quarantines old ciphertext and rejects stale replay');

    // Cached v1 writers do not consult this new epoch. Even when the new
    // reader refuses a mixed footprint, old tabs can still write v1 keys.
    await b.evaluate(({V1_KEY,V1_PAYLOAD})=>{
      localStorage.setItem(V1_KEY,'synthetic-cached-legacy-key');
      localStorage.setItem(V1_PAYLOAD,'synthetic-cached-legacy-payload');
    },{V1_KEY,V1_PAYLOAD});
    assert.equal((await a.evaluate(()=>window.__research.epochRead())).reason,
      'legacy-footprint');
    const activeEpoch=await a.evaluate(key=>localStorage.getItem(key),EPOCH);
    const blockedLegacy=await a.evaluate(({epoch,EPOCH_V2})=>window.__research.epochSave(
      {transactions:['not-written']},epoch,localStorage.getItem(EPOCH_V2)
    ),{epoch:activeEpoch,EPOCH_V2});
    assert.deepEqual(blockedLegacy,{ok:false,reason:'legacy-footprint'});
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),beforeInterruptedWrites);
    console.log('PASS KNOWN UNSAFE Chromium: cached v1 can still write legacy keys; new epoch reader/writer quarantine mixed footprint (migration blocker)');

  } finally {
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
