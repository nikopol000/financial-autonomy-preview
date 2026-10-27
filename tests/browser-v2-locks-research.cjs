'use strict';
// RESEARCH ONLY: actual Chromium tabs, origin-wide Web Locks, localStorage and
// browser AES-GCM. A disposable localhost origin and synthetic ledger are used.
// This does NOT load the production WEB bundle, migrate data or prove Safari safety.
const assert = require('node:assert/strict');
const http = require('node:http');
const {chromium} = require('playwright');

const LOCK = 'financial-autonomy.preview.v2-research-lock';
const V2 = 'financial-autonomy.preview.atomic-browser-research.v2';
const V1_KEY = 'financial-autonomy.preview.key.v1';
const V1_PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const UNSAFE = 'financial-autonomy.preview.unguarded-browser-research.v2';

async function install(page) {
  await page.evaluate(({LOCK,V2,V1_KEY,UNSAFE}) => {
    const hex = bytes => [...bytes].map(b => b.toString(16).padStart(2,'0')).join('');
    const fromHex = s => new Uint8Array(s.match(/../g).map(x => parseInt(x,16)));
    const enc = new TextEncoder(), dec = new TextDecoder();
    async function seal(state) {
      const key = crypto.getRandomValues(new Uint8Array(32));
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const imported = await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
      const cipher = new Uint8Array(await crypto.subtle.encrypt(
        {name:'AES-GCM',iv:nonce},imported,enc.encode(JSON.stringify(state))));
      return JSON.stringify({v:2,key:hex(key),nonce:hex(nonce),cipher:hex(cipher)});
    }
    async function unseal(raw) {
      const env = JSON.parse(raw);
      if(env.v!==2)throw Error('Invalid research envelope');
      const key = await crypto.subtle.importKey('raw',fromHex(env.key),'AES-GCM',false,['decrypt']);
      return JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:fromHex(env.nonce)},key,fromHex(env.cipher))));
    }
    window.__research = {
      writes:0,events:[],holding:false,unsafeHolding:false,
      async read(key=V2) {
        const raw = localStorage.getItem(key);
        return raw===null ? null : {raw,state:await unseal(raw)};
      },
      async save(state,expected,hold=false) {
        if(!navigator.locks || typeof navigator.locks.request!=='function')
          return {ok:false,reason:'lock-unavailable'};
        return navigator.locks.request(LOCK,{mode:'exclusive'},async () => {
          const current=localStorage.getItem(V2);
          if(current!==expected)return {ok:false,reason:'stale'};
          if(hold) {
            window.__research.holding=true;
            await new Promise(resolve => window.__research.release=resolve);
          }
          const raw=await seal(state);
          localStorage.setItem(V2,raw);
          window.__research.writes++;
          return {ok:true,raw};
        });
      },
      async unsafeSave(state,expected,hold=false) {
        // Deliberately UNSAFE: check-then-async-write is not atomic across tabs.
        if(localStorage.getItem(UNSAFE)!==expected)return {ok:false,reason:'stale'};
        if(hold) {
          window.__research.unsafeHolding=true;
          await new Promise(resolve => window.__research.unsafeRelease=resolve);
        }
        const raw=await seal(state);
        localStorage.setItem(UNSAFE,raw);
        window.__research.writes++;
        return {ok:true,raw};
      },
      async guardedRead() {
        // This is a research guard, not an approved migration contract.
        if(localStorage.getItem(V1_KEY)!=='synthetic-v2-fence')
          return {ok:false,reason:'fence-absent-or-reset-ambiguous'};
        const current=await window.__research.read();
        return {ok:true,state:current.state};
      }
    };
    window.addEventListener('storage',e => {
      if(e.key===V2)window.__research.events.push({key:e.key,newValue:e.newValue});
    });
  },{LOCK,V2,V1_KEY,UNSAFE});
}

async function main() {
  const server=http.createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><title>Disposable Web Locks research</title>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    context=await browser.newContext();
    const url='http://127.0.0.1:'+server.address().port+'/';
    const a=await context.newPage(),b=await context.newPage();
    await Promise.all([a.goto(url),b.goto(url)]);
    await Promise.all([install(a),install(b)]);
    assert.equal(await a.evaluate(()=>isSecureContext),true);
    assert.equal(await b.evaluate(()=>typeof navigator.locks?.request),'function');

    // Real browser queue: both tabs start from the same empty revision.
    const first=a.evaluate(()=>window.__research.save({transactions:['A']},null,true));
    await a.waitForFunction(()=>window.__research.holding);
    const second=b.evaluate(()=>window.__research.save({transactions:['B']},null));
    await a.waitForFunction(async name =>
      (await navigator.locks.query()).pending.some(x=>x.name===name),
      LOCK,{timeout:10000});
    await a.evaluate(()=>window.__research.release());
    const [ra,rb]=await Promise.all([first,second]);
    assert.equal(ra.ok,true);
    assert.deepEqual(rb,{ok:false,reason:'stale'});
    assert.deepEqual((await b.evaluate(()=>window.__research.read())).state,
      {transactions:['A']});
    assert.equal(await b.evaluate(()=>window.__research.writes),0,
      'Stale tab must not write ciphertext');
    await b.waitForFunction(()=>window.__research.events.length>0);
    console.log('PASS Chromium real tabs: exclusive Web Lock queues, rechecks and rejects stale write with zero writes');
    console.log('PASS Chromium real tabs: native StorageEvent reports committed v2 bytes');

    const next=await b.evaluate(raw =>
      window.__research.save({transactions:['A','B']},raw),ra.raw);
    assert.equal(next.ok,true);
    assert.deepEqual((await a.evaluate(()=>window.__research.read())).state,
      {transactions:['A','B']});
    console.log('PASS Chromium real tabs: current revision can save after stale rejection');

    // Known-unsafe counterexample: both pass a check before either writes.
    const ua=a.evaluate(()=>window.__research.unsafeSave({transactions:['A']},null,true));
    const ub=b.evaluate(()=>window.__research.unsafeSave({transactions:['B']},null,true));
    await Promise.all([
      a.waitForFunction(()=>window.__research.unsafeHolding),
      b.waitForFunction(()=>window.__research.unsafeHolding)
    ]);
    await b.evaluate(()=>window.__research.unsafeRelease());
    const rbUnsafe=await ub;
    await a.evaluate(()=>window.__research.unsafeRelease());
    const raUnsafe=await ua;
    assert.equal(rbUnsafe.ok,true);
    assert.equal(raUnsafe.ok,true);
    assert.deepEqual((await a.evaluate(()=>window.__research.read(
      'financial-autonomy.preview.unguarded-browser-research.v2'))).state,
      {transactions:['A']});
    console.log('PASS KNOWN UNSAFE Chromium: unguarded async check/write loses tab B transaction (hazard, not fix)');

    // Cached legacy reset does not know the hypothetical v2 key.
    await a.evaluate(key=>localStorage.setItem(key,'synthetic-v2-fence'),V1_KEY);
    assert.equal((await a.evaluate(()=>window.__research.guardedRead())).ok,true);
    await b.evaluate(keys=>keys.forEach(k=>localStorage.removeItem(k)),
      [V1_KEY,V1_PAYLOAD,RESET]);
    assert.equal((await a.evaluate(()=>window.__research.guardedRead())).reason,
      'fence-absent-or-reset-ambiguous');
    assert.deepEqual((await a.evaluate(()=>window.__research.read())).state,
      {transactions:['A','B']},
      'Naive v2-only reader could still resurrect intentionally reset data');
    console.log('PASS KNOWN UNSAFE Chromium: cached-v1-style reset removes fence, leaves decryptable v2; guarded reader quarantines');
  } finally {
    if(context)await context.close();
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
