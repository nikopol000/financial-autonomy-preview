'use strict';
// #4 RESEARCH ONLY: one IndexedDB transaction for encrypted authority + state.
// Synthetic ledger, fixed TEST-ONLY crypto key, disposable localhost origin.
// This does NOT establish key provenance, durable flush, or rollback resistance.
const assert=require('node:assert/strict');
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
    const research=window.__atomicResearch={};
    research.raw=raw;
    research.read=async()=>{
      const record=await raw();
      if(!record)throw Error('MISSING_AUTHORITY');
      if(!Number.isSafeInteger(record.revision)||record.revision<1)
        throw Error('BAD_REVISION');
      const value=await unseal(record.envelope);
      if(!['active','reset'].includes(value.status)||
        (value.status==='reset'&&value.state!==null))
        throw Error('BAD_STATE');
      return {revision:record.revision,...value};
    };
    research.write=async({expectedRevision,state=null,reset=false,fault=null})=>{
      // Encrypt before the transaction; never await crypto while an IDB tx is active.
      const envelope=await seal({status:reset?'reset':'active',state:reset?null:state});
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
          if(fault==='before-put'){
            outcome={ok:false,reason:'injected-before-put'};tx.abort();return;
          }
          store.put({revision:actual+1,envelope},'current');
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
        expectedRevision:0,state:{transactions:['A']}}));
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

      // Demonstrates the fundamental limit of local-only freshness.
      await a.evaluate(record=>window.__atomicResearch.restoreOldForTest(record),original);
      assert.deepEqual((await b.evaluate(()=>window.__atomicResearch.read())).state,
        {transactions:['A']});
      console.log('PASS KNOWN UNSAFE atomic IDB: valid old-record rollback remains possible');
    }finally{await context.close();}
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
