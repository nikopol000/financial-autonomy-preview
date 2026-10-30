'use strict';
// #4/#29/#35 RESEARCH ONLY. SIGKILL the whole disposable Chromium browser
// using a unique persistent profile; NEVER a user's browser or real ledger.
// Pre-crash data is deliberately flushed by a graceful close first; this is
// NOT an in-flight write, power-loss, disk-durability or Safari test.
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
async function run(url,scenario){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fa-whole-browser-crash-'));
  let context;
  try{
    context=await open(profile);
    let page=await context.newPage();
    await page.goto(url);
    assert.equal(await page.evaluate(()=>isSecureContext),true);
    await seed(page,scenario);
    const seeded=await inspect(page);
    assert.equal(seeded.authenticatedWitness,true);
    assert.equal(seeded.classification,'unknown');
    assert.equal(seeded.legacyMatches,false);
    // Explicit flush baseline. The test probes process death, not durability
    // of an unflushed storage transaction.
    await context.close();
    context=null;
    context=await open(profile);
    page=await context.newPage();
    await page.goto(url);
    const before=await inspect(page);
    assert.deepEqual(before,seeded,'gracefully persisted baseline must be stable');
    const pid=uniqueBrowserPid(profile);
    const disconnected=context.waitForEvent('close',{timeout:15000});
    process.kill(pid,'SIGKILL');
    await disconnected; // prove that the whole browser exited, not just a tab
    context=null;
    await new Promise(resolve=>setTimeout(resolve,350));
    context=await open(profile);
    page=await context.newPage();
    await page.goto(url);
    const after=await inspect(page);
    assert.deepEqual(after,before,'whole-browser crash must preserve pre-flushed v1/IDB evidence');
    assert.equal(after.classification,'unknown');
    await page.reload();
    assert.deepEqual(await inspect(page),before,'read-only reload must not repair, erase or replay');
    console.log('PASS whole browser SIGKILL '+scenario+
      ': persistent profile relaunch retains authenticated UNKNOWN without writes');
  }finally{
    if(context)await context.close().catch(()=>{});
    fs.rmSync(profile,{recursive:true,force:true});
  }
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>disposable whole-browser crash</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url='http://127.0.0.1:'+server.address().port+'/';
    for(const scenario of ['orphan-key','deleted-legacy','committed-diverged'])
      await run(url,scenario);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
