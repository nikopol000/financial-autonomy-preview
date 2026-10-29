'use strict';
// #4 RESEARCH ONLY: Chromium IndexedDB witness for sealed localStorage authority.
// Disposable origin, synthetic transactions. NOT a production migration.
// Detects localStorage-only valid-pointer replay, NOT full-origin rollback.
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');
const AUTH='research.witness.authority',KEY='research.witness.key';
const STAGE='research.witness.stage.',LOCK='research.witness.lock',DB='research.witness.db';
async function install(page){
  await page.evaluate(({AUTH,KEY,STAGE,LOCK,DB})=>{
    const enc=new TextEncoder(),dec=new TextDecoder();
    const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
    const bytes=s=>{
      if(typeof s!=='string'||s.length%2||!/^[0-9a-f]+$/i.test(s))throw Error('BAD_HEX');
      return new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
    };
    const digest=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
    const open=()=>new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>req.result.createObjectStore('witness');
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const witness=async()=>{
      const db=await open();
      try{return await new Promise((resolve,reject)=>{
        const tx=db.transaction('witness','readonly');
        const req=tx.objectStore('witness').get('latest');
        req.onsuccess=()=>resolve(req.result??null);
        req.onerror=()=>reject(req.error);tx.onabort=()=>reject(tx.error);
      });}finally{db.close();}
    };
    const putWitness=async value=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction('witness','readwrite');
        tx.objectStore('witness').put(value,'latest');
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
        tx.onerror=()=>reject(tx.error);
      });}finally{db.close();}
    };
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
      const e=JSON.parse(raw);
      if(typeof e.iv!=='string'||e.iv.length!==24||typeof e.cipher!=='string')
        throw Error('BAD_ENVELOPE');
      return JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:bytes(e.iv)},await keyFor(),bytes(e.cipher))));
    };
    const r=window.__witnessResearch={writes:0};
    r.initialize=()=>{
      if(localStorage.getItem(KEY)!==null||localStorage.getItem(AUTH)!==null)
        throw Error('NOT_FRESH');
      localStorage.setItem(KEY,hex(crypto.getRandomValues(new Uint8Array(32))));
    };
    r.witness=witness;
    r.putWitness=putWitness; // test-only full-origin rollback simulation
    r.read=async()=>{
      const raw=localStorage.getItem(AUTH),w=await witness();
      if(raw===null||w===null)throw Error('MISSING_AUTHORITY_OR_WITNESS');
      if(w.hash!==await digest(raw))throw Error('AUTHORITY_WITNESS_MISMATCH');
      const record=await unseal(raw);
      if(record.schema!==2||!Number.isSafeInteger(record.revision)||record.revision<1||
        !['active','reset'].includes(record.status)||record.revision!==w.revision)
        throw Error('BAD_AUTHORITY');
      if(record.status==='reset'){
        if(record.stage!==null||record.stageDigest!==null)throw Error('BAD_RESET');
        return {status:'reset',record};
      }
      if(typeof record.stage!=='string'||!record.stage.startsWith(STAGE))
        throw Error('BAD_STAGE');
      const rawStage=localStorage.getItem(record.stage);
      if(rawStage===null||await digest(rawStage)!==record.stageDigest)
        throw Error('STAGE_MISMATCH');
      return {status:'active',record,state:await unseal(rawStage)};
    };
    r.transition=async({expected=null,state=null,reset=false,failAfterWitness=false})=>{
      if(!navigator.locks?.request)return {ok:false,reason:'locks-unavailable'};
      return navigator.locks.request(LOCK,{mode:'exclusive'},async()=>{
        if(localStorage.getItem(AUTH)!==expected)return {ok:false,reason:'stale-authority'};
        const prior=await witness();
        if(expected===null){
          if(prior!==null)return {ok:false,reason:'orphan-witness'};
        }else{
          if(prior===null||prior.hash!==await digest(expected))
            return {ok:false,reason:'witness-mismatch'};
          if((await r.read()).status!=='active')return {ok:false,reason:'not-active'};
        }
        const revision=prior?prior.revision+1:1;
        let stage=null,stageDigest=null;
        if(!reset){
          stage=STAGE+crypto.randomUUID();
          const rawStage=await seal(state);
          localStorage.setItem(stage,rawStage);r.writes++;
          stageDigest=await digest(rawStage);
        }
        const authority=await seal({schema:2,status:reset?'reset':'active',
          revision,stage,stageDigest,epoch:crypto.randomUUID()});
        // Witness-first: mismatch after a crash is QUARANTINED, not silently rolled back.
        await putWitness({hash:await digest(authority),revision,authority});
        if(failAfterWitness)throw Error('INJECTED_AFTER_WITNESS_COMMIT');
        localStorage.setItem(AUTH,authority);r.writes++;
        return {ok:true,authority};
      });
    };
  },{AUTH,KEY,STAGE,LOCK,DB});
}
async function visible(page,key,value){
  await page.waitForFunction(({key,value})=>localStorage.getItem(key)===value,
    {key,value},{timeout:10000});
}
async function main(){
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    res.end('<!doctype html><title>synthetic IndexedDB witness research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+'/';
    const context=await browser.newContext();
    try{
      const a=await context.newPage(),b=await context.newPage();
      await Promise.all([a.goto(url),b.goto(url)]);
      await Promise.all([install(a),install(b)]);
      assert.equal(await a.evaluate(()=>typeof navigator.locks?.request),'function');
      await a.evaluate(()=>window.__witnessResearch.initialize());
      await visible(b,KEY,await a.evaluate(k=>localStorage.getItem(k),KEY));
      const first=await a.evaluate(()=>window.__witnessResearch.transition({
        state:{transactions:['A']}}));
      assert.equal(first.ok,true);
      await visible(b,AUTH,first.authority);
      assert.deepEqual((await b.evaluate(()=>window.__witnessResearch.read())).state,
        {transactions:['A']});
      console.log('PASS IDB witness: two-tab sealed authority round-trip');

      const priorWitness=await b.evaluate(()=>window.__witnessResearch.witness());
      const reset=await a.evaluate(auth=>window.__witnessResearch.transition({
        expected:auth,reset:true}),first.authority);
      assert.equal(reset.ok,true);
      await visible(b,AUTH,reset.authority);
      assert.equal((await b.evaluate(()=>window.__witnessResearch.read())).status,'reset');
      await b.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:first.authority});
      const before=await b.evaluate(()=>window.__witnessResearch.writes);
      await assert.rejects(b.evaluate(()=>window.__witnessResearch.read()),
        /AUTHORITY_WITNESS_MISMATCH/);
      assert.equal(await b.evaluate(()=>window.__witnessResearch.writes),before);
      await b.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:reset.authority});
      assert.equal((await b.evaluate(()=>window.__witnessResearch.read())).status,'reset');
      console.log('PASS IDB witness: valid old localStorage authority replay fails closed');

      assert.deepEqual(await b.evaluate(auth=>window.__witnessResearch.transition({
        expected:auth,reset:true}),first.authority),
        {ok:false,reason:'stale-authority'});
      console.log('PASS IDB witness: stale tab cannot reset newer state');

      // Both stores can be rolled back together. No trusted external counter.
      await b.evaluate(w=>window.__witnessResearch.putWitness(w),priorWitness);
      await b.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:first.authority});
      assert.deepEqual((await b.evaluate(()=>window.__witnessResearch.read())).state,
        {transactions:['A']});
      console.log('PASS KNOWN UNSAFE IDB witness: coordinated origin rollback succeeds');
    }finally{await context.close();}

    const fault=await browser.newContext();
    try{
      const p=await fault.newPage();
      await p.goto(url);await install(p);
      await p.evaluate(()=>window.__witnessResearch.initialize());
      const first=await p.evaluate(()=>window.__witnessResearch.transition({
        state:{transactions:['A']}}));
      assert.equal(first.ok,true);
      await assert.rejects(p.evaluate(auth=>window.__witnessResearch.transition({
        expected:auth,state:{transactions:['A','B']},failAfterWitness:true
      }),first.authority),/INJECTED_AFTER_WITNESS_COMMIT/);
      assert.equal(await p.evaluate(k=>localStorage.getItem(k),AUTH),first.authority);
      await p.reload();await install(p);
      const before=await p.evaluate(()=>window.__witnessResearch.writes);
      await assert.rejects(p.evaluate(()=>window.__witnessResearch.read()),
        /AUTHORITY_WITNESS_MISMATCH/);
      assert.equal(await p.evaluate(()=>window.__witnessResearch.writes),before);
      console.log('PASS IDB witness: interruption after witness commit fails closed after reload');

      // Reviewed recovery is simulated ONLY in this disposable research origin.
      const w=await p.evaluate(()=>window.__witnessResearch.witness());
      await p.evaluate(({key,value})=>localStorage.setItem(key,value),
        {key:AUTH,value:w.authority});
      assert.deepEqual((await p.evaluate(()=>window.__witnessResearch.read())).state,
        {transactions:['A','B']});
      console.log('PASS IDB witness: explicit synthetic pointer recovery retains ledger');

      await p.evaluate(async()=>{
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('research.witness.db',1);
          req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
        });
        await new Promise((resolve,reject)=>{
          const tx=db.transaction('witness','readwrite');
          tx.objectStore('witness').delete('latest');
          tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
        });db.close();
      });
      const noWrites=await p.evaluate(()=>window.__witnessResearch.writes);
      await assert.rejects(p.evaluate(()=>window.__witnessResearch.read()),
        /MISSING_AUTHORITY_OR_WITNESS/);
      assert.equal(await p.evaluate(()=>window.__witnessResearch.writes),noWrites);
      console.log('PASS IDB witness: missing witness quarantines with zero reader writes');
    }finally{await fault.close();}
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
