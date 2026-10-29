'use strict';
// #4 — research-only REAL archived v1 writer vs isolated experimental v2 authority.
// Actual immutable Metro 309/310/311 + crypto execute in Chromium; only financial
// model 204/205 is stubbed for synthetic records. No production migration exists.
// A green KNOWN UNSAFE assertion characterizes the old client, NOT a product fix.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');
const LOCK='fa.research.v2.restore.lock';
const AUTH='fa.research.v2.restore.authority';
const STAGE='fa.research.v2.restore.stage.';
const V1KEY='financial-autonomy.preview.key.v1';
const V1PAY='financial-autonomy.preview.payload.v1';
const tx=id=>({id,kind:'expense',amount:100,date:'2026-10-29',accountId:'synthetic'});
const empty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});
const archived={
  '18.33':'_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js',
  '18.34':'_expo/static/js/web/index-v01834-multitab-vault-guard-20261024.js'
};
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
const currentModules=extract(fs.readFileSync(CURRENT,'utf8'));
const oldModules=Object.fromEntries(Object.entries(ARCHIVED).map(([v,p])=>
  [v,extract(fs.readFileSync(p,'utf8'))]));

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
async function installV2(page,legacyKey,legacyPay) {
  await page.evaluate(({LOCK,AUTH,STAGE,V1KEY,V1PAY}) => {
    const encoder = new TextEncoder(), decoder = new TextDecoder();
    const hex = data => Array.from(data, b => b.toString(16).padStart(2,'0')).join('');
    const fromHex = str => new Uint8Array(str.match(/../g).map(x => parseInt(x,16)));
    const legacy = () => JSON.stringify([localStorage.getItem(V1KEY),localStorage.getItem(V1PAY)]);
    async function digest(value) {
      return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
    }
    async function seal(state) {
      const rawKey=crypto.getRandomValues(new Uint8Array(32));
      const nonce=crypto.getRandomValues(new Uint8Array(12));
      const key=await crypto.subtle.importKey('raw',rawKey,'AES-GCM',false,['encrypt']);
      const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,encoder.encode(JSON.stringify(state)));
      return JSON.stringify({key:hex(rawKey),nonce:hex(nonce),cipher:hex(new Uint8Array(cipher))});
    }
    async function unseal(raw) {
      const value=JSON.parse(raw);
      const key=await crypto.subtle.importKey('raw',fromHex(value.key),'AES-GCM',false,['decrypt']);
      return JSON.parse(decoder.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:fromHex(value.nonce)},key,fromHex(value.cipher))));
    }
    const r=window.__restoreResearch={writes:0,holding:false};
    r.legacy=legacy;
    r.snapshot=() => ({authority:localStorage.getItem(AUTH),legacy:legacy()});
    r.read=async () => {
      const raw=localStorage.getItem(AUTH);
      if(raw===null)return {source:'legacy',authority:null};
      const record=JSON.parse(raw);
      if(record.schema!==2 || !['active','reset'].includes(record.status))
        throw Error('UNKNOWN_AUTHORITY');
      if(record.status==='reset')return {source:'reset',authority:raw};
      if(typeof record.stage!=='string' || !record.stage.startsWith(STAGE))
        throw Error('INVALID_STAGE_REF');
      const staged=localStorage.getItem(record.stage);
      if(staged===null || await digest(staged)!==record.digest)
        throw Error('STAGE_CHANGED');
      return {source:'v2',authority:raw,state:await unseal(staged),
        legacyDiverged:legacy()!==record.legacy};
    };
    r.restore=async (state,expected,confirmed,hold=false,fault=null) => {
      if(!confirmed)return {ok:false,reason:'confirmation-required'};
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
        if(localStorage.getItem(AUTH)!==expected.authority)
          return {ok:false,reason:'stale-authority'};
        if(legacy()!==expected.legacy)
          return {ok:false,reason:'legacy-diverged'};
        if(hold) {
          r.holding=true;
          await new Promise(resolve=>r.release=resolve);
        }
        const stage=STAGE+crypto.randomUUID();
        const sealed=await seal(state);
        localStorage.setItem(stage,sealed);r.writes++;
        if(localStorage.getItem(stage)!==sealed || JSON.stringify(await unseal(sealed))!==JSON.stringify(state))
          throw Error('STAGE_UNVERIFIED');
        if(localStorage.getItem(AUTH)!==expected.authority || legacy()!==expected.legacy)
          return {ok:false,reason:'changed-during-stage'};
        if(fault==='before')throw Error('SYNTHETIC_BEFORE_AUTHORITY');
        const record=JSON.stringify({schema:2,status:'active',stage,
          digest:await digest(sealed),legacy:expected.legacy,epoch:crypto.randomUUID()});
        localStorage.setItem(AUTH,record);r.writes++;
        if(fault==='after')throw Error('SYNTHETIC_AFTER_AUTHORITY');
        return {ok:true,authority:record,stage};
      });
    };
    r.reset=async (expected,confirmed) => {
      if(!confirmed)return {ok:false,reason:'confirmation-required'};
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
        if(localStorage.getItem(AUTH)!==expected)
          return {ok:false,reason:'stale-authority'};
        const current=await r.read();
        if(current.source!=='v2')return {ok:false,reason:'not-active'};
        if(current.legacyDiverged)return {ok:false,reason:'legacy-diverged'};
        const tombstone=JSON.stringify({schema:2,status:'reset',epoch:crypto.randomUUID()});
        localStorage.setItem(AUTH,tombstone);r.writes++;
        return {ok:true,authority:tombstone};
      });
    };
  },{LOCK,AUTH,STAGE,V1KEY:legacyKey,V1PAY:legacyPay});
}


async function visible(page,key,value){
  await page.waitForFunction(({key,value})=>localStorage.getItem(key)===value,
    {key,value},{timeout:10000});
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>archived v1 versus v2 authority research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+'/?fa_real=1';
    for(const version of ['18.33','18.34']){
      const context=await browser.newContext();
      try{
        const a=await context.newPage(),b=await context.newPage();
        await Promise.all([a.goto(url),b.goto(url)]);
        await installLegacy(a,extract(fs.readFileSync(archived[version],'utf8')));
        await installV2(b,V1KEY,V1PAY);
        assert.equal(await b.evaluate(()=>typeof navigator.locks?.request),'function');
        await a.evaluate(()=>window.__archivedVault.load());
        await a.evaluate(s=>window.__archivedVault.save(s),
          {...empty(),transactions:[tx('legacy-initial')]});
        await visible(b,V1PAY,await a.evaluate(k=>localStorage.getItem(k),V1PAY));
        const baseline=await b.evaluate(()=>window.__restoreResearch.snapshot());
        assert.equal(baseline.authority,null);
        if(version==='18.33'){
          // Old 18.33 ignores the new v2 lock. Real ciphertext drift DURING
          // staged migration must reject promotion, preserving the v1 authority.
          const paused=b.evaluate(snapshot=>window.__restoreResearch.restore(
            {transactions:['v2-not-committed']},snapshot,true,true),baseline);
          await b.waitForFunction(()=>window.__restoreResearch.holding);
          const latest=await a.evaluate(()=>window.__archivedVault.load());
          await a.evaluate(s=>window.__archivedVault.save(s),
            {...latest,transactions:[...latest.transactions,tx('legacy-during-stage')]});
          await visible(b,V1PAY,await a.evaluate(k=>localStorage.getItem(k),V1PAY));
          await b.evaluate(()=>window.__restoreResearch.release());
          assert.deepEqual(await paused,{ok:false,reason:'changed-during-stage'});
          assert.equal((await b.evaluate(()=>window.__restoreResearch.snapshot())).authority,null);
          assert.deepEqual((await a.evaluate(()=>window.__archivedVault.load())).transactions
            .map(t=>t.id),['legacy-initial','legacy-during-stage']);
          console.log('PASS real archived 18.33: v1 write during v2 stage rejects authority promotion');
          const fresh=await b.evaluate(()=>window.__restoreResearch.snapshot());
          const committed=await b.evaluate(snapshot=>window.__restoreResearch.restore(
            {transactions:['v2-authoritative']},snapshot,true),fresh);
          assert.equal(committed.ok,true);
          assert.deepEqual((await b.evaluate(()=>window.__restoreResearch.read())).state,
            {transactions:['v2-authoritative']});
          const next=await a.evaluate(()=>window.__archivedVault.load());
          await a.evaluate(s=>window.__archivedVault.save(s),
            {...next,transactions:[...next.transactions,tx('legacy-after-cutover')]});
          await visible(b,V1PAY,await a.evaluate(k=>localStorage.getItem(k),V1PAY));
          const view=await b.evaluate(()=>window.__restoreResearch.read());
          assert.equal(view.source,'v2');
          assert.equal(view.legacyDiverged,true);
          assert.deepEqual(view.state,{transactions:['v2-authoritative']});
          const beforeWrites=await b.evaluate(()=>window.__restoreResearch.writes);
          assert.deepEqual(await b.evaluate(raw=>window.__restoreResearch.reset(raw,true),
            committed.authority),{ok:false,reason:'legacy-diverged'});
          assert.equal(await b.evaluate(()=>window.__restoreResearch.writes),beforeWrites);
          console.log('PASS real archived 18.33: post-cutover v1 divergence stays separate; reset fails closed');
        }else{
          const committed=await b.evaluate(snapshot=>window.__restoreResearch.restore(
            {transactions:['v2-before-reset']},snapshot,true),baseline);
          assert.equal(committed.ok,true);
          const reset=await b.evaluate(raw=>window.__restoreResearch.reset(raw,true),
            committed.authority);
          assert.equal(reset.ok,true);
          // Old 18.34 can still write v1 independently, including after reload.
          // V2 tombstone must remain authoritative and never auto-import v1.
          await a.reload();
          await installLegacy(a,extract(fs.readFileSync(archived[version],'utf8')));
          const latest=await a.evaluate(()=>window.__archivedVault.load());
          await a.evaluate(s=>window.__archivedVault.save(s),
            {...latest,transactions:[...latest.transactions,tx('old-after-v2-reset')]});
          await visible(b,V1PAY,await a.evaluate(k=>localStorage.getItem(k),V1PAY));
          assert.equal((await b.evaluate(()=>window.__restoreResearch.read())).source,'reset');
          assert.equal(await b.evaluate(k=>localStorage.getItem(k),AUTH),reset.authority);
          console.log('PASS real archived 18.34: legacy write after v2 reset cannot auto-resurrect v2');
        }
      }finally{await context.close()}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
