'use strict';
// P1 #4/#29/#35 — disposable Chromium cross-tab IndexedDB race characterization.
// NOT a production importer, a safety guarantee, or a financial-ledger mutation.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ORIGIN='https://vault-cross-tab.example.test/';
const DB='fa-research-queued-cross-tab-idb';
const STORE='ledger';

async function openDb(page){
  await page.evaluate(async({name,store})=>{
    window.__researchDb=await new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(store);
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  },{name:DB,store:STORE});
}
async function readRecord(page){
  return page.evaluate(store=>new Promise((resolve,reject)=>{
    const tx=window.__researchDb.transaction(store,'readonly');
    const request=tx.objectStore(store).get('sentinel');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }),STORE);
}
async function main(){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  let context;
  try{
    context=await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*',route=>route.fulfill({
      status:200,contentType:'text/html',
      body:'<!doctype html><html><title>Synthetic cross-tab IDB research</title><body>synthetic</body></html>'
    }));
    const inspector=await context.newPage(),writer=await context.newPage();
    await Promise.all([inspector.goto(ORIGIN),writer.goto(ORIGIN)]);
    await openDb(inspector);
    await openDb(writer);
    await inspector.evaluate(store=>new Promise((resolve,reject)=>{
      const tx=window.__researchDb.transaction(store,'readwrite');
      tx.objectStore(store).put('before-other-tab','sentinel');
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    }),STORE);
    assert.equal(await readRecord(inspector),'before-other-tab');

    // Keep a real IDB readwrite transaction alive by chaining requests.
    // The writer's transaction is queued behind this holder, not merely a
    // JavaScript timer scheduled to write in the future.
    await inspector.evaluate(store=>{
      window.__releaseResearchHolder=false;
      window.__holderCompleted=false;
      const tx=window.__researchDb.transaction(store,'readwrite');
      tx.oncomplete=()=>{window.__holderCompleted=true};
      tx.onabort=()=>{window.__holderCompleted=true};
      const objectStore=tx.objectStore(store);
      let requests=0;
      const pump=()=>{
        const request=objectStore.get('sentinel');
        request.onsuccess=()=>{
          requests++;
          if(!window.__releaseResearchHolder && requests<100000)
            pump();
        };
      };
      pump();
      window.__holderStarted=true;
    },STORE);
    await writer.evaluate(store=>{
      window.__writerFinished=false;
      const tx=window.__researchDb.transaction(store,'readwrite');
      window.__writerDone=new Promise((resolve,reject)=>{
        tx.oncomplete=()=>{window.__writerFinished=true;resolve('committed')};
        tx.onerror=()=>reject(tx.error||Error('writer transaction error'));
        tx.onabort=()=>reject(tx.error||Error('writer transaction aborted'));
      });
      tx.objectStore(store).put('after-other-tab','sentinel');
      window.__writerQueued=true;
    },STORE);
    await inspector.waitForTimeout(70);
    assert.equal(await writer.evaluate(()=>window.__writerQueued),true);
    assert.equal(await writer.evaluate(()=>window.__writerFinished),false,
      'other-tab write must be genuinely queued behind the active IDB transaction');
    assert.equal(await inspector.evaluate(()=>window.__holderCompleted),false,
      'holder must still be active before the read-only inspection');

    // Guards are intentionally page-local, as in the selected-file H05/H06
    // experiment. They cannot intercept the other tab's independent realm.
    const preflight=await inspector.evaluate(async()=>{
      const originalTx=IDBDatabase.prototype.transaction;
      const originalPut=IDBObjectStore.prototype.put;
      const originalOpen=indexedDB.open;
      const originalSet=Storage.prototype.setItem;
      const originalRemove=Storage.prototype.removeItem;
      let inspectorWrites=0;
      IDBDatabase.prototype.transaction=function(names,mode,...rest){
        if(mode && mode!=='readonly'){
          inspectorWrites++;
          throw Error('RESEARCH_INSPECTOR_WRITE_BLOCKED');
        }
        return originalTx.call(this,names,mode,...rest);
      };
      IDBObjectStore.prototype.put=function(){
        inspectorWrites++;
        throw Error('RESEARCH_INSPECTOR_PUT_BLOCKED');
      };
      indexedDB.open=function(){
        inspectorWrites++;
        throw Error('RESEARCH_INSPECTOR_OPEN_BLOCKED');
      };
      Storage.prototype.setItem=function(){
        inspectorWrites++;
        throw Error('RESEARCH_INSPECTOR_STORAGE_BLOCKED');
      };
      Storage.prototype.removeItem=function(){
        inspectorWrites++;
        throw Error('RESEARCH_INSPECTOR_STORAGE_BLOCKED');
      };
      window.__getInspectorWrites=()=>inspectorWrites;
      window.__restoreInspectorGuards=()=>{
        IDBDatabase.prototype.transaction=originalTx;
        IDBObjectStore.prototype.put=originalPut;
        indexedDB.open=originalOpen;
        Storage.prototype.setItem=originalSet;
        Storage.prototype.removeItem=originalRemove;
      };
      let guardProbeBlocked=false;
      try{window.__researchDb.transaction('ledger','readwrite')}
      catch(e){guardProbeBlocked=e.message==='RESEARCH_INSPECTOR_WRITE_BLOCKED'}
      inspectorWrites=0; // exclude deliberate positive control
      const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).sort();
      const databases=(await indexedDB.databases())
        .map(d=>({name:d.name,version:d.version}))
        .sort((a,b)=>a.name.localeCompare(b.name));
      return {keys,databases,guardProbeBlocked,inspectorWrites};
    });
    assert.equal(preflight.guardProbeBlocked,true,'page-local write guard must be active');
    assert.equal(preflight.inspectorWrites,0,'read-only preflight must perform zero writes');
    assert.ok(preflight.databases.some(d=>d.name===DB));
    assert.equal(await writer.evaluate(()=>window.__writerFinished),false);

    // A queued writer can commit immediately after the read-only check.
    // No import is performed; only the synthetic writer changes the sentinel.
    await inspector.evaluate(()=>{window.__releaseResearchHolder=true});
    const committed=await writer.evaluate(()=>Promise.race([
      window.__writerDone,
      new Promise((_,reject)=>setTimeout(()=>reject(Error('queued writer timeout')),10000))
    ]));
    assert.equal(committed,'committed');
    assert.equal(await readRecord(inspector),'after-other-tab');
    const postflight=await inspector.evaluate(async()=>{
      const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).sort();
      const databases=(await indexedDB.databases())
        .map(d=>({name:d.name,version:d.version}))
        .sort((a,b)=>a.name.localeCompare(b.name));
      return {keys,databases,writes:window.__getInspectorWrites()};
    });
    assert.deepEqual(postflight.keys,preflight.keys);
    assert.deepEqual(postflight.databases,preflight.databases,
      'IDB names/versions do not reveal a cross-tab record mutation');
    assert.equal(postflight.writes,0,'inspector must have zero write attempts');
    await inspector.evaluate(()=>window.__restoreInspectorGuards());
    console.log('PASS RESEARCH queued other-tab IDB write: queued before read-only preflight; committed afterward');
    console.log('PASS RESEARCH page-local IDB guard: blocks positive control but cannot fence independent tab');
    console.log('PASS RESEARCH IDB footprint: database names/versions unchanged while sentinel record changed');
    console.log('LIMIT: synthetic same-origin IDB race; no importer, atomicity, real vault, backup, Safari or production fix');
    await Promise.all([inspector.evaluate(()=>window.__researchDb.close()),
      writer.evaluate(()=>window.__researchDb.close())]);
  }finally{
    if(context)await context.close();
    await browser.close();
  }
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
