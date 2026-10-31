'use strict';
// #4 isolated Chromium research screen. NOT imported by the WEB product.
// All ledger/encryption bytes are synthetic and confined to disposable contexts.
// No restore, migration, reset, backend, or real data access is implemented.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');

async function install(page){
  await page.evaluate(()=>{
    const DB='research.atomic.primary',STORE='vault';
    const KEY='financial-autonomy.preview.key.v1';
    const PAYLOAD='financial-autonomy.preview.payload.v1';
    const enc=new TextEncoder(),dec=new TextDecoder();
    const testKey=()=>crypto.subtle.importKey('raw',new Uint8Array(32).fill(7),
      'AES-GCM',false,['encrypt','decrypt']); // TEST-ONLY; never production
    const seal=async value=>{
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const cipher=new Uint8Array(await crypto.subtle.encrypt(
        {name:'AES-GCM',iv},await testKey(),enc.encode(JSON.stringify(value))));
      return {iv:Array.from(iv),cipher:Array.from(cipher)};
    };
    const unseal=async envelope=>JSON.parse(dec.decode(await crypto.subtle.decrypt(
      {name:'AES-GCM',iv:new Uint8Array(envelope.iv)},await testKey(),
      new Uint8Array(envelope.cipher))));
    const fingerprint=async pair=>{
      const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',
        enc.encode(JSON.stringify(pair))));
      return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    };
    const pair=()=>[localStorage.getItem(KEY),localStorage.getItem(PAYLOAD)];
    const openExisting=async()=>{
      // indexedDB.open(name) alone would CREATE a missing DB: never do that
      // from a read-only recovery screen.
      if(typeof indexedDB.databases!=='function')throw Error('IDB_LIST_UNAVAILABLE');
      const names=await indexedDB.databases();
      if(!names.some(x=>x.name===DB))return null;
      return await new Promise((resolve,reject)=>{
        const req=indexedDB.open(DB);
        // The DB can disappear after databases() and before open(). Without
        // aborting version creation, a supposedly read-only inspection would
        // silently recreate an empty database during that TOCTOU race.
        req.onupgradeneeded=()=>req.transaction.abort();
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error||Error('IDB_OPEN_FAILED'));
      });
    };
    const raw=async()=>{
      const db=await openExisting();
      if(!db)return null;
      try{return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get('current');
        req.onsuccess=()=>resolve(req.result??null);
        req.onerror=()=>reject(req.error);
        tx.onabort=()=>reject(tx.error);
      });}finally{db.close();}
    };
    async function inspect(){
      try{
        const observed=pair();
        if((observed[0]===null)!==(observed[1]===null))
          return {code:'INCOMPLETE_V1',blocked:true};
        // Bound a stalled read-only IDB inspection. Browser permission prompts,
        // blocked APIs or a test-injected never-settling enumeration must not
        // leave a recovery screen indefinitely awaiting a verdict.
        // A timeout is NOT permission to initialize or unlock a vault.
        const record=await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('IDB_INSPECTION_TIMEOUT')),800);
          Promise.resolve().then(raw).then(
            value=>{clearTimeout(timer);resolve(value);},
            error=>{clearTimeout(timer);reject(error);}
          );
        });
        if(!record)return {code:'MISSING_AUTHORITY',blocked:true};
        if(!Number.isSafeInteger(record.revision)||record.revision<1)
          return {code:'UNREADABLE_AUTHORITY',blocked:true};
        let data;
        try{data=await unseal(record.envelope);}
        catch(_){return {code:'UNREADABLE_AUTHORITY',blocked:true};}
        if(!['active','reset'].includes(data.status)||
          (data.status==='reset'&&data.state!==null))
          return {code:'UNREADABLE_AUTHORITY',blocked:true};
        if(record.legacyFingerprint!==await fingerprint(observed))
          return {code:'LEGACY_DIVERGED',blocked:true};
        // Even a valid record is NOT proof of freshness after full-origin replay.
        return {code:'UNAPPROVED_AUTHORITY',blocked:true};
      }catch(_){return {code:'STORAGE_UNREADABLE',blocked:true};}
    }
    const messages={
      LEGACY_DIVERGED:['Datele locale nu coincid',
        'O filă mai veche ar fi putut modifica o copie a datelor. Salvarea este blocată.'],
      INCOMPLETE_V1:['Datele salvate sunt incomplete',
        'Nu vom șterge sau reface automat informațiile rămase.'],
      MISSING_AUTHORITY:['Registrul local nu poate fi verificat',
        'Nu vom crea automat un registru gol.'],
      UNREADABLE_AUTHORITY:['Datele nu pot fi citite în siguranță',
        'Nu am încercat să le înlocuim.'],
      STORAGE_UNREADABLE:['Stocarea locală nu poate fi verificată',
        'Nu am modificat informațiile existente.'],
      UNAPPROVED_AUTHORITY:['Verificarea este doar experimentală',
        'Nu există o migrare sau restaurare aprobată.']
    };
    const style=document.createElement('style');
    style.textContent='*{box-sizing:border-box}html,body{margin:0;max-width:100%;'+
      'font:16px/1.45 system-ui,sans-serif}body{min-height:100vh;background:#f4f3fa;'+
      'color:#211b33}body[data-theme="dark"]{background:#16131e;color:#f5f0ff}'+
      'main{width:min(100%,520px);margin:0 auto;padding:20px 16px 28px}'+
      'article{background:#fff;border:1px solid #a8a0bb;border-radius:16px;'+
      'padding:20px;overflow-wrap:anywhere}body[data-theme="dark"] article{'+
      'background:#272231;border-color:#82768f}h1{font-size:1.45rem;line-height:1.2;'+
      'margin:0 0 16px}p{margin:0 0 16px}button{font:inherit;min-height:44px;'+
      'min-width:44px;padding:10px 14px;border-radius:10px;border:2px solid #66528a;'+
      'background:#eee8f8;color:#211b33;cursor:pointer}button:focus-visible{'+
      'outline:3px solid #b050ff;outline-offset:3px}.actions{display:flex;'+
      'flex-wrap:wrap;gap:12px}small{display:block;margin-top:16px;'+
      'overflow-wrap:anywhere}body[data-theme="dark"] button{background:#403452;'+
      'color:#fff;border-color:#c6a7ee}';
    document.head.append(style);
    // A delayed older inspection must never replace a newer blocked state.
    // This is only a synthetic research UI, not a production recovery gate.
    let renderEpoch=0;
    async function render(){
      const epoch=++renderEpoch;
      const result=await inspect();
      if(epoch!==renderEpoch)return result;
      const [title,explanation]=messages[result.code];
      const root=document.getElementById('root');
      root.replaceChildren();
      const main=document.createElement('main'),card=document.createElement('article');
      card.setAttribute('aria-labelledby','blocked-title');
      const heading=document.createElement('h1');
      heading.id='blocked-title';heading.tabIndex=-1;heading.textContent=title;
      const status=document.createElement('p');
      status.setAttribute('role','alert');
      status.textContent=explanation;
      const caution=document.createElement('p');
      caution.textContent='Nu combinăm automat registrele și nu afișăm solduri neverificate.';
      const actions=document.createElement('div');actions.className='actions';
      const recheck=document.createElement('button');
      recheck.type='button';recheck.textContent='Verifică din nou';
      recheck.addEventListener('click',()=>{render();});
      const detail=document.createElement('button');
      detail.type='button';detail.textContent='Detalii tehnice';
      const code=document.createElement('small');
      code.hidden=true;code.textContent='Cod: '+result.code;
      detail.addEventListener('click',()=>{
        code.hidden=!code.hidden;
        detail.textContent=code.hidden?'Detalii tehnice':'Închide detaliile';
      });
      const cancel=document.createElement('button');
      cancel.type='button';cancel.textContent='Anulează';
      cancel.addEventListener('click',()=>{
        // Cancellation never dismisses the safety block or mutates storage.
        caution.textContent='Acțiunea a fost anulată. Datele rămân blocate pentru salvare.';
        heading.focus();
      });
      actions.append(recheck,detail,cancel);
      card.append(heading,status,caution,actions,code);
      main.append(card);root.append(main);
      heading.focus();
      return result;
    }
    // Fixture writer is exposed separately. The screen never calls it.
    async function seed({scenario}){
      const initial=await seal({version:4,transactions:['synthetic-only']});
      localStorage.setItem(KEY,'TEST-ONLY-KEY-NOT-A-PRODUCTION-KEY');
      localStorage.setItem(PAYLOAD,JSON.stringify(initial));
      const fp=await fingerprint(pair());
      if(scenario!=='missing'){
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open(DB,1);
          req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        const envelope=scenario==='corrupt'?{iv:[0],cipher:[0]}:
          await seal(scenario==='pending'?
            {status:'reset',state:null,operationId:'SYNTHETIC-NOT-CONSENT'}:
            {status:'active',state:{transactions:['synthetic']}}); 
        try{await new Promise((resolve,reject)=>{
          const tx=db.transaction(STORE,'readwrite');
          tx.objectStore(STORE).put({revision:1,envelope,legacyFingerprint:fp},'current');
          tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
        });}finally{db.close();}
      }
      if(scenario==='diverged')
        localStorage.setItem(PAYLOAD,localStorage.getItem(PAYLOAD)+'-changed');
      if(scenario==='key-only')localStorage.removeItem(PAYLOAD);
      if(scenario==='payload-only')localStorage.removeItem(KEY);
    }
    window.__readonlyResearch={seed,inspect,render,raw,
      snapshot:async()=>({
        local:[localStorage.getItem(KEY),localStorage.getItem(PAYLOAD)],
        idb:await raw(),dbs:(await indexedDB.databases()).map(x=>x.name)
      })};
  });
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><html lang="ro"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Isolated read-only conflict research</title><div id="root"></div></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+'/';
    const scenarios=[
      ['diverged','LEGACY_DIVERGED'],
      ['key-only','INCOMPLETE_V1'],
      ['payload-only','INCOMPLETE_V1'],
      ['missing','MISSING_AUTHORITY'],
      ['corrupt','UNREADABLE_AUTHORITY'],
      ['valid','UNAPPROVED_AUTHORITY'],
      ['pending','UNAPPROVED_AUTHORITY']
    ];
    for(const [scenario,expected] of scenarios){
      const context=await browser.newContext({viewport:{width:320,height:640}});
      try{
        const page=await context.newPage();await page.goto(url);await install(page);
        await page.evaluate(s=>window.__readonlyResearch.seed({scenario:s}),scenario);
        const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
        const decision=await page.evaluate(()=>window.__readonlyResearch.render());
        assert.deepEqual(decision,{code:expected,blocked:true});
        assert.equal(await page.locator('h1').count(),1);
        assert.equal(await page.locator('button').count(),3);
        assert.equal(await page.locator('input').count(),0);
        assert.equal(await page.locator('h1').evaluate(el=>el===document.activeElement),true);
        await page.keyboard.press('Tab');
        assert.equal(await page.getByRole('button',{name:'Verifică din nou'}).evaluate(
          el=>el===document.activeElement),true);
        await page.getByRole('button',{name:'Anulează'}).click();
        assert.match(await page.locator('article').innerText(),/Acțiunea a fost anulată/);
        await page.getByRole('button',{name:'Detalii tehnice'}).click();
        assert.equal(await page.locator('small').isVisible(),true);
        await page.getByRole('button',{name:'Închide detaliile'}).click();
        await page.getByRole('button',{name:'Verifică din nou'}).click();
        assert.equal((await page.evaluate(()=>window.__readonlyResearch.inspect())).code,expected);
        assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
        await page.reload();await install(page);
        assert.equal((await page.evaluate(()=>window.__readonlyResearch.render())).code,expected);
        assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
        console.log('PASS isolated read-only conflict screen: '+scenario+
          ' classified, rechecked and reloaded with zero storage mutations');
      }finally{await context.close();}
    }
    const context=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const page=await context.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      await page.evaluate(()=>{
        Object.defineProperty(indexedDB,'databases',{configurable:true,
          value:()=>Promise.reject(Error('TEST_DENIED'))});
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      await page.evaluate(()=>{delete indexedDB.databases;});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      console.log('PASS isolated read-only conflict screen: IDB permission denial blocks without writes');
    }finally{await context.close();}

    // Synthetic never-settling IDB enumeration: read-only inspection must
    // fail closed within a bounded time, permit explicit reinspection after
    // the injected fault clears, and preserve every existing storage byte.
    // This does not prove Safari permission behavior or disk durability.
    const hangContext=await browser.newContext({viewport:{width:320,height:640}});
    try{
      const page=await hangContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      await page.evaluate(()=>{
        window.__realDatabases=indexedDB.databases;
        indexedDB.databases=()=>new Promise(()=>{});
      });
      const start=Date.now();
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.ok(Date.now()-start<3500,'Read-only inspection must time out promptly');
      assert.match(await page.locator('h1').innerText(),/Stocarea locală/);
      assert.equal(await page.locator('input').count(),0);
      await page.evaluate(()=>{indexedDB.databases=window.__realDatabases;});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      await page.getByRole('button',{name:'Verifică din nou'}).click();
      await page.waitForFunction(()=>document.querySelector('h1')?.textContent===
        'Verificarea este doar experimentală');
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      assert.equal(await page.locator('input').count(),0);
      await page.reload();await install(page);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      console.log('PASS isolated read-only quarantine: stalled IDB enumeration times out, reinspection and reload preserve exact bytes');
    }finally{await hangContext.close();}

    // A deleted database can race the databases() existence check. A normal
    // indexedDB.open() would then create a ghost DB as a side effect of a
    // supposedly read-only inspection. Abort onupgradeneeded, preserve v1.
    const ghostContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const page=await ghostContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'pending'}));
      const before=await page.evaluate(async()=>{
        const names=await indexedDB.databases();
        const local=['financial-autonomy.preview.key.v1',
          'financial-autonomy.preview.payload.v1'].map(k=>localStorage.getItem(k));
        await new Promise((resolve,reject)=>{
          const req=indexedDB.deleteDatabase('research.atomic.primary');
          req.onsuccess=resolve;
          req.onerror=()=>reject(req.error);
          req.onblocked=()=>reject(Error('SYNTHETIC_DB_DELETE_BLOCKED'));
        });
        if((await indexedDB.databases()).some(x=>x.name==='research.atomic.primary'))
          throw Error('SYNTHETIC_DB_NOT_DELETED');
        // Stale metadata simulates the race between enumeration and open.
        indexedDB.databases=()=>Promise.resolve(names);
        const open=indexedDB.open.bind(indexedDB);
        window.__ghostUpgradeSeen=false;
        indexedDB.open=(...args)=>{
          const request=open(...args);
          request.addEventListener('upgradeneeded',()=>{window.__ghostUpgradeSeen=true;});
          return request;
        };
        return {local};
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.match(await page.locator('h1').innerText(),/Stocarea locală/);
      const after=await page.evaluate(async()=>{
        const upgraded=window.__ghostUpgradeSeen;
        delete indexedDB.databases;
        delete indexedDB.open;
        return {upgraded,
          names:(await indexedDB.databases()).map(x=>x.name),
          local:['financial-autonomy.preview.key.v1',
            'financial-autonomy.preview.payload.v1'].map(k=>localStorage.getItem(k))};
      });
      assert.equal(after.upgraded,true,'Must exercise actual missing-DB upgrade path');
      assert.equal(after.names.includes('research.atomic.primary'),false,
        'Read-only inspection must not recreate a deleted IDB');
      assert.deepEqual(after.local,before.local);
      assert.equal(await page.locator('input').count(),0);
      console.log('PASS isolated read-only quarantine: stale IDB enumeration cannot recreate deleted database; v1 unchanged');
    }finally{await ghostContext.close();}

    // A quarantined tab must not unlock, repair, or silently pick a ledger
    // when an archived, non-cooperating tab writes after reset intent.
    // This is an isolated synthetic writer, NOT a product reset implementation.
    const lateContext=await browser.newContext({viewport:{width:320,height:640}});
    try{
      const blocked=await lateContext.newPage();
      await blocked.goto(url);await install(blocked);
      await blocked.evaluate(()=>window.__readonlyResearch.seed({scenario:'pending'}));
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      const baseline=await blocked.evaluate(()=>window.__readonlyResearch.snapshot());
      const legacy=await lateContext.newPage();await legacy.goto(url);
      await legacy.evaluate(()=>{
        const key='financial-autonomy.preview.payload.v1';
        const old=localStorage.getItem(key);
        if(!old)throw Error('MISSING_SYNTHETIC_PAYLOAD');
        localStorage.setItem(key,old+'-ARCHIVED-WRITER-AFTER-PENDING');
      });
      const afterLegacy=await blocked.evaluate(()=>window.__readonlyResearch.snapshot());
      assert.equal(afterLegacy.local[0],baseline.local[0]);
      assert.notEqual(afterLegacy.local[1],baseline.local[1]);
      assert.deepEqual(afterLegacy.idb,baseline.idb);
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.inspect()),
        {code:'LEGACY_DIVERGED',blocked:true});
      await blocked.evaluate(()=>{
        const audit={set:0,remove:0,idbReadwrite:0};
        const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
        const transaction=IDBDatabase.prototype.transaction;
        Storage.prototype.setItem=function(...args){audit.set++;return set.apply(this,args);};
        Storage.prototype.removeItem=function(...args){audit.remove++;return remove.apply(this,args);};
        IDBDatabase.prototype.transaction=function(...args){
          if(args[1]==='readwrite')audit.idbReadwrite++;
          return transaction.apply(this,args);
        };
        window.__quarantineWriteAudit=audit;
      });
      await blocked.getByRole('button',{name:'Verifică din nou'}).click();
      await blocked.waitForFunction(()=>document.querySelector('h1')?.textContent===
        'Datele locale nu coincid');
      assert.match(await blocked.locator('h1').innerText(),/Datele locale nu coincid/);
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.inspect()),
        {code:'LEGACY_DIVERGED',blocked:true});
      assert.deepEqual(await blocked.evaluate(()=>window.__quarantineWriteAudit),
        {set:0,remove:0,idbReadwrite:0});
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.snapshot()),afterLegacy);
      await blocked.reload();await install(blocked);
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.render()),
        {code:'LEGACY_DIVERGED',blocked:true});
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.snapshot()),afterLegacy);
      assert.equal(await blocked.locator('input').count(),0);
      console.log('PASS isolated read-only quarantine: archived late writer after pending reset remains blocked, zero reinspection writes, reload unchanged');
    }finally{await lateContext.close();}


    // Race: an older read starts before a non-cooperating legacy write, then
    // resolves after a newer read. The older result must NOT overwrite the
    // newer, more restrictive blocked UI. All evidence remains byte-identical.
    const raceContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const blocked=await raceContext.newPage();await blocked.goto(url);await install(blocked);
      await blocked.evaluate(()=>window.__readonlyResearch.seed({scenario:'pending'}));
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      await blocked.evaluate(()=>{
        const original=indexedDB.databases.bind(indexedDB);
        let reads=0;
        indexedDB.databases=()=>{
          if(++reads!==1)return original();
          return new Promise((resolve,reject)=>{
            window.__releaseOlderInspection=()=>original().then(resolve,reject);
          });
        };
        window.__olderInspection=window.__readonlyResearch.render();
      });
      await blocked.waitForFunction(()=>typeof window.__releaseOlderInspection==='function');
      const writer=await raceContext.newPage();await writer.goto(url);
      await writer.evaluate(()=>{
        const k='financial-autonomy.preview.payload.v1';
        localStorage.setItem(k,localStorage.getItem(k)+'-RACE-WRITER');
      });
      const afterWriter=await blocked.evaluate(()=>window.__readonlyResearch.snapshot());
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.render()),
        {code:'LEGACY_DIVERGED',blocked:true});
      assert.match(await blocked.locator('h1').innerText(),/Datele locale nu coincid/);
      await blocked.evaluate(()=>window.__releaseOlderInspection());
      assert.deepEqual(await blocked.evaluate(()=>window.__olderInspection),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      // The stale result is intentionally returned to the caller, but cannot
      // replace the more recent UI. Never auto-unlock even if both are blocked.
      assert.match(await blocked.locator('h1').innerText(),/Datele locale nu coincid/);
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.snapshot()),afterWriter);
      assert.equal(await blocked.locator('input').count(),0);
      await blocked.reload();await install(blocked);
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.render()),
        {code:'LEGACY_DIVERGED',blocked:true});
      assert.deepEqual(await blocked.evaluate(()=>window.__readonlyResearch.snapshot()),afterWriter);
      console.log('PASS isolated read-only quarantine: overlapping inspections cannot replace newer legacy divergence; bytes unchanged');
    }finally{await raceContext.close();}


    // Unsupported IDB enumeration + absent Web Locks is a real compatibility
    // boundary (e.g. some Safari environments). Read-only inspection must
    // fail closed rather than try indexedDB.open() and create an empty DB.
    const unsupportedContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const page=await unsupportedContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      await page.evaluate(()=>{
        const audit={set:0,remove:0,idbReadwrite:0};
        const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
        const transaction=IDBDatabase.prototype.transaction;
        Storage.prototype.setItem=function(...args){audit.set++;return set.apply(this,args);};
        Storage.prototype.removeItem=function(...args){audit.remove++;return remove.apply(this,args);};
        IDBDatabase.prototype.transaction=function(...args){
          if(args[1]==='readwrite')audit.idbReadwrite++;
          return transaction.apply(this,args);
        };
        window.__unsupportedAudit=audit;
        Object.defineProperty(indexedDB,'databases',{configurable:true,value:undefined});
        Object.defineProperty(navigator,'locks',{configurable:true,value:undefined});
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.match(await page.locator('h1').innerText(),/Stocarea locală/);
      assert.equal(await page.locator('input').count(),0);
      assert.deepEqual(await page.evaluate(()=>window.__unsupportedAudit),
        {set:0,remove:0,idbReadwrite:0});
      await page.evaluate(()=>{delete indexedDB.databases;delete navigator.locks;});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      await page.reload();await install(page);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      console.log('PASS isolated read-only quarantine: missing IDB enumeration and Web Locks fail closed, zero writes, reload unchanged');
    }finally{await unsupportedContext.close();}

    // A real IndexedDB schema loss (object store removed in a synthetic
    // version upgrade) must be classified as unreadable, not as an empty
    // ledger or a reason to recreate a store. Fixture damage is deliberate;
    // the read-only inspector itself must perform zero writes.
    const schemaContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const page=await schemaContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const before=await page.evaluate(()=>[
        localStorage.getItem('financial-autonomy.preview.key.v1'),
        localStorage.getItem('financial-autonomy.preview.payload.v1')
      ]);
      await page.evaluate(async()=>{
        await new Promise((resolve,reject)=>{
          const req=indexedDB.open('research.atomic.primary',2);
          req.onupgradeneeded=()=>req.result.deleteObjectStore('vault');
          req.onsuccess=()=>{req.result.close();resolve();};
          req.onerror=()=>reject(req.error||Error('SYNTHETIC_SCHEMA_UPGRADE_FAILED'));
          req.onblocked=()=>reject(Error('SYNTHETIC_SCHEMA_UPGRADE_BLOCKED'));
        });
        const audit={set:0,remove:0,idbReadwrite:0};
        const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
        const transaction=IDBDatabase.prototype.transaction;
        Storage.prototype.setItem=function(...args){audit.set++;return set.apply(this,args);};
        Storage.prototype.removeItem=function(...args){audit.remove++;return remove.apply(this,args);};
        IDBDatabase.prototype.transaction=function(...args){
          if(args[1]==='readwrite')audit.idbReadwrite++;
          return transaction.apply(this,args);
        };
        window.__schemaLossAudit=audit;
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.match(await page.locator('h1').innerText(),/Stocarea locală/);
      assert.equal(await page.locator('input').count(),0);
      await page.getByRole('button',{name:'Verifică din nou'}).click();
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.inspect()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.deepEqual(await page.evaluate(()=>window.__schemaLossAudit),
        {set:0,remove:0,idbReadwrite:0});
      const after=await page.evaluate(async()=>{
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('research.atomic.primary');
          req.onupgradeneeded=()=>req.transaction.abort();
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        const schema={version:db.version,stores:Array.from(db.objectStoreNames)};
        db.close();
        return {schema,local:[
          localStorage.getItem('financial-autonomy.preview.key.v1'),
          localStorage.getItem('financial-autonomy.preview.payload.v1')
        ]};
      });
      assert.deepEqual(after.local,before,'Read-only inspector changed legacy bytes');
      assert.deepEqual(after.schema,{version:2,stores:[]},
        'Inspector must not recreate a missing vault object store');
      await page.reload();await install(page);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      assert.deepEqual(await page.evaluate(()=>[
        localStorage.getItem('financial-autonomy.preview.key.v1'),
        localStorage.getItem('financial-autonomy.preview.payload.v1')
      ]),before);
      console.log('PASS isolated read-only quarantine: missing IndexedDB object store fails closed, zero inspector writes, legacy bytes survive reload');
    }finally{await schemaContext.close();}

    // A timed-out read may still resolve after a newer successful reinspection.
    // Its late result must never replace the newer blocked message or mutate
    // storage. Promise.race does not cancel the underlying IndexedDB read.
    const lateTimeoutContext=await browser.newContext({viewport:{width:320,height:640}});
    try{
      const page=await lateTimeoutContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      await page.evaluate(()=>{
        const original=indexedDB.databases.bind(indexedDB);
        window.__originalDatabases=original;
        indexedDB.databases=()=>new Promise((resolve,reject)=>{
          window.__releaseTimedOutRead=()=>original().then(resolve,reject);
        });
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'STORAGE_UNREADABLE',blocked:true});
      await page.evaluate(()=>{indexedDB.databases=window.__originalDatabases;});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      await page.evaluate(()=>window.__releaseTimedOutRead());
      await page.waitForTimeout(100);
      assert.match(await page.locator('h1').innerText(),/Verificarea este doar experimentală/);
      assert.equal(await page.locator('input').count(),0);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
      console.log('PASS isolated read-only quarantine: late completion after timeout cannot replace newer blocked result');
    }finally{await lateTimeoutContext.close();}

    // Full-origin rollback limitation: both localStorage AND IndexedDB can
    // be replayed to an older, internally authenticated snapshot. An origin-
    // local inspector has no trusted monotonic external freshness witness.
    // This is a NEGATIVE SECURITY CHARACTERIZATION, not a passed recovery.
    const rollbackContext=await browser.newContext({viewport:{width:390,height:844}});
    try{
      const page=await rollbackContext.newPage();await page.goto(url);await install(page);
      await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'valid'}));
      const original=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      assert.equal(original.idb.revision,1);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.inspect()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      // Synthetic legitimate advancement: create a distinct, authenticated
      // v2 envelope and fingerprint of the new v1 pair in one test fixture.
      await page.evaluate(async()=>{
        const key='financial-autonomy.preview.key.v1';
        const payload='financial-autonomy.preview.payload.v1';
        const cryptoKey=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(7),
          'AES-GCM',false,['encrypt','decrypt']);
        const seal=async value=>{
          const iv=crypto.getRandomValues(new Uint8Array(12));
          const cipher=new Uint8Array(await crypto.subtle.encrypt(
            {name:'AES-GCM',iv},cryptoKey,new TextEncoder().encode(JSON.stringify(value))));
          return {iv:Array.from(iv),cipher:Array.from(cipher)};
        };
        localStorage.setItem(payload,JSON.stringify(await seal(
          {version:5,transactions:['synthetic-only','synthetic-newer']})));
        const pair=[localStorage.getItem(key),localStorage.getItem(payload)];
        const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',
          new TextEncoder().encode(JSON.stringify(pair))));
        const legacyFingerprint=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('research.atomic.primary');
          req.onupgradeneeded=()=>req.transaction.abort();
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        try{await new Promise((resolve,reject)=>{
          const tx=db.transaction('vault','readwrite');
          tx.objectStore('vault').put({
            revision:2,
            envelope:await seal({status:'active',state:{transactions:['synthetic-newer']}}),
            legacyFingerprint
          },'current');
          tx.oncomplete=resolve;
          tx.onabort=()=>reject(tx.error||Error('SYNTHETIC_ADVANCE_ABORTED'));
          tx.onerror=()=>reject(tx.error);
        });}finally{db.close();}
      });
      const newer=await page.evaluate(()=>window.__readonlyResearch.snapshot());
      assert.equal(newer.idb.revision,2);
      assert.notDeepEqual(newer,original);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.inspect()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true},
        'Newer authenticated snapshot must still be quarantined in research');
      // Simulate a complete *external* origin restore of both stores. This
      // intentionally rewinds synthetic fixture bytes, not application data.
      await page.evaluate(async old=>{
        const key='financial-autonomy.preview.key.v1';
        const payload='financial-autonomy.preview.payload.v1';
        localStorage.setItem(key,old.local[0]);
        localStorage.setItem(payload,old.local[1]);
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('research.atomic.primary');
          req.onupgradeneeded=()=>req.transaction.abort();
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        try{await new Promise((resolve,reject)=>{
          const tx=db.transaction('vault','readwrite');
          tx.objectStore('vault').put(old.idb,'current');
          tx.oncomplete=resolve;
          tx.onabort=()=>reject(tx.error||Error('SYNTHETIC_ROLLBACK_ABORTED'));
          tx.onerror=()=>reject(tx.error);
        });}finally{db.close();}
      },original);
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),original);
      await page.reload();await install(page);
      await page.evaluate(()=>{
        const audit={set:0,remove:0,idbReadwrite:0};
        const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
        const transaction=IDBDatabase.prototype.transaction;
        Storage.prototype.setItem=function(...args){audit.set++;return set.apply(this,args);};
        Storage.prototype.removeItem=function(...args){audit.remove++;return remove.apply(this,args);};
        IDBDatabase.prototype.transaction=function(...args){
          if(args[1]==='readwrite')audit.idbReadwrite++;
          return transaction.apply(this,args);
        };
        window.__rollbackInspectionAudit=audit;
      });
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.render()),
        {code:'UNAPPROVED_AUTHORITY',blocked:true});
      assert.deepEqual(await page.evaluate(()=>window.__rollbackInspectionAudit),
        {set:0,remove:0,idbReadwrite:0});
      assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),original);
      assert.equal(await page.locator('input').count(),0);
      console.log('PASS NEGATIVE characterization: full-origin rollback of authenticated v1/v2 is locally indistinguishable; inspector stays blocked with zero writes (NO freshness guarantee)');
    }finally{await rollbackContext.close();}

    fs.mkdirSync('artifacts/browser-v2-conflict-readonly',{recursive:true});
    for(const width of [320,390]){
      for(const theme of ['light','dark']){
        const context=await browser.newContext({viewport:{width,height:740}});
        try{
          const page=await context.newPage();await page.goto(url);await install(page);
          await page.evaluate(()=>window.__readonlyResearch.seed({scenario:'diverged'}));
          const before=await page.evaluate(()=>window.__readonlyResearch.snapshot());
          await page.evaluate(t=>{
            document.body.dataset.theme=t;
            document.documentElement.style.zoom='200%'; // CSS proxy, NOT Safari Dynamic Type
          },theme);
          await page.evaluate(()=>window.__readonlyResearch.render());
          const geometry=await page.evaluate(()=>{
            const buttons=[...document.querySelectorAll('button')].map(el=>{
              const r=el.getBoundingClientRect();
              return {x:r.x,y:r.y,width:r.width,height:r.height};
            });
            return {scrollWidth:document.documentElement.scrollWidth,
              clientWidth:document.documentElement.clientWidth,buttons};
          });
          assert.ok(geometry.scrollWidth<=geometry.clientWidth+1,
            'Unexpected horizontal overflow at CSS zoom');
          for(const r of geometry.buttons)assert.ok(r.height>=44&&r.width>=44,
            'Touch target smaller than 44 CSS px');
          for(let i=0;i<geometry.buttons.length;i++)for(let j=i+1;j<geometry.buttons.length;j++){
            const a=geometry.buttons[i],b=geometry.buttons[j];
            assert.ok(a.y+a.height<=b.y||b.y+b.height<=a.y||
              a.x+a.width<=b.x||b.x+b.width<=a.x,'Buttons overlap');
          }
          assert.deepEqual(await page.evaluate(()=>window.__readonlyResearch.snapshot()),before);
          await page.screenshot({path:'artifacts/browser-v2-conflict-readonly/'+
            width+'-'+theme+'-zoom200.png',fullPage:true});
          console.log('PASS isolated read-only conflict screen: '+width+'px '+theme+
            ' CSS zoom 200% geometry and no writes (not Safari evidence)');
        }finally{await context.close();}
      }
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
