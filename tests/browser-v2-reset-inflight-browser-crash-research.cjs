'use strict';
// #4/#29/#35 RESEARCH ONLY: in-flight IDB transaction and between-operation
// localStorage deletion SIGKILL in disposable Chromium persistent profiles.
// Synthetic-only, no product vault, no real data, no proof of disk durability,
// global reset completion, origin rollback resistance, or Safari behavior.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const DB='fa.research.renderer-crash.reset';
const KEY='financial-autonomy.preview.key.v1';
const PAY='financial-autonomy.preview.payload.v1';
async function seed(page,scenario){
  await page.evaluate(async ({DB,KEY,PAY,scenario})=>{
    const encoder=new TextEncoder();
    const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const digest=async value=>hex(new Uint8Array(await crypto.subtle.digest(
      'SHA-256',encoder.encode(value))));
    localStorage.setItem(KEY,'SYNTHETIC-LEGACY-KEY');
    localStorage.setItem(PAY,'SYNTHETIC-LEGACY-CIPHERTEXT');
    const original=JSON.stringify([localStorage.getItem(KEY),localStorage.getItem(PAY)]);
    const rawKey=new Uint8Array(32).fill(7); // TEST ONLY; never a production key
    const key=await crypto.subtle.importKey('raw',rawKey,'AES-GCM',false,['encrypt']);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const operationId='synthetic-reset-'+scenario;
    const plain={status:scenario==='committed-diverged'?'committed':'pending',
      operationId,source:'synthetic-not-user-consent'};
    const cipher=await crypto.subtle.encrypt(
      {name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(plain)));
    const authority={revision:2,envelope:{iv:Array.from(iv),
      cipher:Array.from(new Uint8Array(cipher))},
      legacyFingerprint:await digest(original)};
    const witness={operationId,authorityDigest:await digest(JSON.stringify(authority))};
    const db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>req.result.createObjectStore('vault');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('vault','readwrite');
        const store=tx.objectStore('vault');
        store.put(authority,'authority');
        store.put(witness,'witness');
        tx.oncomplete=resolve;
        tx.onabort=()=>reject(tx.error||Error('IDB_ABORT'));
        tx.onerror=()=>reject(tx.error||Error('IDB_ERROR'));
      });
    }finally{db.close();}
    if(scenario==='orphan-key'){
      localStorage.removeItem(PAY);
    }else if(scenario==='deleted-legacy'){
      localStorage.removeItem(PAY);
      localStorage.removeItem(KEY);
    }else if(scenario==='committed-diverged'){
      localStorage.setItem(PAY,'SYNTHETIC-ARCHIVED-LATE-WRITE');
    }else throw Error('UNKNOWN_SCENARIO');
  },{DB,KEY,PAY,scenario});
}

async function inspect(page){
  return page.evaluate(async ({DB,KEY,PAY})=>{
    const encoder=new TextEncoder(),decoder=new TextDecoder();
    const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    const digest=async value=>hex(new Uint8Array(await crypto.subtle.digest(
      'SHA-256',encoder.encode(value))));
    const db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      // Never create a missing database during inspection.
      req.onupgradeneeded=()=>{req.transaction.abort();};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    let authority,witness;
    try{
      [authority,witness]=await new Promise((resolve,reject)=>{
        const tx=db.transaction('vault','readonly');
        const store=tx.objectStore('vault');
        const a=store.get('authority'),w=store.get('witness');
        tx.oncomplete=()=>resolve([a.result,w.result]);
        tx.onabort=()=>reject(tx.error||Error('IDB_READ_ABORT'));
        tx.onerror=()=>reject(tx.error||Error('IDB_READ_ERROR'));
      });
    }finally{db.close();}
    if(!authority||!witness)throw Error('MISSING_AUTHORITY_OR_WITNESS');
    const authenticatedWitness=(await digest(JSON.stringify(authority)))===
      witness.authorityDigest;
    const key=await crypto.subtle.importKey('raw',new Uint8Array(32).fill(7),
      'AES-GCM',false,['decrypt']); // same TEST-ONLY fixture key
    const plain=JSON.parse(decoder.decode(await crypto.subtle.decrypt(
      {name:'AES-GCM',iv:new Uint8Array(authority.envelope.iv)},key,
      new Uint8Array(authority.envelope.cipher))));
    const legacy=[localStorage.getItem(KEY),localStorage.getItem(PAY)];
    const legacyMatches=await digest(JSON.stringify(legacy))===
      authority.legacyFingerprint;
    // A committed witness does NOT prove old tabs were fenced or global reset.
    const classification=authenticatedWitness && plain.status==='committed' &&
      legacyMatches?'candidate-only':'unknown';
    return {legacy,authority,witness,plain,authenticatedWitness,
      legacyMatches,classification};
  },{DB,KEY,PAY});
}


function uniqueBrowserPid(profile){
  if(process.platform!=='linux')throw Error('Linux /proc required for isolated browser PID validation');
  const matches=[];
  for(const item of fs.readdirSync('/proc')){
    if(!/^\d+$/.test(item))continue;
    let args;
    try{args=fs.readFileSync('/proc/'+item+'/cmdline','utf8').split('\0').filter(Boolean);}
    catch{continue;}
    if(!args.some(arg=>arg==='--user-data-dir='+profile))continue;
    if(args.some(arg=>arg.startsWith('--type=')))continue;
    if(!/chrom(e|ium)|headless.shell/i.test(path.basename(args[0]||'')))continue;
    matches.push(Number(item));
  }
  assert.equal(matches.length,1,'Must identify exactly one isolated persistent Chromium browser process');
  assert.notEqual(matches[0],process.pid,'Never terminate the test runner');
  return matches[0];
}
async function open(profile){
  return chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
}

async function relaunchAfterKill(profile,context,url){
  const pid=uniqueBrowserPid(profile);
  const closed=context.waitForEvent('close',{timeout:15000});
  process.kill(pid,'SIGKILL');
  await closed;
  await new Promise(resolve=>setTimeout(resolve,350));
  const reopened=await open(profile);
  const page=await reopened.newPage();
  await page.goto(url);
  return {context:reopened,page};
}
async function runInflightIDB(url){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fa-inflight-idb-'));
  let context;
  try{
    context=await open(profile);
    let page=await context.newPage();
    await page.goto(url);
    assert.equal(await page.evaluate(()=>isSecureContext),true);
    await seed(page,'orphan-key');
    await context.close(); // stable, flushed baseline; no user data
    context=await open(profile);
    page=await context.newPage();
    await page.goto(url);
    const before=await inspect(page);
    assert.equal(before.classification,'unknown');
    assert.equal(before.authenticatedWitness,true);
    const nextAuthority={...before.authority,revision:before.authority.revision+1};
    const cryptoNode=require('node:crypto');
    const nextWitness={...before.witness,authorityDigest:cryptoNode.createHash('sha256')
      .update(JSON.stringify(nextAuthority)).digest('hex')};
    await page.evaluate(async ({DB,nextAuthority,nextWitness})=>{
      const db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(DB,1);
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      });
      const tx=db.transaction('vault','readwrite');
      const store=tx.objectStore('vault');
      window.__faResearch={reads:0,completed:false,aborted:false};
      tx.oncomplete=()=>{window.__faResearch.completed=true;db.close();};
      tx.onabort=()=>{window.__faResearch.aborted=true;db.close();};
      store.put(nextAuthority,'authority');
      store.put(nextWitness,'witness');
      // Keep the IDB transaction open with a chain of genuine requests.
      // SIGKILL happens only after multiple callbacks while oncomplete=false.
      function keepAlive(){
        const req=store.get('authority');
        req.onsuccess=()=>{
          window.__faResearch.reads++;
          if(!window.__faResearch.completed&&!window.__faResearch.aborted)
            keepAlive();
        };
        req.onerror=()=>{window.__faResearch.aborted=true;};
      }
      keepAlive();
    },{DB,nextAuthority,nextWitness});
    await page.waitForFunction(()=>window.__faResearch?.reads>=5 &&
      !window.__faResearch?.completed&&!window.__faResearch?.aborted,
      null,{timeout:10000});
    assert.equal(await page.evaluate(()=>window.__faResearch.completed),false,
      'IDB transaction must still be in flight at SIGKILL');
    const reopened=await relaunchAfterKill(profile,context,url);
    context=reopened.context;
    page=reopened.page;
    const after=await inspect(page);
    assert.equal(after.authenticatedWitness,true);
    assert.equal(after.classification,'unknown');
    assert.deepEqual(after.legacy,before.legacy,'legacy evidence must remain untouched');
    const oldPair=JSON.stringify([before.authority,before.witness]);
    const newPair=JSON.stringify([nextAuthority,nextWitness]);
    const actualPair=JSON.stringify([after.authority,after.witness]);
    assert.ok(actualPair===oldPair||actualPair===newPair,
      'IDB must recover the complete old or new pair, never a torn authority/witness');
    const result=actualPair===oldPair?'aborted':'committed';
    await page.reload();
    assert.deepEqual(await inspect(page),after,
      'read-only second inspection must not repair, erase or replay');
    console.log('PASS in-flight IDB whole-browser SIGKILL: '+result+
      ' atomic pair, authenticated UNKNOWN, legacy unchanged, no recovery writes');
  }finally{
    if(context)await context.close().catch(()=>{});
    fs.rmSync(profile,{recursive:true,force:true});
  }
}
async function runLegacyDeletionGap(url){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fa-legacy-delete-gap-'));
  let context;
  try{
    context=await open(profile);
    let page=await context.newPage();
    await page.goto(url);
    await seed(page,'committed-diverged');
    await context.close(); // flushed baseline
    context=await open(profile);
    page=await context.newPage();
    await page.goto(url);
    const before=await inspect(page);
    assert.equal(before.classification,'unknown');
    // localStorage.removeItem is synchronous. This is an inter-operation
    // crash, NOT a kill while removeItem itself is executing.
    await page.evaluate(({PAY})=>localStorage.removeItem(PAY),{PAY});
    assert.equal(await page.evaluate(({PAY})=>localStorage.getItem(PAY),{PAY}),null);
    const reopened=await relaunchAfterKill(profile,context,url);
    context=reopened.context;
    page=reopened.page;
    const after=await inspect(page);
    assert.equal(after.authenticatedWitness,true);
    assert.equal(after.classification,'unknown');
    assert.deepEqual(after.authority,before.authority);
    assert.deepEqual(after.witness,before.witness);
    assert.equal(after.legacy[0],before.legacy[0],
      'legacy key must not be removed or rewritten by inspection');
    assert.ok(after.legacy[1]===before.legacy[1]||after.legacy[1]===null,
      'payload can be old or removed after crash; neither means reset completed');
    await page.reload();
    assert.deepEqual(await inspect(page),after,
      'reload must not delete key, resurrect payload or alter witness');
    console.log('PASS localStorage inter-deletion browser SIGKILL: UNKNOWN, no auto-write');
  }finally{
    if(context)await context.close().catch(()=>{});
    fs.rmSync(profile,{recursive:true,force:true});
  }
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>disposable in-flight reset research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url='http://127.0.0.1:'+server.address().port+'/';
    await runInflightIDB(url);
    await runLegacyDeletionGap(url);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
