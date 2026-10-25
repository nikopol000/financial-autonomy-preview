'use strict';
// Chromium/Playwright acceptance against the ACTUAL active WEB bundle, not Node VM.
// Runs only on disposable localhost browser contexts with synthetic empty state.
// No production origin, user profile, real ledger, or backup file is accessed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const PASSWORD = 'SyntheticBrowserBackup!2026';
const prefix = '/financial-autonomy-preview/';
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon'};

// One deliberately populated, synthetic v4 ledger. The independent Node AES-GCM
// writer is consumed by the ACTUAL browser vault reader, testing interoperability.
// These names and amounts are fixtures, never user data.
function syntheticLedger() {
  const date = new Date().toISOString().slice(0,10);
  return {
    version:4,names:[],nameChanges:[],rolesEffectiveFrom:date,
    balanceChecks:[],checkAudit:[],currency:'RON',started:date,
    accounts:[{id:'synthetic-checking-browser',name:'Cont sintetic browser',kind:'current',opening:123456,date}],
    incomes:[],expenses:[],debts:[],recurring:[],
    transactions:[{id:'synthetic-expense-browser',name:'Cheltuială sintetică browser',
      kind:'expense',accountId:'synthetic-checking-browser',amount:1250,date,details:[]}],
    monthPlans:[{month:date.slice(0,7),budgets:[],expenses:[],debtPayments:[],contribution:0}],
    goals:[],plans:[],reviews:{},audit:[]
  };
}
function encryptSyntheticLedger(state) {
  const key=crypto.randomBytes(32),nonce=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);
  const data=Buffer.concat([cipher.update(JSON.stringify(state),'utf8'),cipher.final(),cipher.getAuthTag()]);
  return {key:key.toString('hex'),payload:JSON.stringify({v:1,nonce:nonce.toString('hex'),data:data.toString('hex')}),reset:null};
}
function decryptBrowserVault(bytes) {
  const envelope=JSON.parse(bytes.payload);
  assert.equal(envelope.v,1);
  const raw=Buffer.from(envelope.data,'hex');
  const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(bytes.key,'hex'),Buffer.from(envelope.nonce,'hex'));
  decipher.setAuthTag(raw.subarray(-16));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(0,-16)),decipher.final()]).toString('utf8'));
}

function serve(req,res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const relative = pathname === '/' || pathname === prefix || pathname === prefix.slice(0,-1)
    ? 'index.html'
    : pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  if (!relative) {res.writeHead(404);res.end('Not found');return;}
  const absolute = path.resolve(ROOT,relative);
  if (!absolute.startsWith(ROOT+path.sep) && absolute !== path.join(ROOT,'index.html')) {
    res.writeHead(403);res.end('Forbidden');return;
  }
  fs.readFile(absolute,(error,body)=>{
    if(error){res.writeHead(404);res.end('Not found: '+relative);return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(absolute)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  });
}
function vaultBytes(page) {
  return page.evaluate(([key,payload,reset])=>({
    key:localStorage.getItem(key),
    payload:localStorage.getItem(payload),
    reset:localStorage.getItem(reset)
  }),[KEY,PAYLOAD,RESET]);
}
async function openReal(page,url) {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  // Existing v18.45 sessions can auto-open on mount. A blocked vault displays
  // its error directly; a fresh vault may instead show the launch button.
  await page.waitForFunction(()=> {
    const body=(document.body?.innerText||'').toLocaleLowerCase('ro');
    return body.includes('deschide aplicația') ||
      body.includes('datele locale nu pot fi deschise') ||
      body.includes('autonomie');
  },null,{timeout:25000});
  const start=page.getByText('Deschide aplicația',{exact:true});
  if(await start.isVisible())await start.click();
}
async function toolsScreen(page) {
  await page.getByRole('tab',{name:/Mai mult/}).click();
  await page.getByText('Instrumente',{exact:true}).click();
  await page.getByText('Backup criptat',{exact:true}).waitFor({state:'visible',timeout:15000});
}
async function filePicker(page,bytes) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser',{timeout:15000}),
    page.getByText('Verifică și restaurează backup',{exact:true}).click()
  ]);
  await chooser.setFiles({name:'synthetic-financial-autonomy.backup.json',mimeType:'application/json',buffer:bytes});
}
async function run() {
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+prefix+'?fa_real=1';
  let browser, activePage;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    // This is real Chromium localStorage + Web Locks at a localhost secure context.
    const blocked=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:'dark'});
    await blocked.addInitScript(([key,value])=>{localStorage.setItem(key,value)},[KEY,'a'.repeat(64)]);
    const orphan=await blocked.newPage();activePage=orphan;
    await openReal(orphan,url);
    await orphan.getByText('Datele locale nu pot fi deschise',{exact:true}).waitFor({state:'visible',timeout:15000});
    await orphan.getByText(/Nu șterge datele site-ului și nu reseta aplicația/).waitFor({state:'visible'});
    await orphan.getByText(/această pagină nu poate restaura datele cât timp seiful este blocat/).waitFor({state:'visible'});
    const beforeOrphan=await vaultBytes(orphan);
    assert.deepEqual(beforeOrphan,{key:'a'.repeat(64),payload:null,reset:null});
    await orphan.getByText('Reîncearcă deschiderea',{exact:true}).click();
    await orphan.getByText('Datele locale nu pot fi deschise',{exact:true}).waitFor({state:'visible'});
    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Retry must not modify orphan key or invent payload');
    console.log('PASS Chromium dark mobile: blocked KEY-only vault warns, retry preserves every vault byte');

    const sourceContext=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const source=await sourceContext.newPage();activePage=source;
    await openReal(source,url);
    await source.getByText(/^autonomie$/i).first().waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await vaultBytes(source),{key:null,payload:null,reset:null});
    await toolsScreen(source);
    const passwords=source.locator('input[type="password"]');
    assert.ok(await passwords.count()>=2,'Backup UI must expose two password fields');
    await passwords.nth(0).fill(PASSWORD);
    await passwords.nth(1).fill(PASSWORD);
    const [download]=await Promise.all([
      source.waitForEvent('download',{timeout:60000}),
      source.getByText('Exportă backup criptat',{exact:true}).click()
    ]);
    const backupBytes=await fs.promises.readFile(await download.path());
    const envelope=JSON.parse(backupBytes.toString('utf8'));
    assert.equal(envelope.format,'FinancialAutonomy');
    assert.equal(envelope.version,1);
    assert.equal(envelope.iterations,600000);
    assert.ok(!backupBytes.toString('utf8').includes('"accounts":['),'Portable backup must be encrypted');
    assert.deepEqual(await vaultBytes(source),{key:null,payload:null,reset:null},'Export alone must not initialize local vault');
    console.log('PASS Chromium mobile: actual UI exports AES-GCM/PBKDF2 password backup from synthetic empty real state');

    const targetContext=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const target=await targetContext.newPage();activePage=target;
    await openReal(target,url);
    await target.getByText(/^autonomie$/i).first().waitFor({state:'visible',timeout:20000});
    await toolsScreen(target);
    const restorePassword=target.locator('input[type="password"]').first();
    await restorePassword.fill('IncorrectBrowserPassword!');
    await filePicker(target,backupBytes);
    await target.getByText(/Parolă greșită sau backup deteriorat/).waitFor({state:'visible',timeout:60000});
    assert.deepEqual(await vaultBytes(target),{key:null,payload:null,reset:null},'Wrong password must not write a vault');
    await restorePassword.fill(PASSWORD);
    await filePicker(target,backupBytes);
    await target.getByText(/Backup valid: 0 conturi și 0 operațiuni/).waitFor({state:'visible',timeout:60000});
    assert.deepEqual(await vaultBytes(target),{key:null,payload:null,reset:null},'Validation alone must not replace storage');
    await target.getByText('Confirm înlocuirea datelor',{exact:true}).click();
    await target.getByText('Backup restaurat.',{exact:true}).waitFor({state:'visible',timeout:20000});
    const restored=await vaultBytes(target);
    assert.match(restored.key,/^[0-9a-f]{64}$/);
    assert.ok(restored.payload && restored.payload.length>50);
    assert.equal(restored.reset,null);
    await openReal(target,url);
    await target.getByText(/^autonomie$/i).first().waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await vaultBytes(target),restored,'Restored ciphertext must survive reload without rewrite');
    assert.deepEqual(await vaultBytes(source),{key:null,payload:null,reset:null},'Exporting profile must stay isolated');
    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Blocked profile must stay byte-identical');
    console.log('PASS Chromium mobile: wrong password no-write, validated file picker, explicit restore, reload, isolated profiles');
    // Populate an independent, disposable browser origin with one account and
    // one expense, then let the actual application load/decrypt/validate it.
    // Unlike addInitScript, this seed is written ONCE and cannot mask reload bugs.
    const populatedContext=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
    const populated=await populatedContext.newPage();activePage=populated;
    await openReal(populated,url);
    const fixture=syntheticLedger(),seed=encryptSyntheticLedger(fixture);
    await populated.evaluate(([key,payload,seed])=>{
      localStorage.setItem(key,seed.key);
      localStorage.setItem(payload,seed.payload);
    },[KEY,PAYLOAD,seed]);
    await openReal(populated,url);
    await populated.getByText(/^autonomie$/i).first().waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await vaultBytes(populated),seed,'Loading the populated fixture must not rewrite its ciphertext');
    await toolsScreen(populated);
    const populatedPasswords=populated.locator('input[type="password"]');
    assert.ok(await populatedPasswords.count()>=2);
    await populatedPasswords.nth(0).fill(PASSWORD);
    await populatedPasswords.nth(1).fill(PASSWORD);
    const [populatedDownload]=await Promise.all([
      populated.waitForEvent('download',{timeout:60000}),
      populated.getByText('Exportă backup criptat',{exact:true}).click()
    ]);
    const populatedBackup=await fs.promises.readFile(await populatedDownload.path());
    assert.ok(!populatedBackup.toString('utf8').includes('Cont sintetic browser'),'Account name must not leak in password backup');
    assert.ok(!populatedBackup.toString('utf8').includes('Cheltuială sintetică browser'),'Expense name must not leak in password backup');
    assert.deepEqual(await vaultBytes(populated),seed,'Export must not rewrite populated source vault');
    console.log('PASS Chromium dark mobile: real bundle loads one synthetic account and expense; password export leaves ciphertext intact');

    const populatedTargetContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const populatedTarget=await populatedTargetContext.newPage();activePage=populatedTarget;
    await openReal(populatedTarget,url);
    await toolsScreen(populatedTarget);
    const targetPassword=populatedTarget.locator('input[type="password"]').first();
    await targetPassword.fill(PASSWORD);
    await filePicker(populatedTarget,populatedBackup);
    await populatedTarget.getByText(/Backup valid: 1 conturi și 1 operațiuni/).waitFor({state:'visible',timeout:60000});
    assert.deepEqual(await vaultBytes(populatedTarget),{key:null,payload:null,reset:null},'Validating populated backup must not write');
    await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).click();
    await populatedTarget.getByText('Backup restaurat.',{exact:true}).waitFor({state:'visible',timeout:20000});
    const populatedRestored=await vaultBytes(populatedTarget);
    const decrypted=decryptBrowserVault(populatedRestored);
    assert.equal(decrypted.accounts.length,1);
    assert.equal(decrypted.transactions.length,1);
    assert.equal(decrypted.accounts[0].id,fixture.accounts[0].id);
    assert.equal(decrypted.accounts[0].opening,123456);
    assert.equal(decrypted.transactions[0].id,fixture.transactions[0].id);
    assert.equal(decrypted.transactions[0].amount,1250);
    assert.equal(decrypted.transactions[0].accountId,fixture.accounts[0].id);
    await openReal(populatedTarget,url);
    await populatedTarget.getByText(/^autonomie$/i).first().waitFor({state:'visible',timeout:20000});
    assert.deepEqual(await vaultBytes(populatedTarget),populatedRestored,'Populated restored vault must persist byte-identically across reload');
    assert.deepEqual(await vaultBytes(populated),seed,'Populated source must remain byte-identical after target restore');
    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Orphan profile must remain byte-identical after populated restore');
    console.log('PASS Chromium light mobile: real UI validates 1 account/1 expense, restores encrypted ledger, reloads and isolates profiles');

    // Two real Chromium tabs on the SAME origin. These calls go through the
    // actual bundled platform module 309, including its revision guard and
    // navigator.locks, rather than a simulated lock or synthetic Node storage.
    const tabsContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
    const tabA=await tabsContext.newPage();activePage=tabA;
    await openReal(tabA,url);
    const tabSeed=encryptSyntheticLedger(syntheticLedger());
    await tabA.evaluate(([key,payload,seed])=>{
      localStorage.setItem(key,seed.key);
      localStorage.setItem(payload,seed.payload);
    },[KEY,PAYLOAD,tabSeed]);
    await openReal(tabA,url);
    const tabB=await tabsContext.newPage();activePage=tabB;
    await openReal(tabB,url);
    const loadedA=await tabA.evaluate(async()=>window.__r(309).load());
    const loadedB=await tabB.evaluate(async()=>window.__r(309).load());
    assert.equal(loadedA.transactions.length,1);
    assert.equal(loadedB.transactions.length,1);
    assert.equal(await tabA.evaluate(()=>typeof navigator.locks?.request),'function','Chromium must expose real Web Locks');
    const addSyntheticExpense=(state,id)=>{
      const next=structuredClone(state);
      next.transactions.push({id,name:'Browser multi-tab synthetic expense',kind:'expense',
        accountId:'synthetic-checking-browser',amount:250,date:state.started,details:[]});
      return next;
    };
    const a1=addSyntheticExpense(loadedA,'tab-a-1');
    await tabA.evaluate(async state=>window.__r(309).save(state),a1);
    const savedA=await vaultBytes(tabA);
    assert.equal(decryptBrowserVault(savedA).transactions.length,2);
    const bStale=await tabB.evaluate(async state=>{
      try {await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },addSyntheticExpense(loadedB,'tab-b-stale'));
    assert.match(bStale,/altă filă/,'Stale tab must receive a clear conflict');
    assert.deepEqual(await vaultBytes(tabB),savedA,'Rejected stale tab must make zero writes');
    const a2=addSyntheticExpense(a1,'tab-a-2');
    await tabA.evaluate(async state=>window.__r(309).save(state),a2);
    assert.equal(decryptBrowserVault(await vaultBytes(tabA)).transactions.length,3,
      'Same tab must be allowed a second save after updating its revision');
    await openReal(tabB,url);
    const bFresh=await tabB.evaluate(async()=>window.__r(309).load());
    assert.equal(bFresh.transactions.length,3);
    await tabB.evaluate(async state=>window.__r(309).save(state),
      addSyntheticExpense(bFresh,'tab-b-fresh'));
    const savedB=await vaultBytes(tabB);
    assert.equal(decryptBrowserVault(savedB).transactions.length,4);
    const staleReset=await tabA.evaluate(async()=>{
      try {await window.__r(309).resetData();return 'UNEXPECTED_RESET'}
      catch(error){return String(error.message)}
    });
    assert.match(staleReset,/altă filă/,'Stale reset must not erase another tab’s work');
    assert.deepEqual(await vaultBytes(tabA),savedB);
    console.log('PASS Chromium same-origin two tabs: stale save/reset reject with zero writes; repeat and refreshed saves preserve all transactions');

    // Hold the ACTUAL Web Lock in tab A, then request a save in tab B.
    // Its ciphertext must remain byte-identical until the lock is released.
    await openReal(tabA,url);
    await tabA.evaluate(async()=>window.__r(309).load());
    await openReal(tabB,url);
    const bBeforeLock=await tabB.evaluate(async()=>window.__r(309).load());
    await tabA.evaluate(()=>{
      window.__faLockHeld=false;
      window.__faLockError=null;
      navigator.locks.request('financial-autonomy.preview.vault.v1',{mode:'exclusive'},async()=>{
        window.__faLockHeld=true;
        await new Promise(resolve=>{window.__faReleaseLock=resolve});
      }).catch(error=>{window.__faLockError=String(error)});
    });
    await tabA.waitForFunction(()=>window.__faLockHeld===true,{timeout:10000});
    await tabB.evaluate(state=>{
      window.__faSaveResult='pending';
      window.__r(309).save(state).then(
        ()=>{window.__faSaveResult='saved'},
        error=>{window.__faSaveResult='error:'+error.message}
      );
    },addSyntheticExpense(bBeforeLock,'tab-b-after-lock'));
    await new Promise(resolve=>setTimeout(resolve,250));
    assert.equal(await tabB.evaluate(()=>window.__faSaveResult),'pending',
      'Save should wait for the exclusive Web Lock');
    assert.deepEqual(await vaultBytes(tabB),savedB,'Queued save must not write before acquiring lock');
    await tabA.evaluate(()=>window.__faReleaseLock());
    await tabB.waitForFunction(()=>window.__faSaveResult!=='pending',null,{timeout:15000});
    assert.equal(await tabB.evaluate(()=>window.__faSaveResult),'saved');
    const afterLock=await vaultBytes(tabB);
    assert.equal(decryptBrowserVault(afterLock).transactions.length,5);
    assert.equal(await tabA.evaluate(()=>window.__faLockError),null);
    console.log('PASS Chromium Web Locks: second tab waits, then commits authenticated ledger after exclusive lock release');

    // A browser lacking Web Locks must reject BOTH save and reset without
    // touching the real encrypted pair. Restore the browser API afterward.
    await tabB.evaluate(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:undefined}));
    const noLock=await tabB.evaluate(async state=>{
      const result={};
      try {await window.__r(309).save(state);result.save='UNEXPECTED_SAVE'}
      catch(error){result.save=String(error.message)}
      try {await window.__r(309).resetData();result.reset='UNEXPECTED_RESET'}
      catch(error){result.reset=String(error.message)}
      return result;
    },addSyntheticExpense(bBeforeLock,'tab-b-no-lock'));
    assert.match(noLock.save,/Web Locks/);
    assert.match(noLock.reset,/Web Locks/);
    assert.deepEqual(await vaultBytes(tabB),afterLock,'No-Web-Locks fallback must never write');
    await tabB.evaluate(()=>{delete navigator.locks});
    console.log('PASS Chromium missing Web Locks: save and reset fail closed without changing encrypted data');

    // Deliberately interrupt the SECOND reset deletion (KEY) in tab A.
    // The committed reset marker must survive, and a real reload must finish
    // the intentional deletion without reviving the old transactions.
    await openReal(tabA,url);
    await tabA.evaluate(async()=>window.__r(309).load());
    await tabA.evaluate(key=>{
      const original=Storage.prototype.removeItem;
      Storage.prototype.removeItem=function(name){
        if(name===key)throw new DOMException('Synthetic key removal denied','SecurityError');
        return original.call(this,name);
      };
      window.__faRestoreRemove=()=>{Storage.prototype.removeItem=original};
    },KEY);
    const interrupted=await tabA.evaluate(async()=>{
      try {await window.__r(309).resetData();return 'UNEXPECTED_RESET'}
      catch(error){return String(error.message)}
    });
    assert.match(interrupted,/Resetarea a fost întreruptă/);
    const interruptedBytes=await vaultBytes(tabA);
    assert.equal(interruptedBytes.reset,'committed-v1');
    assert.equal(interruptedBytes.payload,null);
    assert.match(interruptedBytes.key,/^[0-9a-f]{64}$/);
    await tabA.evaluate(()=>window.__faRestoreRemove());
    await openReal(tabA,url);
    await tabA.evaluate(async()=>window.__r(309).load());
    const erased={key:null,payload:null,reset:null};
    assert.deepEqual(await vaultBytes(tabA),erased,'Reload must finish committed reset and remove journal');
    const staleAfterReset=await tabB.evaluate(async state=>{
      try {await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },addSyntheticExpense(bBeforeLock,'tab-b-after-reset'));
    assert.match(staleAfterReset,/altă filă/);
    assert.deepEqual(await vaultBytes(tabA),erased,'Stale tab must not resurrect data after reset');
    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Independent orphan profile must remain untouched');
    assert.deepEqual(await vaultBytes(populated),seed,'Independent populated source profile must remain untouched');
    console.log('PASS Chromium interrupted committed reset: reload completes deletion, stale tab cannot resurrect ledger, other profiles unchanged');

    // Fault matrix uses only fresh, disposable Chromium contexts and the
    // actual bundled vault/platform modules. No browser user profile is reused.
    const faultContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const faultPage=await faultContext.newPage();activePage=faultPage;
    await openReal(faultPage,url);
    const faultSeed=encryptSyntheticLedger(syntheticLedger());
    await faultPage.evaluate(([key,payload,seed])=>{
      localStorage.setItem(key,seed.key);
      localStorage.setItem(payload,seed.payload);
    },[KEY,PAYLOAD,faultSeed]);
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(faultPage),faultSeed);

    // Denied journal commit must not start deleting either encrypted entry.
    await faultPage.evaluate(reset=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===reset)throw new DOMException('Synthetic reset marker write denied','SecurityError');
        return original.call(this,name,value);
      };
      window.__restoreFaultSet=()=>{Storage.prototype.setItem=original};
    },RESET);
    const markerDenied=await faultPage.evaluate(async()=>{
      try{await window.__r(309).resetData();return 'UNEXPECTED_RESET'}
      catch(error){return String(error.message)}
    });
    assert.match(markerDenied,/Synthetic reset marker write denied/);
    await faultPage.evaluate(()=>window.__restoreFaultSet());
    assert.deepEqual(await vaultBytes(faultPage),faultSeed,
      'Marker write failure must leave original key/payload byte-identical and no reset marker');
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(faultPage),faultSeed,'Marker failure reload must retain encrypted ledger');
    console.log('PASS Chromium reset marker write denied: fail closed, zero deletion, reload retains authenticated ledger');

    // Denied FIRST deletion after a committed journal must preserve ciphertext
    // until a later reload completes the intentional reset.
    await faultPage.evaluate(payload=>{
      const original=Storage.prototype.removeItem;
      Storage.prototype.removeItem=function(name){
        if(name===payload)throw new DOMException('Synthetic payload deletion denied','SecurityError');
        return original.call(this,name);
      };
      window.__restoreFaultRemove=()=>{Storage.prototype.removeItem=original};
    },PAYLOAD);
    const payloadDenied=await faultPage.evaluate(async()=>{
      try{await window.__r(309).resetData();return 'UNEXPECTED_RESET'}
      catch(error){return String(error.message)}
    });
    assert.match(payloadDenied,/Resetarea a fost întreruptă/);
    const pendingReset=await vaultBytes(faultPage);
    assert.equal(pendingReset.reset,'committed-v1');
    assert.equal(pendingReset.key,faultSeed.key);
    assert.equal(pendingReset.payload,faultSeed.payload);
    await faultPage.evaluate(()=>window.__restoreFaultRemove());
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    const cleared={key:null,payload:null,reset:null};
    assert.deepEqual(await vaultBytes(faultPage),cleared);
    await faultPage.evaluate(async()=>window.__r(309).resetData());
    assert.deepEqual(await vaultBytes(faultPage),cleared,'Repeated reset must be idempotent');
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(faultPage),cleared);
    console.log('PASS Chromium payload removal denied: committed journal survives, reload completes reset, repeated reset idempotent');

    // Read permission faults must block both loading and saving; no attempt to
    // guess whether ciphertext was removed or to rewrite it is permitted.
    const readContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
    const readPage=await readContext.newPage();activePage=readPage;
    await openReal(readPage,url);
    const readSeed=encryptSyntheticLedger(syntheticLedger());
    await readPage.evaluate(([key,payload,seed])=>{
      localStorage.setItem(key,seed.key);
      localStorage.setItem(payload,seed.payload);
    },[KEY,PAYLOAD,readSeed]);
    await openReal(readPage,url);
    const readState=await readPage.evaluate(async()=>window.__r(309).load());
    await readPage.evaluate(payload=>{
      const original=Storage.prototype.getItem;
      Storage.prototype.getItem=function(name){
        if(name===payload)throw new DOMException('Synthetic localStorage read denied','SecurityError');
        return original.call(this,name);
      };
      window.__restoreFaultGet=()=>{Storage.prototype.getItem=original};
    },PAYLOAD);
    const readDenied=await readPage.evaluate(async state=>{
      const result={};
      try{await window.__r(309).load();result.load='UNEXPECTED_LOAD'}
      catch(error){result.load=String(error.message)}
      try{await window.__r(309).save(state);result.save='UNEXPECTED_SAVE'}
      catch(error){result.save=String(error.message)}
      return result;
    },readState);
    assert.match(readDenied.load,/Synthetic localStorage read denied/);
    assert.match(readDenied.save,/Synthetic localStorage read denied/);
    await readPage.evaluate(()=>window.__restoreFaultGet());
    assert.deepEqual(await vaultBytes(readPage),readSeed,'Read-denied load/save must never mutate ciphertext');
    assert.equal((await readPage.evaluate(async()=>window.__r(309).load())).transactions.length,1);
    assert.deepEqual(await vaultBytes(readPage),readSeed,'Read permission recovery must not rewrite data');
    console.log('PASS Chromium storage read denied: load/save fail closed; restored permission reads original ledger without writes');


    // Reset-marker READ denial is distinct from a payload read fault. A denied
    // marker read must not be interpreted as an absent marker, nor permit a
    // save/reset to proceed. No real user profile is involved.
    await readPage.evaluate(reset=>{
      const original=Storage.prototype.getItem;
      Storage.prototype.getItem=function(name){
        if(name===reset)throw new DOMException('Synthetic reset journal read denied','SecurityError');
        return original.call(this,name);
      };
      window.__restoreResetRead=()=>{Storage.prototype.getItem=original};
    },RESET);
    const resetReadDenied=await readPage.evaluate(async state=>{
      const result={};
      for(const [name,action] of [
        ['load',()=>window.__r(309).load()],
        ['save',()=>window.__r(309).save(state)],
        ['reset',()=>window.__r(309).resetData()]
      ]){
        try{await action();result[name]='UNEXPECTED_SUCCESS'}
        catch(error){result[name]=String(error.message)}
      }
      return result;
    },readState);
    assert.match(resetReadDenied.load,/Synthetic reset journal read denied/);
    assert.match(resetReadDenied.save,/Synthetic reset journal read denied/);
    assert.match(resetReadDenied.reset,/Synthetic reset journal read denied/);
    await readPage.evaluate(()=>window.__restoreResetRead());
    assert.deepEqual(await vaultBytes(readPage),readSeed,'Denied journal reads must not write/delete encrypted bytes');
    assert.equal((await readPage.evaluate(async()=>window.__r(309).load())).transactions.length,1);
    assert.deepEqual(await vaultBytes(readPage),readSeed,'Permission recovery must not rewrite the vault');
    console.log('PASS Chromium reset journal read denied: load/save/reset fail closed; permission recovery preserves ciphertext');

    // A future-version, corrupt or otherwise unknown reset marker is NOT an
    // instruction to erase the vault. The current version must preserve it
    // byte-for-byte and refuse load/save/reset until a compatible reader exists.
    await readPage.evaluate(reset=>localStorage.setItem(reset,'future-or-corrupt-marker-v9'),RESET);
    const unknownBefore=await vaultBytes(readPage);
    assert.equal(unknownBefore.reset,'future-or-corrupt-marker-v9');
    const unknownMarker=await readPage.evaluate(async state=>{
      const result={};
      for(const [name,action] of [
        ['load',()=>window.__r(309).load()],
        ['save',()=>window.__r(309).save(state)],
        ['reset',()=>window.__r(309).resetData()]
      ]){
        try{await action();result[name]='UNEXPECTED_SUCCESS'}
        catch(error){result[name]=String(error.message)}
      }
      return result;
    },readState);
    assert.match(unknownMarker.load,/Marcaj de resetare necunoscut/);
    assert.match(unknownMarker.save,/Resetarea locală este în curs/);
    assert.match(unknownMarker.reset,/Resetarea locală este în curs/);
    assert.deepEqual(await vaultBytes(readPage),unknownBefore,'Unknown journal must never delete or rewrite the vault');
    await openReal(readPage,url);
    await readPage.getByText('Datele locale nu pot fi deschise',{exact:true}).waitFor({state:'visible'});
    assert.deepEqual(await vaultBytes(readPage),unknownBefore,'Unknown journal must remain intact after a real reload');
    assert.deepEqual(await vaultBytes(populated),seed,'Unknown journal must not affect another browser profile');
    console.log('PASS Chromium unknown reset journal: load/save/reset refuse, reload retains marker and encrypted ledger');

    // The known first-save flaw is a characterization, NOT a repair: if the
    // first payload write fails, the key remains and reload must refuse to
    // create a new ledger. Never auto-delete the ambiguous orphan key.
    const firstContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const firstPage=await firstContext.newPage();activePage=firstPage;
    await openReal(firstPage,url);
    const firstState=await firstPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(firstPage),cleared);
    await firstPage.evaluate(payload=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===payload)throw new DOMException('Synthetic first payload quota failure','QuotaExceededError');
        return original.call(this,name,value);
      };
      window.__restoreFirstSet=()=>{Storage.prototype.setItem=original};
    },PAYLOAD);
    const firstError=await firstPage.evaluate(async state=>{
      try{await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },firstState);
    assert.match(firstError,/nu a putut salva datele local/);
    await firstPage.evaluate(()=>window.__restoreFirstSet());
    const orphanAfterFirst=await vaultBytes(firstPage);
    assert.match(orphanAfterFirst.key,/^[0-9a-f]{64}$/);
    assert.equal(orphanAfterFirst.payload,null);
    assert.equal(orphanAfterFirst.reset,null);
    await openReal(firstPage,url);
    await firstPage.getByText('Datele locale nu pot fi deschise',{exact:true}).waitFor({state:'visible'});
    assert.deepEqual(await vaultBytes(firstPage),orphanAfterFirst);
    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Independent blocked profile must stay untouched');
    assert.deepEqual(await vaultBytes(populated),seed,'Independent populated profile must stay untouched');
    console.log('PASS Chromium KNOWN UNSAFE first-save payload quota fault: orphan key persists; reload blocks instead of overwriting');
  } catch(error) {
    if(activePage) {
      try {
        console.error('Browser screen excerpt:',(await activePage.locator('body').innerText()).slice(0,1400));
        await activePage.screenshot({path:'browser-vault-smoke-failure.png',fullPage:true});
      } catch(ignore) {}
    }
    throw error;
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1});
