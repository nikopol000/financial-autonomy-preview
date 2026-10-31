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
    await Promise.all([openReal(current,url),old.goto(url)]);
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
    const fixture={version:4,accounts:[],transactions:[],balanceChecks:[]};
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
        const before=pair();
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
          const after=pair();
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
    await current.evaluate(()=>window.__consentResearch.disarm());
    console.log('PASS KNOWN UNSAFE Chromium: authentic backup and final locked recheck DO NOT fence archived v1 writer after reinspection; no reset/restore exists');
  }finally{
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
