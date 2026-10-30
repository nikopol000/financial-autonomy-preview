'use strict';
// #4/#29/#35 RESEARCH ONLY. Disposable Chromium origin and synthetic state.
// One IndexedDB transaction atomically stores KEY/PAYLOAD/authority and an
// operation-specific witness. NOT production, anti-rollback, or a recovery UI.
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');
async function install(page){
  await page.evaluate(()=>{
    const DB='fa.restore.operation.research',VAULT='vault',OPS='operations';
    const enc=new TextEncoder(),dec=new TextDecoder();
    const hex=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
    const bytes=s=>new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
    const digest=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
    const open=()=>new Promise((resolve,reject)=>{
      const q=indexedDB.open(DB,1);
      q.onupgradeneeded=()=>{q.result.createObjectStore(VAULT);q.result.createObjectStore(OPS)};
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    const read=async opId=>{
      const db=await open();
      try{return await new Promise((resolve,reject)=>{
        const tx=db.transaction([VAULT,OPS],'readonly');let current=null,witness=null;
        tx.objectStore(VAULT).get('current').onsuccess=e=>current=e.target.result??null;
        tx.objectStore(OPS).get(opId).onsuccess=e=>witness=e.target.result??null;
        tx.oncomplete=()=>resolve({current,witness});
        tx.onabort=()=>reject(tx.error??Error('READ_ABORT'));
      });}finally{db.close()}
    };
    const authenticate=async raw=>{
      if(!raw||raw.schema!==2||!Number.isSafeInteger(raw.revision)||raw.revision<1||
        typeof raw.key!=='string'||raw.key.length!==64||typeof raw.opId!=='string')
        throw Error('INVALID_AUTHORITY');
      const key=await crypto.subtle.importKey('raw',bytes(raw.key),'AES-GCM',false,['decrypt']);
      const plain=JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:bytes(raw.iv)},key,bytes(raw.cipher))));
      if(plain.opId!==raw.opId||plain.revision!==raw.revision||plain.schema!==2)
        throw Error('AUTHORITY_BINDING_MISMATCH');
      return plain;
    };
    const api=window.__restoreOperationResearch={};
    api.read=read;
    api.ack=async({before,opId,expected})=>{
      try{
        const {current,witness}=await read(opId);
        // A missing authority after eviction is not proof that a prior commit never happened.
        // Only an existing matching record can support unchanged-state evidence.
        if(current&&before&&JSON.stringify(current)===JSON.stringify(before))
          return 'verified_unchanged';
        if(!current||current.opId!==opId||!witness||witness.opId!==opId||
          witness.revision!==current.revision||
          witness.digest!==await digest(JSON.stringify(current)))return 'unknown';
        const plain=await authenticate(current);
        return JSON.stringify(plain.state)===JSON.stringify(expected)
          ?'verified_committed_operation':'unknown';
      }catch{return 'unknown'}
    };
    api.commit=async({opId,state,expectedRevision,allowInitialize=false,fault=null,expectedEpoch=undefined})=>{
      if(typeof opId!=='string'||!/^op-[a-z0-9-]{4,}$/.test(opId))
        return {ok:false,reason:'invalid-operation-id'};
      const before=(await read(opId)).current;
      if(!before&&(!allowInitialize||expectedRevision!==0))
        return {ok:false,reason:'missing-authority'};
      if(before){
        let authenticated;
        try{authenticated=await authenticate(before)}catch{return {ok:false,reason:'invalid-authority'}}
        // Cooperative v2 writers must explicitly bind their observed reset epoch.
        // This preflight plus the transaction CAS does NOT fence cached v1 tabs.
        if(expectedEpoch!==undefined&&
          (authenticated.state?.resetIntent?.epoch??null)!==expectedEpoch)
          return {ok:false,reason:'reset-epoch-changed'};
        if(before.revision!==expectedRevision)
          return {ok:false,reason:'stale-revision'};
      }
      const keyBytes=before?bytes(before.key):crypto.getRandomValues(new Uint8Array(32));
      const key=await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const revision=expectedRevision+1;
      const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,
        enc.encode(JSON.stringify({schema:2,revision,opId,state}))));
      const next={schema:2,revision,opId,key:hex(keyBytes),iv:hex(iv),cipher:hex(cipher)};
      const witness={opId,revision,digest:await digest(JSON.stringify(next))};
      const db=await open();let result;
      try{result=await new Promise((resolve,reject)=>{
        const tx=db.transaction([VAULT,OPS],'readwrite');
        const v=tx.objectStore(VAULT),o=tx.objectStore(OPS);
        let gotVault=false,gotOp=false,current=null,priorOp=null,reason=null;
        const abort=why=>{reason=why;tx.abort()};
        const stage=()=>{
          if(!gotVault||!gotOp)return;
          if(JSON.stringify(current)!==JSON.stringify(before))return abort('authority-changed');
          if(priorOp!==null)return abort('duplicate-operation-id');
          if(fault==='before-put')return abort('injected-before-put');
          // A synchronous quota exception after the first staged put must
          // explicitly abort the entire transaction, including its witness.
          try{v.put(next,'current');o.put(witness,opId)}
          catch(e){return abort('write-'+e.name)}
          if(fault==='after-put')return abort('injected-after-put');
        };
        v.get('current').onsuccess=e=>{current=e.target.result??null;gotVault=true;stage()};
        o.get(opId).onsuccess=e=>{priorOp=e.target.result??null;gotOp=true;stage()};
        tx.oncomplete=()=>resolve({ok:true,revision});
        tx.onabort=()=>resolve({ok:false,reason:reason??'transaction-aborted'});
        tx.onerror=()=>{if(tx.error)reject(tx.error)};
      });}finally{db.close()}
      if(result.ok&&fault==='throw-after-complete')throw Error('SYNTHETIC_POST_COMMIT_ERROR');
      return result;
    };

    // Test-only v1 localStorage -> v2 IDB candidate. v1 AES-GCM envelope shape
    // matches the actual immutable WEB 18.64 vault, independently checked by
    // vault-real-crypto-regression.cjs. Never deletes or rewrites the v1 pair.
    const LEGACY_KEY='financial-autonomy.preview.key.v1';
    const LEGACY_PAYLOAD='financial-autonomy.preview.payload.v1';
    const LEGACY_RESET='financial-autonomy.preview.reset.v1';
    api.resetFootprint=()=>localStorage.getItem(LEGACY_RESET);
    api.legacyFootprint=()=>({key:localStorage.getItem(LEGACY_KEY),
      payload:localStorage.getItem(LEGACY_PAYLOAD)});
    api.seedLegacyForTest=async state=>{
      const existing=localStorage.getItem(LEGACY_KEY);
      const raw=existing?bytes(existing):crypto.getRandomValues(new Uint8Array(32));
      const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
      const nonce=crypto.getRandomValues(new Uint8Array(12));
      const cipher=new Uint8Array(await crypto.subtle.encrypt(
        {name:'AES-GCM',iv:nonce},key,enc.encode(JSON.stringify(state))));
      localStorage.setItem(LEGACY_KEY,hex(raw));
      localStorage.setItem(LEGACY_PAYLOAD,JSON.stringify({
        v:1,nonce:hex(nonce),data:hex(cipher)}));
    };
    api.migrateLegacyForTest=async({opId,fault=null})=>{
      let source,state;
      try{
        if(fault==='deny-legacy-read')throw Error('SYNTHETIC_READ_DENIED');
        source=api.legacyFootprint();
        if(!source.key||!source.payload)
          return {ok:false,reason:'incomplete-legacy'};
        if(!/^[0-9a-f]{64}$/.test(source.key))
          return {ok:false,reason:'invalid-legacy'};
        const envelope=JSON.parse(source.payload);
        if(envelope.v!==1||typeof envelope.nonce!=='string'||
          !/^[0-9a-f]{24}$/.test(envelope.nonce)||
          typeof envelope.data!=='string'||!/^(?:[0-9a-f]{2})+$/.test(envelope.data))
          return {ok:false,reason:'invalid-legacy'};
        const key=await crypto.subtle.importKey('raw',bytes(source.key),'AES-GCM',
          false,['decrypt']);
        state=JSON.parse(dec.decode(await crypto.subtle.decrypt(
          {name:'AES-GCM',iv:bytes(envelope.nonce)},key,bytes(envelope.data))));
        if(!state||state.version!==4||
          !['accounts','transactions','balanceChecks'].every(k=>Array.isArray(state[k])))
          return {ok:false,reason:'invalid-legacy'};
      }catch{return {ok:false,reason:'unreadable-or-unauthenticated-legacy'}}
      // Preflight check is NOT a lock against old cached v1 writers.
      if(fault==='change-source-before-commit')
        localStorage.setItem(LEGACY_PAYLOAD,source.payload+' ');
      try{
        if(JSON.stringify(api.legacyFootprint())!==JSON.stringify(source))
          return {ok:false,reason:'legacy-changed'};
        if((await read(opId)).current)
          return {ok:false,reason:'existing-v2-authority'};
      }catch{return {ok:false,reason:'preflight-unavailable'}}
      return api.commit({opId,state,expectedRevision:0,allowInitialize:true,
        fault:['before-put','after-put','throw-after-complete'].includes(fault)?fault:null});
    };
    // Research-only read-only quarantine classifier. 'matches' is NOT proof
    // that no later legacy edit ever occurred (whole-origin rollback can mimic it).
    // A production design would have to bind the baseline to authenticated v2
    // authority, rather than accepting an arbitrary caller-supplied snapshot.
    api.inspectLegacyConflictForTest=async({opId,baseline,expected,resetBaseline=null})=>{
      try{
        if(await api.ack({before:null,opId,expected})!=='verified_committed_operation')
          return 'unknown';
        // The v1 reset journal is a separate localStorage key. A changed
        // marker cannot be ignored even when the ciphertext pair matches.
        // Caller-provided baseline is NOT authenticated production provenance.
        if(api.resetFootprint()!==resetBaseline)return 'unknown';
        const now=api.legacyFootprint();
        if(!now.key||!now.payload||!/^[0-9a-f]{64}$/.test(now.key))
          return 'unknown';
        const envelope=JSON.parse(now.payload);
        if(envelope.v!==1||!/^[0-9a-f]{24}$/.test(envelope.nonce)||
          !/^(?:[0-9a-f]{2})+$/.test(envelope.data))return 'unknown';
        const key=await crypto.subtle.importKey('raw',bytes(now.key),'AES-GCM',false,['decrypt']);
        const state=JSON.parse(dec.decode(await crypto.subtle.decrypt(
          {name:'AES-GCM',iv:bytes(envelope.nonce)},key,bytes(envelope.data))));
        if(!state||state.version!==4||
          !['accounts','transactions','balanceChecks'].every(k=>Array.isArray(state[k])))
          return 'unknown';
        return JSON.stringify(now)===JSON.stringify(baseline)
          ?'legacy_matches_snapshot':'authenticated_legacy_divergence';
      }catch{return 'unknown'}
    };
    // Simulates a whole-origin rollback of the test database. Never production.
    api.rewindIdbForTest=async({current,witness})=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction([VAULT,OPS],'readwrite');
        const v=tx.objectStore(VAULT),o=tx.objectStore(OPS);
        v.clear();o.clear();
        if(current)v.put(current,'current');
        if(witness)o.put(witness,witness.opId);
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error??Error('ROLLBACK_ABORT'));
        tx.onerror=()=>reject(tx.error);
      });}finally{db.close()}
    };
    api.deleteWitnessForTest=async opId=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction(OPS,'readwrite');tx.objectStore(OPS).delete(opId);
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });}finally{db.close()}
    };
  });
}

// Execute ACTUAL immutable archived v1 Metro vault modules (309/310/311)
// in a separate Chromium tab. Only the synthetic financial model is stubbed.
const fs=require('node:fs');
const archivedPaths={
  '18.27':'_expo/static/js/web/index-v01827-vault-orphan-guard-20261023.js',
  '18.33':'_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js',
  '18.34':'_expo/static/js/web/index-v01834-multitab-vault-guard-20261024.js'
};
function extractArchived(source){
  const modules={};
  function visit(id){
    if(id===204||id===205||modules[id])return;
    const matches=[...source.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
    assert.equal(matches.length,1,'Missing or duplicate archived Metro module '+id);
    const match=matches[0],start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,'Missing archived Metro factory '+id);
    const deps=match[1]?match[1].split(',').map(Number):[];
    modules[id]={factory:source.slice(start+4,match.index+1),deps};
    deps.forEach(visit);
  }
  visit(309);
  assert.ok(modules[309]&&modules[310]&&modules[311]);
  return modules;
}
async function installArchived(page,defs){
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
      if(!def)throw Error('MISSING_ARCHIVED_MODULE_'+id);
      const factory=Function('return ('+def.factory+')')();
      const module={exports:{}};
      cache.set(id,module.exports);
      factory(window,load,()=>{},null,module,module.exports,def.deps);
      cache.set(id,module.exports);
      return module.exports;
    }
    window.__archivedVault=load(309);
    if(!window.__archivedVault?.load||!window.__archivedVault?.save)
      throw Error('ARCHIVED_VAULT_EXPORTS_MISSING');
  },defs);
}
async function testArchivedWriterQuarantine(browser,url){
  for(const version of ['18.27','18.33','18.34']){
    const ctx=await browser.newContext();
    try{
      const old=await ctx.newPage(),modern=await ctx.newPage();
      await Promise.all([old.goto(url+'?fa_real=1'),modern.goto(url)]);
      const defs=extractArchived(fs.readFileSync(archivedPaths[version],'utf8'));
      await installArchived(old,defs);await install(modern);
      const initial={version:4,accounts:[],balanceChecks:[],transactions:[
        {id:'synthetic-before-cutover',kind:'expense',amount:100,
          date:'2026-10-29',accountId:'synthetic'}
      ]};
      await old.evaluate(()=>window.__archivedVault.load());
      await old.evaluate(s=>window.__archivedVault.save(s),initial);
      await modern.waitForFunction(()=>
        localStorage.getItem('financial-autonomy.preview.payload.v1')!==null,
        null,{timeout:10000});
      const baseline=await modern.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      assert.ok(baseline.key&&baseline.payload,'actual archived AES-GCM pair required');
      const expected=await old.evaluate(()=>window.__archivedVault.load());
      assert.deepEqual(expected.transactions.map(t=>t.id),['synthetic-before-cutover']);
      const opId='op-archived-migrate-'+version.replace('.','');
      const migrated=await modern.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),opId);
      assert.equal(migrated.ok,true,'archived v1 migration must commit');
      const authority=await modern.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),opId);
      assert.equal(await modern.evaluate(({opId,baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected}),{opId,baseline,expected}),
      'legacy_matches_snapshot');
      // The cached archived tab does not know about v2 authority. Its late
      // write must be real AES-GCM, not a test helper re-encrypting the bytes.
      const cached=await old.evaluate(()=>window.__archivedVault.load());
      await old.evaluate(s=>window.__archivedVault.save(s),{
        ...cached,transactions:[...cached.transactions,{
          id:'synthetic-late-'+version,kind:'expense',amount:50,
          date:'2026-10-30',accountId:'synthetic'
        }]
      });
      const late=await old.evaluate(()=>({
        key:localStorage.getItem('financial-autonomy.preview.key.v1'),
        payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
      }));
      assert.notEqual(late.payload,baseline.payload,
        'archived writer must actually mutate v1 ciphertext');
      await modern.waitForFunction(payload=>
        localStorage.getItem('financial-autonomy.preview.payload.v1')===payload,
        late.payload,{timeout:10000});
      assert.equal(await modern.evaluate(({opId,baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected}),{opId,baseline,expected}),
      'authenticated_legacy_divergence');
      assert.deepEqual(await modern.evaluate(()=>
        window.__restoreOperationResearch.legacyFootprint()),late,
      'read-only classifier must not alter archived v1 evidence');
      assert.deepEqual(await modern.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),opId),authority,
      'late archived write and classifier must not alter v2 authority/witness');
      assert.equal(await modern.evaluate(({opId,expected})=>
        window.__restoreOperationResearch.ack({before:null,opId,expected}),
        {opId,expected}),'verified_committed_operation',
      'v2 witness remains valid despite the legacy divergence');
      console.log('PASS actual archived '+version+
        ': late AES-GCM v1 writer detected, quarantined without v1/IDB writes');
      // A deliberate test-origin rollback of only the v1 pair demonstrates
      // that a snapshot match cannot certify freshness or recover the edit.
      await old.evaluate(pair=>{
        localStorage.setItem('financial-autonomy.preview.key.v1',pair.key);
        localStorage.setItem('financial-autonomy.preview.payload.v1',pair.payload);
      },baseline);
      await modern.waitForFunction(payload=>
        localStorage.getItem('financial-autonomy.preview.payload.v1')===payload,
        baseline.payload,{timeout:10000});
      assert.equal(await modern.evaluate(({opId,baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected}),{opId,baseline,expected}),
      'legacy_matches_snapshot');
      assert.deepEqual(await modern.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),opId),authority);
      console.log('PASS KNOWN UNSAFE actual archived '+version+
        ': restored v1 snapshot hides intervening late write; no freshness proof');
    }finally{await ctx.close()}
  }
}


async function testArchivedResetAfterMigration(browser,url){
  // Execute real archived v1 resetData() after experimental v2 cutover.
  // This is a destructive operation ONLY against disposable synthetic origins.
  for(const version of ['18.27','18.33','18.34']){
    const defs=extractArchived(fs.readFileSync(archivedPaths[version],'utf8'));
    for(const mode of ['complete','deny-second-remove']){
      const ctx=await browser.newContext();
      try{
        const old=await ctx.newPage(),modern=await ctx.newPage();
        await Promise.all([old.goto(url+'?fa_real=1'),modern.goto(url)]);
        await installArchived(old,defs);await install(modern);
        const fixture={version:4,accounts:[],balanceChecks:[],transactions:[{
          id:'synthetic-reset-before-'+version,kind:'expense',amount:25,
          date:'2026-10-30',accountId:'synthetic'
        }]};
        await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(s=>window.__archivedVault.save(s),fixture);
        await modern.waitForFunction(()=>localStorage.getItem(
          'financial-autonomy.preview.payload.v1')!==null,null,{timeout:10000});
        const baseline=await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint());
        assert.ok(baseline.key&&baseline.payload);
        const expected=await old.evaluate(()=>window.__archivedVault.load());
        const opId='op-archived-reset-'+version.replace('.','')+'-'+mode;
        assert.equal((await modern.evaluate(opId=>
          window.__restoreOperationResearch.migrateLegacyForTest({opId}),opId)).ok,true);
        const authority=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),opId);
        assert.equal(await modern.evaluate(({opId,baseline,expected})=>
          window.__restoreOperationResearch.inspectLegacyConflictForTest({
            opId,baseline,expected,resetBaseline:null
          }),{opId,baseline,expected}),'legacy_matches_snapshot');
        // Real archived clearWebVault removes PAYLOAD first and KEY second.
        // Deny the second removeItem to reproduce the P1 orphan-key risk.
        const outcome=await old.evaluate(async mode=>{
          if(mode==='complete'){
            await window.__archivedVault.resetData();
            return 'completed';
          }
          const original=Storage.prototype.removeItem;
          Storage.prototype.removeItem=function(key){
            if(key==='financial-autonomy.preview.key.v1')
              throw new DOMException('Synthetic second-remove denial','SecurityError');
            return original.call(this,key);
          };
          try{
            await window.__archivedVault.resetData();
            return 'unexpected-success';
          }catch(e){return String(e.message)}
          finally{Storage.prototype.removeItem=original}
        },mode);
        if(mode==='complete')assert.equal(outcome,'completed');
        else assert.match(outcome,/Synthetic second-remove denial/);
        const after=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1'),
          reset:localStorage.getItem('financial-autonomy.preview.reset.v1')
        }));
        assert.equal(after.payload,null,'archived reset removes v1 PAYLOAD first');
        assert.equal(after.key,mode==='complete'?null:baseline.key,
          'second-remove failure must retain orphan KEY, not invent recovery');
        assert.equal(after.reset,null,
          'archived v1 reset has no authenticated reset epoch');
        await modern.waitForFunction(after=>
          localStorage.getItem('financial-autonomy.preview.key.v1')===after.key&&
          localStorage.getItem('financial-autonomy.preview.payload.v1')===after.payload,
          after,{timeout:10000});
        await modern.reload();await install(modern);
        assert.equal(await modern.evaluate(({opId,baseline,expected})=>
          window.__restoreOperationResearch.inspectLegacyConflictForTest({
            opId,baseline,expected,resetBaseline:null
          }),{opId,baseline,expected}),'unknown',
          'archived reset must quarantine v1/v2 instead of promoting IDB silently');
        assert.equal(await modern.evaluate(({opId,expected})=>
          window.__restoreOperationResearch.ack({
            before:null,opId,expected
          }),{opId,expected}),'verified_committed_operation',
          'v2 witness still authenticates itself, NOT legacy reset intent');
        assert.deepEqual(await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),opId),authority,
          'archived reset must not mutate the experimental v2 witness');
        assert.deepEqual(await modern.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1'),
          reset:localStorage.getItem('financial-autonomy.preview.reset.v1')
        })),after,'read-only quarantine must not modify archived reset footprint');
        console.log('PASS actual archived '+version+' reset '+mode+
          ': v1 evidence classified unknown, v2 witness unchanged; no automatic resurrection');
      }finally{await ctx.close()}
    }
  }
}


async function testArchivedPostResetCachedWriter(browser,url){
  // P1 characterization only: real archived cached v1 writers AFTER an
  // intentional or interrupted v1 reset, with an existing test-only IDB v2.
  // No real user data, production migration, recovery or deletion is involved.
  for(const version of ['18.27','18.33','18.34']){
    const defs=extractArchived(fs.readFileSync(archivedPaths[version],'utf8'));
    for(const mode of ['complete','deny-second-remove']){
      const ctx=await browser.newContext();
      try{
        const old=await ctx.newPage(),modern=await ctx.newPage();
        await Promise.all([old.goto(url+'?fa_real=1'),modern.goto(url)]);
        await installArchived(old,defs);await install(modern);
        const fixture={version:4,accounts:[],balanceChecks:[],transactions:[{
          id:'synthetic-postreset-original-'+version,kind:'expense',amount:25,
          date:'2026-10-30',accountId:'synthetic'
        }]};
        await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(s=>window.__archivedVault.save(s),fixture);
        const cached=await old.evaluate(()=>window.__archivedVault.load());
        const original=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
        }));
        assert.ok(original.key&&original.payload);
        await modern.waitForFunction(payload=>
          localStorage.getItem('financial-autonomy.preview.payload.v1')===payload,
          original.payload,{timeout:10000});
        const opId='op-postreset-'+version.replace('.','')+'-'+mode;
        assert.equal((await modern.evaluate(opId=>
          window.__restoreOperationResearch.migrateLegacyForTest({opId}),opId)).ok,true);
        const v2Before=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),opId);
        const reset=await old.evaluate(async mode=>{
          if(mode==='complete'){
            await window.__archivedVault.resetData();
            return {ok:true};
          }
          const remove=Storage.prototype.removeItem;
          Storage.prototype.removeItem=function(key){
            if(key==='financial-autonomy.preview.key.v1')
              throw new DOMException('Synthetic post-reset key denial','SecurityError');
            return remove.call(this,key);
          };
          try{await window.__archivedVault.resetData();return {ok:true}}
          catch(e){return {ok:false,message:String(e.message)}}
          finally{Storage.prototype.removeItem=remove}
        },mode);
        assert.equal(reset.ok,mode==='complete');
        if(mode!=='complete')assert.match(reset.message,/Synthetic post-reset key denial/);
        const afterReset=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
        }));
        assert.equal(afterReset.payload,null);
        assert.equal(afterReset.key,mode==='complete'?null:original.key);
        const next={...cached,transactions:[...cached.transactions,{
          id:'synthetic-postreset-late-'+version+'-'+mode,kind:'expense',
          amount:50,date:'2026-10-30',accountId:'synthetic'
        }]};
        // The OLD cached code, not a test helper, attempts to write.
        const attempt=await old.evaluate(async state=>{
          try{await window.__archivedVault.save(state);return {ok:true}}
          catch(e){return {ok:false,message:String(e.message)}}
        },next);
        const afterWrite=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
        }));
        await modern.waitForFunction(pair=>
          localStorage.getItem('financial-autonomy.preview.key.v1')===pair.key&&
          localStorage.getItem('financial-autonomy.preview.payload.v1')===pair.payload,
          afterWrite,{timeout:10000});
        if(attempt.ok){
          assert.ok(afterWrite.key&&afterWrite.payload,
            'successful archived save must leave a complete v1 pair');
          const actual=await old.evaluate(()=>window.__archivedVault.load());
          assert.ok(actual.transactions.some(t=>
            t.id==='synthetic-postreset-late-'+version+'-'+mode),
            'real archived save must authenticate the late synthetic transaction');
        }
        const beforeInspect=await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint());
        await modern.reload();await install(modern);
        const classification=await modern.evaluate(({opId,original,cached})=>
          window.__restoreOperationResearch.inspectLegacyConflictForTest({
            opId,baseline:original,expected:cached,resetBaseline:null
          }),{opId,original,cached});
        assert.ok(['unknown','authenticated_legacy_divergence'].includes(classification),
          'reset followed by a cached write cannot be treated as a safe snapshot match');
        if(attempt.ok)assert.equal(classification,'authenticated_legacy_divergence',
          'authenticated v1 resurrection must be flagged as a divergent register');
        assert.deepEqual(await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint()),beforeInspect,
          'read-only classifier must not repair, erase or rewrite v1 evidence');
        assert.deepEqual(await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),opId),v2Before,
          'archived reset and late writer must not silently alter v2 authority');
        assert.equal(await modern.evaluate(({opId,cached})=>
          window.__restoreOperationResearch.ack({
            before:null,opId,expected:cached
          }),{opId,cached}),'verified_committed_operation',
          'IDB witness authenticity is not permission to reopen v2 after reset');
        console.log('PASS CHARACTERIZATION actual archived '+version+
          ' post-reset cached writer '+mode+': save='+
          (attempt.ok?'succeeded':'blocked')+', quarantine='+classification+
          ', v2 unchanged; no automatic resurrection');
      }finally{await ctx.close()}
    }
  }
}


async function testArchivedWriterAtPendingResetBoundary(browser,url){
  // #4/#29/#35 CHARACTERIZATION ONLY: archived WEB v1 clients do not know
  // about the synthetic IDB reset epoch. Two deterministic orderings bound
  // the pending window; no production reset, migration or user data.
  for(const version of ['18.27','18.33','18.34']){
    const defs=extractArchived(fs.readFileSync(archivedPaths[version],'utf8'));
    for(const order of ['legacy-before-pending','legacy-after-pending']){
      const ctx=await browser.newContext();
      try{
        const old=await ctx.newPage(),modern=await ctx.newPage();
        await Promise.all([old.goto(url+'?fa_real=1'),modern.goto(url)]);
        await installArchived(old,defs);await install(modern);
        const initial={version:4,accounts:[],balanceChecks:[],transactions:[{
          id:'synthetic-pending-baseline-'+version,kind:'expense',amount:25,
          date:'2026-10-30',accountId:'synthetic'
        }]};
        await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(state=>window.__archivedVault.save(state),initial);
        const cached=await old.evaluate(()=>window.__archivedVault.load());
        const original=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
        }));
        assert.ok(original.key&&original.payload);
        await modern.waitForFunction(payload=>localStorage.getItem(
          'financial-autonomy.preview.payload.v1')===payload,original.payload,{timeout:10000});
        const migrateOp='op-pending-legacy-base-'+version.replace('.','')+'-'+order;
        assert.equal((await modern.evaluate(opId=>
          window.__restoreOperationResearch.migrateLegacyForTest({opId}),migrateOp)).ok,true);
        const before=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),migrateOp);
        assert.equal(before.current.revision,1);
        const intent={...cached,resetIntent:{schema:1,phase:'pending',
          epoch:'synthetic-legacy-boundary-'+version+'-'+order,sourceRevision:1}};
        const resetOp='op-pending-legacy-reset-'+version.replace('.','')+'-'+order;
        const next={...cached,transactions:[...cached.transactions,{
          id:'synthetic-legacy-during-pending-'+version+'-'+order,
          kind:'expense',amount:50,date:'2026-10-30',accountId:'synthetic'
        }]};
        async function legacySave(){
          const attempt=await old.evaluate(async state=>{
            try{await window.__archivedVault.save(state);return {ok:true}}
            catch(e){return {ok:false,message:String(e.message)}}
          },next);
          assert.equal(attempt.ok,true,'archived cached writer must actually save v1');
          const late=await old.evaluate(()=>({
            key:localStorage.getItem('financial-autonomy.preview.key.v1'),
            payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
          }));
          assert.notEqual(late.payload,original.payload,'v1 ciphertext must change');
          const decoded=await old.evaluate(()=>window.__archivedVault.load());
          assert.ok(decoded.transactions.some(t=>t.id===
            'synthetic-legacy-during-pending-'+version+'-'+order));
          await modern.waitForFunction(payload=>localStorage.getItem(
            'financial-autonomy.preview.payload.v1')===payload,late.payload,{timeout:10000});
          return late;
        }
        if(order==='legacy-before-pending')await legacySave();
        const pending=await modern.evaluate(({opId,state})=>
          window.__restoreOperationResearch.commit({
            opId,state,expectedRevision:1,expectedEpoch:null
          }),{opId:resetOp,state:intent});
        assert.equal(pending.ok,true,'synthetic pending reset records only v2 intent');
        const v2Pending=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),resetOp);
        assert.equal(v2Pending.current.revision,2);
        if(order==='legacy-after-pending')await legacySave();
        const lateFootprint=await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint());
        await modern.reload();await install(modern);
        assert.equal(await modern.evaluate(({opId,state})=>
          window.__restoreOperationResearch.ack({before:null,opId,expected:state}),
          {opId:resetOp,state:intent}),'verified_committed_operation');
        assert.equal(await modern.evaluate(({opId,baseline,expected})=>
          window.__restoreOperationResearch.inspectLegacyConflictForTest({
            opId,baseline,expected,resetBaseline:null
          }),{opId:resetOp,baseline:original,expected:intent}),
        'authenticated_legacy_divergence',
        'pending v2 witness does not fence cached v1 or authorize resurrection');
        assert.deepEqual(await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint()),lateFootprint,
        'read-only quarantine must not rewrite v1');
        assert.deepEqual(await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),resetOp),v2Pending,
        'read-only quarantine must not rewrite v2 authority or witness');
        console.log('PASS KNOWN UNSAFE actual archived '+version+' '+order+
          ': cached v1 save succeeds across pending v2 reset, divergence quarantined without writes');
      }finally{await ctx.close()}
    }
  }
}


async function testArchivedResetFinalizationBoundary(browser,url){
  // #4/#29/#35: CHARACTERIZATION ONLY. These are synthetic confirmations,
  // not user consent. A v2 marker cannot make legacy localStorage deletion
  // atomic or prevent cached WEB 18.27/18.33/18.34 JavaScript from writing.
  for(const version of ['18.27','18.33','18.34']){
    const defs=extractArchived(fs.readFileSync(archivedPaths[version],'utf8'));
    for(const mode of ['legacy-key-remove-denied','idb-completion-aborted',
      'v2-committed-before-legacy-retirement']){
      const ctx=await browser.newContext();
      try{
        const old=await ctx.newPage(),modern=await ctx.newPage();
        await Promise.all([old.goto(url+'?fa_real=1'),modern.goto(url)]);
        await installArchived(old,defs);await install(modern);
        const initial={version:4,accounts:[],balanceChecks:[],transactions:[{
          id:'synthetic-finalize-baseline-'+version,kind:'expense',amount:25,
          date:'2026-10-30',accountId:'synthetic'
        }]};
        await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(state=>window.__archivedVault.save(state),initial);
        const cached=await old.evaluate(()=>window.__archivedVault.load());
        const baseline=await old.evaluate(()=>({
          key:localStorage.getItem('financial-autonomy.preview.key.v1'),
          payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
        }));
        assert.ok(baseline.key&&baseline.payload);
        await modern.waitForFunction(payload=>localStorage.getItem(
          'financial-autonomy.preview.payload.v1')===payload,
          baseline.payload,{timeout:10000});
        const tag=version.replace('.','')+'-'+mode;
        const baseOp='op-finalize-base-'+tag;
        assert.equal((await modern.evaluate(opId=>
          window.__restoreOperationResearch.migrateLegacyForTest({opId}),baseOp)).ok,true);
        const epoch='synthetic-finalize-epoch-'+tag;
        const stateFor=phase=>({...cached,resetIntent:{
          schema:1,phase,epoch,sourceRevision:1
        }});
        const confirmed=stateFor('confirmed'),pending=stateFor('pending');
        const completed=stateFor('committed');
        const confirmOp='op-finalize-confirm-'+tag;
        const pendingOp='op-finalize-pending-'+tag;
        const completeOp='op-finalize-complete-'+tag;
        assert.equal((await modern.evaluate(({opId,state})=>
          window.__restoreOperationResearch.commit({
            opId,state,expectedRevision:1,expectedEpoch:null
          }),{opId:confirmOp,state:confirmed})).ok,true);
        assert.equal((await modern.evaluate(({opId,state,epoch})=>
          window.__restoreOperationResearch.commit({
            opId,state,expectedRevision:2,expectedEpoch:epoch
          }),{opId:pendingOp,state:pending,epoch})).ok,true);
        const pendingWitness=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),pendingOp);
        assert.equal(pendingWitness.current.revision,3);
        assert.equal(await modern.evaluate(({opId,state})=>
          window.__restoreOperationResearch.ack({before:null,opId,expected:state}),
          {opId:pendingOp,state:pending}),'verified_committed_operation');
        let completedWitness=null;
        if(mode==='v2-committed-before-legacy-retirement'){
          // Deliberately UNSAFE ordering: a valid v2 'committed' witness exists
          // while an old v1 tab can still save its own stale financial state.
          assert.equal((await modern.evaluate(({opId,state,epoch})=>
            window.__restoreOperationResearch.commit({
              opId,state,expectedRevision:3,expectedEpoch:epoch
            }),{opId:completeOp,state:completed,epoch})).ok,true);
          completedWitness=await modern.evaluate(opId=>
            window.__restoreOperationResearch.read(opId),completeOp);
          const late={...cached,transactions:[...cached.transactions,{
            id:'synthetic-after-v2-committed-'+tag,kind:'expense',
            amount:50,date:'2026-10-30',accountId:'synthetic'
          }]};
          const save=await old.evaluate(async state=>{
            try{await window.__archivedVault.save(state);return {ok:true}}
            catch(e){return {ok:false,message:String(e.message)}}
          },late);
          assert.equal(save.ok,true,'archived v1 still writes after v2 committed marker');
          const decoded=await old.evaluate(()=>window.__archivedVault.load());
          assert.ok(decoded.transactions.some(t=>t.id==='synthetic-after-v2-committed-'+tag));
        }else{
          const reset=await old.evaluate(async mode=>{
            if(mode==='idb-completion-aborted'){
              await window.__archivedVault.resetData();
              return {ok:true};
            }
            const original=Storage.prototype.removeItem;
            Storage.prototype.removeItem=function(key){
              if(key==='financial-autonomy.preview.key.v1')
                throw new DOMException('Synthetic finalization key denial','SecurityError');
              return original.call(this,key);
            };
            try{await window.__archivedVault.resetData();return {ok:true}}
            catch(e){return {ok:false,message:String(e.message)}}
            finally{Storage.prototype.removeItem=original}
          },mode);
          assert.equal(reset.ok,mode==='idb-completion-aborted');
          if(mode==='legacy-key-remove-denied')
            assert.match(reset.message,/Synthetic finalization key denial/);
          const after=await old.evaluate(()=>({
            key:localStorage.getItem('financial-autonomy.preview.key.v1'),
            payload:localStorage.getItem('financial-autonomy.preview.payload.v1')
          }));
          assert.equal(after.payload,null);
          assert.equal(after.key,mode==='legacy-key-remove-denied'?baseline.key:null);
          if(mode==='idb-completion-aborted'){
            const abort=await modern.evaluate(({opId,state,epoch})=>
              window.__restoreOperationResearch.commit({
                opId,state,expectedRevision:3,expectedEpoch:epoch,
                fault:'after-put'
              }),{opId:completeOp,state:completed,epoch});
            assert.equal(abort.ok,false,'aborted IDB completion must not be acknowledged');
          }
        }
        const afterLegacy=await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint());
        await modern.reload();await install(modern);
        const afterIdb=await modern.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),pendingOp);
        if(mode==='v2-committed-before-legacy-retirement'){
          assert.deepEqual(afterIdb,completedWitness,
            'completed witness survives but is NOT proof of legacy retirement');
          assert.equal(await modern.evaluate(({opId,state})=>
            window.__restoreOperationResearch.ack({
              before:null,opId,expected:state
            }),{opId:completeOp,state:completed}),'verified_committed_operation');
          assert.equal(await modern.evaluate(({opId,baseline,expected})=>
            window.__restoreOperationResearch.inspectLegacyConflictForTest({
              opId,baseline,expected,resetBaseline:null
            }),{opId:completeOp,baseline,expected:completed}),
            'authenticated_legacy_divergence',
            'valid v2 completion does not fence an archived v1 writer');
        }else{
          assert.deepEqual(afterIdb,pendingWitness,
            'legacy partial deletion or IDB abort must leave pending authority intact');
          assert.equal(await modern.evaluate(({opId,state})=>
            window.__restoreOperationResearch.ack({
              before:null,opId,expected:state
            }),{opId:pendingOp,state:pending}),'verified_committed_operation');
          assert.equal(await modern.evaluate(({opId,state})=>
            window.__restoreOperationResearch.ack({
              before:null,opId,expected:state
            }),{opId:completeOp,state:completed}),'unknown',
            'a pending reset must never be acknowledged as completed');
          assert.equal(await modern.evaluate(({opId,baseline,expected})=>
            window.__restoreOperationResearch.inspectLegacyConflictForTest({
              opId,baseline,expected,resetBaseline:null
            }),{opId:pendingOp,baseline,expected:pending}),'unknown',
            'partial or complete legacy deletion without completion requires quarantine');
        }
        assert.deepEqual(await modern.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint()),afterLegacy,
          'read-only classification must not resurrect or delete v1 evidence');
        console.log('PASS CHARACTERIZATION actual archived '+version+' '+mode+
          ': synthetic confirmed/pending/committed boundary quarantined; no safe global reset proof');
      }finally{await ctx.close()}
    }
  }
}

async function main(){
  const server=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});
    res.end('<!doctype html><title>synthetic restore operation witness</title>')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    const options={headless:true,args:['--no-sandbox']};
    if(process.env.FA_CHROMIUM_EXECUTABLE)options.executablePath=process.env.FA_CHROMIUM_EXECUTABLE;
    browser=await chromium.launch(options);
    const context=await browser.newContext(),url='http://127.0.0.1:'+server.address().port+'/';
    try{
      const a=await context.newPage(),b=await context.newPage();
      await Promise.all([a.goto(url),b.goto(url)]);
      await Promise.all([install(a),install(b)]);
      const first=await a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-initialize-0001',state:{transactions:['A']},expectedRevision:0,allowInitialize:true}));
      assert.equal(first.ok,true);
      assert.equal(await b.evaluate(()=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-initialize-0001',expected:{transactions:['A']}})),
      'verified_committed_operation');
      console.log('PASS atomic IDB restore witness: key, ciphertext, authority and authenticated operation committed together');
      const prior=(await a.evaluate(()=>window.__restoreOperationResearch.read('op-initialize-0001'))).current;
      for(const fault of ['before-put','after-put']){
        const opId='op-abort-'+fault;
        const attempt=await a.evaluate(({opId,fault})=>window.__restoreOperationResearch.commit({
          opId,state:{transactions:['A','B']},expectedRevision:1,fault}),{opId,fault});
        assert.equal(attempt.ok,false);
        assert.equal(await b.evaluate(({prior,opId})=>window.__restoreOperationResearch.ack({
          before:prior,opId,expected:{transactions:['A','B']}}),{prior,opId}),
        'verified_unchanged');
        assert.deepEqual((await b.evaluate(opId=>window.__restoreOperationResearch.read(opId),opId)).current,prior);
      }
      console.log('PASS atomic IDB restore witness: aborted writes never strand a key, payload or operation witness');
      await assert.rejects(a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-restore-0002',state:{transactions:['A','B']},expectedRevision:1,
        fault:'throw-after-complete'})),/SYNTHETIC_POST_COMMIT_ERROR/);
      await b.reload();await install(b);
      assert.equal(await b.evaluate(()=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-restore-0002',expected:{transactions:['A','B']}})),
      'verified_committed_operation');
      console.log('PASS atomic IDB restore witness: post-commit exception acknowledged after reload without replay');
      const second=(await b.evaluate(()=>window.__restoreOperationResearch.read('op-restore-0002'))).current;
      const duplicate=await b.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-restore-0002',state:{transactions:['X']},expectedRevision:2}));
      assert.equal(duplicate.ok,false);
      assert.deepEqual((await b.evaluate(()=>window.__restoreOperationResearch.read('op-restore-0002'))).current,second);
      console.log('PASS atomic IDB restore witness: duplicate operation ID cannot overwrite current ledger');
      const third=await a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-next-0003',state:{transactions:['A','B','C']},expectedRevision:2}));
      assert.equal(third.ok,true);
      const stale=await b.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-stale-0004',state:{transactions:['A','B','D']},expectedRevision:2}));
      assert.equal(stale.ok,false);
      assert.equal(await b.evaluate(({second})=>window.__restoreOperationResearch.ack({
        before:second,opId:'op-stale-0004',expected:{transactions:['A','B','D']}}),{second}),
      'unknown');
      console.log('PASS atomic IDB restore witness: stale tab rejected, conflicting outcome unknown and never replayed');
      // Competing tabs use the same previously authenticated revision. IDB must
      // serialize both the authority CAS and the witness put, not merely the
      // asynchronous preflight. Synthetic records only; no production migration.
      const beforeRace=(await a.evaluate(()=>window.__restoreOperationResearch.read('op-next-0003'))).current;
      const candidates=[
        {opId:'op-race-left-0005',state:{transactions:['A','B','C','left']}},
        {opId:'op-race-right-0006',state:{transactions:['A','B','C','right']}}
      ];
      const raced=await Promise.all([
        a.evaluate(candidate=>window.__restoreOperationResearch.commit({...candidate,expectedRevision:3}),candidates[0]),
        b.evaluate(candidate=>window.__restoreOperationResearch.commit({...candidate,expectedRevision:3}),candidates[1])
      ]);
      assert.equal(raced.filter(result=>result.ok).length,1,'exactly one distinct-ID writer must win');
      const winnerIndex=raced.findIndex(result=>result.ok);
      const winner=candidates[winnerIndex],loser=candidates[1-winnerIndex];
      const afterRace=(await a.evaluate(opId=>window.__restoreOperationResearch.read(opId),winner.opId)).current;
      assert.equal(afterRace.revision,4);
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:beforeRace,opId:winner.opId,expected:winner.state}),
      'verified_committed_operation');
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:beforeRace,opId:loser.opId,expected:loser.state}),
      'unknown');
      console.log('PASS atomic IDB restore witness: two simultaneous distinct-ID writers serialize, one wins without torn witness');
      const sharedId='op-race-shared-0007';
      const sharedStates=[
        {transactions:['A','B','C','shared-left']},
        {transactions:['A','B','C','shared-right']}
      ];
      const shared=await Promise.all([
        a.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:4}),{opId:sharedId,state:sharedStates[0]}),
        b.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:4}),{opId:sharedId,state:sharedStates[1]})
      ]);
      assert.equal(shared.filter(result=>result.ok).length,1,'same-ID race must not double commit');
      const sharedWinner=sharedStates[shared.findIndex(result=>result.ok)];
      const sharedLoser=sharedStates[1-shared.findIndex(result=>result.ok)];
      const sharedRecord=(await a.evaluate(opId=>window.__restoreOperationResearch.read(opId),sharedId));
      assert.equal(sharedRecord.current.revision,5);
      assert.equal(sharedRecord.witness.opId,sharedId);
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedWinner}),
      'verified_committed_operation');
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedLoser}),
      'unknown','a shared operation ID cannot authenticate the losing state');
      console.log('PASS atomic IDB restore witness: simultaneous duplicate operation IDs cannot double commit');
      await a.evaluate(opId=>window.__restoreOperationResearch.deleteWitnessForTest(opId),sharedId);
      assert.equal(await a.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedWinner}),'unknown');
      console.log('PASS atomic IDB restore witness: missing operation witness quarantines without repairing/deleting');
    }finally{await context.close()}
    // Migration gate runs on independent disposable origins; never user storage.
    async function isolated(run){
      const ctx=await browser.newContext();
      try{
        const p=await ctx.newPage();
        await p.goto(url);await install(p);
        return await run(p);
      }finally{await ctx.close()}
    }
    const fixture={version:4,accounts:[{id:'checking-test',name:'Fictiv'}],
      transactions:[{id:'old-v1-expense',amount:200,date:'2026-10-30'}],
      balanceChecks:[]};
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const before=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      assert.match(before.key,/^[0-9a-f]{64}$/);
      assert.deepEqual(JSON.parse(before.payload).v,1);
      assert.ok(!before.payload.includes('old-v1-expense'));
      const migrated=await p.evaluate(()=>window.__restoreOperationResearch.migrateLegacyForTest({
        opId:'op-v1-migrate-0001'}));
      assert.equal(migrated.ok,true);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),before,
        'migration must not remove or alter v1 recovery evidence');
      await p.reload();await install(p);
      assert.equal(await p.evaluate(s=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-v1-migrate-0001',expected:s}),fixture),
      'verified_committed_operation');
      assert.equal(await p.evaluate(({baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId:'op-v1-migrate-0001',baseline,expected}),{baseline:before,expected:fixture}),
      'legacy_matches_snapshot');
      // A cached old v1 tab can still write after cutover. IDB cannot stop it.
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),
        {...fixture,transactions:[...fixture.transactions,{id:'late-v1-write'}]});
      assert.equal(await p.evaluate(s=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-v1-migrate-0001',expected:s}),fixture),
      'verified_committed_operation');
      assert.notDeepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),before);
      const late=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      assert.equal(await p.evaluate(({baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId:'op-v1-migrate-0001',baseline,expected}),{baseline:before,expected:fixture}),
      'authenticated_legacy_divergence');
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),late,
        'read-only conflict inspection must not mutate legacy evidence');
      await p.evaluate(()=>{
        const key='financial-autonomy.preview.payload.v1';
        const raw=JSON.parse(localStorage.getItem(key));
        raw.data=(raw.data[0]==='0'?'1':'0')+raw.data.slice(1);
        localStorage.setItem(key,JSON.stringify(raw));
      });
      assert.equal(await p.evaluate(({baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId:'op-v1-migrate-0001',baseline,expected}),{baseline:before,expected:fixture}),
      'unknown','corrupted legacy ciphertext must not be selected as authoritative');
      // An origin rollback can restore the exact old bytes. Matching the
      // snapshot is not a freshness proof and cannot recover the late write.
      await p.evaluate(({key,payload})=>{
        localStorage.setItem('financial-autonomy.preview.key.v1',key);
        localStorage.setItem('financial-autonomy.preview.payload.v1',payload);
      },before);
      assert.equal(await p.evaluate(({baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId:'op-v1-migrate-0001',baseline,expected}),{baseline:before,expected:fixture}),
      'legacy_matches_snapshot');
      await p.evaluate(()=>window.__restoreOperationResearch.deleteWitnessForTest('op-v1-migrate-0001'));
      assert.equal(await p.evaluate(({baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId:'op-v1-migrate-0001',baseline,expected}),{baseline:before,expected:fixture}),
      'unknown','missing IDB witness must never be repaired or trusted');

    });
    console.log('PASS research v1 AES-GCM envelope migrates into IDB witness without deleting legacy bytes; KNOWN UNSAFE late v1 writer remains possible');
    console.log('PASS research read-only v1/v2 conflict quarantine: authenticated divergence, corruption, rollback limitation and missing witness');
    await testArchivedWriterQuarantine(browser,url);
    await testArchivedResetAfterMigration(browser,url);
    await testArchivedPostResetCachedWriter(browser,url);
    await testArchivedWriterAtPendingResetBoundary(browser,url);
    await testArchivedResetFinalizationBoundary(browser,url);
    // Candidate encrypted reset-intent boundary, NOT a production reset.
    // Stage an authenticated pending intent in v2 only; preserve all legacy
    // ciphertext. This does not prove the user confirmed deletion, prevent
    // archived v1 writers, or protect against whole-origin rollback.
    for(const fault of ['before-put','after-put']){
      await isolated(async p=>{
        await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
        const legacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
        const baseOp='op-reset-base-'+fault;
        assert.equal((await p.evaluate(opId=>
          window.__restoreOperationResearch.migrateLegacyForTest({opId}),baseOp)).ok,true);
        const before=await p.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),baseOp);
        const resetOp='op-reset-intent-'+fault;
        const intent={...fixture,resetIntent:{schema:1,phase:'pending',
          epoch:'synthetic-epoch-'+fault,sourceRevision:1}};
        const result=await p.evaluate(({opId,state,fault})=>
          window.__restoreOperationResearch.commit({
            opId,state,expectedRevision:1,fault
          }),{opId:resetOp,state:intent,fault});
        assert.equal(result.ok,false);
        assert.deepEqual(await p.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),baseOp),before,
        'aborted reset intent must preserve prior authenticated v2 authority');
        assert.equal(await p.evaluate(({opId,state,before})=>
          window.__restoreOperationResearch.ack({
            opId,expected:state,before
          }),{opId:resetOp,state:intent,before:before.current}),'verified_unchanged');
        await p.reload();await install(p);
        assert.deepEqual(await p.evaluate(opId=>
          window.__restoreOperationResearch.read(opId),baseOp),before);
        assert.deepEqual(await p.evaluate(()=>
          window.__restoreOperationResearch.legacyFootprint()),legacy,
        'no v1 deletion may precede an authenticated reset boundary');
      });
    }
    console.log('PASS research pending reset-intent IDB abort before/after puts: v2 authority and legacy ciphertext preserved after reload');
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const legacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const baseOp='op-reset-denial-base-0013';
      assert.equal((await p.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),baseOp)).ok,true);
      const before=await p.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),baseOp);
      const intent={...fixture,resetIntent:{schema:1,phase:'pending',
        epoch:'synthetic-denied-epoch',sourceRevision:1}};
      const denial=await p.evaluate(async state=>{
        const descriptor=Object.getOwnPropertyDescriptor(window,'indexedDB');
        Object.defineProperty(window,'indexedDB',{configurable:true,value:{
          open(){throw new DOMException('Synthetic reset boundary denial','SecurityError')}
        }});
        try{
          await window.__restoreOperationResearch.commit({
            opId:'op-reset-denied-0014',state,expectedRevision:1
          });
          return 'unexpected-success';
        }catch(e){return e.name}
        finally{
          if(descriptor)Object.defineProperty(window,'indexedDB',descriptor);
          else delete window.indexedDB;
        }
      },intent);
      assert.equal(denial,'SecurityError');
      await p.reload();await install(p);
      assert.deepEqual(await p.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),baseOp),before);
      assert.equal(await p.evaluate(({state,before})=>
        window.__restoreOperationResearch.ack({
          before,opId:'op-reset-denied-0014',expected:state
        }),{state:intent,before:before.current}),'verified_unchanged');
      assert.deepEqual(await p.evaluate(()=>
        window.__restoreOperationResearch.legacyFootprint()),legacy);
    });
    console.log('PASS research pending reset-intent IndexedDB SecurityError: no v1 deletion, no v2 revision or witness change');
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const legacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const baseOp='op-reset-postcommit-base-0015';
      assert.equal((await p.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),baseOp)).ok,true);
      const intent={...fixture,resetIntent:{schema:1,phase:'pending',
        epoch:'synthetic-postcommit-epoch',sourceRevision:1}};
      const resetOp='op-reset-postcommit-0016';
      await assert.rejects(p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:1,fault:'throw-after-complete'
        }),{opId:resetOp,state:intent}),/SYNTHETIC_POST_COMMIT_ERROR/);
      await p.reload();await install(p);
      assert.equal(await p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.ack({
          before:null,opId,expected:state
        }),{opId:resetOp,state:intent}),'verified_committed_operation');
      assert.deepEqual(await p.evaluate(()=>
        window.__restoreOperationResearch.legacyFootprint()),legacy,
      'authenticated pending intent must not silently delete legacy evidence');
      const idb=await p.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),resetOp);
      assert.equal(idb.current.revision,2);
      // An old v1 writer can still mutate v1 after a pending intent. Do not
      // treat authenticated v2 intent as permission to resurrect or erase v1.
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),
        {...fixture,transactions:[...fixture.transactions,{id:'late-after-pending-reset'}]});
      const diverged=await p.evaluate(()=>
        window.__restoreOperationResearch.legacyFootprint());
      assert.equal(await p.evaluate(({opId,baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected,resetBaseline:null
        }),{opId:resetOp,baseline:legacy,expected:intent}),
      'authenticated_legacy_divergence');
      assert.deepEqual(await p.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),resetOp),idb);
      assert.deepEqual(await p.evaluate(()=>
        window.__restoreOperationResearch.legacyFootprint()),diverged);
    });
    console.log('PASS CHARACTERIZATION pending reset-intent post-commit exception: authenticated after reload, KNOWN UNSAFE late v1 writer quarantined');
    // Synthetic QuotaExceededError at either IDB put, including after the
    // authority has been staged but before its witness. No production reset.
    for(const store of ['vault','operations']){
      await isolated(async p=>{
        await p.evaluate(state=>window.__restoreOperationResearch.seedLegacyForTest(state),fixture);
        const legacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
        const baseOp='op-quota-base-'+store;
        assert.equal((await p.evaluate(opId=>window.__restoreOperationResearch.migrateLegacyForTest({opId}),baseOp)).ok,true);
        const before=await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),baseOp);
        const resetOp='op-quota-reset-'+store;
        const intent={...fixture,resetIntent:{schema:1,phase:'pending',epoch:'quota-'+store,sourceRevision:1}};
        const result=await p.evaluate(async({store,resetOp,intent})=>{
          const original=IDBObjectStore.prototype.put;
          IDBObjectStore.prototype.put=function(...args){
            if(this.name===store)throw new DOMException('Synthetic IDB quota denial','QuotaExceededError');
            return original.apply(this,args);
          };
          try{return await window.__restoreOperationResearch.commit({
            opId:resetOp,state:intent,expectedRevision:1,expectedEpoch:null
          })}finally{IDBObjectStore.prototype.put=original}
        },{store,resetOp,intent});
        assert.deepEqual(result,{ok:false,reason:'write-QuotaExceededError'});
        await p.reload();await install(p);
        assert.deepEqual(await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),baseOp),before,
          'quota denial must not commit a partial authority or witness');
        assert.equal(await p.evaluate(({before,resetOp,intent})=>
          window.__restoreOperationResearch.ack({before,opId:resetOp,expected:intent}),
          {before:before.current,resetOp,intent}),'verified_unchanged');
        assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),legacy);
      });
      console.log('PASS research pending reset-intent synthetic QuotaExceededError at '+store+
        ' put: IDB transaction aborted, v1 ciphertext and v2 witness unchanged after reload');
    }
    // Competing cooperating v2 tabs share an authenticated revision. The
    // transaction CAS allows exactly one reset-intent or financial write.
    // An epoch-bound writer cannot save after a pending reset, even when it
    // reads the newer revision. Legacy v1 tabs still ignore this contract.
    await isolated(async p=>{
      const second=await p.context().newPage();await second.goto(url);await install(second);
      await p.evaluate(state=>window.__restoreOperationResearch.seedLegacyForTest(state),fixture);
      const legacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      assert.equal((await p.evaluate(()=>window.__restoreOperationResearch.migrateLegacyForTest({
        opId:'op-race-reset-base-0017'}))).ok,true);
      const before=await p.evaluate(()=>window.__restoreOperationResearch.read('op-race-reset-base-0017'));
      const resetOp='op-race-reset-0018',writeOp='op-race-write-0019';
      const intent={...fixture,resetIntent:{schema:1,phase:'pending',epoch:'race-epoch-0018',sourceRevision:1}};
      const changed={...fixture,transactions:[...fixture.transactions,{id:'synthetic-racing-expense'}]};
      const outcomes=await Promise.all([
        p.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:1,expectedEpoch:null}),{opId:resetOp,state:intent}),
        second.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:1,expectedEpoch:null}),{opId:writeOp,state:changed})
      ]);
      assert.equal(outcomes.filter(x=>x.ok).length,1,'reset vs write must have one atomic winner');
      const resetWon=outcomes[0].ok;
      const winnerOp=resetWon?resetOp:writeOp;
      const loserOp=resetWon?writeOp:resetOp;
      const winnerState=resetWon?intent:changed;
      const loserState=resetWon?changed:intent;
      assert.equal(await second.evaluate(({opId,state})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:state}),{opId:winnerOp,state:winnerState}),
      'verified_committed_operation');
      assert.equal(await second.evaluate(({opId,state})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:state}),{opId:loserOp,state:loserState}),'unknown');
      let latest=await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),winnerOp);
      assert.equal(latest.current.revision,2);
      if(!resetWon){
        const committed=await p.evaluate(({opId,state,revision})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:revision,expectedEpoch:null
        }),{opId:resetOp,state:intent,revision:latest.current.revision});
        assert.equal(committed.ok,true,'pending reset can be retried as a NEW operation after losing');
        latest=await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),resetOp);
      }
      const blocked=await second.evaluate(({revision,state})=>window.__restoreOperationResearch.commit({
        opId:'op-race-after-reset-0020',state,expectedRevision:revision,expectedEpoch:null
      }),{revision:latest.current.revision,state:changed});
      assert.deepEqual(blocked,{ok:false,reason:'reset-epoch-changed'},
        'a cooperative writer must not bypass pending reset using a fresh revision');
      await p.reload();await install(p);
      assert.deepEqual(await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),resetOp),latest);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),legacy);
      assert.equal(await p.evaluate(({opId,state})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:state}),{opId:resetOp,state:intent}),
      'verified_committed_operation');
      assert.equal(await p.evaluate(({opId,state})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:state}),{opId:'op-race-after-reset-0020',state:changed}),
      'unknown');
    });
    console.log('PASS research concurrent v2 pending reset vs epoch-bound writer: one winner, post-reset writer fenced, no legacy mutation');
    // Research-only denial: browser API access may throw SecurityError. A
    // failed IDB preflight must NOT silently import v1 as authoritative.
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const baseline=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const outcome=await p.evaluate(async({baseline,fixture})=>{
        const descriptor=Object.getOwnPropertyDescriptor(window,'indexedDB');
        Object.defineProperty(window,'indexedDB',{configurable:true,value:{
          open(){throw new DOMException('Synthetic IndexedDB denial','SecurityError')}
        }});
        try{
          const api=window.__restoreOperationResearch;
          return {
            ack:await api.ack({before:null,opId:'op-idb-denied-0008',expected:fixture}),
            migration:await api.migrateLegacyForTest({opId:'op-idb-denied-0008'}),
            conflict:await api.inspectLegacyConflictForTest({
              opId:'op-idb-denied-0008',baseline,expected:fixture}),
            legacy:api.legacyFootprint()
          };
        }finally{
          if(descriptor)Object.defineProperty(window,'indexedDB',descriptor);
          else delete window.indexedDB;
        }
      },{baseline,fixture});
      assert.equal(outcome.ack,'unknown');
      assert.equal(outcome.migration.ok,false);
      assert.equal(outcome.migration.reason,'preflight-unavailable');
      assert.equal(outcome.conflict,'unknown');
      assert.deepEqual(outcome.legacy,baseline);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),baseline);
      assert.equal((await p.evaluate(()=>window.__restoreOperationResearch.read('op-idb-denied-0008'))).current,null);
    });
    console.log('PASS research IDB SecurityError denial: migration and acknowledgment quarantine without legacy mutation or silent fallback');
    // Eviction is simulated by explicitly deleting the disposable test DB.
    // It does not reproduce real browser eviction policy, nor prove recency.
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const baseline=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const opId='op-idb-eviction-0009';
      const committed=await p.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),opId);
      assert.equal(committed.ok,true);
      assert.equal(await p.evaluate(({opId,fixture})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:fixture}),{opId,fixture}),'verified_committed_operation');
      await p.evaluate(()=>new Promise((resolve,reject)=>{
        const request=indexedDB.deleteDatabase('fa.restore.operation.research');
        request.onsuccess=()=>resolve();
        request.onerror=()=>reject(request.error);
        request.onblocked=()=>reject(Error('SYNTHETIC_EVICTION_BLOCKED'));
      }));
      await p.reload();await install(p);
      assert.equal(await p.evaluate(({opId,fixture})=>window.__restoreOperationResearch.ack({
        before:null,opId,expected:fixture}),{opId,fixture}),'unknown',
      'missing IDB authority is not proof that a previously committed operation never happened');
      assert.equal(await p.evaluate(({opId,baseline,fixture})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected:fixture}),{opId,baseline,fixture}),'unknown');
      const missing=await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),opId);
      assert.equal(missing.current,null);assert.equal(missing.witness,null);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),baseline,
        'IDB loss must not delete, replace or promote v1 evidence');
    });
    console.log('PASS research IDB synthetic eviction: previously authenticated operation becomes unknown; v1 bytes preserved, no auto-promotion');
    // The real v1 reset marker is not part of the atomic IDB transaction.
    // A marker-only change must invalidate a legacy snapshot match even when
    // both v1 ciphertext bytes and the IDB operation witness remain valid.
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const baseline=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const opId='op-reset-marker-0010';
      assert.equal((await p.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),opId)).ok,true);
      const idbBefore=await p.evaluate(opId=>
        window.__restoreOperationResearch.read(opId),opId);
      assert.equal(await p.evaluate(({opId,baseline,fixture})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected:fixture,resetBaseline:null
        }),{opId,baseline,fixture}),'legacy_matches_snapshot');
      const reset='idle-v2:'+('a'.repeat(32));
      await p.evaluate(reset=>localStorage.setItem(
        'financial-autonomy.preview.reset.v1',reset),reset);
      assert.equal(await p.evaluate(({opId,baseline,fixture})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected:fixture,resetBaseline:null
        }),{opId,baseline,fixture}),'unknown');
      assert.equal(await p.evaluate(({opId,fixture})=>
        window.__restoreOperationResearch.ack({before:null,opId,expected:fixture}),
        {opId,fixture}),'verified_committed_operation',
        'IDB witness authenticates IDB state, NOT reset-journal consistency');
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),
        baseline,'read-only reset inspection must preserve v1 encrypted bytes');
      assert.deepEqual(await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),opId),
        idbBefore,'read-only reset inspection must preserve IDB witness');
      // Partial v1 reset: payload removed, key and reset journal retained.
      await p.evaluate(()=>localStorage.removeItem('financial-autonomy.preview.payload.v1'));
      const partial=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      assert.equal(partial.key,baseline.key);assert.equal(partial.payload,null);
      await p.reload();await install(p);
      assert.equal(await p.evaluate(()=>window.__restoreOperationResearch.resetFootprint()),reset);
      assert.equal(await p.evaluate(({opId,baseline,fixture})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected:fixture,resetBaseline:null
        }),{opId,baseline,fixture}),'unknown');
      assert.deepEqual(await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),opId),
        idbBefore);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),
        partial,'no automatic recovery, key deletion or v1 fallback');
    });
    console.log('PASS research reset journal: marker-only drift and partial v1 deletion quarantine without IDB/v1 writes');

    // Full-origin rollback can restore BOTH localStorage and IDB to an older,
    // internally authenticated snapshot. This is a known unsolved freshness
    // limitation of a local-only browser origin, not a successful defense.
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const oldLegacy=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      const oldOp='op-origin-old-0011',newOp='op-origin-new-0012';
      assert.equal((await p.evaluate(opId=>
        window.__restoreOperationResearch.migrateLegacyForTest({opId}),oldOp)).ok,true);
      const oldIdb=await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),oldOp);
      const newer={...fixture,transactions:[...fixture.transactions,{id:'newer-unrecoverable'}]};
      assert.equal((await p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:1
        }),{opId:newOp,state:newer})).ok,true);
      assert.equal(await p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.ack({before:null,opId,expected:state}),
        {opId:newOp,state:newer}),'verified_committed_operation');
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),newer);
      await p.evaluate(()=>localStorage.setItem('financial-autonomy.preview.reset.v1',
        'idle-v2:'+('b'.repeat(32))));
      // Deliberately rewind every tracked origin component, as could occur
      // when a complete site-data snapshot is restored by the environment.
      await p.evaluate(snapshot=>window.__restoreOperationResearch.rewindIdbForTest(snapshot),
        oldIdb);
      await p.evaluate(({key,payload})=>{
        localStorage.setItem('financial-autonomy.preview.key.v1',key);
        localStorage.setItem('financial-autonomy.preview.payload.v1',payload);
        localStorage.removeItem('financial-autonomy.preview.reset.v1');
      },oldLegacy);
      await p.reload();await install(p);
      assert.equal(await p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.ack({before:null,opId,expected:state}),
        {opId:oldOp,state:fixture}),'verified_committed_operation');
      assert.equal(await p.evaluate(({opId,state})=>
        window.__restoreOperationResearch.ack({before:null,opId,expected:state}),
        {opId:newOp,state:newer}),'unknown');
      assert.equal(await p.evaluate(({opId,baseline,expected})=>
        window.__restoreOperationResearch.inspectLegacyConflictForTest({
          opId,baseline,expected,resetBaseline:null
        }),{opId:oldOp,baseline:oldLegacy,expected:fixture}),'legacy_matches_snapshot');
      assert.deepEqual(await p.evaluate(opId=>window.__restoreOperationResearch.read(opId),oldOp),
        oldIdb);
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),
        oldLegacy);
      assert.equal(await p.evaluate(()=>window.__restoreOperationResearch.resetFootprint()),null);
    });
    console.log('PASS KNOWN UNSAFE full-origin rollback: old authenticated IDB/v1/reset snapshot hides newer committed operation; no freshness guarantee');
    for(const kind of ['orphan-key','orphan-payload','corrupt-payload','deny-legacy-read']){
      await isolated(async p=>{
        await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
        await p.evaluate(kind=>{
          const key='financial-autonomy.preview.key.v1';
          const payload='financial-autonomy.preview.payload.v1';
          if(kind==='orphan-key')localStorage.removeItem(payload);
          if(kind==='orphan-payload')localStorage.removeItem(key);
          if(kind==='corrupt-payload'){
            const raw=JSON.parse(localStorage.getItem(payload));
            raw.data=(raw.data[0]==='0'?'1':'0')+raw.data.slice(1);
            localStorage.setItem(payload,JSON.stringify(raw));
          }
        },kind);
        const before=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
        const result=await p.evaluate(kind=>window.__restoreOperationResearch.migrateLegacyForTest({
          opId:'op-v1-reject-0002',fault:kind==='deny-legacy-read'?kind:null}),kind);
        assert.equal(result.ok,false);
        assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),before);
        assert.equal((await p.evaluate(()=>window.__restoreOperationResearch.read('op-v1-reject-0002'))).current,null);
      });
    }
    console.log('PASS research v1 migration rejects orphan KEY, orphan PAYLOAD, corrupt ciphertext and denied reads without IDB or legacy mutation');
    for(const fault of ['before-put','after-put']){
      await isolated(async p=>{
        await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
        const before=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
        const result=await p.evaluate(fault=>window.__restoreOperationResearch.migrateLegacyForTest({
          opId:'op-v1-abort-0003',fault}),fault);
        assert.equal(result.ok,false);
        assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),before);
        assert.equal((await p.evaluate(()=>window.__restoreOperationResearch.read('op-v1-abort-0003'))).current,null);
      });
    }
    console.log('PASS research v1 migration IDB abort before/after puts leaves legacy pair and authority unchanged');
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const before=await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint());
      await assert.rejects(p.evaluate(()=>window.__restoreOperationResearch.migrateLegacyForTest({
        opId:'op-v1-postcommit-0004',fault:'throw-after-complete'})),/SYNTHETIC_POST_COMMIT_ERROR/);
      await p.reload();await install(p);
      assert.equal(await p.evaluate(s=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-v1-postcommit-0004',expected:s}),fixture),
      'verified_committed_operation');
      assert.deepEqual(await p.evaluate(()=>window.__restoreOperationResearch.legacyFootprint()),before);
    });
    console.log('PASS research v1 migration post-commit exception can authenticate witness after reload without replay');
    await isolated(async p=>{
      await p.evaluate(s=>window.__restoreOperationResearch.seedLegacyForTest(s),fixture);
      const result=await p.evaluate(()=>window.__restoreOperationResearch.migrateLegacyForTest({
        opId:'op-v1-changed-0005',fault:'change-source-before-commit'}));
      assert.equal(result.reason,'legacy-changed');
      assert.equal((await p.evaluate(()=>window.__restoreOperationResearch.read('op-v1-changed-0005'))).current,null);
    });
    console.log('PASS research v1 migration detects a preflight legacy source change; cannot prevent a late cached writer');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
