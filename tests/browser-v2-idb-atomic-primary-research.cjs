'use strict';
// #4 RESEARCH ONLY: one IndexedDB transaction for encrypted authority + state.
// Synthetic ledger, fixed TEST-ONLY crypto key, disposable localhost origin.
// This does NOT establish key provenance, durable flush, or rollback resistance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');

async function install(page){
  await page.evaluate(()=>{
    const DB='research.atomic.primary',STORE='vault';
    const encoder=new TextEncoder(),decoder=new TextDecoder();
    const testKey=()=>crypto.subtle.importKey('raw',new Uint8Array(32).fill(7),
      'AES-GCM',false,['encrypt','decrypt']); // NEVER use this key in production
    const seal=async value=>{
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const bytes=new Uint8Array(await crypto.subtle.encrypt(
        {name:'AES-GCM',iv},await testKey(),encoder.encode(JSON.stringify(value))));
      return {iv:Array.from(iv),cipher:Array.from(bytes)};
    };
    const unseal=async envelope=>JSON.parse(decoder.decode(await crypto.subtle.decrypt(
      {name:'AES-GCM',iv:new Uint8Array(envelope.iv)},await testKey(),
      new Uint8Array(envelope.cipher))));
    const open=()=>new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const raw=async()=>{
      const db=await open();
      try{return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get('current');
        req.onsuccess=()=>resolve(req.result??null);
        req.onerror=()=>reject(req.error);tx.onabort=()=>reject(tx.error);
      });}finally{db.close();}
    };
    // TEST-ONLY cutover witness: a digest, never the v1 encryption key itself.
    // This detects divergence on the next v2 operation; it cannot prevent an
    // archived tab writing immediately AFTER the last check/commit.
    const legacyPair=()=>[
      localStorage.getItem('financial-autonomy.preview.key.v1'),
      localStorage.getItem('financial-autonomy.preview.payload.v1')
    ];
    const legacyFingerprint=async pair=>{
      const hash=await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(pair)));
      return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    };
    const research=window.__atomicResearch={};
    research.raw=raw;
    research.read=async()=>{
      const record=await raw();
      if(!record)throw Error('MISSING_AUTHORITY');
      if(!Number.isSafeInteger(record.revision)||record.revision<1)
        throw Error('BAD_REVISION');
      const value=await unseal(record.envelope);
      if(record.legacyFingerprint!==await legacyFingerprint(legacyPair()))
        throw Error('LEGACY_DIVERGED');
      if(!['active','reset'].includes(value.status)||
        (value.status==='reset'&&value.state!==null))
        throw Error('BAD_STATE');
      return {revision:record.revision,...value};
    };
    research.write=async({expectedRevision,state=null,reset=false,fault=null,
      allowInitialize=false})=>{
      // Authenticate the existing envelope BEFORE opening a write transaction.
      // Never await WebCrypto while a live IndexedDB transaction is active.
      // Explicit initialization is needed: missing authority is NOT a blank ledger.
      const observed=await raw();
      if(!observed){
        if(!allowInitialize||expectedRevision!==0)
          return {ok:false,reason:'missing-authority'};
      }else{
        if(!Number.isSafeInteger(observed.revision)||observed.revision<1)
          return {ok:false,reason:'invalid-authority'};
        try{
          const prior=await unseal(observed.envelope);
          if(!['active','reset'].includes(prior.status)||
            (prior.status==='reset'&&prior.state!==null))
            throw Error('BAD_STATE');
        }catch(_){
          return {ok:false,reason:'unreadable-authority'};
        }
      }
      // Preflight is asynchronous (WebCrypto), so recheck the exact v1 pair
      // synchronously inside the transaction before committing the IDB record.
      const v1Observed=legacyPair();
      const v1Digest=await legacyFingerprint(v1Observed);
      if(observed&&observed.legacyFingerprint!==v1Digest)
        return {ok:false,reason:'legacy-diverged'};
      const envelope=await seal({status:reset?'reset':'active',state:reset?null:state});
      // RESEARCH ONLY: another authenticated writer replaces the record
      // with different ciphertext but the SAME revision after our async
      // preflight. The transaction must compare the full observed snapshot,
      // not just the revision. This injected rival write is deliberate.
      if(fault==='same-revision-authenticated-substitution'&&observed){
        const substitutedEnvelope=await seal({
          status:'active',state:{transactions:['external-authenticated-writer']}
        });
        const rival=await open();
        try{await new Promise((resolve,reject)=>{
          const tx=rival.transaction(STORE,'readwrite');
          tx.objectStore(STORE).put({...observed,envelope:substitutedEnvelope},'current');
          tx.oncomplete=resolve;
          tx.onabort=()=>reject(tx.error);
          tx.onerror=()=>reject(tx.error);
        });}finally{rival.close();}
      }
      const db=await open();
      try{return await new Promise((resolve,reject)=>{
        let outcome=null,completed=false;
        const tx=db.transaction(STORE,'readwrite');
        const store=tx.objectStore(STORE);
        const req=store.get('current');
        req.onsuccess=()=>{
          const old=req.result??null;
          const actual=old?old.revision:0;
          if(actual!==expectedRevision){
            outcome={ok:false,reason:'stale-revision',actualRevision:actual};
            tx.abort();return;
          }
          // The same revision with different ciphertext is also a conflict.
          // Compare bytes/snapshot synchronously inside the transaction.
          if(JSON.stringify(old)!==JSON.stringify(observed)){
            outcome={ok:false,reason:'authority-changed'};tx.abort();return;
          }
          // An injected change models a legacy write during the async preflight.
          // A real v1 tab can still write after this synchronous check.
          if(fault==='legacy-drift-before-commit')
            localStorage.setItem('financial-autonomy.preview.payload.v1',
              (v1Observed[1]??'')+'synthetic-race');
          if(JSON.stringify(legacyPair())!==JSON.stringify(v1Observed)){
            outcome={ok:false,reason:'legacy-raced'};tx.abort();return;
          }
          if(fault==='before-put'){
            outcome={ok:false,reason:'injected-before-put'};tx.abort();return;
          }
          store.put({revision:actual+1,envelope,legacyFingerprint:v1Digest},'current');
          // A cached WEB v1 tab can synchronously write AFTER our final
          // localStorage check but BEFORE the IDB transaction commits.
          // This is a KNOWN UNSAFE inter-store race, not a mitigation.
          if(fault==='legacy-drift-after-put')
            localStorage.setItem('financial-autonomy.preview.payload.v1',
              (v1Observed[1]??'')+'synthetic-after-check');
          if(fault==='after-put-before-commit'){
            outcome={ok:false,reason:'injected-after-put'};tx.abort();
          }
        };
        req.onerror=()=>reject(req.error);
        tx.oncomplete=()=>{completed=true;resolve({ok:true,revision:expectedRevision+1});};
        tx.onabort=()=>resolve(outcome??{ok:false,reason:'transaction-aborted'});
        tx.onerror=()=>{if(!completed&&tx.error)reject(tx.error);};
      });}finally{db.close();}
    };
    research.deleteForTest=async()=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).delete('current');
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });}finally{db.close();}
    };
    research.restoreOldForTest=async record=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put(record,'current');
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });}finally{db.close();}
    };
  });
}
const archivedPaths={
  '18.27':'_expo/static/js/web/index-v01827-vault-orphan-guard-20261023.js',
  '18.33':'_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js',
  '18.34':'_expo/static/js/web/index-v01834-multitab-vault-guard-20261024.js'
};
const syntheticTx=id=>({id,kind:'expense',amount:100,date:'2026-10-29',accountId:'synthetic'});
const syntheticEmpty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
function extract(source){
  const modules={};
  function visit(id){
    if(id===204||id===205||modules[id])return;
    const matches=[...source.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
    assert.equal(matches.length,1,'Missing or duplicate Metro module '+id);
    const match=matches[0];
    const start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,'Metro factory missing for '+id);
    const deps=match[1]?match[1].split(',').map(Number):[];
    modules[id]={factory:source.slice(start+4,match.index+1),deps};
    deps.forEach(visit);
  }
  visit(309);
  assert.ok(modules[309]&&modules[310]&&modules[311],
    'Must execute real platform, vault and cryptographic adapter');
  return modules;
}

async function installLegacy(page,modules){
  await page.evaluate(defs=>{
    const model={
      emptyState:()=>({version:4,accounts:[],transactions:[],balanceChecks:[]}),
      migrate(s){model.validateState(s);return s},
      validateState(s){
        if(!s||s.version!==4||!['accounts','transactions','balanceChecks']
          .every(k=>Array.isArray(s[k])))throw Error('INVALID_SYNTHETIC_STATE');
        return s;
      },
      saveTransaction:(s,t)=>({...s,transactions:[...s.transactions,t]})
    };
    const cache=new Map([[204,{validateState:model.validateState}],[205,model]]);
    function load(id){
      if(cache.has(id))return cache.get(id);
      const def=defs[id];
      if(!def)throw Error('MISSING_METRO_MODULE_'+id);
      // Trusted immutable repository source, evaluated only on a disposable
      // localhost origin; this is NOT a generic user-input code evaluator.
      const factory=Function('return ('+def.factory+')')();
      const module={exports:{}};
      cache.set(id,module.exports);
      factory(window,load,()=>{},null,module,module.exports,def.deps);
      cache.set(id,module.exports);
      return module.exports;
    }
    window.__archivedVault=load(309);
    if(!window.__archivedVault?.load||!window.__archivedVault?.save)
      throw Error('ARCHIVED_PLATFORM_EXPORTS_MISSING');
  },modules);
}



/*
 * Migration-gap characterization, not a migration implementation:
 * execute actual immutable WEB 18.27/18.33/18.34 vault+crypto adapters
 * on the SAME disposable browser origin as the IDB-primary research.
 * Only the financial model is synthetic. A current IDB writer does not
 * yet bind its authority to legacy v1 ciphertext; this test documents
 * the resulting unsafe reset after an archived writer changes v1.
 */
async function testRealArchivedDriftAgainstIdb(browser,url){
  for(const version of ['18.27','18.33','18.34']){
    const context=await browser.newContext();
    try{
      const old=await context.newPage(),modern=await context.newPage();
      await Promise.all([old.goto(url),modern.goto(url)]);
      await installLegacy(old,extract(fs.readFileSync(archivedPaths[version],'utf8')));
      await install(modern);
      await old.evaluate(()=>window.__archivedVault.load());
      await old.evaluate(s=>window.__archivedVault.save(s),
        {...syntheticEmpty(),transactions:[syntheticTx('legacy-initial')]});
      const before=await old.evaluate(()=>[
        localStorage.getItem('financial-autonomy.preview.key.v1'),
        localStorage.getItem('financial-autonomy.preview.payload.v1')
      ]);
      assert.ok(before[0]&&before[1],
        'actual archived AES-GCM v1 pair required, not demo-only state');
      const staged=await modern.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:0,allowInitialize:true,
        state:{transactions:['synthetic-staged-from-v1']}
      }));
      assert.deepEqual(staged,{ok:true,revision:1});
      const latest=await old.evaluate(()=>window.__archivedVault.load());
      await old.evaluate(s=>window.__archivedVault.save(s),{
        ...latest,transactions:[...latest.transactions,syntheticTx('legacy-after-idb')]
      });
      const after=await old.evaluate(()=>[
        localStorage.getItem('financial-autonomy.preview.key.v1'),
        localStorage.getItem('financial-autonomy.preview.payload.v1')
      ]);
      assert.ok(after[0]&&after[1]);
      assert.notEqual(after[1],before[1],
        'archived writer must really change v1 encrypted payload');
      const stagedRaw=await modern.evaluate(()=>window.__atomicResearch.raw());
      await assert.rejects(modern.evaluate(()=>window.__atomicResearch.read()),
        /LEGACY_DIVERGED/);
      const blocked=await modern.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:1,reset:true
      }));
      assert.deepEqual(blocked,{ok:false,reason:'legacy-diverged'});
      assert.deepEqual(await modern.evaluate(()=>window.__atomicResearch.raw()),
        stagedRaw,'divergence must not mutate IDB authority');
      // A partial v1 key-only or payload-only fault must also block writes.
      for(const slot of [0,1]){
        // The real archived writer reuses its v1 key, so mixing old/new
        // key bytes is NOT necessarily a key-only fault. Inject each
        // partial fault explicitly, and restore the pristine pair after.
        await old.evaluate(({slot,before})=>{
          const keys=['financial-autonomy.preview.key.v1',
            'financial-autonomy.preview.payload.v1'];
          keys.forEach((key,i)=>localStorage.setItem(key,
            before[i]+(i===slot?'-synthetic-partial-fault':'')));
        },{slot,before});
        const partial=await modern.evaluate(()=>window.__atomicResearch.write({
          expectedRevision:1,reset:true
        }));
        assert.deepEqual(partial,{ok:false,reason:'legacy-diverged'});
        assert.deepEqual(await modern.evaluate(()=>window.__atomicResearch.raw()),
          stagedRaw);
      }
      // Recreate the exact initial pair only in this disposable test origin.
      await old.evaluate(before=>{
        localStorage.setItem('financial-autonomy.preview.key.v1',before[0]);
        localStorage.setItem('financial-autonomy.preview.payload.v1',before[1]);
      },before);
      assert.deepEqual((await modern.evaluate(()=>window.__atomicResearch.read())).state,
        {transactions:['synthetic-staged-from-v1']});
      console.log('PASS guarded atomic IDB + real archived '+version+
        ': full and partial v1 drift block reset with zero IDB writes');
    }finally{await context.close();}
  }
}

async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>synthetic atomic IndexedDB vault</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext();
    try{
      const url='http://127.0.0.1:'+server.address().port+'/';
      const a=await context.newPage(),b=await context.newPage();
      await Promise.all([a.goto(url),b.goto(url)]);
      await Promise.all([install(a),install(b)]);
      const first=await a.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:0,allowInitialize:true,state:{transactions:['A']}}));
      assert.deepEqual(first,{ok:true,revision:1});
      assert.deepEqual((await b.evaluate(()=>window.__atomicResearch.read())).state,
        {transactions:['A']});
      console.log('PASS atomic IDB: encrypted initial commit readable across tabs');

      const original=await a.evaluate(()=>window.__atomicResearch.raw());
      const concurrent=await Promise.all([
        a.evaluate(()=>window.__atomicResearch.write({
          expectedRevision:1,state:{transactions:['A','B']}})),
        b.evaluate(()=>window.__atomicResearch.write({
          expectedRevision:1,state:{transactions:['A','C']}}))
      ]);
      assert.equal(concurrent.filter(x=>x.ok).length,1);
      assert.equal(concurrent.filter(x=>x.reason==='stale-revision').length,1);
      const after=await a.evaluate(()=>window.__atomicResearch.read());
      assert.equal(after.revision,2);
      assert.equal(after.state.transactions.length,2);
      assert.equal(after.state.transactions[0],'A');
      assert.ok(['B','C'].includes(after.state.transactions[1]));
      console.log('PASS atomic IDB: concurrent stale writer rejects, one transaction commits');

      for(const fault of ['before-put','after-put-before-commit']){
        assert.equal((await b.evaluate(({revision,fault})=>
          window.__atomicResearch.write({expectedRevision:revision,reset:true,fault}),
          {revision:2,fault})).ok,false);
        assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.read()),after);
      }
      console.log('PASS atomic IDB: both injected precommit reset faults retain ledger');

      const beforeCorruption=await a.evaluate(()=>window.__atomicResearch.raw());
      await a.evaluate(record=>window.__atomicResearch.restoreOldForTest(record),
        {revision:2,envelope:{iv:[0],cipher:[0]}});
      await assert.rejects(
        a.evaluate(()=>window.__atomicResearch.read()),/decrypt|OperationError|failed|error/i);
      const refused=await b.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:2,reset:true}));
      assert.deepEqual(refused,{ok:false,reason:'unreadable-authority'});
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.raw()),
        {revision:2,envelope:{iv:[0],cipher:[0]}});
      await a.evaluate(record=>window.__atomicResearch.restoreOldForTest(record),
        beforeCorruption);
      assert.deepEqual(await b.evaluate(()=>window.__atomicResearch.read()),after);
      console.log('PASS atomic IDB: corrupt encrypted authority blocks reset without overwrite');

      const reset=await b.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:2,reset:true}));
      assert.deepEqual(reset,{ok:true,revision:3});
      await a.reload();await install(a);
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.read()),
        {revision:3,status:'reset',state:null});
      console.log('PASS atomic IDB: committed reset tombstone survives reload');

      const stale=await a.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:2,state:{transactions:['resurrected']}}));
      assert.deepEqual(stale,{ok:false,reason:'stale-revision',actualRevision:3});
      assert.equal((await b.evaluate(()=>window.__atomicResearch.read())).status,'reset');
      console.log('PASS atomic IDB: pre-reset stale writer cannot resurrect ledger');

      const tombstone=await a.evaluate(()=>window.__atomicResearch.raw());
      await a.evaluate(()=>window.__atomicResearch.deleteForTest());
      const noImplicitInit=await b.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:0,state:{transactions:['silently-resurrected']}}));
      assert.deepEqual(noImplicitInit,{ok:false,reason:'missing-authority'});
      assert.equal(await b.evaluate(()=>window.__atomicResearch.raw()),null);
      await a.evaluate(record=>window.__atomicResearch.restoreOldForTest(record),
        tombstone);
      assert.equal((await b.evaluate(()=>window.__atomicResearch.read())).status,'reset');
      console.log('PASS atomic IDB: missing authority cannot auto-initialize after reset');

      const denied=await b.evaluate(async()=>{
        Object.defineProperty(indexedDB,'open',{configurable:true,value:()=>{
          throw Error('TEST_IDB_DENIED');
        }});
        try{
          await window.__atomicResearch.write({
            expectedRevision:3,state:{transactions:['denied']}});
          return 'UNEXPECTED_SUCCESS';
        }catch(e){return e.message;}
        finally{delete indexedDB.open;}
      });
      assert.equal(denied,'TEST_IDB_DENIED');
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.raw()),tombstone);
      console.log('PASS atomic IDB: storage denial fails without modifying sealed tombstone');

      const beforeRaced=await a.evaluate(()=>window.__atomicResearch.raw());
      const raced=await a.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:3,reset:true,fault:'legacy-drift-before-commit'
      }));
      assert.deepEqual(raced,{ok:false,reason:'legacy-raced'});
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.raw()),beforeRaced);
      await assert.rejects(a.evaluate(()=>window.__atomicResearch.read()),
        /LEGACY_DIVERGED/);
      await a.evaluate(()=>localStorage.removeItem(
        'financial-autonomy.preview.payload.v1'));
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.raw()),beforeRaced);
      console.log('PASS atomic IDB: injected legacy precommit race aborts without IDB write');

      // Deterministic adversarial schedule: the old client writes just AFTER
      // the last synchronous v1 check. The IDB reset commits despite drift.
      // Subsequent reads and resets quarantine the divergent pair, but the
      // already committed reset cannot be retroactively made atomic.
      const late=await a.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:3,reset:true,fault:'legacy-drift-after-put'
      }));
      assert.deepEqual(late,{ok:true,revision:4});
      const lateRecord=await b.evaluate(()=>window.__atomicResearch.raw());
      assert.equal(lateRecord.revision,4);
      await assert.rejects(b.evaluate(()=>window.__atomicResearch.read()),
        /LEGACY_DIVERGED/);
      const quarantined=await b.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:4,reset:true
      }));
      assert.deepEqual(quarantined,{ok:false,reason:'legacy-diverged'});
      assert.deepEqual(await a.evaluate(()=>window.__atomicResearch.raw()),lateRecord,
        'subsequent rejection must not mutate the committed authority');
      // A fresh page load must not silently treat a divergent old-tab write
      // as an empty vault or as permission to reset again. Both encrypted
      // stores are preserved byte-for-byte while the conflict is unresolved.
      const legacyAfterLate=await a.evaluate(()=>localStorage.getItem(
        'financial-autonomy.preview.payload.v1'));
      assert.ok(legacyAfterLate?.includes('synthetic-after-check'));
      await b.reload();await install(b);
      assert.equal(await b.evaluate(()=>localStorage.getItem(
        'financial-autonomy.preview.payload.v1')),legacyAfterLate);
      assert.deepEqual(await b.evaluate(()=>window.__atomicResearch.raw()),lateRecord);
      await assert.rejects(b.evaluate(()=>window.__atomicResearch.read()),
        /LEGACY_DIVERGED/);
      const afterReload=await b.evaluate(()=>window.__atomicResearch.write({
        expectedRevision:4,reset:true
      }));
      assert.deepEqual(afterReload,{ok:false,reason:'legacy-diverged'});
      assert.deepEqual(await b.evaluate(()=>window.__atomicResearch.raw()),lateRecord);
      assert.equal(await b.evaluate(()=>localStorage.getItem(
        'financial-autonomy.preview.payload.v1')),legacyAfterLate);
      console.log('PASS atomic IDB: reload retains divergent v1 bytes and quarantines reset without writes');
      await a.evaluate(()=>localStorage.removeItem(
        'financial-autonomy.preview.payload.v1'));
      assert.deepEqual(await b.evaluate(()=>window.__atomicResearch.read()),
        {revision:4,status:'reset',state:null});
      console.log('PASS KNOWN UNSAFE atomic IDB: late legacy write can race a committed reset; later operations quarantine');

      // Demonstrates the fundamental limit of local-only freshness.
      await a.evaluate(record=>window.__atomicResearch.restoreOldForTest(record),original);
      assert.deepEqual((await b.evaluate(()=>window.__atomicResearch.read())).state,
        {transactions:['A']});
      console.log('PASS KNOWN UNSAFE atomic IDB: valid old-record rollback remains possible');

      // A revision-only compare would silently erase this independent
      // authenticated replacement. It must reject the proposed reset and
      // preserve the rival's valid encrypted record byte-for-byte.
      const sameRevisionRejected=await b.evaluate(()=>
        window.__atomicResearch.write({
          expectedRevision:1,reset:true,
          fault:'same-revision-authenticated-substitution'
        }));
      assert.deepEqual(sameRevisionRejected,{ok:false,reason:'authority-changed'});
      const sameRevisionSurvivor=await a.evaluate(()=>window.__atomicResearch.raw());
      assert.equal(sameRevisionSurvivor.revision,1);
      assert.notDeepEqual(sameRevisionSurvivor,original,
        'the injected authenticated rival must really replace ciphertext');
      const survivingState=await a.evaluate(()=>window.__atomicResearch.read());
      assert.equal(survivingState.status,'active');
      assert.deepEqual(survivingState.state,
        {transactions:['external-authenticated-writer']});
      assert.deepEqual(await b.evaluate(()=>window.__atomicResearch.raw()),
        sameRevisionSurvivor,
        'rejected reset must not overwrite the rival ciphertext');
      console.log('PASS atomic IDB: authenticated same-revision replacement blocks stale reset and preserves rival ciphertext');
    }finally{await context.close();}
    await testRealArchivedDriftAgainstIdb(browser,
      'http://127.0.0.1:'+server.address().port+'/?fa_real=1');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
