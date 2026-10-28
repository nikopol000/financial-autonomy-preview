'use strict';
// Issue #4 — RESEARCH / CHARACTERIZATION ONLY. Actual archived Metro vault modules
// execute in TWO real Chromium tabs with shared browser localStorage and Web Locks.
// Synthetic transactions only. PASS on a KNOWN UNSAFE case is NOT a safety fix.
// No production bundle, vault format, backup or user data is changed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require('playwright');

const ARCHIVED={
  '18.27':'_expo/static/js/web/index-v01827-vault-orphan-guard-20261023.js',
  '18.33':'_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js',
  '18.34':'_expo/static/js/web/index-v01834-multitab-vault-guard-20261024.js'
};
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(active,'Active immutable bundle reference is required');
const CURRENT='_expo/static/js/web/'+active.replace(/^_expo\/static\/js\/web\//,'');
const KEY='financial-autonomy.preview.key.v1';
const PAY='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const tx=id=>({id,kind:'expense',amount:100,date:'2026-10-29',accountId:'synthetic'});
const clone=x=>JSON.parse(JSON.stringify(x));
const empty=()=>({version:4,accounts:[],transactions:[],balanceChecks:[]});

// Extract the ACTUAL Metro module factory and its transitive cryptographic
// dependencies. Only the pure financial model (204/205) is stubbed to accept
// synthetic ledger records; 309/310/311 and crypto dependencies are unmodified.
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

async function install(page,modules){
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
async function visible(page,key,value){
  await page.waitForFunction(({key,value})=>localStorage.getItem(key)===value,
    {key,value},{timeout:10000});
}
async function withTabs(browser,version,fn){
  const context=await browser.newContext();
  try{
    const serverUrl=globalThis.__researchUrl;
    const a=await context.newPage(),b=await context.newPage();
    await Promise.all([a.goto(serverUrl),b.goto(serverUrl)]);
    await install(a,oldModules[version]);
    await install(b,currentModules);
    assert.equal(await a.evaluate(()=>isSecureContext),true);
    assert.equal(await b.evaluate(()=>typeof navigator.locks?.request),'function');
    await fn(a,b);
  }finally{await context.close()}
}
async function staleSave(browser,version,guarded){
  await withTabs(browser,version,async(a,b)=>{
    await a.evaluate(()=>window.__archivedVault.load());
    await a.evaluate(s=>window.__archivedVault.save(s),
      {...empty(),transactions:[tx('initial')]});
    const original=await a.evaluate(()=>window.__archivedVault.load());
    await visible(b,PAY,await a.evaluate(key=>localStorage.getItem(key),PAY));
    await b.evaluate(()=>window.__archivedVault.load());
    await b.evaluate(s=>window.__archivedVault.save(s),
      {...empty(),transactions:[tx('initial'),tx('newer')]});
    const modernPayload=await b.evaluate(key=>localStorage.getItem(key),PAY);
    await visible(a,PAY,modernPayload);
    const attempt=await a.evaluate(async s=>{
      try{await window.__archivedVault.save(s);return {ok:true}}
      catch(e){return {ok:false,message:String(e.message)}}
    },{...clone(original),transactions:[tx('legacy-stale')]});
    if(guarded){
      assert.equal(attempt.ok,false,'18.34 must reject stale cached snapshot');
      assert.equal(await b.evaluate(key=>localStorage.getItem(key),PAY),modernPayload,
        'Rejected stale writer must not mutate ciphertext');
      assert.deepEqual((await b.evaluate(()=>window.__archivedVault.load())).transactions
        .map(x=>x.id),['initial','newer']);
      console.log('PASS PARTIAL GUARD: real Chromium '+version+
        ' rejects sequential stale save without writing');
    }else{
      assert.equal(attempt.ok,true,'Legacy unguarded stale save is KNOWN UNSAFE');
      const stalePayload=await a.evaluate(key=>localStorage.getItem(key),PAY);
      await visible(b,PAY,stalePayload);
      assert.deepEqual((await b.evaluate(()=>window.__archivedVault.load())).transactions
        .map(x=>x.id),['legacy-stale']);
      console.log('PASS KNOWN UNSAFE: real Chromium '+version+
        ' cached tab overwrites 18.62 ledger');
    }
  });
}
async function resetResurrection(browser,version){
  await withTabs(browser,version,async(a,b)=>{
    await a.evaluate(()=>window.__archivedVault.load());
    await a.evaluate(s=>window.__archivedVault.save(s),
      {...empty(),transactions:[tx('before-reset')]});
    const snapshot=await a.evaluate(()=>window.__archivedVault.load());
    await visible(b,PAY,await a.evaluate(key=>localStorage.getItem(key),PAY));
    await b.evaluate(()=>window.__archivedVault.load());
    await b.evaluate(()=>window.__archivedVault.resetData());
    const marker=await b.evaluate(key=>localStorage.getItem(key),RESET);
    assert.match(marker,/^idle-v2:[0-9a-f]{32}$/);
    await visible(a,RESET,marker);
    await visible(a,PAY,null);
    const attempt=await a.evaluate(async s=>{
      try{await window.__archivedVault.save(s);return {ok:true}}
      catch(e){return {ok:false,message:String(e.message)}}
    },snapshot);
    assert.equal(attempt.ok,true,'Archived '+version+' resurrection is KNOWN UNSAFE');
    const resurrected=await a.evaluate(key=>localStorage.getItem(key),PAY);
    assert.ok(resurrected,'Archived cached writer recreated v1 ciphertext');
    await visible(b,PAY,resurrected);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),RESET),marker,
      'Reset marker remains, yet current v1 load can still accept old ciphertext');
    assert.deepEqual((await b.evaluate(()=>window.__archivedVault.load())).transactions
      .map(x=>x.id),['before-reset']);
    console.log('PASS KNOWN UNSAFE: real Chromium '+version+
      ' cached tab resurrects v1 ledger after 18.62 reset');
  });
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>archived cached vault research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  globalThis.__researchUrl='http://127.0.0.1:'+server.address().port+'/?fa_real=1';
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    await staleSave(browser,'18.27',false);
    await staleSave(browser,'18.33',false);
    await staleSave(browser,'18.34',true);
    await resetResurrection(browser,'18.33');
    await resetResurrection(browser,'18.34');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
