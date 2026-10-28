'use strict';
// #35: actual WEB 18.59 UI + native Chromium localStorage, with an injected
// spec-compatible atomic QuotaExceededError at the FIRST ciphertext write.
// Disposable localhost real-mode contexts; no real user data, backup, or server.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const VAULT=[KEY,PAYLOAD,RESET];
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
function serve(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'||pathname===PREFIX||pathname===PREFIX.slice(0,-1)
    ?'index.html':pathname.startsWith(PREFIX)?pathname.slice(PREFIX.length):'';
  const file=path.resolve(ROOT,relative);
  if(!relative||(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html'))){
    res.writeHead(403);res.end('Forbidden');return;
  }
  fs.readFile(file,(error,body)=>{
    if(error){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'});res.end(body);
  });
}
async function bytes(page){
  return page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),VAULT);
}
async function openReal(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>{
    const t=document.body?.innerText||'';
    return t.includes('Deschide aplicația')||t.includes('Datele locale nu pot fi deschise')||
      t.toLocaleLowerCase('ro').includes('autonomie');
  },null,{timeout:30000});
  const open=page.getByText('Deschide aplicația',{exact:true});
  if(await open.isVisible())await open.click();
}
async function beginBudget(page,name){
  await page.getByRole('tab',{name:'Mai mult'}).click();
  await page.getByText('Bugete',{exact:true}).last().click();
  await page.getByRole('button',{name:'Configurează primul buget'}).click();
  await page.getByText('Categorie de buget',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('textbox',{name:'Nume'}).fill(name);
  await page.getByRole('textbox',{name:'Limită pentru perioada principală · RON'}).fill('2000');
}
async function injectAtomicPayloadFailure(page){
  await page.evaluate(payload=>{
    const original=Storage.prototype.setItem;
    window.__faTestWrites=[];
    window.__faTestInjected=0;
    Storage.prototype.setItem=function(key,value){
      if(this===localStorage&&key===payload&&window.__faTestInjected++===0){
        // An individual failing setItem leaves the native storage unchanged.
        throw new DOMException('Synthetic atomic payload quota failure','QuotaExceededError');
      }
      if(this===localStorage&&[payload,'financial-autonomy.preview.key.v1',
        'financial-autonomy.preview.reset.v1'].includes(String(key)))
        window.__faTestWrites.push(String(key));
      return original.call(this,key,value);
    };
    window.__faRestoreSet=()=>{Storage.prototype.setItem=original};
  },PAYLOAD);
}
async function failedBudgetSave(page){
  await page.getByRole('button',{name:'Salvează configurația'}).click();
  await page.getByText(/Prima salvare criptată nu a fost confirmată/).first()
    .waitFor({state:'visible',timeout:20000});
  await page.evaluate(()=>window.__faRestoreSet());
  const footprint=await bytes(page);
  assert.match(footprint[0],/^[0-9a-f]{64}$/,'First key must be retained');
  assert.equal(footprint[1],null,'Atomic failed payload write must leave no ciphertext');
  assert.equal(footprint[2],null,'No reset marker may be invented');
  // The editor may remain open after its rejected save. Dismiss only the
  // editor, not the error banner or the local vault.
  await page.getByRole('button',{name:'Renunță',exact:true}).click();
  return footprint;
}
async function caseLiveRetry(browser,url){
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,colorScheme:'light',timezoneId:'Europe/Bucharest'});
  const page=await context.newPage();
  try{
    await openReal(page,url);
    assert.deepEqual(await bytes(page),[null,null,null]);
    await beginBudget(page,'Buget sintetic recuperat');
    await injectAtomicPayloadFailure(page);
    const orphan=await failedBudgetSave(page);
    const retry=page.getByRole('button',{name:'Reîncearcă prima salvare',exact:true});
    await retry.waitFor({state:'visible',timeout:10000});
    const hit=await retry.boundingBox();
    assert.ok(hit&&hit.width>=44&&hit.height>=44,
      'Same-tab retry must have at least a 44x44 CSS px target');
    assert.deepEqual(await bytes(page),orphan,'Displaying retry must not mutate storage');
    await retry.click();
    await page.getByText(/Prima salvare a fost confirmată/).waitFor({state:'visible',timeout:20000});
    const committed=await bytes(page);
    assert.equal(committed[0],orphan[0],'Retry must preserve original AES key');
    assert.ok(committed[1]&&committed[1].length>50,'Retry must commit encrypted payload');
    assert.equal(committed[2],orphan[2]);
    const state=await page.evaluate(async()=>window.__r(309).load());
    assert.ok(state.monthPlans.some(m=>m.budgets?.some(b=>b.name==='Buget sintetic recuperat')),
      'Recovered ciphertext must contain the budget saved by the real editor');
    await openReal(page,url);
    assert.deepEqual(await bytes(page),committed,'Reload must not rewrite recovered ciphertext');
    const reloaded=await page.evaluate(async()=>window.__r(309).load());
    assert.ok(reloaded.monthPlans.some(m=>m.budgets?.some(b=>b.name==='Buget sintetic recuperat')));
    console.log('PASS #35 actual Chromium WEB UI: atomic first-save failure, visible 44px retry, original key, authenticated budget and reload');
  }finally{await context.close();}
}
async function caseReloadBeforeRetry(browser,url){
  const context=await browser.newContext({viewport:{width:320,height:844},
    isMobile:true,hasTouch:true,colorScheme:'dark',timezoneId:'Europe/Bucharest'});
  const page=await context.newPage();
  try{
    await openReal(page,url);
    await beginBudget(page,'Buget sintetic întrerupt');
    await injectAtomicPayloadFailure(page);
    const orphan=await failedBudgetSave(page);
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    await page.getByText(/Nu șterge datele site-ului și nu reseta aplicația/).waitFor({state:'visible'});
    assert.equal(await page.getByRole('button',{name:'Reîncearcă prima salvare'}).count(),0,
      'Reload must not advertise a lost volatile first-save retry token');
    assert.deepEqual(await bytes(page),orphan,'Reload must not clear ambiguous KEY-only state');
    await page.getByRole('button',{name:'Reîncearcă deschiderea'}).click();
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible'});
    assert.deepEqual(await bytes(page),orphan,'Blocked UI retry must be read-only');
    console.log('PASS #35 actual Chromium WEB UI: reload before retry blocks and preserves orphan bytes at 320px dark');
  }finally{await context.close();}
}
// #35: a genuine encrypted payload can survive without its key (for example,
// external deletion). The blocked UI must never treat that ciphertext as a
// fresh installation or erase it. This uses the actual WEB editor and AES-GCM
// rather than a fabricated malformed envelope; all data is synthetic.
async function casePayloadOnlyPreserved(browser,url){
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,colorScheme:'light',timezoneId:'Europe/Bucharest'});
  const page=await context.newPage();
  try{
    await openReal(page,url);
    assert.deepEqual(await bytes(page),[null,null,null]);
    await beginBudget(page,'Buget sintetic cu cheie absentă');
    await page.getByRole('button',{name:'Salvează configurația'}).click();
    await page.waitForFunction(payload=>Boolean(localStorage.getItem(payload)),PAYLOAD,
      {timeout:20000});
    const committed=await bytes(page);
    assert.match(committed[0],/^[0-9a-f]{64}$/,'A real AES key must exist before fault injection');
    assert.ok(committed[1]&&committed[1].length>50,'Real ciphertext must be committed');
    const verified=await page.evaluate(()=>window.__r(310).loadWebVault(localStorage));
    assert.ok(verified.monthPlans.some(m=>m.budgets?.some(b=>
      b.name==='Buget sintetic cu cheie absentă')),
      'Payload must authenticate before deliberate key removal');
    await page.evaluate(key=>localStorage.removeItem(key),KEY);
    const payloadOnly=await bytes(page);
    assert.deepEqual(payloadOnly,[null,committed[1],committed[2]]);
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    assert.equal(await page.getByRole('button',{name:'Reîncearcă prima salvare'}).count(),0,
      'Missing key must not advertise first-save retry');
    assert.deepEqual(await bytes(page),payloadOnly,
      'Blocked load must preserve authenticated ciphertext with missing key');
    await page.getByRole('button',{name:'Reîncearcă deschiderea'}).click();
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await bytes(page),payloadOnly,
      'Blocked UI retry must not delete ciphertext or recreate a key');
    console.log('PASS #35 actual Chromium WEB UI: authenticated PAYLOAD-only vault blocks and preserves ciphertext across reload and retry');
  }finally{await context.close();}
}
// The 120-second in-memory retry is deliberately non-durable. Verify that a
// real Chromium timer expiry revokes authority without deleting the orphan
// key, and that the existing blocked-vault guidance survives a reload.
async function caseExpiryBeforeRetry(browser,url){
  const context=await browser.newContext({viewport:{width:320,height:844},
    isMobile:true,hasTouch:true,colorScheme:'light',timezoneId:'Europe/Bucharest'});
  const page=await context.newPage();
  try{
    await page.clock.install({time:new Date('2026-10-28T10:00:00+02:00')});
    await openReal(page,url);
    await beginBudget(page,'Buget sintetic expirat');
    await injectAtomicPayloadFailure(page);
    const orphan=await failedBudgetSave(page);
    assert.equal(await page.evaluate(()=>window.__r(309).canRetryFirstSave()),true,
      'A live failed first save must initially permit bounded retry');
    await page.clock.fastForward(120001);
    assert.equal(await page.evaluate(()=>window.__r(309).canRetryFirstSave()),false,
      'Actual Chromium timeout must revoke the volatile retry authority');
    assert.deepEqual(await bytes(page),orphan,
      'Expiry must not erase or replace the KEY-only storage footprint');
    const retry=page.getByRole('button',{name:'Reîncearcă prima salvare',exact:true});
    if(await retry.count()&&await retry.isVisible())await retry.click();
    assert.deepEqual(await bytes(page),orphan,
      'An expired visible retry action must fail closed with zero vault writes');
    const result=await page.evaluate(async()=>{
      try{await window.__r(309).retryFirstSave();return 'UNEXPECTED SUCCESS'}
      catch(error){return String(error?.message||error)}
    });
    assert.match(result,/nu mai este disponibilă/,
      'Expired retry must reject rather than create a new vault');
    assert.deepEqual(await bytes(page),orphan,
      'Direct expired retry must not mutate encrypted storage');
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await bytes(page),orphan,
      'Reload after expiry must quarantine the same orphan key');
    console.log('PASS #35 actual Chromium WEB UI: 120s retry expiry revokes authority, preserves KEY-only bytes, reload remains blocked');
  }finally{await context.close();}
}

// A separate real Chromium tab commits a DIFFERENT, authenticated envelope
// under the existing first-save key. The pending first tab must not overwrite
// that ciphertext, even though its own editor still has a pending retry.
async function caseCrossTabAuthenticatedConflict(browser,url){
  const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,colorScheme:'dark',timezoneId:'Europe/Bucharest'});
  const first=await context.newPage();
  let second;
  try{
    await openReal(first,url);
    const cleanState=await first.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await bytes(first),[null,null,null]);
    await beginBudget(first,'Buget sintetic care nu trebuie suprascris');
    await injectAtomicPayloadFailure(first);
    const orphan=await failedBudgetSave(first);
    await first.getByRole('button',{name:'Reîncearcă prima salvare',exact:true})
      .waitFor({state:'visible',timeout:10000});
    second=await context.newPage();
    await openReal(second,url);
    await second.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    // The second tab uses the actual bundled AES-GCM implementation and the
    // native localStorage shared by this disposable browser context.
    const committed=await second.evaluate(({keyName,payloadName,state})=>{
      const keyHex=localStorage.getItem(keyName);
      if(!keyHex||localStorage.getItem(payloadName)!==null)
        throw Error('Expected only the first-save key');
      const key=Uint8Array.from(keyHex.match(/.{2}/g),part=>parseInt(part,16));
      const envelope=window.__r(311).seal(JSON.stringify(state),key,
        size=>crypto.getRandomValues(new Uint8Array(size)));
      localStorage.setItem(payloadName,envelope);
      // Verify the independently committed payload authenticates with the
      // real vault module, rather than relying on a malformed sentinel.
      const loaded=window.__r(310).loadWebVault(localStorage);
      if(JSON.stringify(loaded)!==JSON.stringify(state))
        throw Error('Second-tab ciphertext failed authentication');
      return [localStorage.getItem(keyName),localStorage.getItem(payloadName),
        localStorage.getItem('financial-autonomy.preview.reset.v1')];
    },{keyName:KEY,payloadName:PAYLOAD,state:cleanState});
    assert.equal(committed[0],orphan[0],'Other tab must not replace the first AES key');
    assert.ok(committed[1]&&committed[1].length>50);
    assert.deepEqual(await bytes(first),committed,'First tab must observe the other tab ciphertext');
    await first.getByRole('button',{name:'Reîncearcă prima salvare',exact:true}).click();
    await first.waitForFunction(()=>!window.__r(309).canRetryFirstSave(),null,{timeout:20000});
    assert.deepEqual(await bytes(first),committed,
      'Conflicting first-save retry must never overwrite authenticated other-tab ciphertext');
    await openReal(first,url);
    assert.deepEqual(await bytes(first),committed,'Reload must preserve the other tab ciphertext');
    const after=await first.evaluate(async()=>window.__r(309).load());
    assert.equal(after.monthPlans?.some(m=>m.budgets?.some(b=>
      b.name==='Buget sintetic care nu trebuie suprascris')),false,
      'Failed first-tab budget must not appear as a successful save');
    console.log('PASS #35 actual Chromium WEB UI: authenticated second-tab ciphertext wins, first-tab retry refuses overwrite and reload preserves it');
  }finally{
    if(second)await second.close();
    await context.close();
  }
}
// Browser-backed lifecycle guard: events are injected deterministically.
// These are NOT physical tab backgrounding, navigation or Safari tests.
// The UI may still render a stale retry button, but the vault authority must
// be revoked immediately and any attempted retry must remain write-free.
async function caseLifecycleRevokesRetry(browser,url,kind){
  assert.ok(['visibilitychange','pagehide'].includes(kind));
  const context=await browser.newContext({viewport:{width:320,height:844},
    isMobile:true,hasTouch:true,colorScheme:'dark',timezoneId:'Europe/Bucharest'});
  const page=await context.newPage();
  try{
    await openReal(page,url);
    await beginBudget(page,'Buget sintetic lifecycle '+kind);
    await injectAtomicPayloadFailure(page);
    const orphan=await failedBudgetSave(page);
    assert.equal(await page.evaluate(()=>window.__r(309).canRetryFirstSave()),true,
      'A live first-save failure must initially retain a bounded retry token');
    await page.evaluate(type=>{
      if(type==='visibilitychange'){
        // Browser visibility is normally read-only. Override only inside
        // this disposable test document to inject the hidden lifecycle edge.
        Object.defineProperty(document,'visibilityState',{
          configurable:true,get:()=> 'hidden'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }else{
        window.dispatchEvent(new Event('pagehide'));
      }
    },kind);
    assert.equal(await page.evaluate(()=>window.__r(309).canRetryFirstSave()),false,
      kind+' must invalidate the volatile first-save retry immediately');
    assert.deepEqual(await bytes(page),orphan,
      kind+' must not mutate the ambiguous KEY-only vault footprint');
    const result=await page.evaluate(async()=>{
      try{await window.__r(309).retryFirstSave();return 'UNEXPECTED SUCCESS'}
      catch(error){return String(error?.message||error)}
    });
    assert.match(result,/nu mai este disponibilă/,
      kind+' must reject a direct retry after lifecycle invalidation');
    assert.deepEqual(await bytes(page),orphan,
      kind+' rejected retry must never write ciphertext or delete the key');
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await bytes(page),orphan,
      kind+' reload must preserve the same blocked KEY-only bytes');
    console.log('PASS #35 actual Chromium WEB UI: synthetic '+kind+
      ' revokes first-save retry; KEY-only remains unchanged and blocked after reload');
  }finally{await context.close();}
}

(async()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const version=html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/)?.[1];
  const script=html.match(/<script src="([^"]+)" defer>/)?.[1];
  assert.ok(version&&script,'Active release metadata and script required');
  const parsed=new URL(script,'http://localhost');
  assert.ok(parsed.pathname.startsWith(PREFIX),'Script must use the preview path prefix');
  assert.ok(parsed.pathname.includes('index-v0'+version.replace('.','')+'-'),
    'Immutable bundle name must match active version');
  assert.ok(fs.existsSync(path.resolve(ROOT,parsed.pathname.slice(PREFIX.length))),
    'Active immutable bundle must exist');
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    await caseLiveRetry(browser,url);
    await caseReloadBeforeRetry(browser,url);
    await casePayloadOnlyPreserved(browser,url);
    await caseExpiryBeforeRetry(browser,url);
    await caseLifecycleRevokesRetry(browser,url,'visibilitychange');
    await caseLifecycleRevokesRetry(browser,url,'pagehide');
    await caseCrossTabAuthenticatedConflict(browser,url);
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
