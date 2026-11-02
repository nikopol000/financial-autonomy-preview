'use strict';
// P1 #4/#29/#35 H07/H08/H14/H15: disposable Chromium design oracle ONLY.
// No production import, backup parser, cutover, vault writes or new deployment.
// Synthetic .test HTTPS hosts are fulfilled entirely in-browser, not contacted.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const OLD='https://legacy-vault.example.test';
const NEXT='https://new-vault.example.test';
const KEY='financial-autonomy.preview.key.v1';
const PAY='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';

async function footprint(page){
  return page.evaluate(async()=>({
    storage:Array.from({length:localStorage.length},(_,i)=>localStorage.key(i))
      .sort().map(k=>[k,localStorage.getItem(k)]),
    databases:(await indexedDB.databases()).map(x=>x.name).sort()
  }));
}
async function inspect(page,options={}){
  // This in-page, read-only design probe checks the origin BEFORE storage.
  // Loopback isSecureContext is NOT evidence of an HTTPS production origin.
  return page.evaluate(async({oldOrigin,expectedOrigin,deny})=>{
    let writes=0,reads=0;
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
    const clear=Storage.prototype.clear,get=Storage.prototype.getItem;
    const databases=indexedDB.databases;
    Storage.prototype.setItem=function(){writes++;throw Error('RESEARCH_WRITE_FORBIDDEN')};
    Storage.prototype.removeItem=function(){writes++;throw Error('RESEARCH_DELETE_FORBIDDEN')};
    Storage.prototype.clear=function(){writes++;throw Error('RESEARCH_CLEAR_FORBIDDEN')};
    Storage.prototype.getItem=function(k){reads++;if(deny==='storage')throw Error('SecurityError');return get.call(this,k)};
    if(deny==='idb')indexedDB.databases=async()=>{throw Error('SecurityError')};
    const result=(status,reason)=>({status,reason,writes,reads,origin:location.origin,secureContext:isSecureContext});
    try{
      const old=new URL(oldOrigin),target=new URL(expectedOrigin);
      if(old.protocol!=='https:'||target.protocol!=='https:'||
         old.hostname===target.hostname||
         location.protocol!=='https:'||location.origin!==target.origin)
        return result('BLOCKED_ORIGIN','not_exact_independent_https_origin');
      let keys,values,dbs;
      try{
        keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i));
        values=Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));
        if(typeof indexedDB.databases!=='function')throw Error('IDB_ENUMERATION_UNAVAILABLE');
        dbs=await indexedDB.databases();
        if(!Array.isArray(dbs))throw Error('IDB_ENUMERATION_UNAVAILABLE');
      }catch{return result('BLOCKED_UNREADABLE','destination_inspection_unknown')}
      const has=k=>Object.prototype.hasOwnProperty.call(values,k);
      if(has('financial-autonomy.preview.reset.v1'))
        return result('BLOCKED_RESET','reset_state_requires_review');
      if(has('financial-autonomy.preview.key.v1')!==has('financial-autonomy.preview.payload.v1'))
        return result('BLOCKED_PARTIAL','orphan_envelope_requires_review');
      if(has('financial-autonomy.preview.key.v1'))
        return result('BLOCKED_EXISTING','encrypted_ledger_requires_review');
      if(keys.length||dbs.length)
        return result('BLOCKED_UNKNOWN','other_origin_storage_requires_review');
      return result('REVIEW_ONLY','empty_observation_not_import_authority');
    }finally{
      Storage.prototype.setItem=set;
      Storage.prototype.removeItem=remove;
      Storage.prototype.clear=clear;
      Storage.prototype.getItem=get;
      indexedDB.databases=databases;
    }
  },{oldOrigin:OLD,expectedOrigin:NEXT,deny:options.deny||null});
}
async function run(browser,{id,url,expected,storage={},idb=false,deny=null,secureLoopback=false}){
  const context=await browser.newContext({serviceWorkers:'block'});
  try{
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());
      if(u.hostname!=='127.0.0.1'&&!u.hostname.endsWith('.example.test'))
        return route.abort();
      return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>disposable handoff preflight</title>'});
    });
    const page=await context.newPage();
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.evaluate(async({storage,idb})=>{
      for(const [key,value] of Object.entries(storage))localStorage.setItem(key,value);
      if(idb){
        const db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open('synthetic-existing-idb',1);
          req.onupgradeneeded=()=>req.result.createObjectStore('synthetic');
          req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
        });
        db.close();
      }
    },{storage,idb});
    const before=await footprint(page);
    const outcome=await inspect(page,{deny});
    const after=await footprint(page);
    assert.equal(outcome.status,expected,id+' status: '+JSON.stringify(outcome));
    assert.equal(outcome.writes,0,id+' preflight must not mutate any storage');
    assert.deepEqual(after,before,id+' storage and IDB metadata must remain unchanged');
    if(expected==='BLOCKED_ORIGIN')assert.equal(outcome.reads,0,id+' wrong origin must not inspect storage');
    if(secureLoopback)assert.equal(outcome.secureContext,true,
      'Chromium loopback secure context must still be rejected for non-HTTPS');
    console.log('PASS RESEARCH '+id+': '+expected+'; zero writes');
  }finally{await context.close()}
}
// H09 TOCTOU characterization: another tab writes AFTER an empty preflight.
// This is a negative design test, not an import implementation or an atomic
// commit guarantee. The test-owned writer is the only source of mutations.
async function raceAfterPreflight(browser,{id,kind,expected}){
  const context=await browser.newContext({serviceWorkers:'block'});
  try{
    await context.route('**/*',route=>route.fulfill({
      status:200,contentType:'text/html',
      body:'<!doctype html><title>disposable H09 race research</title>'
    }));
    const inspector=await context.newPage(),writer=await context.newPage();
    await Promise.all([inspector.goto(NEXT+'/'),writer.goto(NEXT+'/')]);
    const first=await inspect(inspector);
    assert.equal(first.status,'REVIEW_ONLY',id+' initial empty observation');
    assert.equal(first.writes,0,id+' first inspection is read-only');
    // Deliberately change the SAME destination origin from a second tab.
    await writer.evaluate(async kind=>{
      if(kind==='unknown')localStorage.setItem('synthetic-other-owner','changed-after-preflight');
      else if(kind==='key')localStorage.setItem('financial-autonomy.preview.key.v1','synthetic-new-key');
      else if(kind==='idb'){
        const db=await new Promise((resolve,reject)=>{
          const request=indexedDB.open('synthetic-race-created-db',1);
          request.onupgradeneeded=()=>request.result.createObjectStore('synthetic');
          request.onsuccess=()=>resolve(request.result);
          request.onerror=()=>reject(request.error);
        });
        db.close();
      }else throw Error('UNKNOWN_TEST_MUTATION');
    },kind);
    const external=await footprint(inspector);
    const second=await inspect(inspector);
    assert.equal(second.status,expected,id+' must reject stale empty observation');
    assert.equal(second.writes,0,id+' inspector must not write');
    assert.deepEqual(await footprint(inspector),external,
      id+' second inspection must preserve the external writer footprint');
    console.log('PASS RESEARCH '+id+': REVIEW_ONLY -> '+expected+
      '; inspector zero writes (external synthetic writer changed destination)');
  }finally{await context.close()}
}
async function main(){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const cases=[
      {id:'H14 same-origin path',url:OLD+'/v2',expected:'BLOCKED_ORIGIN'},
      {id:'H15 post-redirect final landing on old host',url:OLD+'/redirected',expected:'BLOCKED_ORIGIN'},
      {id:'H15 unapproved host alias',url:'https://alias-vault.example.test/',expected:'BLOCKED_ORIGIN'},
      {id:'H15 wrong HTTPS port',url:NEXT+':8443/',expected:'BLOCKED_ORIGIN'},
      {id:'H14 loopback HTTP secure-context exception',url:'http://127.0.0.1:8765/',expected:'BLOCKED_ORIGIN',secureLoopback:true},
      {id:'H07 new origin empty is only a review candidate',url:NEXT+'/',expected:'REVIEW_ONLY'},
      {id:'H07 authenticated-looking pair blocks',url:NEXT+'/',expected:'BLOCKED_EXISTING',storage:{[KEY]:'synthetic-key',[PAY]:'synthetic-ciphertext'}},
      {id:'H08 KEY-only blocks',url:NEXT+'/',expected:'BLOCKED_PARTIAL',storage:{[KEY]:'synthetic-key'}},
      {id:'H08 PAYLOAD-only blocks',url:NEXT+'/',expected:'BLOCKED_PARTIAL',storage:{[PAY]:'synthetic-ciphertext'}},
      {id:'H08 reset marker blocks',url:NEXT+'/',expected:'BLOCKED_RESET',storage:{[RESET]:'pending-v2:'+'a'.repeat(32)}},
      {id:'H08 completed reset marker is not proof of virgin storage',url:NEXT+'/',expected:'BLOCKED_RESET',storage:{[RESET]:'idle-v2:'+'b'.repeat(32)}},
      {id:'H09 unknown localStorage blocks',url:NEXT+'/',expected:'BLOCKED_UNKNOWN',storage:{'unrecognized-vault-key':'synthetic'}},
      {id:'H09 existing IndexedDB blocks',url:NEXT+'/',expected:'BLOCKED_UNKNOWN',idb:true},
      {id:'H09 denied localStorage read blocks',url:NEXT+'/',expected:'BLOCKED_UNREADABLE',storage:{[KEY]:'synthetic-key'},deny:'storage'},
      {id:'H09 denied IDB enumeration blocks',url:NEXT+'/',expected:'BLOCKED_UNREADABLE',deny:'idb'}
    ];
    for(const scenario of cases)await run(browser,scenario);
    await raceAfterPreflight(browser,{id:'H09 changed destination unknown key',kind:'unknown',expected:'BLOCKED_UNKNOWN'});
    await raceAfterPreflight(browser,{id:'H09 changed destination KEY-only',kind:'key',expected:'BLOCKED_PARTIAL'});
    await raceAfterPreflight(browser,{id:'H09 changed destination IndexedDB',kind:'idb',expected:'BLOCKED_UNKNOWN'});
    console.log('LIMIT: read-only H09 recheck is NOT atomic with any later commit; no real backup authentication, import, deployment, Safari or crash guarantee');
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
