'use strict';
// #4/#29/#35 RESEARCH ONLY. Disposable same-origin Chromium, synthetic values.
// Tests pagehide/reload during a blocked IndexedDB upgrade and queued Web Lock.
// No production recovery code, real ledger, destructive API, or user backup.
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');

const DB='fa.research.pagehide.blocked-idb.20261031';
const LOCK='fa.research.pagehide.queued-lock.20261031';
const KEY='financial-autonomy.preview.key.v1';
const PAY='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const CALLBACK='fa.research.only.unexpected-lock-callback';
const initial=['SYNTHETIC-KEY-NOT-REAL','SYNTHETIC-CIPHERTEXT-NOT-REAL','synthetic-reset-marker'];
const vault=()=>[localStorage.getItem(KEY),localStorage.getItem(PAY),localStorage.getItem(RESET)];

async function openDatabase(page){
  await page.evaluate(async name=>{
    const request=indexedDB.open(name,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('synthetic');
    window.__oldDb=await new Promise((resolve,reject)=>{
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
    await new Promise((resolve,reject)=>{
      const tx=window.__oldDb.transaction('synthetic','readwrite');
      tx.objectStore('synthetic').put('original','sentinel');
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error);
    });
  },DB);
}

async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><title>Disposable lifecycle test</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    context=await browser.newContext();
    const url='http://127.0.0.1:'+server.address().port+'/?fa_real=1';
    const holder=await context.newPage(),worker=await context.newPage();
    await Promise.all([holder.goto(url),worker.goto(url)]);
    assert.equal(await worker.evaluate(()=>isSecureContext),true);
    await holder.evaluate(({KEY,PAY,RESET,initial})=>{
      localStorage.setItem(KEY,initial[0]);
      localStorage.setItem(PAY,initial[1]);
      localStorage.setItem(RESET,initial[2]);
    },{KEY,PAY,RESET,initial});
    assert.deepEqual(await worker.evaluate(vault),initial);
    await openDatabase(holder);

    // The old page holds v1 open; v2 request is genuinely blocked.
    // Its late upgrade callback always aborts; a timed-out/hidden page
    // cannot be granted new authority by an eventual unblock.
    await worker.evaluate(name=>{
      window.__blocked=false;
      const request=indexedDB.open(name,2);
      request.onblocked=()=>{window.__blocked=true;};
      request.onupgradeneeded=()=>request.transaction.abort();
      request.onsuccess=()=>request.result.close();
      request.onerror=()=>{};
      addEventListener('pagehide',()=>{
        sessionStorage.setItem('fa.research.idb-pagehide','seen');
      },{once:true});
    },DB);
    await worker.waitForFunction(()=>window.__blocked===true,null,{timeout:10000});
    await worker.reload({waitUntil:'domcontentloaded'});
    assert.equal(await worker.evaluate(()=>
      sessionStorage.getItem('fa.research.idb-pagehide')),'seen',
      'actual pagehide must occur before the reload');
    await holder.evaluate(()=>{window.__oldDb.close();window.__oldDb=null;});
    const evidence=await worker.evaluate(async name=>{
      const request=indexedDB.open(name);
      request.onupgradeneeded=()=>request.transaction.abort();
      const db=await new Promise((resolve,reject)=>{
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
      try{
        const value=await new Promise((resolve,reject)=>{
          const tx=db.transaction('synthetic','readonly');
          const get=tx.objectStore('synthetic').get('sentinel');
          tx.oncomplete=()=>resolve(get.result);
          tx.onabort=()=>reject(tx.error);
          tx.onerror=()=>reject(tx.error);
        });
        return {version:db.version,value};
      }finally{db.close();}
    },DB);
    assert.deepEqual(evidence,{version:1,value:'original'},
      'reload must not promote blocked v2 upgrade or rewrite v1');
    assert.deepEqual(await worker.evaluate(vault),initial);
    console.log('PASS Chromium pagehide/reload during real blocked IDB upgrade: v1 schema/sentinel and synthetic encrypted footprint unchanged');

    // Real exclusive lock held by old tab; new tab queues and cancels on
    // pagehide. Callback would write a TEST-ONLY marker if it ever entered.
    assert.equal(await worker.evaluate(()=>typeof navigator.locks?.request),'function');
    const holding=holder.evaluate(name=>navigator.locks.request(name,
      {mode:'exclusive'},async()=>{
        window.__lockHeld=true;
        await new Promise(resolve=>{window.__releaseLock=resolve;});
      }),LOCK);
    await holder.waitForFunction(()=>window.__lockHeld===true,null,{timeout:10000});
    await worker.evaluate(({name,marker})=>{
      const controller=new AbortController();
      addEventListener('pagehide',()=>{
        sessionStorage.setItem('fa.research.lock-pagehide','seen');
        controller.abort();
      },{once:true});
      navigator.locks.request(name,{mode:'exclusive',signal:controller.signal},()=>{
        localStorage.setItem(marker,'UNEXPECTED');
      }).catch(()=>{});
    },{name:LOCK,marker:CALLBACK});
    await holder.waitForFunction(async name=>{
      const state=await navigator.locks.query();
      return state.pending.some(item=>item.name===name);
    },LOCK,{timeout:10000});
    await worker.reload({waitUntil:'domcontentloaded'});
    assert.equal(await worker.evaluate(()=>
      sessionStorage.getItem('fa.research.lock-pagehide')),'seen');
    await holder.evaluate(()=>window.__releaseLock());
    await holding;
    await worker.waitForFunction(async name=>{
      const state=await navigator.locks.query();
      return !state.pending.some(item=>item.name===name)&&
        !state.held.some(item=>item.name===name);
    },LOCK,{timeout:10000});
    assert.equal(await worker.evaluate(marker=>localStorage.getItem(marker),CALLBACK),null,
      'a cancelled page must never execute a late lock callback');
    assert.deepEqual(await worker.evaluate(vault),initial);
    console.log('PASS Chromium pagehide/reload while real Web Lock queued: aborted/no late callback; synthetic encrypted footprint unchanged');
    console.log('KNOWN UNSAFE: cached noncooperating v1 writers still bypass modern Web Locks; NO destructive recovery authorized');
  }finally{
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
