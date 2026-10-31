'use strict';
// #4/#29/#35 RESEARCH ONLY: SIGKILL a unique disposable Chromium process
// while an IndexedDB version upgrade or a Web Lock is genuinely queued.
// This is NOT a production vault, disk/power-loss proof, Safari test, or
// authorization for destructive reset/restore. Synthetic evidence only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');

const DB='fa.research.blocked-crash.idb.20261031';
const LOCK='fa.research.blocked-crash.lock.20261031';
const MARK='fa.research.blocked-crash.UNEXPECTED_CALLBACK';
const KEYS=['financial-autonomy.preview.key.v1',
  'financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
const EXPECTED=['SYNTHETIC-KEY','SYNTHETIC-CIPHERTEXT','SYNTHETIC-RESET'];

function isolatedBrowserPid(profile){
  if(process.platform!=='linux')throw Error('Linux /proc required for isolated crash test');
  const matches=[];
  for(const item of fs.readdirSync('/proc')){
    if(!/^\d+$/.test(item))continue;
    let args;
    try{args=fs.readFileSync('/proc/'+item+'/cmdline','utf8').split('\0').filter(Boolean);}
    catch{continue;}
    if(!args.includes('--user-data-dir='+profile))continue;
    if(args.some(a=>a.startsWith('--type=')))continue;
    if(!/chrom(e|ium)|headless.shell/i.test(path.basename(args[0]||'')))continue;
    matches.push(Number(item));
  }
  assert.equal(matches.length,1,'Kill only the unique test-profile browser');
  assert.notEqual(matches[0],process.pid);
  return matches[0];
}
const launch=profile=>chromium.launchPersistentContext(profile,
  {headless:true,args:['--no-sandbox']});
async function seed(page){
  await page.evaluate(async ({DB,KEYS,EXPECTED})=>{
    KEYS.forEach((key,i)=>localStorage.setItem(key,EXPECTED[i]));
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>req.result.createObjectStore('synthetic');
    const db=await new Promise((resolve,reject)=>{
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('synthetic','readwrite');
        tx.objectStore('synthetic').put('original','sentinel');
        tx.oncomplete=resolve;
        tx.onabort=()=>reject(tx.error||Error('SEED_ABORT'));
        tx.onerror=()=>reject(tx.error||Error('SEED_ERROR'));
      });
    }finally{db.close();}
  },{DB,KEYS,EXPECTED});
}
async function inspect(page){
  return page.evaluate(async ({DB,KEYS,MARK})=>{
    const vault=KEYS.map(key=>localStorage.getItem(key));
    const marker=localStorage.getItem(MARK);
    const req=indexedDB.open(DB,1);
    // A missing database must not be silently created by inspection.
    req.onupgradeneeded=()=>req.transaction.abort();
    const db=await new Promise((resolve,reject)=>{
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||Error('MISSING_DB'));
    });
    try{
      const value=await new Promise((resolve,reject)=>{
        const tx=db.transaction('synthetic','readonly');
        const get=tx.objectStore('synthetic').get('sentinel');
        tx.oncomplete=()=>resolve(get.result);
        tx.onabort=()=>reject(tx.error||Error('READ_ABORT'));
        tx.onerror=()=>reject(tx.error||Error('READ_ERROR'));
      });
      return {vault,marker,version:db.version,value,stores:Array.from(db.objectStoreNames)};
    }finally{db.close();}
  },{DB,KEYS,MARK});
}
async function killAndReopen(profile,context,url){
  const pid=isolatedBrowserPid(profile);
  const closed=context.waitForEvent('close',{timeout:15000});
  process.kill(pid,'SIGKILL');
  await closed;
  await new Promise(resolve=>setTimeout(resolve,350));
  const reopened=await launch(profile);
  const page=await reopened.newPage();
  await page.goto(url);
  return {context:reopened,page};
}
async function run(url,scenario){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fa-blocked-crash-'));
  let context;
  try{
    context=await launch(profile);
    let page=await context.newPage();
    await page.goto(url);
    assert.equal(await page.evaluate(()=>isSecureContext),true);
    await seed(page);
    const expected={vault:EXPECTED,marker:null,version:1,value:'original',
      stores:['synthetic']};
    assert.deepEqual(await inspect(page),expected);
    // Flush a known baseline before testing the crash of a blocked operation.
    await context.close();
    context=await launch(profile);
    const holder=await context.newPage(),worker=await context.newPage();
    await Promise.all([holder.goto(url),worker.goto(url)]);
    assert.deepEqual(await inspect(holder),expected);
    if(scenario==='blocked-idb'){
      await holder.evaluate(async name=>{
        const req=indexedDB.open(name,1);
        window.__oldDb=await new Promise((resolve,reject)=>{
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
      },DB);
      await worker.evaluate(name=>{
        window.__blocked=false;
        const req=indexedDB.open(name,2);
        req.onblocked=()=>{window.__blocked=true;};
        // If ever unexpectedly unblocked before death, abort, never commit.
        req.onupgradeneeded=()=>req.transaction.abort();
        req.onsuccess=()=>req.result.close();
        req.onerror=()=>{};
      },DB);
      await worker.waitForFunction(()=>window.__blocked===true,null,{timeout:10000});
    }else if(scenario==='queued-lock'){
      assert.equal(await holder.evaluate(()=>typeof navigator.locks?.request),'function');
      // Intentionally unresolved until the whole disposable browser is killed.
      holder.evaluate(name=>navigator.locks.request(name,{mode:'exclusive'},
        async()=>{window.__held=true;await new Promise(()=>{});}),LOCK).catch(()=>{});
      await holder.waitForFunction(()=>window.__held===true,null,{timeout:10000});
      await worker.evaluate(({LOCK,MARK})=>{
        navigator.locks.request(LOCK,{mode:'exclusive'},()=>{
          localStorage.setItem(MARK,'UNEXPECTED');
        }).catch(()=>{});
      },{LOCK,MARK});
      await holder.waitForFunction(async name=>{
        const state=await navigator.locks.query();
        return state.pending.some(item=>item.name===name);
      },LOCK,{timeout:10000});
    }else throw Error('UNKNOWN_SCENARIO');
    const reopened=await killAndReopen(profile,context,url);
    context=reopened.context;
    page=reopened.page;
    assert.deepEqual(await inspect(page),expected,
      'SIGKILL/relaunch must not promote IDB, lose baseline or run queued callback');
    if(scenario==='queued-lock'){
      const locks=await page.evaluate(name=>navigator.locks.query().then(state=>({
        held:state.held.filter(x=>x.name===name).length,
        pending:state.pending.filter(x=>x.name===name).length
      })),LOCK);
      assert.deepEqual(locks,{held:0,pending:0},
        'old browser locks and requests must be gone after process death');
    }
    await page.reload();
    assert.deepEqual(await inspect(page),expected,
      'second inspection must not silently repair or alter encrypted evidence');
    console.log('PASS whole-browser SIGKILL while '+scenario+
      ': persistent synthetic vault/IDB sentinel unchanged; no late callback');
  }finally{
    if(context)await context.close().catch(()=>{});
    fs.rmSync(profile,{recursive:true,force:true});
  }
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>Disposable blocked browser crash research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url='http://127.0.0.1:'+server.address().port+'/';
    await run(url,'blocked-idb');
    await run(url,'queued-lock');
    console.log('KNOWN UNSAFE: noncooperating cached v1 writer bypasses Web Locks; NO destructive recovery');
  }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
