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

    console.log('PASS RESEARCH: same-origin paths share archived v1 ledger');
    console.log('PASS RESEARCH: late archived v1 AES-GCM write cannot alter second-origin localStorage');
    console.log('PASS RESEARCH: same-name IndexedDB databases are origin-isolated');
    console.log('LIMIT: no encrypted-file handoff, freshness proof, Safari, or production cutover tested');
  }finally{
    if(browser)await browser.close();
    await Promise.all([new Promise(resolve=>oldServer.close(resolve)),
      new Promise(resolve=>newServer.close(resolve))]);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
