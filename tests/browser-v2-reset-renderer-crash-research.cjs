'use strict';
// #4/#29/#35 RESEARCH ONLY: real Chromium renderer crash at reset boundaries.
// Disposable localhost browser contexts, synthetic data and a fixed TEST-ONLY key.
// A renderer crash is NOT a browser-process kill, OS crash, disk flush, or proof
// of rollback resistance. No production vault or real financial data is touched.
const assert=require('node:assert/strict');
const http=require('node:http');
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

async function run(browser,url,scenario){
  const context=await browser.newContext();
  try{
    const page=await context.newPage();
    await page.goto(url);
    assert.equal(await page.evaluate(()=>isSecureContext),true);
    await seed(page,scenario);
    const before=await inspect(page);
    assert.equal(before.authenticatedWitness,true);
    assert.equal(before.classification,'unknown');
    assert.equal(before.legacyMatches,false);
    // Chromium's internal crash URL targets the renderer. Require an actual
    // Playwright crash event; never treat a navigation failure as proof.
    const crashed=page.waitForEvent('crash',{timeout:15000});
    void page.goto('chrome://crash').catch(()=>{});
    await crashed;
    const reopened=await context.newPage();
    await reopened.goto(url);
    const after=await inspect(reopened);
    assert.deepEqual(after,before,
      'renderer crash/reopen must preserve both raw stores and UNKNOWN result');
    await reopened.reload();
    assert.deepEqual(await inspect(reopened),before,
      'a second read must not mutate or auto-recover either store');
    console.log('PASS renderer crash '+scenario+
      ': authenticated synthetic witness remains UNKNOWN; no storage writes');
  }finally{await context.close();}
}

async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>disposable reset renderer crash</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+'/?fa_real=1';
    for(const scenario of ['orphan-key','deleted-legacy','committed-diverged']){
      await run(browser,url,scenario);
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
