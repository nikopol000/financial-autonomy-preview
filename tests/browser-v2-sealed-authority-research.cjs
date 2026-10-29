'use strict';
// #4: isolated Chromium sealed-authority acceptance research. NOT production.
// Synthetic values only; no real user ledger, backups or app bundle accessed.
// Deliberately characterizes valid-record replay as KNOWN UNSAFE.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const {chromium}=require('playwright');
const AUTH='research.sealed.chromium.authority';
const KEY='research.sealed.chromium.key';
const STAGE='research.sealed.chromium.stage.';
const LEGACY='financial-autonomy.preview.payload.v1';
const LEGACY_KEY='financial-autonomy.preview.key.v1';
const LOCK='research.sealed.chromium.lock';
async function install(page){
  await page.evaluate(({AUTH,KEY,STAGE,LEGACY,LEGACY_KEY,LOCK})=>{
    const enc=new TextEncoder(),dec=new TextDecoder();
    const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
    const bytes=s=>{
      if(typeof s!=='string'||s.length%2||!/^[0-9a-f]+$/i.test(s))throw Error('BAD_HEX');
      return new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
    };
    const digest=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
    const keyFor=async()=>{
      const raw=localStorage.getItem(KEY);
      if(raw===null)throw Error('MISSING_KEY');
      return crypto.subtle.importKey('raw',bytes(raw),'AES-GCM',false,['encrypt','decrypt']);
    };
    const seal=async value=>{
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await keyFor(),
        enc.encode(JSON.stringify(value)));
      return JSON.stringify({iv:hex(iv),cipher:hex(new Uint8Array(ciphertext))});
    };
    const unseal=async raw=>{
      const envelope=JSON.parse(raw);
      if(typeof envelope.iv!=='string'||envelope.iv.length!==24||
        typeof envelope.cipher!=='string')throw Error('BAD_ENVELOPE');
      return JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:bytes(envelope.iv)},await keyFor(),bytes(envelope.cipher))));
    };
    const legacy=()=>JSON.stringify([localStorage.getItem(LEGACY_KEY),localStorage.getItem(LEGACY)]);
    const r=window.__sealedResearch={writes:0,holding:false};
    r.initialize=()=>{
      if(localStorage.getItem(KEY)!==null||localStorage.getItem(AUTH)!==null)
        throw Error('NOT_FRESH');
      localStorage.setItem(KEY,hex(crypto.getRandomValues(new Uint8Array(32))));
    };
    r.read=async()=>{
      const raw=localStorage.getItem(AUTH);
      if(raw===null){
        if(localStorage.getItem(KEY)!==null)throw Error('MISSING_AUTHORITY');
        return {status:'legacy'};
      }
      const record=await unseal(raw);
      if(record.schema!==2||!['active','reset'].includes(record.status)||
        !Number.isSafeInteger(record.revision)||record.revision<1||
        typeof record.epoch!=='string'||!record.epoch)throw Error('BAD_AUTHORITY');
      if(record.status==='reset'){
        if(record.stage!==null||record.digest!==null)throw Error('BAD_RESET');
        return {status:'reset',record};
      }
      if(typeof record.stage!=='string'||!record.stage.startsWith(STAGE)||
        typeof record.digest!=='string'||typeof record.legacy!=='string')
        throw Error('BAD_STAGE_REF');
      const rawStage=localStorage.getItem(record.stage);
      if(rawStage===null||await digest(rawStage)!==record.digest)
        throw Error('STAGE_MISSING_OR_CHANGED');
      return {status:'active',record,state:await unseal(rawStage),
        legacyDiverged:legacy()!==record.legacy};
    };
    r.commit=async(state,expected,expectedLegacy,hold=false)=>{
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async()=>{
        if(localStorage.getItem(AUTH)!==expected)return {ok:false,reason:'stale-authority'};
        if(legacy()!==expectedLegacy)
          return {ok:false,reason:'legacy-diverged'};
        const old=expected===null?null:await r.read();
        if(old&&old.status!=='active')return {ok:false,reason:'not-active'};
        if(old?.legacyDiverged)return {ok:false,reason:'legacy-diverged'};
        const stage=STAGE+crypto.randomUUID(),payload=await seal(state);
        localStorage.setItem(stage,payload);r.writes++;
        if(hold){r.holding=true;await new Promise(resolve=>r.release=resolve);}
        if(localStorage.getItem(AUTH)!==expected)return {ok:false,reason:'stale-authority'};
        if(legacy()!==expectedLegacy)
          return {ok:false,reason:'legacy-diverged'};
        const record={schema:2,status:'active',stage,digest:await digest(payload),
          legacy:expectedLegacy,revision:old?old.record.revision+1:1,epoch:crypto.randomUUID()};
        const authority=await seal(record);
        localStorage.setItem(AUTH,authority);r.writes++;
        return {ok:true,authority};
      });
    };
    r.reset=async(expected,throwAfter=false)=>{
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async()=>{
        if(localStorage.getItem(AUTH)!==expected)return {ok:false,reason:'stale-authority'};
        const current=await r.read();
        if(current.status!=='active')return {ok:false,reason:'not-active'};
        if(current.legacyDiverged)return {ok:false,reason:'legacy-diverged'};
        const authority=await seal({schema:2,status:'reset',stage:null,digest:null,
          revision:current.record.revision+1,epoch:crypto.randomUUID()});
        if(localStorage.getItem(AUTH)!==expected)return {ok:false,reason:'stale-authority'};
        localStorage.setItem(AUTH,authority);r.writes++;
        if(throwAfter)throw Error('INJECTED_AFTER_RESET_COMMIT');
        return {ok:true,authority};
      });
    };
  },{AUTH,KEY,STAGE,LEGACY,LEGACY_KEY,LOCK});
}
async function visible(page,key,value){
  await page.waitForFunction(({key,value})=>localStorage.getItem(key)===value,
    {key,value},{timeout:10000});
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

// The archived platform/vault/crypto modules are executed as shipped. Only the
// synthetic financial model is stubbed. Each version uses a fresh browser origin
// storage context; no real ledger, portable backup or product bundle is modified.
async function testRealArchivedAgainstSealed(browser,url){
  for(const version of ['18.27','18.33','18.34']){
    const context=await browser.newContext();
    try{
      const old=await context.newPage(),modern=await context.newPage();
      await Promise.all([old.goto(url),modern.goto(url)]);
      await installLegacy(old,extract(fs.readFileSync(archivedPaths[version],'utf8')));
      await install(modern);
      assert.equal(await modern.evaluate(()=>typeof navigator.locks?.request),'function');
      await old.evaluate(()=>window.__archivedVault.load());
      await old.evaluate(s=>window.__archivedVault.save(s),
        {...syntheticEmpty(),transactions:[syntheticTx('legacy-initial')]});
      const initialKey=await old.evaluate(k=>localStorage.getItem(k),LEGACY_KEY);
      const initialPayload=await old.evaluate(k=>localStorage.getItem(k),LEGACY);
      assert.ok(initialKey&&initialPayload,'real archived AES-GCM v1 bytes required');
      await visible(modern,LEGACY_KEY,initialKey);
      await visible(modern,LEGACY,initialPayload);
      await modern.evaluate(()=>window.__sealedResearch.initialize());
      const legacyFingerprint=JSON.stringify([initialKey,initialPayload]);
      const first=await modern.evaluate(legacy=>window.__sealedResearch.commit(
        {transactions:['sealed-A']},null,legacy),legacyFingerprint);
      assert.equal(first.ok,true);
      assert.deepEqual((await modern.evaluate(()=>window.__sealedResearch.read())).state,
        {transactions:['sealed-A']});
      if(version==='18.27'){
        const paused=modern.evaluate(({auth,legacy})=>window.__sealedResearch.commit(
          {transactions:['sealed-B-uncommitted']},auth,legacy,true),
          {auth:first.authority,legacy:legacyFingerprint});
        await modern.waitForFunction(()=>window.__sealedResearch.holding===true);
        const latest=await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(s=>window.__archivedVault.save(s),
          {...latest,transactions:[...latest.transactions,syntheticTx('real-18.27-during-stage')]});
        await visible(modern,LEGACY,await old.evaluate(k=>localStorage.getItem(k),LEGACY));
        await modern.evaluate(()=>window.__sealedResearch.release());
        assert.deepEqual(await paused,{ok:false,reason:'legacy-diverged'});
        assert.equal(await modern.evaluate(k=>localStorage.getItem(k),AUTH),first.authority);
        const current=await modern.evaluate(()=>window.__sealedResearch.read());
        assert.deepEqual(current.state.transactions,['sealed-A']);
        assert.equal(current.legacyDiverged,true);
        console.log('PASS real archived 18.27: ciphertext write during sealed staging blocks promotion');
      }else if(version==='18.33'){
        const latest=await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(s=>window.__archivedVault.save(s),
          {...latest,transactions:[...latest.transactions,syntheticTx('real-18.33-post-cutover')]});
        await visible(modern,LEGACY,await old.evaluate(k=>localStorage.getItem(k),LEGACY));
        const current=await modern.evaluate(()=>window.__sealedResearch.read());
        assert.equal(current.status,'active');
        assert.equal(current.legacyDiverged,true);
        assert.deepEqual(current.state.transactions,['sealed-A']);
        const before=await modern.evaluate(()=>window.__sealedResearch.writes);
        assert.deepEqual(await modern.evaluate(auth=>window.__sealedResearch.reset(auth),
          first.authority),{ok:false,reason:'legacy-diverged'});
        assert.equal(await modern.evaluate(()=>window.__sealedResearch.writes),before);
        console.log('PASS real archived 18.33: post-cutover v1 divergence blocks destructive reset');
        // Model a partial legacy deletion AFTER a real archived write. No v1
        // ciphertext may be recreated automatically and v2 must stay readable.
        await old.evaluate(k=>localStorage.removeItem(k),LEGACY);
        await visible(modern,LEGACY,null);
        const orphan=await modern.evaluate(()=>window.__sealedResearch.read());
        assert.equal(orphan.status,'active');
        assert.equal(orphan.legacyDiverged,true);
        assert.deepEqual(orphan.state.transactions,['sealed-A']);
        assert.deepEqual(await modern.evaluate(auth=>window.__sealedResearch.reset(auth),
          first.authority),{ok:false,reason:'legacy-diverged'});
        console.log('PASS real archived 18.33: payload-only deletion leaves v2 readable and reset blocked');
      }else{
        const reset=await modern.evaluate(auth=>window.__sealedResearch.reset(auth),
          first.authority);
        assert.equal(reset.ok,true);
        await old.reload();
        await installLegacy(old,extract(fs.readFileSync(archivedPaths[version],'utf8')));
        const latest=await old.evaluate(()=>window.__archivedVault.load());
        await old.evaluate(s=>window.__archivedVault.save(s),
          {...latest,transactions:[...latest.transactions,syntheticTx('real-18.34-after-reset')]});
        await visible(modern,LEGACY,await old.evaluate(k=>localStorage.getItem(k),LEGACY));
        assert.equal((await modern.evaluate(()=>window.__sealedResearch.read())).status,'reset');
        await modern.reload();
        await install(modern);
        assert.equal((await modern.evaluate(()=>window.__sealedResearch.read())).status,'reset');
        console.log('PASS real archived 18.34: reloaded old writer cannot auto-import after sealed reset');
        await modern.evaluate(({key,value})=>localStorage.setItem(key,value),
          {key:AUTH,value:first.authority});
        const replay=await modern.evaluate(()=>window.__sealedResearch.read());
        assert.equal(replay.status,'active');
        assert.deepEqual(replay.state.transactions,['sealed-A']);
        assert.equal(replay.legacyDiverged,true);
        await modern.evaluate(({key,value})=>localStorage.setItem(key,value),
          {key:AUTH,value:reset.authority});
        assert.equal((await modern.evaluate(()=>window.__sealedResearch.read())).status,'reset');
        console.log('PASS KNOWN UNSAFE real archived 18.34: valid sealed authority replay exposes pre-reset stage');
      }
    }finally{await context.close();}
  }
}

async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>isolated sealed authority research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext();
    try{
      const a=await context.newPage(),b=await context.newPage();
      const url='http://127.0.0.1:'+server.address().port+'/';
      await Promise.all([a.goto(url),b.goto(url)]);
      await Promise.all([install(a),install(b)]);
      assert.equal(await a.evaluate(()=>typeof navigator.locks?.request),'function');
      await a.evaluate(key=>localStorage.setItem(key,'synthetic-legacy-1'),LEGACY);
      await visible(b,LEGACY,'synthetic-legacy-1');
      await a.evaluate(()=>window.__sealedResearch.initialize());
      const key=await a.evaluate(k=>localStorage.getItem(k),KEY);
      await visible(b,KEY,key);
      const originalLegacy=JSON.stringify([null,'synthetic-legacy-1']);
      const first=await a.evaluate(legacy=>window.__sealedResearch.commit(
        {transactions:['A']},null,legacy),originalLegacy);
      assert.equal(first.ok,true);
      await visible(b,AUTH,first.authority);
      assert.deepEqual((await b.evaluate(()=>window.__sealedResearch.read())).state,
        {transactions:['A']});
      console.log('PASS Chromium: sealed authority and stage round-trip across two tabs');
      const forged=JSON.stringify({schema:2,status:'reset',stage:null,digest:null,revision:2});
      await a.evaluate(({key,value})=>localStorage.setItem(key,value),{key:AUTH,value:forged});
      await visible(b,AUTH,forged);
      const before=await b.evaluate(()=>window.__sealedResearch.writes);
      await assert.rejects(b.evaluate(()=>window.__sealedResearch.read()));
      assert.equal(await b.evaluate(()=>window.__sealedResearch.writes),before);
      await a.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:first.authority});
      await visible(b,AUTH,first.authority);
      assert.equal((await b.evaluate(()=>window.__sealedResearch.read())).status,'active');
      console.log('PASS Chromium: plain forged reset fails closed, no reader writes');
      const second=await b.evaluate(({auth,legacy})=>window.__sealedResearch.commit(
        {transactions:['A','B']},auth,legacy),{auth:first.authority,legacy:originalLegacy});
      assert.equal(second.ok,true);
      await visible(a,AUTH,second.authority);
      assert.deepEqual((await a.evaluate(()=>window.__sealedResearch.read())).state.transactions,
        ['A','B']);
      const paused=b.evaluate(({auth,legacy})=>window.__sealedResearch.commit(
        {transactions:['A','B','C']},auth,legacy,true),{auth:second.authority,legacy:originalLegacy});
      await b.waitForFunction(()=>window.__sealedResearch.holding===true);
      await a.evaluate(key=>localStorage.setItem(key,'synthetic-legacy-from-old-tab'),LEGACY);
      await visible(b,LEGACY,'synthetic-legacy-from-old-tab');
      await b.evaluate(()=>window.__sealedResearch.release());
      assert.deepEqual(await paused,{ok:false,reason:'legacy-diverged'});
      assert.equal(await b.evaluate(k=>localStorage.getItem(k),AUTH),second.authority);
      const blocked=await a.evaluate(auth=>window.__sealedResearch.reset(auth),
        second.authority);
      assert.deepEqual(blocked,{ok:false,reason:'legacy-diverged'});
      console.log('PASS Chromium: legacy drift during stage blocks promotion and divergent reset');
      await a.evaluate(key=>localStorage.setItem(key,'synthetic-legacy-1'),LEGACY);
      await visible(b,LEGACY,'synthetic-legacy-1');
      // A key-only partial legacy write must also count as divergence.
      await a.evaluate(key=>localStorage.setItem(key,'synthetic-orphan-v1-key'),LEGACY_KEY);
      await visible(b,LEGACY_KEY,'synthetic-orphan-v1-key');
      assert.deepEqual(await b.evaluate(auth=>window.__sealedResearch.reset(auth),
        second.authority),{ok:false,reason:'legacy-diverged'});
      await a.evaluate(key=>localStorage.removeItem(key),LEGACY_KEY);
      await visible(b,LEGACY_KEY,null);
      console.log('PASS Chromium: key-only v1 partial write also blocks destructive reset');
      await assert.rejects(b.evaluate(auth=>window.__sealedResearch.reset(auth,true),
        second.authority),/INJECTED_AFTER_RESET_COMMIT/);
      const resetAuthority=await b.evaluate(k=>localStorage.getItem(k),AUTH);
      await visible(a,AUTH,resetAuthority);
      assert.equal((await a.evaluate(()=>window.__sealedResearch.read())).status,'reset');
      await a.reload();await install(a);
      assert.equal((await a.evaluate(()=>window.__sealedResearch.read())).status,'reset');
      await a.evaluate(key=>localStorage.setItem(key,'synthetic-legacy-after-reset'),LEGACY);
      assert.equal((await a.evaluate(()=>window.__sealedResearch.read())).status,'reset');
      console.log('PASS Chromium: committed reset survives throw/reload and later legacy write');
      await a.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:first.authority});
      assert.deepEqual((await a.evaluate(()=>window.__sealedResearch.read())).state.transactions,
        ['A']);
      console.log('PASS KNOWN UNSAFE: replay of valid pre-reset sealed authority resurrects old stage');
      await a.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:resetAuthority});
      await a.evaluate(key=>localStorage.removeItem(key),KEY);
      const writes=await a.evaluate(()=>window.__sealedResearch.writes);
      await assert.rejects(a.evaluate(()=>window.__sealedResearch.read()));
      assert.equal(await a.evaluate(()=>window.__sealedResearch.writes),writes);
      await a.evaluate(({key,value})=>localStorage.setItem(key,value),{key:KEY,value:key});
      assert.equal((await a.evaluate(()=>window.__sealedResearch.read())).status,'reset');
      console.log('PASS Chromium: missing key fails closed and restoring key recovers reset');
    }finally{await context.close();}
    await testRealArchivedAgainstSealed(browser,'http://127.0.0.1:'+server.address().port+'/');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
