'use strict';
// RESEARCH ONLY (#4/#29/#35): authentic WEB backup crypto + actual archived v1
// writer in disposable same-origin Chromium tabs. NEVER authorize deletion.
// This test does not import a recovery gate into the product or touch user data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const OLD='_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js';
const KEY='financial-autonomy.preview.key.v1';
const PAY='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const LOCK='fa.research.consent.readonly.v2';
const PASSWORD='Disposable-Authenticated-Source-2026!';
const tx=id=>({id,kind:'expense',amount:125,date:'2026-10-31',accountId:'synthetic'});
const empty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
function archivedModules(){
  const source=fs.readFileSync(path.join(ROOT,OLD),'utf8'),out={};
  function visit(id){
    if(id===204||id===205||out[id])return;
    const hits=[...source.matchAll(new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g'))];
    assert.equal(hits.length,1,'archived Metro module '+id);
    const m=hits[0],start=source.lastIndexOf('__d(function(',m.index);
    assert.ok(start>=0,'archived Metro factory '+id);
    const deps=m[1]?m[1].split(',').map(Number):[];
    out[id]={factory:source.slice(start+4,m.index+1),deps};
    deps.forEach(visit);
  }
  visit(309);
  assert.ok(out[310]&&out[311]);
  return out;
}
async function installOld(page,modules){
  await page.evaluate(defs=>{
    const model={
      emptyState:()=>({version:4,accounts:[],transactions:[],balanceChecks:[]}),
      migrate(s){model.validateState(s);return s},
      validateState(s){
        if(!s||s.version!==4||!['accounts','transactions','balanceChecks'].every(k=>Array.isArray(s[k])))
          throw Error('INVALID_SYNTHETIC_STATE');
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
    if(!window.__archivedVault?.save||!window.__archivedVault?.load)
      throw Error('ARCHIVED_V1_WRITER_MISSING');
  },modules);
}
function serve(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/legacy-test'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><title>Disposable archived writer</title>');return;
  }
  const rel=pathname==='/'||pathname===PREFIX?'index.html':
    pathname.startsWith(PREFIX)?pathname.slice(PREFIX.length):'';
  if(!rel||rel.includes('..')){res.writeHead(404);res.end();return}
  const file=path.resolve(ROOT,rel);
  if(file!==path.join(ROOT,'index.html')&&!file.startsWith(ROOT+path.sep)){
    res.writeHead(403);res.end();return;
  }
  fs.readFile(file,(err,bytes)=>{
    if(err){res.writeHead(404);res.end();return}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?
      'application/javascript; charset=utf-8':'text/html; charset=utf-8',
      'Cache-Control':'no-store'});
    res.end(bytes);
  });
}
async function openReal(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>/deschide aplicația|autonomie|datele locale nu pot fi deschise/i
    .test(document.body?.innerText||''),null,{timeout:25000});
  const start=page.getByText('Deschide aplicația',{exact:true});
  if(await start.isVisible())await start.click();
  await page.waitForFunction(()=>typeof window.__r==='function'&&
    typeof window.__r(311)?.backup==='function',null,{timeout:20000});
}
async function main(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    context=await browser.newContext();
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    const current=await context.newPage(),old=await context.newPage();
    await Promise.all([openReal(current,url),old.goto(new URL('/legacy-test?fa_real=1',url).toString())]);
    await installOld(old,archivedModules());
    assert.equal(await current.evaluate(()=>isSecureContext),true);
    assert.equal(await current.evaluate(()=>typeof navigator.locks?.request),'function');
    await old.evaluate(s=>window.__archivedVault.save(s),{
      ...empty(),transactions:[tx('initial')]
    });
    const initial=await old.evaluate(key=>localStorage.getItem(key),PAY);
    assert.ok(initial?.length>50);
    await current.waitForFunction(([key,value])=>localStorage.getItem(key)===value,
      [PAY,initial],{timeout:10000});

    // Actual active immutable module 311: PBKDF2 (600k) + AES-GCM, not mock proof.
    // Match the actual WEB v4 portable-backup schema (synthetic only).
    const date=new Date().toISOString().slice(0,10);
    const fixture={
      version:4,names:[],nameChanges:[],rolesEffectiveFrom:date,
      balanceChecks:[],checkAudit:[],currency:'RON',started:date,
      accounts:[{id:'consent-synthetic',name:'Cont de test',kind:'current',opening:10000,date}],
      incomes:[],expenses:[],debts:[],recurring:[],
      transactions:[{id:'consent-synthetic-expense',name:'Operațiune test',kind:'expense',
        accountId:'consent-synthetic',amount:125,date,details:[]}],
      monthPlans:[{month:date.slice(0,7),budgets:[],expenses:[],debtPayments:[],contribution:0}],
      goals:[],plans:[],reviews:{},audit:[]
    };
    const backup=await current.evaluate(async({state,password})=>
      window.__r(311).backup(state,password,n=>crypto.getRandomValues(new Uint8Array(n))),
      {state:fixture,password:PASSWORD});
    const envelope=JSON.parse(backup);
    assert.equal(envelope.format,'FinancialAutonomy');
    assert.equal(envelope.version,1);
    assert.equal(envelope.iterations,600000);
    assert.ok(!backup.includes('"transactions":['));
    await current.evaluate(({key,pay,reset,lock})=>{
      const pair=()=>JSON.stringify([localStorage.getItem(key),
        localStorage.getItem(pay),localStorage.getItem(reset)]);
      const originalSet=Storage.prototype.setItem;
      const originalRemove=Storage.prototype.removeItem;
      window.__consentResearch={phase:null,release:null,gateWrites:0,pair};
      const names=new Set([key,pay,reset]);
      Storage.prototype.setItem=function(name,value){
        if(this===localStorage&&names.has(name))window.__consentResearch.gateWrites++;
        return originalSet.call(this,name,value);
      };
      Storage.prototype.removeItem=function(name){
        if(this===localStorage&&names.has(name))window.__consentResearch.gateWrites++;
        return originalRemove.call(this,name);
      };
      window.__consentResearch.preview=async(text,password,mode='none',locksAvailable=true)=>{
        let before;
        try{before=pair();}catch(_){return {code:'STORAGE_UNAVAILABLE'};}
        // An orphan KEY or PAYLOAD is ambiguous: interrupted initialization,
        // deletion, reset or eviction cannot be distinguished by this origin.
        const initialPair=JSON.parse(before);
        if(Boolean(initialPair[0])!==Boolean(initialPair[1]))
          return {code:'AMBIGUOUS_V1_PAIR'};
        if(!locksAvailable||typeof navigator.locks?.request!=='function')
          return {code:'NO_LOCKS'};
        let validated;
        try{
          validated=await window.__r(311).restore(text,password);
          validated=window.__r(205).migrate(validated);
        }catch(_){return {code:'AUTH_FAILED'};}
        if(validated?.version!==4)return {code:'UNVERIFIABLE_SOURCE'};
        if(pair()!==before)return {code:'EVIDENCE_CHANGED_DURING_PROOF'};
        return navigator.locks.request(lock,{mode:'exclusive'},async()=>{
          if(mode==='before'){
            window.__consentResearch.phase='before';
            await new Promise(resolve=>window.__consentResearch.release=resolve);
          }
          let after;
          try{after=pair();}catch(_){return {code:'STORAGE_UNAVAILABLE'};}
          const checkedPair=JSON.parse(after);
          if(Boolean(checkedPair[0])!==Boolean(checkedPair[1]))
            return {code:'AMBIGUOUS_V1_PAIR'};
          if(after!==before)return {code:'EVIDENCE_CHANGED'};
          if(mode==='after'){
            window.__consentResearch.phase='after';
            await new Promise(resolve=>window.__consentResearch.release=resolve);
          }
          // Deliberately NO destructive callback. This is NOT authorization.
          return {code:'READ_ONLY_REVIEW_ONLY',reviewed:after};
        });
      };
      window.__consentResearch.disarm=()=>{
        Storage.prototype.setItem=originalSet;
        Storage.prototype.removeItem=originalRemove;
      };
    },{key:KEY,pay:PAY,reset:RESET,lock:LOCK});
    const snapshot=await current.evaluate(()=>window.__consentResearch.pair());
    assert.equal((await current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password),
      {text:backup,password:'incorrect-password'})).code,'AUTH_FAILED');
    const tampered=JSON.stringify({...envelope,
      data:(envelope.data[0]==='a'?'b':'a')+envelope.data.slice(1)});
    assert.equal((await current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password),
      {text:tampered,password:PASSWORD})).code,'AUTH_FAILED');
    assert.equal((await current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password,'none',false),
      {text:backup,password:PASSWORD})).code,'NO_LOCKS');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),snapshot);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    console.log('PASS Chromium actual WEB backup: PBKDF2/AES-GCM, wrong password, tamper and no-lock all fail closed without gate writes');

    // A noncooperating cached 18.33 writer modifies real v1 ciphertext
    // WHILE the modern read-only gate holds a real Web Lock.
    const pending=current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password,'before'),
      {text:backup,password:PASSWORD});
    await current.waitForFunction(()=>window.__consentResearch.phase==='before',
      null,{timeout:20000});
    await old.evaluate(s=>window.__archivedVault.save(s),{
      ...empty(),transactions:[tx('before-reinspection')]
    });
    const changed=await old.evaluate(key=>localStorage.getItem(key),PAY);
    assert.notEqual(changed,initial);
    await current.waitForFunction(([key,value])=>localStorage.getItem(key)===value,
      [PAY,changed],{timeout:10000});
    await current.evaluate(()=>window.__consentResearch.release());
    assert.equal((await pending).code,'EVIDENCE_CHANGED');
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    console.log('PASS Chromium actual archived 18.33 writer: pre-reinspection change blocked under real Web Lock');

    // The same old writer ignores the lock AFTER the final reinspection.
    // A green result here is a NEGATIVE safety finding, not a restore grant.
    await current.evaluate(()=>{window.__consentResearch.phase=null;});
    const post=current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password,'after'),
      {text:backup,password:PASSWORD});
    await current.waitForFunction(()=>window.__consentResearch.phase==='after',
      null,{timeout:20000});
    await old.evaluate(s=>window.__archivedVault.save(s),{
      ...empty(),transactions:[tx('after-reinspection')]
    });
    const late=await old.evaluate(key=>localStorage.getItem(key),PAY);
    await current.waitForFunction(([key,value])=>localStorage.getItem(key)===value,
      [PAY,late],{timeout:10000});
    await current.evaluate(()=>window.__consentResearch.release());
    const result=await post;
    assert.equal(result.code,'READ_ONLY_REVIEW_ONLY');
    assert.notEqual(result.reviewed,await current.evaluate(()=>window.__consentResearch.pair()));
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    assert.equal(await current.evaluate(()=>typeof window.__consentResearch.commit),'undefined');
    // Real same-origin localStorage footprints with one surviving half must not
    // be interpreted as empty or as authorization to replace an encrypted vault.
    // All removals below are test-fixture operations in a disposable Chromium
    // origin; the consent gate itself must perform ZERO storage writes.
    const intact=await old.evaluate(([key,pay])=>({
      key:localStorage.getItem(key),pay:localStorage.getItem(pay)
    }),[KEY,PAY]);
    assert.ok(intact.key&&intact.pay);
    const intactPair=await current.evaluate(()=>window.__consentResearch.pair());
    for(const missing of [PAY,KEY]){
      await old.evaluate(name=>localStorage.removeItem(name),missing);
      await current.waitForFunction(([name])=>localStorage.getItem(name)===null,
        [missing],{timeout:10000});
      const response=await current.evaluate(({text,password})=>
        window.__consentResearch.preview(text,password),
        {text:backup,password:PASSWORD});
      assert.equal(response.code,'AMBIGUOUS_V1_PAIR',missing+' missing');
      assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
      await old.evaluate(([name,value])=>localStorage.setItem(name,value),
        [missing,missing===KEY?intact.key:intact.pay]);
      await current.waitForFunction(([name,value])=>localStorage.getItem(name)===value,
        [missing,missing===KEY?intact.key:intact.pay],{timeout:10000});
    }
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    console.log('PASS Chromium ambiguous KEY-only/PAYLOAD-only footprints block authenticated consent review without gate writes');

    // A SecurityError on an actual localStorage read must fail closed; do not
    // infer that inaccessible encrypted evidence is absent or disposable.
    await current.evaluate(key=>{
      const original=Storage.prototype.getItem;
      window.__consentResearch.restoreGetItem=()=>{Storage.prototype.getItem=original;};
      Storage.prototype.getItem=function(name){
        if(this===localStorage&&name===key)
          throw new DOMException('Synthetic denied read','SecurityError');
        return original.call(this,name);
      };
    },KEY);
    const denied=await current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password),
      {text:backup,password:PASSWORD});
    assert.equal(denied.code,'STORAGE_UNAVAILABLE');
    await current.evaluate(()=>window.__consentResearch.restoreGetItem());
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    console.log('PASS Chromium denied localStorage read fails closed and preserves encrypted evidence');

    // Fault injected AFTER authenticating the real AES-GCM backup, but BEFORE
    // the final read under the real Web Lock. An earlier successful read must
    // never be treated as permission to proceed when later storage is denied.
    await current.evaluate(()=>{window.__consentResearch.phase=null;});
    const deniedAtFinal=current.evaluate(({text,password})=>
      window.__consentResearch.preview(text,password,'before'),
      {text:backup,password:PASSWORD});
    await current.waitForFunction(()=>window.__consentResearch.phase==='before',
      null,{timeout:20000});
    await current.evaluate(key=>{
      const original=Storage.prototype.getItem;
      window.__consentResearch.restoreFinalRead=()=>{Storage.prototype.getItem=original;};
      Storage.prototype.getItem=function(name){
        if(this===localStorage&&name===key)
          throw new DOMException('Synthetic final-read denial','SecurityError');
        return original.call(this,name);
      };
    },PAY);
    await current.evaluate(()=>window.__consentResearch.release());
    assert.equal((await deniedAtFinal).code,'STORAGE_UNAVAILABLE');
    await current.evaluate(()=>window.__consentResearch.restoreFinalRead());
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    assert.equal(await current.evaluate(()=>typeof window.__consentResearch.commit),'undefined');
    console.log('PASS Chromium final locked reinspection SecurityError after real AES-GCM authentication blocks without gate writes');


    // Real Chromium IndexedDB lifecycle, following authentic WEB backup proof.
    // This is an independent READ-ONLY research preflight, not a product gate.
    // IndexedDB may be missing, evicted, denied, or missing a required store;
    // NONE of those states proves the encrypted localStorage ledger is empty.
    const idbName='fa-consent-disposable-idb-20261031';
    await current.evaluate(async name=>{
      const opened=indexedDB.open(name,1);
      opened.onupgradeneeded=()=>opened.result.createObjectStore('authority');
      const db=await new Promise((resolve,reject)=>{
        opened.onsuccess=()=>resolve(opened.result);
        opened.onerror=()=>reject(opened.error);
      });
      try{
        await new Promise((resolve,reject)=>{
          const tx=db.transaction('authority','readwrite');
          tx.objectStore('authority').put('synthetic-marker','sentinel');
          tx.oncomplete=resolve;
          tx.onerror=()=>reject(tx.error);
          tx.onabort=()=>reject(tx.error);
        });
      }finally{db.close();}
      window.__consentResearch.idbReadOnly=async(name,store)=>{
        try{
          // Do not open an unknown DB: an ordinary IDB open may create it.
          const entries=await indexedDB.databases();
          if(!Array.isArray(entries)||!entries.some(x=>x.name===name))
            return {code:'IDB_MISSING'};
          const request=indexedDB.open(name);
          // If a race removes the DB after enumeration, abort its implicit
          // creation rather than silently initializing an empty authority.
          request.onupgradeneeded=()=>request.transaction.abort();
          const existing=await new Promise((resolve,reject)=>{
            request.onsuccess=()=>resolve(request.result);
            request.onerror=()=>reject(request.error);
          });
          try{
            if(!existing.objectStoreNames.contains(store))
              return {code:'IDB_STORE_MISSING'};
            // A successful get() event is NOT a committed IDB transaction.
            // Wait for oncomplete; an abort after onsuccess invalidates proof.
            const value=await new Promise((resolve,reject)=>{
              const tx=existing.transaction(store,'readonly');
              const read=tx.objectStore(store).get('sentinel');
              let observed;
              read.onsuccess=()=>{observed=read.result;};
              read.onerror=()=>reject(read.error||Error('IDB read failed'));
              tx.oncomplete=()=>resolve(observed);
              tx.onerror=()=>reject(tx.error||Error('IDB transaction error'));
              tx.onabort=()=>reject(tx.error||Error('IDB transaction aborted'));
            });
            return {code:value==='synthetic-marker'?'READ_ONLY_EVIDENCE':'IDB_UNVERIFIABLE'};
          }finally{existing.close();}
        }catch(_){return {code:'IDB_UNAVAILABLE'};}
      };
    },idbName);
    // Authenticate a genuine WEB v4 AES-GCM backup before the IDB read-only
    // preflight; this proves control of the FILE, not IDB authority/freshness.
    assert.equal(await current.evaluate(async({text,password})=>
      (await window.__r(311).restore(text,password)).version,
      {text:backup,password:PASSWORD}),4);
    assert.equal((await current.evaluate(name=>
      window.__consentResearch.idbReadOnly(name,'authority'),idbName)).code,
      'READ_ONLY_EVIDENCE');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    console.log('PASS Chromium real IndexedDB readonly evidence after authentic WEB backup proof; zero vault writes');

    // Force a REAL readonly transaction abort after get() reports success.
    // The old helper returned READ_ONLY_EVIDENCE from get.onsuccess, before
    // transaction completion. That event alone must not grant authority.
    const abortedRead=await current.evaluate(async name=>{
      const originalGet=IDBObjectStore.prototype.get;
      let injected=false;
      IDBObjectStore.prototype.get=function(key){
        const request=originalGet.call(this,key);
        if(this.name==='authority'&&key==='sentinel'){
          const transaction=this.transaction;
          request.addEventListener('success',()=>{
            injected=true;
            transaction.abort();
          },{once:true});
        }
        return request;
      };
      try{
        const result=await window.__consentResearch.idbReadOnly(name,'authority');
        return {code:result.code,injected};
      }finally{IDBObjectStore.prototype.get=originalGet;}
    },idbName);
    assert.equal(abortedRead.injected,true,'real get() success event reached');
    assert.equal(abortedRead.code,'IDB_UNAVAILABLE',
      'aborted readonly transaction must never count as verified evidence');
    assert.equal((await current.evaluate(name=>
      window.__consentResearch.idbReadOnly(name,'authority'),idbName)).code,
      'READ_ONLY_EVIDENCE','retry must read the original synthetic sentinel');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    console.log('PASS Chromium real IDB abort AFTER get success blocks authority until transaction complete; retry read-only; zero vault writes');

    // A real version upgrade removes the expected object store. The read-only
    // preflight MUST refuse the incomplete schema without recreating it.
    await current.evaluate(async name=>{
      const req=indexedDB.open(name,2);
      req.onupgradeneeded=()=>req.result.deleteObjectStore('authority');
      const db=await new Promise((resolve,reject)=>{
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
      db.close();
    },idbName);
    assert.equal((await current.evaluate(name=>
      window.__consentResearch.idbReadOnly(name,'authority'),idbName)).code,
      'IDB_STORE_MISSING');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    console.log('PASS Chromium real IndexedDB missing object store blocks readonly authority; ciphertext preserved');

    // Simulate origin-local eviction by deleting only the disposable IDB.
    // No IDB is automatically recreated by the preflight.
    await current.evaluate(async name=>{
      const req=indexedDB.deleteDatabase(name);
      await new Promise((resolve,reject)=>{
        req.onsuccess=resolve;
        req.onerror=()=>reject(req.error);
        req.onblocked=()=>reject(Error('Disposable IDB deletion blocked'));
      });
    },idbName);
    assert.equal((await current.evaluate(name=>
      window.__consentResearch.idbReadOnly(name,'authority'),idbName)).code,
      'IDB_MISSING');
    assert.equal(await current.evaluate(name=>
      indexedDB.databases().then(xs=>xs.some(x=>x.name===name)),idbName),false);
    console.log('PASS Chromium real IndexedDB deletion treated as missing, not empty; no implicit recreation');

    // A synthetic permission denial on the IDB enumeration must also block.
    // This is fault injection, NOT evidence of an actual browser permission bug.
    assert.equal(await current.evaluate(async name=>{
      Object.defineProperty(indexedDB,'databases',{configurable:true,
        value:()=>Promise.reject(new DOMException('Synthetic IDB denial','SecurityError'))});
      try{return (await window.__consentResearch.idbReadOnly(name,'authority')).code;}
      finally{delete indexedDB.databases;}
    },idbName),'IDB_UNAVAILABLE');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    assert.equal(await current.evaluate(()=>typeof window.__consentResearch.commit),'undefined');
    console.log('PASS Chromium injected IndexedDB SecurityError blocks readonly preflight; zero vault writes; NO destructive authority');


    // Real cross-tab IndexedDB version upgrade blocked by an old connection.
    // A deadline must not promote a late request into recovery authority.
    const blockedDb='fa-consent-disposable-blocked-upgrade-20261031';
    await old.evaluate(async name=>{
      const request=indexedDB.open(name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore('synthetic');
      window.__blockedDbConnection=await new Promise((resolve,reject)=>{
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
    },blockedDb);
    const blockedOutcome=await current.evaluate(async name=>{
      const probe={blocked:false,timedOut:false,upgradeSeen:false,
        lateError:null,unexpectedSuccess:false};
      window.__consentResearch.blockedIdbProbe=probe;
      const request=indexedDB.open(name,2);
      request.onblocked=()=>{probe.blocked=true;};
      request.onupgradeneeded=()=>{
        probe.upgradeSeen=true;
        // A late upgrade must not initialize or mutate authority.
        request.transaction.abort();
      };
      request.onsuccess=()=>{
        probe.unexpectedSuccess=true;
        request.result.close();
      };
      request.onerror=()=>{probe.lateError=request.error?.name||'unknown';};
      await new Promise(resolve=>setTimeout(resolve,300));
      probe.timedOut=true;
      return 'INSPECTION_TIMEOUT';
    },blockedDb);
    assert.equal(blockedOutcome,'INSPECTION_TIMEOUT');
    await current.waitForFunction(()=>window.__consentResearch.blockedIdbProbe.blocked,
      null,{timeout:10000});
    assert.equal(await current.evaluate(()=>
      window.__consentResearch.blockedIdbProbe.upgradeSeen),false);
    await old.evaluate(()=>window.__blockedDbConnection.close());
    await current.waitForFunction(()=>window.__consentResearch.blockedIdbProbe.lateError,
      null,{timeout:10000});
    const blockedProof=await current.evaluate(()=>
      window.__consentResearch.blockedIdbProbe);
    assert.equal(blockedProof.upgradeSeen,true);
    assert.equal(blockedProof.unexpectedSuccess,false);
    assert.equal(blockedProof.lateError,'AbortError');
    const unchangedVersion=await current.evaluate(async name=>{
      const request=indexedDB.open(name);
      const db=await new Promise((resolve,reject)=>{
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
      });
      const version=db.version;
      db.close();
      return version;
    },blockedDb);
    assert.equal(unchangedVersion,1,'timed-out upgrade must not change schema');
    assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
    assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
    console.log('PASS Chromium REAL blocked IndexedDB upgrade: timeout, late abort, unchanged schema and encrypted vault');

    // A queued REAL Web Lock is cancellable with AbortSignal, before the
    // callback begins. Exercise user cancellation and deadline separately.
    for(const reason of ['CANCELLED','LOCK_TIMEOUT']){
      const heldLock=LOCK+'-queued-'+reason;
      await old.evaluate(()=>{
        window.__researchLockHeld=false;
        window.__researchLockRelease=null;
      });
      const holding=old.evaluate(name=>navigator.locks.request(name,
        {mode:'exclusive'},async()=>{
          window.__researchLockHeld=true;
          await new Promise(resolve=>{window.__researchLockRelease=resolve;});
        }),heldLock);
      await old.waitForFunction(()=>window.__researchLockHeld===true,
        null,{timeout:10000});
      const queued=await current.evaluate(async name=>{
        const controller=new AbortController();
        let entered=false;
        const pending=navigator.locks.request(name,
          {mode:'exclusive',signal:controller.signal},async()=>{
            entered=true;
            return 'UNSAFE_LATE_CALLBACK';
          }).then(()=> 'UNEXPECTED_SUCCESS',error=>error.name);
        await new Promise(resolve=>setTimeout(resolve,200));
        controller.abort();
        return {outcome:await pending,entered};
      },heldLock);
      assert.equal(queued.outcome,'AbortError');
      assert.equal(queued.entered,false);
      await old.evaluate(()=>window.__researchLockRelease());
      await holding;
      assert.equal(await current.evaluate(()=>window.__consentResearch.pair()),intactPair);
      assert.equal(await current.evaluate(()=>window.__consentResearch.gateWrites),0);
      console.log('PASS Chromium REAL queued Web Lock '+reason+
        ': AbortSignal prevents late callback, encrypted vault preserved');
    }

    await current.evaluate(()=>window.__consentResearch.disarm());
    console.log('PASS KNOWN UNSAFE Chromium: authentic backup and final locked recheck DO NOT fence archived v1 writer after reinspection; no reset/restore exists');
  }finally{
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
