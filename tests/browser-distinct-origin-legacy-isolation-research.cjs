'use strict';
// #4/#29/#35: RESEARCH ONLY. Same browser profile, two loopback origins.
// Uses actual archived WEB 18.33 AES-GCM vault modules and synthetic ledger.
// This tests browser-origin isolation, NOT an approved migration, cutover,
// freshness guarantee, backup protocol, or production vault implementation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const ARCHIVE='_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js';
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const DB='fa-disposable-origin-isolation';
const state=id=>({version:4,accounts:[],transactions:[
  {id,kind:'expense',amount:125,date:'2026-11-01',accountId:'synthetic'}
],balanceChecks:[]});
function definitions(){
  const source=fs.readFileSync(path.join(ROOT,ARCHIVE),'utf8');
  const out={};
  function visit(id){
    if(id===204||id===205||out[id])return;
    const matches=[...source.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
    assert.equal(matches.length,1,'real archived Metro module '+id);
    const match=matches[0],start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,'module factory '+id);
    const deps=match[1]?match[1].split(',').map(Number):[];
    out[id]={factory:source.slice(start+4,match.index+1),deps};
    deps.forEach(visit);
  }
  visit(309);
  assert.ok(out[310]&&out[311]);
  return out;
}
async function install(page,defs){
  await page.evaluate(defs=>{
    const model={
      emptyState:()=>({version:4,accounts:[],transactions:[],balanceChecks:[]}),
      migrate(s){model.validateState(s);return s},
      validateState(s){
        if(!s||s.version!==4||
          !['accounts','transactions','balanceChecks'].every(k=>Array.isArray(s[k])))
          throw Error('INVALID_SYNTHETIC_LEDGER');
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
    window.__oldVault=load(309);
    if(!window.__oldVault?.save||!window.__oldVault?.load)
      throw Error('MISSING_ARCHIVED_VAULT');
  },defs);
}
function serve(req,res){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store'});
  res.end('<!doctype html><html><body>Disposable origin research</body></html>');
}
async function start(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return server;
}
async function putIdb(page,value){
  return page.evaluate(async({DB,value})=>{
    const database=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>req.result.createObjectStore('values');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    try{
      await new Promise((resolve,reject)=>{
        const tx=database.transaction('values','readwrite');
        tx.objectStore('values').put(value,'owner');
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    }finally{database.close()}
  },{DB,value});
}
async function getIdb(page){
  return page.evaluate(async DB=>{
    const database=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    try{
      return await new Promise((resolve,reject)=>{
        const tx=database.transaction('values','readonly');
        const req=tx.objectStore('values').get('owner');
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
    }finally{database.close()}
  },DB);
}
async function main(){
  const oldServer=await start(),newServer=await start();
  let browser;
  try{
    const oldOrigin='http://127.0.0.1:'+oldServer.address().port;
    const newOrigin='http://127.0.0.1:'+newServer.address().port;
    assert.notEqual(oldOrigin,newOrigin);
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext();
    const old=await context.newPage(),sameOrigin=await context.newPage(),
      fresh=await context.newPage();
    await Promise.all([
      old.goto(oldOrigin+'/archived?fa_real=1',{waitUntil:'domcontentloaded'}),
      sameOrigin.goto(oldOrigin+'/different-path?fa_real=1',{waitUntil:'domcontentloaded'}),
      fresh.goto(newOrigin+'/new?fa_real=1',{waitUntil:'domcontentloaded'})
    ]);
    const defs=definitions();
    await Promise.all([install(old,defs),install(sameOrigin,defs),install(fresh,defs)]);
    assert.equal(await old.evaluate(()=>isSecureContext),true);
    assert.equal(await fresh.evaluate(()=>isSecureContext),true);

    await old.evaluate(s=>window.__oldVault.save(s),state('old-initial'));
    assert.deepEqual(
      await sameOrigin.evaluate(async()=> (await window.__oldVault.load()).transactions.map(t=>t.id)),
      ['old-initial'],'changing only the URL path does not isolate storage');
    assert.equal(await fresh.evaluate(key=>localStorage.getItem(key),KEY),null,
      'new origin must not inherit legacy key');
    assert.equal(await fresh.evaluate(key=>localStorage.getItem(key),PAYLOAD),null,
      'new origin must not inherit legacy ciphertext');

    await fresh.evaluate(s=>window.__oldVault.save(s),state('new-primary-synthetic'));
    const before=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    assert.ok(before[0]&&before[1],'new origin has its own AES-GCM envelope');
    await old.evaluate(s=>window.__oldVault.save(s),state('old-late-write'));
    assert.deepEqual(await sameOrigin.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id)),['old-late-write']);
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),before,
      'late archived writer must not mutate independent origin bytes');
    assert.deepEqual(await fresh.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id)),
      ['new-primary-synthetic']);

    await putIdb(old,'legacy-idb');
    assert.equal(await fresh.evaluate(async DB=>
      (await indexedDB.databases()).some(x=>x.name===DB),DB),false,
      'legacy IndexedDB must not appear at independent origin');
    await putIdb(fresh,'new-origin-idb');
    assert.equal(await getIdb(old),'legacy-idb');
    assert.equal(await getIdb(fresh),'new-origin-idb');

    // A deliberately identical synthetic checkpoint is NOT an encrypted-file import.
    // It models a user selecting the same snapshot in two independent locations.
    // A cached old tab can then accept a later edit, but the new location has no
    // way to infer that change from its own storage; never silently claim sync.
    await old.evaluate(s=>window.__oldVault.save(s),state('same-synthetic-checkpoint'));
    await fresh.evaluate(s=>window.__oldVault.save(s),state('same-synthetic-checkpoint'));
    const newOriginCheckpoint=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    assert.deepEqual(await old.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id)),
      ['same-synthetic-checkpoint']);
    assert.deepEqual(await fresh.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id)),
      ['same-synthetic-checkpoint']);
    await old.evaluate(s=>window.__oldVault.save(s),state('late-old-origin-only-edit'));
    const oldAfter=await old.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id));
    const newAfter=await fresh.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id));
    assert.deepEqual(oldAfter,['late-old-origin-only-edit']);
    assert.deepEqual(newAfter,['same-synthetic-checkpoint']);
    assert.notDeepEqual(oldAfter,newAfter,'histories must be explicitly recognized as divergent');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),
      newOriginCheckpoint,'late old-origin edit must not touch independent checkpoint');
    assert.deepEqual(await sameOrigin.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>t.id)),oldAfter);

    // ID-only comparison is unsafe: independent edits can retain the same
    // transaction identifier while changing the financial amount. A read-only
    // comparison must not mutate either encrypted origin, and identical IDs
    // must never be presented as proof that ledgers match or are current.
    await old.evaluate(s=>window.__oldVault.save(s),state('same-transaction-id'));
    await fresh.evaluate(s=>window.__oldVault.save(s),state('same-transaction-id'));
    const oldBeforeCollision=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const newBeforeCollision=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const changedAmount=state('same-transaction-id');
    changedAmount.transactions[0].amount=175;
    await old.evaluate(s=>window.__oldVault.save(s),changedAmount);
    const oldAfterCollision=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    assert.notDeepEqual(oldAfterCollision,oldBeforeCollision,
      'the legacy origin must actually commit the synthetic changed amount');
    const oldCollisionRows=await old.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>({id:t.id,amount:t.amount})));
    const newCollisionRows=await fresh.evaluate(async()=>
      (await window.__oldVault.load()).transactions.map(t=>({id:t.id,amount:t.amount})));
    assert.deepEqual(oldCollisionRows.map(t=>t.id),newCollisionRows.map(t=>t.id),
      'identical transaction IDs must be an explicit collision fixture');
    assert.deepEqual(oldCollisionRows,[{id:'same-transaction-id',amount:175}]);
    assert.deepEqual(newCollisionRows,[{id:'same-transaction-id',amount:125}]);
    assert.notDeepEqual(oldCollisionRows,newCollisionRows,
      'identical IDs do not establish equal financial content');
    assert.deepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),oldAfterCollision,
      'read-only old-origin inspection must not write its encrypted envelope');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),newBeforeCollision,
      'read-only new-origin inspection must not write its encrypted envelope');

    // Time-of-check/time-of-use adversary: a complete, read-only inspection
    // can truthfully find equal ledgers, then become stale before a cutover.
    // This is sequential and deterministic, not a claim of atomic handoff.
    const inspectedState=state('post-inspection-same-id');
    await old.evaluate(s=>window.__oldVault.save(s),inspectedState);
    await fresh.evaluate(s=>window.__oldVault.save(s),inspectedState);
    const oldAtInspection=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const newAtInspection=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const inspectedOld=await old.evaluate(()=>window.__oldVault.load());
    const inspectedNew=await fresh.evaluate(()=>window.__oldVault.load());
    assert.deepEqual(inspectedOld,inspectedNew,
      'complete decrypted states are identical at the read-only inspection point');
    assert.deepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),oldAtInspection,
      'old-origin read-only inspection cannot mutate its encrypted envelope');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),newAtInspection,
      'new-origin read-only inspection cannot mutate its encrypted envelope');

    const afterInspection=state('post-inspection-same-id');
    afterInspection.transactions[0].amount=205;
    afterInspection.transactions.push({
      id:'post-inspection-new-expense',kind:'expense',amount:40,
      date:'2026-11-01',accountId:'synthetic'
    });
    await old.evaluate(s=>window.__oldVault.save(s),afterInspection);
    const oldAfterInspection=await old.evaluate(()=>window.__oldVault.load());
    const newAfterInspection=await fresh.evaluate(()=>window.__oldVault.load());
    assert.deepEqual(oldAfterInspection,afterInspection,
      'archived old tab commits changed amount and new transaction after equality check');
    assert.deepEqual(newAfterInspection,inspectedNew,
      'independent origin retains its previously inspected state');
    assert.notDeepEqual(oldAfterInspection,newAfterInspection,
      'one-time full-state equality does not confer future source freshness');
    assert.deepEqual(inspectedOld,inspectedNew,
      'previously observed equality remains a stale observation, not authority');
    assert.notDeepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),oldAtInspection,
      'post-inspection old-origin write must change the archived envelope');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),newAtInspection,
      'post-inspection old-origin write must not touch the independent envelope');
    const oldAfterRead=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const newAfterRead=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    assert.deepEqual(await old.evaluate(()=>window.__oldVault.load()),afterInspection);
    assert.deepEqual(await fresh.evaluate(()=>window.__oldVault.load()),inspectedNew);
    assert.deepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),oldAfterRead,
      'detecting divergence is read-only on the old origin');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),newAfterRead,
      'detecting divergence is read-only on the new origin');

    // Both directions of destructive reset are origin-scoped, too. This is
    // disposable browser research only; NEVER treat an independent-origin
    // reset as consent to erase the other origin or as a completed handoff.
    const oldBeforeReset=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const newBeforeReset=await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    const oldLedgerBeforeReset=await old.evaluate(()=>window.__oldVault.load());
    const newLedgerBeforeReset=await fresh.evaluate(()=>window.__oldVault.load());
    const oldIdbBeforeReset=await getIdb(old);
    const newIdbBeforeReset=await getIdb(fresh);
    assert.ok(oldBeforeReset.every(Boolean)&&newBeforeReset.every(Boolean),
      'both disposable origins must have authenticated envelopes before reset');
    await old.evaluate(()=>window.__oldVault.resetData());
    assert.deepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),[null,null],
      'archived reset must actually remove its own origin envelope');
    assert.deepEqual(await sameOrigin.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),[null,null],
      'different URL paths share the archived origin reset');
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),newBeforeReset,
      'archived reset must not delete independent origin envelope');
    assert.deepEqual(await fresh.evaluate(()=>window.__oldVault.load()),newLedgerBeforeReset,
      'archived reset must not alter independent origin decrypted ledger');
    assert.equal(await getIdb(fresh),newIdbBeforeReset,
      'archived reset must not alter independent origin IndexedDB');
    console.log('PASS RESEARCH: archived v1 reset deletes same-origin pair but not independent origin ledger');

    // Restore only the synthetic old-origin fixture for the reverse-direction
    // test. No backup import, migration, or recovery logic is exercised.
    await old.evaluate(s=>window.__oldVault.save(s),oldLedgerBeforeReset);
    assert.ok((await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD])).every(Boolean),
      'disposable old origin must reinitialize for reverse-direction reset');
    const restoredOld=await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]);
    await fresh.evaluate(()=>window.__oldVault.resetData());
    assert.deepEqual(await fresh.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),[null,null],
      'independent origin reset must remove only its own pair');
    assert.deepEqual(await old.evaluate(([k,p])=>
      [localStorage.getItem(k),localStorage.getItem(p)],[KEY,PAYLOAD]),restoredOld,
      'new origin reset must preserve old origin ciphertext exactly');
    assert.deepEqual(await old.evaluate(()=>window.__oldVault.load()),oldLedgerBeforeReset,
      'new origin reset must preserve old origin financial history');
    assert.equal(await getIdb(old),oldIdbBeforeReset,
      'new origin reset must not alter old origin IndexedDB');
    console.log('PASS RESEARCH: independent origin reset does not erase archived origin ledger');
    console.log('LIMIT: isolated resets do not resolve stale old-origin edits, provenance or user consent');

    console.log('PASS RESEARCH: complete read-only equality becomes stale after later archived write');
    console.log('PASS RESEARCH: same-origin paths share archived v1 ledger');
    console.log('PASS RESEARCH: late archived v1 AES-GCM write cannot alter second-origin localStorage');
    console.log('PASS RESEARCH: same-name IndexedDB databases are origin-isolated');
    console.log('PASS RESEARCH: identical synthetic checkpoints diverge after late old-origin edit');
    console.log('PASS RESEARCH: identical transaction IDs can hide changed amounts without inspection writes');
    console.log('LIMIT: no encrypted-file handoff, freshness proof, Safari, or production cutover tested');
  }finally{
    if(browser)await browser.close();
    await Promise.all([new Promise(resolve=>oldServer.close(resolve)),
      new Promise(resolve=>newServer.close(resolve))]);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
