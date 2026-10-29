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
    // Research-only shape check: a UUID is NOT proof of reset provenance.
    const validEpoch = value => typeof value==='string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
        if(epoch===null)return {ok:false,reason:'epoch-missing'};
        if(!validEpoch(epoch))return {ok:false,reason:'epoch-invalid'};
        const raw=localStorage.getItem(EPOCH_V2);
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
          if(epoch!==null && !validEpoch(epoch))
            return {ok:false,reason:'epoch-invalid'};
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
          const epoch=localStorage.getItem(EPOCH);
          if(epoch===null)return {ok:false,reason:'epoch-missing'};
          if(!validEpoch(epoch))return {ok:false,reason:'epoch-invalid'};
          const next=crypto.randomUUID();
          localStorage.setItem(EPOCH,next);
          if(faultAfterEpoch)throw Error('synthetic-reset-interrupted-after-epoch');
          localStorage.removeItem(EPOCH_V2);
          return {ok:true,epoch:next};
        });
      },
      // RESEARCH ONLY: destructive reset must prove the CURRENT ciphertext
      // belongs to the CURRENT epoch and matches the caller's snapshot.
      // This guards against a syntactically valid but foreign epoch marker;
      // it does NOT fence cached v1 clients or authenticate an empty vault.
      async epochResetChecked(expectedEpoch,expectedRaw) {
        if(!navigator.locks?.request)return {ok:false,reason:'lock-unavailable'};
        return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
          const epoch=localStorage.getItem(EPOCH);
          if(epoch===null)return {ok:false,reason:'epoch-missing'};
          if(!validEpoch(epoch))return {ok:false,reason:'epoch-invalid'};
          if(epoch!==expectedEpoch)return {ok:false,reason:'stale-epoch'};
          if(localStorage.getItem(V1_KEY)!==null || localStorage.getItem(V1_PAYLOAD)!==null)
            return {ok:false,reason:'legacy-footprint'};
          const raw=localStorage.getItem(EPOCH_V2);
          if(raw!==expectedRaw)return {ok:false,reason:'stale-revision'};
          if(raw!==null) {
            let state;
            try { state=await unseal(raw); }
            catch(_error) { return {ok:false,reason:'unauthenticated'}; }
            if(state.__epoch!==epoch)return {ok:false,reason:'epoch-mismatch'};
          }
          const next=crypto.randomUUID();
          localStorage.setItem(EPOCH,next);
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

    // RESEARCH ONLY: repeat reset must rotate the epoch even after a
    // previously interrupted reset; no stale draft may be accepted.
    await a.evaluate(({V1_KEY,V1_PAYLOAD})=>{
      localStorage.removeItem(V1_KEY);
      localStorage.removeItem(V1_PAYLOAD);
    },{V1_KEY,V1_PAYLOAD});
    const epochBeforeRetry=await a.evaluate(key=>localStorage.getItem(key),EPOCH);
    const repeatedOnce=await a.evaluate(()=>window.__research.epochReset());
    assert.equal(repeatedOnce.ok,true);
    assert.notEqual(repeatedOnce.epoch,epochBeforeRetry);
    assert.deepEqual(await b.evaluate(()=>window.__research.epochRead()),{
      ok:true,epoch:repeatedOnce.epoch,raw:null,state:null
    });
    const repeatedTwice=await b.evaluate(()=>window.__research.epochReset());
    assert.equal(repeatedTwice.ok,true);
    assert.notEqual(repeatedTwice.epoch,repeatedOnce.epoch);
    const epochWritesBeforeRepeatedStale=await a.evaluate(()=>window.__research.epochWrites);
    const repeatedStale=await a.evaluate(epoch=>window.__research.epochSave(
      {transactions:['stale-repeat-reset']},epoch,null),repeatedOnce.epoch);
    assert.deepEqual(repeatedStale,{ok:false,reason:'stale-epoch'});
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),epochWritesBeforeRepeatedStale);
    const repeatedFresh=await b.evaluate(epoch=>window.__research.epochSave(
      {transactions:['fresh-after-two-resets']},epoch,null),repeatedTwice.epoch);
    assert.equal(repeatedFresh.ok,true);
    assert.deepEqual((await a.evaluate(()=>window.__research.epochRead())).state.transactions,
      ['fresh-after-two-resets']);
    console.log('PASS Chromium research epoch: repeated resets rotate generation, reject stale draft, and accept only fresh ledger');

    // An evicted/missing marker is NOT a clean first run: keep the encrypted
    // bytes untouched and reject both a write and an attempted reset.
    const encryptedBeforeEviction=await a.evaluate(key=>localStorage.getItem(key),EPOCH_V2);
    await b.evaluate(key=>localStorage.removeItem(key),EPOCH);
    assert.deepEqual(await a.evaluate(()=>window.__research.epochRead()),{
      ok:false,reason:'epoch-missing'
    });
    const writesBeforeEvictionAttempt=await a.evaluate(()=>window.__research.epochWrites);
    const evictedSave=await a.evaluate(({epoch,raw})=>window.__research.epochSave(
      {transactions:['must-not-recreate']},epoch,raw),
      {epoch:repeatedTwice.epoch,raw:repeatedFresh.raw});
    assert.deepEqual(evictedSave,{ok:false,reason:'stale-epoch'});
    assert.deepEqual(await a.evaluate(()=>window.__research.epochReset()),{
      ok:false,reason:'epoch-missing'
    });
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),writesBeforeEvictionAttempt);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),encryptedBeforeEviction);
    console.log('PASS Chromium research epoch: missing marker quarantines existing ciphertext; no write, reset or auto-bootstrap');

    // Separate disposable synthetic generation: deny marker reads in one tab.
    // A SecurityError must never be coerced into a missing/clean marker.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const markerBeforeDenial=await a.evaluate(key=>localStorage.getItem(key),EPOCH);
    const deniedMarker=await a.evaluate(async ({EPOCH})=>{
      const original=Storage.prototype.getItem;
      Storage.prototype.getItem=function(key) {
        if(key===EPOCH)throw new DOMException('synthetic marker read denied','SecurityError');
        return original.call(this,key);
      };
      try {
        const capture=async fn=>fn().then(()=>({ok:true}),
          e=>({ok:false,name:e.name,message:e.message}));
        return {
          read:await capture(()=>window.__research.epochRead()),
          save:await capture(()=>window.__research.epochSave(
            {transactions:['must-not-write']},'any',null)),
          reset:await capture(()=>window.__research.epochReset())
        };
      } finally {
        Storage.prototype.getItem=original;
      }
    },{EPOCH});
    for(const operation of ['read','save','reset']){
      assert.deepEqual(deniedMarker[operation],{
        ok:false,name:'SecurityError',message:'synthetic marker read denied'
      },operation+' must fail closed rather than treat denied read as clean storage');
    }
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),writesBeforeEvictionAttempt,
      'Denied marker read must not add a ciphertext write');
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH),markerBeforeDenial);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),null);
    console.log('PASS Chromium research epoch: denied marker read blocks load/save/reset; no ciphertext write or false clean state');
    
    // Corrupted epoch markers must never become a clean bootstrap even if
    // ciphertext is still present. A UUID shape check is only a minimal guard:
    // a different well-formed UUID remains a provenance/legacy-client problem.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const cleanEpoch=await a.evaluate(()=>window.__research.epochRead());
    const beforeCorrupt=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['before-corruption']},snapshot.epoch,snapshot.raw),cleanEpoch);
    assert.equal(beforeCorrupt.ok,true);
    await b.evaluate(key=>localStorage.setItem(key,'invalid-marker'),EPOCH);
    assert.deepEqual(await a.evaluate(()=>window.__research.epochRead()),
      {ok:false,reason:'epoch-invalid'});
    const writesBeforeCorrupt=await a.evaluate(()=>window.__research.epochWrites);
    assert.deepEqual(await b.evaluate(()=>window.__research.epochSave(
      {transactions:['must-not-write']},'invalid-marker',null)),
      {ok:false,reason:'epoch-invalid'});
    assert.deepEqual(await a.evaluate(()=>window.__research.epochReset()),
      {ok:false,reason:'epoch-invalid'});
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),writesBeforeCorrupt);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),
      beforeCorrupt.raw);
    console.log('PASS Chromium research epoch: corrupt marker blocks read/save/reset without changing authenticated ciphertext');

    // Browser reports an error AFTER the reset marker setItem committed.
    // An older ciphertext still exists, but must not be reopened/replayed.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const beforeAck=await a.evaluate(()=>window.__research.epochRead());
    const savedBeforeAck=await b.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['do-not-resurrect']},snapshot.epoch,snapshot.raw),beforeAck);
    assert.equal(savedBeforeAck.ok,true);
    const ackFault=await a.evaluate(async key=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value) {
        if(name===key) {
          original.call(this,name,value);
          throw Error('synthetic-epoch-reset-ack-lost-after-commit');
        }
        return original.call(this,name,value);
      };
      try {
        return await window.__research.epochReset().then(
          ()=>({ok:true}),e=>({ok:false,message:e.message}));
      } finally {
        Storage.prototype.setItem=original;
      }
    },EPOCH);
    assert.deepEqual(ackFault,{
      ok:false,message:'synthetic-epoch-reset-ack-lost-after-commit'
    });
    const committedEpoch=await b.evaluate(key=>localStorage.getItem(key),EPOCH);
    assert.notEqual(committedEpoch,beforeAck.epoch);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),
      savedBeforeAck.raw,'Old ciphertext remains after marker committed but reset threw');
    assert.deepEqual(await b.evaluate(()=>window.__research.epochRead()),
      {ok:false,reason:'epoch-mismatch'});
    const writesBeforeAckRetry=await a.evaluate(()=>window.__research.epochWrites);
    assert.deepEqual(await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['unsafe-replay']},snapshot.epoch,snapshot.raw),
      {epoch:beforeAck.epoch,raw:savedBeforeAck.raw}),
      {ok:false,reason:'stale-epoch'});
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),
      writesBeforeAckRetry);
    console.log('PASS Chromium research epoch: reset marker commits then throws; old ciphertext quarantined and stale replay refused');


    // A syntactically valid UUID from a foreign generation is not proof of
    // a legitimate reset. A mixed-version or external writer can replace it.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const foreignBaseline=await a.evaluate(()=>window.__research.epochRead());
    assert.equal(foreignBaseline.ok,true);
    const foreignSaved=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['before-foreign-epoch']},snapshot.epoch,snapshot.raw),foreignBaseline);
    assert.equal(foreignSaved.ok,true);
    const foreignEpoch=await b.evaluate(({EPOCH,old})=>{
      let replacement=crypto.randomUUID();
      while(replacement===old)replacement=crypto.randomUUID();
      localStorage.setItem(EPOCH,replacement);
      return replacement;
    },{EPOCH,old:foreignBaseline.epoch});
    assert.notEqual(foreignEpoch,foreignBaseline.epoch);
    assert.deepEqual(await b.evaluate(()=>window.__research.epochRead()),{
      ok:false,reason:'epoch-mismatch'
    });
    const writesBeforeForeign=await a.evaluate(()=>window.__research.epochWrites);
    assert.deepEqual(await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['stale-foreign']},snapshot.epoch,snapshot.raw),foreignBaseline),{
      ok:false,reason:'stale-epoch'
    });
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),writesBeforeForeign);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),
      foreignSaved.raw,'A foreign marker must not silently replace ciphertext');
    console.log('PASS Chromium research epoch: well-formed foreign UUID quarantines old ciphertext and rejects stale save');

    // KNOWN UNSAFE: epochReset only validates UUID shape, so it will accept
    // the foreign marker as authoritative and delete the authenticated record.
    // This is an intentional counterexample, NOT a production-safe reset.
    const unsafeForeignReset=await b.evaluate(()=>window.__research.epochReset());
    assert.equal(unsafeForeignReset.ok,true);
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),EPOCH_V2),null);
    assert.notEqual(unsafeForeignReset.epoch,foreignEpoch);
    console.log('PASS KNOWN UNSAFE Chromium: reset accepts unauthenticated foreign UUID and deletes v2 ciphertext (migration blocker)');

    // A denied marker write BEFORE commit must preserve the old epoch and
    // authenticated ciphertext. It is distinct from write-then-throw.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const deniedBaseline=await a.evaluate(()=>window.__research.epochRead());
    const deniedSaved=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['preserve-on-denied-reset']},snapshot.epoch,snapshot.raw),deniedBaseline);
    assert.equal(deniedSaved.ok,true);
    const writesBeforeDeniedReset=await a.evaluate(()=>window.__research.epochWrites);
    const deniedReset=await a.evaluate(async key=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value) {
        if(name===key)throw new DOMException('synthetic epoch write denied','SecurityError');
        return original.call(this,name,value);
      };
      try {
        return await window.__research.epochReset().then(
          ()=>({ok:true}),error=>({ok:false,name:error.name,message:error.message}));
      } finally {
        Storage.prototype.setItem=original;
      }
    },EPOCH);
    assert.deepEqual(deniedReset,{
      ok:false,name:'SecurityError',message:'synthetic epoch write denied'
    });
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH),
      deniedBaseline.epoch,'Pre-commit denial must not rotate epoch');
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),
      deniedSaved.raw,'Pre-commit denial must not delete ciphertext');
    assert.equal(await a.evaluate(()=>window.__research.epochWrites),writesBeforeDeniedReset);
    assert.deepEqual((await b.evaluate(()=>window.__research.epochRead())).state.transactions,
      ['preserve-on-denied-reset']);
    console.log('PASS Chromium research epoch: denied pre-commit reset marker write preserves authenticated ledger');


    // Guarded-reset alternative: UUID shape is not sufficient. A foreign
    // marker cannot authorize deletion of authenticated older ciphertext.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const checkedBase=await a.evaluate(()=>window.__research.epochRead());
    const checkedSaved=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['must-survive-foreign-marker']},snapshot.epoch,snapshot.raw),checkedBase);
    assert.equal(checkedSaved.ok,true);
    const foreignChecked=await b.evaluate(({EPOCH,old})=>{
      let replacement=crypto.randomUUID();
      while(replacement===old)replacement=crypto.randomUUID();
      localStorage.setItem(EPOCH,replacement);
      return replacement;
    },{EPOCH,old:checkedBase.epoch});
    const checkedBefore=await a.evaluate(key=>localStorage.getItem(key),EPOCH_V2);
    assert.deepEqual(await b.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),{epoch:foreignChecked,raw:checkedSaved.raw}),{
      ok:false,reason:'epoch-mismatch'
    });
    assert.deepEqual(await a.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),{epoch:checkedBase.epoch,raw:checkedSaved.raw}),{
      ok:false,reason:'stale-epoch'
    });
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),EPOCH_V2),checkedBefore);
    console.log('PASS Chromium research guarded reset: foreign valid UUID cannot delete authenticated old-epoch ciphertext');

    // In a clean synthetic generation, a caller with a stale ciphertext
    // revision cannot reset someone else's newly committed transaction.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const checkedEmpty=await b.evaluate(()=>window.__research.epochRead());
    // A previous CI attempt failed on the save below but a rerun passed.
    // Preserve fail-closed semantics: never retry or silently reinitialize.
    // Instead report the precise precondition and failure reason, including
    // the browser's actual marker/revision, for a reproducible diagnosis.
    assert.equal(checkedEmpty.ok,true,
      'Expected readable clean generation: '+JSON.stringify(checkedEmpty));
    assert.equal(checkedEmpty.raw,null,
      'Expected an empty ciphertext slot: '+JSON.stringify(checkedEmpty));
    const checkedNew=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['newer-than-reset-snapshot']},snapshot.epoch,snapshot.raw),checkedEmpty);
    if(!checkedNew.ok) {
      const actual=await a.evaluate(({EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD})=>({
        epoch:localStorage.getItem(EPOCH),
        ciphertextPresent:localStorage.getItem(EPOCH_V2)!==null,
        legacyKeyPresent:localStorage.getItem(V1_KEY)!==null,
        legacyPayloadPresent:localStorage.getItem(V1_PAYLOAD)!==null
      }),{EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD});
      assert.fail('Guarded reset research save failed: '+JSON.stringify({
        reason:checkedNew.reason,expectedEpoch:checkedEmpty.epoch,
        expectedRaw:checkedEmpty.raw,actual
      }));
    }
    assert.deepEqual(await b.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),checkedEmpty),{ok:false,reason:'stale-revision'});
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),checkedNew.raw);
    console.log('PASS Chromium research guarded reset: stale snapshot cannot delete newer authenticated transaction');

    // A matching, authenticated snapshot may reset. A stale pre-reset tab
    // must then fail, and ciphertext must remain absent after that attempt.
    const checkedCurrent=await b.evaluate(()=>window.__research.epochRead());
    const checkedReset=await b.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),checkedCurrent);
    assert.equal(checkedReset.ok,true);
    assert.notEqual(checkedReset.epoch,checkedCurrent.epoch);
    // Web Locks serialize cooperating writers, but do not guarantee that a
    // different Chromium renderer has observed both localStorage mutations.
    // Wait for the reset marker AND the absent ciphertext before asserting
    // stale-tab behavior; do not weaken the stale rejection itself.
    await a.waitForFunction(({epochKey,recordKey,expectedEpoch})=>
      localStorage.getItem(epochKey)===expectedEpoch &&
      localStorage.getItem(recordKey)===null,
      {epochKey:EPOCH,recordKey:EPOCH_V2,expectedEpoch:checkedReset.epoch},
      {timeout:10000});
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),EPOCH_V2),null);
    assert.deepEqual(await a.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),checkedCurrent),{ok:false,reason:'stale-epoch'});
    assert.deepEqual(await a.evaluate(()=>window.__research.epochRead()),{
      ok:true,epoch:checkedReset.epoch,raw:null,state:null
    });
    console.log('PASS Chromium research guarded reset: authenticated current snapshot resets once; stale retry cannot erase new generation');

    // Even if the marker matches, corrupt ciphertext is not resettable.
    const cleanAfterChecked=await a.evaluate(()=>window.__research.epochRead());
    const validAfterChecked=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['protected-against-corrupt-reset']},snapshot.epoch,snapshot.raw),cleanAfterChecked);
    assert.equal(validAfterChecked.ok,true);
    await b.evaluate(key=>localStorage.setItem(key,'{broken-ciphertext'),EPOCH_V2);
    assert.deepEqual(await a.evaluate(({epoch,EPOCH_V2})=>window.__research.epochResetChecked(
      epoch,localStorage.getItem(EPOCH_V2)),{epoch:checkedReset.epoch,EPOCH_V2}),{
      ok:false,reason:'unauthenticated'
    });
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),'{broken-ciphertext');
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),EPOCH),checkedReset.epoch);
    console.log('PASS Chromium research guarded reset: corrupt ciphertext cannot authorize destructive reset');


    // KNOWN UNSAFE mixed-version sequence: v2 detects a legacy footprint
    // while it exists, but cannot infer a completed v1 reset once it vanishes.
    await a.evaluate(({EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD,RESET})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.removeItem(V1_KEY);
      localStorage.removeItem(V1_PAYLOAD);
      localStorage.removeItem(RESET);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2,V1_KEY,V1_PAYLOAD,RESET});
    const beforeLegacyReset=await a.evaluate(()=>window.__research.epochRead());
    const legacySurvivor=await a.evaluate(snapshot=>window.__research.epochSave(
      {transactions:['v2-before-legacy-reset']},snapshot.epoch,snapshot.raw),beforeLegacyReset);
    assert.equal(legacySurvivor.ok,true);
    await b.evaluate(({V1_KEY,V1_PAYLOAD})=>{
      localStorage.setItem(V1_KEY,'synthetic-cached-v1-key');
      localStorage.setItem(V1_PAYLOAD,'synthetic-cached-v1-payload');
    },{V1_KEY,V1_PAYLOAD});
    assert.deepEqual(await a.evaluate(()=>window.__research.epochRead()),{
      ok:false,reason:'legacy-footprint'
    });
    await b.evaluate(({V1_KEY,V1_PAYLOAD,RESET})=>{
      localStorage.removeItem(V1_PAYLOAD);
      localStorage.removeItem(V1_KEY);
      localStorage.setItem(RESET,'committed-v1');
    },{V1_KEY,V1_PAYLOAD,RESET});
    const resurfaced=await a.evaluate(()=>window.__research.epochRead());
    assert.equal(resurfaced.ok,true);
    assert.deepEqual(resurfaced.state.transactions,['v2-before-legacy-reset']);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),EPOCH_V2),
      legacySurvivor.raw,'The legacy reset never touched v2 ciphertext');
    console.log('PASS KNOWN UNSAFE Chromium mixed-version: completed legacy reset removes footprint; naive v2 reader resurfaces old ciphertext (hazard, not fix)');

    // A checked reset still has an ambiguous commit acknowledgement. The
    // committed epoch must quarantine the old ciphertext on reload/retry.
    await a.evaluate(key=>localStorage.removeItem(key),RESET);
    const beforeCheckedAck=await a.evaluate(()=>window.__research.epochRead());
    const checkedAckFault=await a.evaluate(async ({snapshot,EPOCH})=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key===EPOCH){
          original.call(this,key,value);
          throw Error('synthetic-checked-reset-ack-lost');
        }
        return original.call(this,key,value);
      };
      try{
        return await window.__research.epochResetChecked(snapshot.epoch,snapshot.raw)
          .then(()=>({ok:true}),error=>({ok:false,message:error.message}));
      }finally{
        Storage.prototype.setItem=original;
      }
    },{snapshot:beforeCheckedAck,EPOCH});
    assert.deepEqual(checkedAckFault,{ok:false,message:'synthetic-checked-reset-ack-lost'});
    const afterCheckedAck=await b.evaluate(({EPOCH,EPOCH_V2})=>({
      epoch:localStorage.getItem(EPOCH),raw:localStorage.getItem(EPOCH_V2)
    }),{EPOCH,EPOCH_V2});
    assert.notEqual(afterCheckedAck.epoch,beforeCheckedAck.epoch);
    assert.equal(afterCheckedAck.raw,beforeCheckedAck.raw);
    assert.deepEqual(await b.evaluate(()=>window.__research.epochRead()),{
      ok:false,reason:'epoch-mismatch'
    });
    assert.deepEqual(await a.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),beforeCheckedAck),{ok:false,reason:'stale-epoch'});
    console.log('PASS Chromium research checked reset: commit-then-throw rotates epoch, quarantines ciphertext and rejects stale retry');

    // KNOWN UNSAFE provenance gap: a syntactically valid foreign marker with
    // no ciphertext can authorize checked reset because no bound envelope
    // exists. This is not evidence of lost money; it blocks claiming that
    // the reset authorization model is complete for an empty vault.
    await a.evaluate(({EPOCH,EPOCH_V2})=>{
      localStorage.removeItem(EPOCH_V2);
      localStorage.setItem(EPOCH,crypto.randomUUID());
    },{EPOCH,EPOCH_V2});
    const genuineEmpty=await a.evaluate(()=>window.__research.epochRead());
    assert.equal(genuineEmpty.raw,null);
    const foreignEmpty=await b.evaluate(({EPOCH,prior})=>{
      let other=crypto.randomUUID();
      while(other===prior)other=crypto.randomUUID();
      localStorage.setItem(EPOCH,other);
      return other;
    },{EPOCH,prior:genuineEmpty.epoch});
    const unboundEmpty=await a.evaluate(()=>window.__research.epochRead());
    assert.equal(unboundEmpty.ok,true);
    assert.equal(unboundEmpty.epoch,foreignEmpty);
    assert.equal(unboundEmpty.raw,null);
    const acceptedEmpty=await b.evaluate(snapshot=>window.__research.epochResetChecked(
      snapshot.epoch,snapshot.raw),unboundEmpty);
    assert.equal(acceptedEmpty.ok,true);
    assert.notEqual(acceptedEmpty.epoch,foreignEmpty);
    console.log('PASS KNOWN UNSAFE Chromium empty-vault: foreign valid epoch authorizes checked reset without authenticated provenance (gap, not fix)');



  } finally {
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
