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
    await orphan.getByText(/reîncercarea deschiderii nu le poate recrea/).waitFor({state:'visible'});
    await orphan.getByText(/Acest ecran nu poate restaura un backup/).waitFor({state:'visible'});
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
    // A validated file is only a pending proposal. A later password edit or
    // invalid replacement file must revoke it; otherwise Confirm could apply
    // a different backup from the one most recently selected.
    const pendingBefore=await vaultBytes(populatedTarget);
    await targetPassword.fill('IncorrectBrowserPassword!');
    assert.equal(await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).count(),0,
      'Changing backup password must revoke the previously validated candidate');
    await filePicker(populatedTarget,populatedBackup);
    await populatedTarget.getByText(/Parolă greșită sau backup deteriorat/).waitFor({state:'visible',timeout:60000});
    assert.equal(await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).count(),0);
    assert.deepEqual(await vaultBytes(populatedTarget),pendingBefore,'Wrong password must not write');
    await targetPassword.fill(PASSWORD);
    const validEnvelope=JSON.parse(populatedBackup.toString('utf8'));
    await filePicker(populatedTarget,Buffer.from(JSON.stringify({...validEnvelope,version:2})));
    await populatedTarget.getByText(/Backup incompatibil sau deteriorat/).waitFor({state:'visible',timeout:60000});
    assert.equal(await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).count(),0);
    assert.deepEqual(await vaultBytes(populatedTarget),pendingBefore,'Unsupported format must not write');
    const badCipher={...validEnvelope,
      data:(validEnvelope.data[0]==='0'?'1':'0')+validEnvelope.data.slice(1)};
    await filePicker(populatedTarget,Buffer.from(JSON.stringify(badCipher)));
    await populatedTarget.getByText(/Parolă greșită sau backup deteriorat/).waitFor({state:'visible',timeout:60000});
    assert.equal(await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).count(),0);
    assert.deepEqual(await vaultBytes(populatedTarget),pendingBefore,'Tampered ciphertext must not write');
    await filePicker(populatedTarget,populatedBackup);
    await populatedTarget.getByText(/Backup valid: 1 conturi și 1 operațiuni/).waitFor({state:'visible',timeout:60000});
    await populatedTarget.getByText('Renunță la restaurare',{exact:true}).click();
    assert.equal(await populatedTarget.getByText('Confirm înlocuirea datelor',{exact:true}).count(),0,
      'Explicit cancellation must revoke the pending backup');
    assert.deepEqual(await vaultBytes(populatedTarget),pendingBefore,'Cancellation must not write');
    // Successful validation intentionally clears the password field. Re-enter
    // it after cancelling before selecting the file again.
    await targetPassword.fill(PASSWORD);
    await filePicker(populatedTarget,populatedBackup);
    await populatedTarget.getByText(/Backup valid: 1 conturi și 1 operațiuni/).waitFor({state:'visible',timeout:60000});
    console.log('PASS Chromium actual WEB backup: password edit, wrong password, unsupported schema, tamper and cancel revoke candidate with zero writes');
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
    assert.match(interruptedBytes.reset,/^pending-v2:[0-9a-f]{32}$/);
    assert.equal(interruptedBytes.payload,null);
    assert.match(interruptedBytes.key,/^[0-9a-f]{64}$/);
    await tabA.evaluate(()=>window.__faRestoreRemove());
    await openReal(tabA,url);
    await tabA.evaluate(async()=>window.__r(309).load());
    const erased=await vaultBytes(tabA);
    assert.equal(erased.key,null);assert.equal(erased.payload,null);
    assert.match(erased.reset,/^idle-v2:[0-9a-f]{32}$/);
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
    assert.match(pendingReset.reset,/^pending-v2:[0-9a-f]{32}$/);
    assert.equal(pendingReset.key,faultSeed.key);
    assert.equal(pendingReset.payload,faultSeed.payload);
    await faultPage.evaluate(()=>window.__restoreFaultRemove());
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    const cleared=await vaultBytes(faultPage);
    assert.equal(cleared.key,null);assert.equal(cleared.payload,null);
    assert.match(cleared.reset,/^idle-v2:[0-9a-f]{32}$/);
    await faultPage.evaluate(async()=>window.__r(309).resetData());
    const secondReset=await vaultBytes(faultPage);
    assert.equal(secondReset.key,null);assert.equal(secondReset.payload,null);
    assert.match(secondReset.reset,/^idle-v2:[0-9a-f]{32}$/);
    assert.notEqual(secondReset.reset,cleared.reset,'Repeated reset rotates durable epoch');
    await openReal(faultPage,url);
    await faultPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(faultPage),secondReset);
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


    // A denied first KEY write must not create a partial vault. Once storage
    // permission is restored, the same synthetic state can be saved normally.
    const firstKeyContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const firstKeyPage=await firstKeyContext.newPage();activePage=firstKeyPage;
    await openReal(firstKeyPage,url);
    const firstKeyState=await firstKeyPage.evaluate(async()=>window.__r(309).load());
    await firstKeyPage.evaluate(key=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===key)throw new DOMException('Synthetic first key write denied','QuotaExceededError');
        return original.call(this,name,value);
      };
      window.__restoreKeyWrite=()=>{Storage.prototype.setItem=original};
    },KEY);
    const firstKeyError=await firstKeyPage.evaluate(async state=>{
      try{await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },firstKeyState);
    assert.match(firstKeyError,/nu a putut salva datele local/);
    await firstKeyPage.evaluate(()=>window.__restoreKeyWrite());
    assert.deepEqual(await vaultBytes(firstKeyPage),{key:null,payload:null,reset:null});
    await openReal(firstKeyPage,url);
    const retryState=await firstKeyPage.evaluate(async()=>window.__r(309).load());
    await firstKeyPage.evaluate(async state=>window.__r(309).save(state),retryState);
    const firstKeyRetried=await vaultBytes(firstKeyPage);
    assert.match(firstKeyRetried.key,/^[0-9a-f]{64}$/);
    assert.equal(decryptBrowserVault(firstKeyRetried).transactions.length,0);
    console.log('PASS Chromium first KEY write denied: no partial vault, permission recovery allows authenticated retry');

    // Storage may write the ciphertext and THEN throw. The caller receives an
    // error but must never delete its key on the assumption that no payload
    // was committed. Reload must decrypt the committed synthetic pair.
    const writeThenThrowContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
    const writeThenThrowPage=await writeThenThrowContext.newPage();activePage=writeThenThrowPage;
    await openReal(writeThenThrowPage,url);
    const writeThenThrowState=await writeThenThrowPage.evaluate(async()=>window.__r(309).load());
    await writeThenThrowPage.evaluate(payload=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        const result=original.call(this,name,value);
        if(name===payload)throw new DOMException('Synthetic payload wrote then threw','QuotaExceededError');
        return result;
      };
      window.__restoreWriteThenThrow=()=>{Storage.prototype.setItem=original};
    },PAYLOAD);
    const afterWriteError=await writeThenThrowPage.evaluate(async state=>{
      try{await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },writeThenThrowState);
    assert.match(afterWriteError,/Prima salvare criptată nu a fost confirmată/);
    await writeThenThrowPage.evaluate(()=>window.__restoreWriteThenThrow());
    const committedDespiteError=await vaultBytes(writeThenThrowPage);
    assert.match(committedDespiteError.key,/^[0-9a-f]{64}$/);
    assert.ok(committedDespiteError.payload?.length>50);
    // WEB 18.51: exact committed ciphertext is authenticated without a second write.
    assert.equal(await writeThenThrowPage.evaluate(()=>window.__r(309).canRetryFirstSave()),true);
    const alreadyCommitted=await writeThenThrowPage.evaluate(async()=>window.__r(309).retryFirstSave());
    assert.equal(alreadyCommitted.transactions.length,0);
    assert.deepEqual(await vaultBytes(writeThenThrowPage),committedDespiteError);
    assert.equal(await writeThenThrowPage.evaluate(()=>window.__r(309).canRetryFirstSave()),false);
    await openReal(writeThenThrowPage,url);
    assert.equal((await writeThenThrowPage.evaluate(async()=>window.__r(309).load())).transactions.length,0);
    assert.deepEqual(await vaultBytes(writeThenThrowPage),committedDespiteError,
      'A successful write followed by an exception must not cause destructive rollback');
    console.log('PASS Chromium first payload write-then-throw: reported failure but committed encrypted pair survives reload');

    // WEB 18.51: an explicit same-live-tab retry can commit the previously
    // sealed envelope when KEY is present and PAYLOAD was never written.
    const retryContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const retryPage=await retryContext.newPage();activePage=retryPage;
    await openReal(retryPage,url);
    const initialRetryState=await retryPage.evaluate(async()=>window.__r(309).load());
    await retryPage.evaluate(payload=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===payload)throw new DOMException('Synthetic quota failure before commit','QuotaExceededError');
        return original.call(this,name,value);
      };
      window.__restoreRetryWrite=()=>{Storage.prototype.setItem=original};
    },PAYLOAD);
    const retryError=await retryPage.evaluate(async state=>{
      try{await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },initialRetryState);
    assert.match(retryError,/Prima salvare criptată nu a fost confirmată/);
    assert.equal(await retryPage.evaluate(()=>window.__r(309).canRetryFirstSave()),true);
    await retryPage.evaluate(()=>window.__restoreRetryWrite());
    const orphanBeforeRetry=await vaultBytes(retryPage);
    assert.ok(orphanBeforeRetry.key);assert.equal(orphanBeforeRetry.payload,null);
    await retryPage.evaluate(async()=>window.__r(309).retryFirstSave());
    const repaired=await vaultBytes(retryPage);
    assert.equal(repaired.key,orphanBeforeRetry.key);
    assert.ok(repaired.payload);
    assert.equal(decryptBrowserVault(repaired).transactions.length,0);
    assert.equal(await retryPage.evaluate(()=>window.__r(309).canRetryFirstSave()),false);
    await openReal(retryPage,url);
    assert.deepEqual(await vaultBytes(retryPage),repaired);
    console.log('PASS Chromium WEB 18.51 bounded first PAYLOAD failure retry commits authenticated ciphertext and reloads');

    // Regression #35: visibilitychange fires on document, not window, and
    // does not bubble. A hidden tab must lose its volatile retry authority.
    const hiddenContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'dark'});
    const hiddenPage=await hiddenContext.newPage();activePage=hiddenPage;
    await openReal(hiddenPage,url);
    const hiddenState=await hiddenPage.evaluate(async()=>window.__r(309).load());
    await hiddenPage.evaluate(payload=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(name===payload)throw new DOMException('Synthetic hidden-tab first write failure','QuotaExceededError');
        return original.call(this,name,value);
      };
      window.__restoreHiddenSet=()=>{Storage.prototype.setItem=original};
    },PAYLOAD);
    const hiddenError=await hiddenPage.evaluate(async state=>{
      try{await window.__r(309).save(state);return 'UNEXPECTED_SAVE'}
      catch(error){return String(error.message)}
    },hiddenState);
    assert.match(hiddenError,/Prima salvare criptată nu a fost confirmată/);
    await hiddenPage.evaluate(()=>window.__restoreHiddenSet());
    assert.equal(await hiddenPage.evaluate(()=>window.__r(309).canRetryFirstSave()),true);
    const hiddenBefore=await vaultBytes(hiddenPage);
    await hiddenPage.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
      document.dispatchEvent(new Event('visibilitychange',{bubbles:false}));
    });
    assert.equal(await hiddenPage.evaluate(()=>window.__r(309).canRetryFirstSave()),false,
      'Document visibilitychange must revoke retry authority without bubbling to window');
    const hiddenResult=await hiddenPage.evaluate(async()=>{
      try{await window.__r(309).retryFirstSave();return 'UNEXPECTED_RETRY'}
      catch(error){return String(error.message)}
    });
    assert.match(hiddenResult,/nu mai este disponibilă/);
    assert.deepEqual(await vaultBytes(hiddenPage),hiddenBefore,
      'Hidden document must not write, delete or replace vault bytes');
    console.log('PASS Chromium WEB 18.52 document visibilitychange revokes pending first-save retry with zero writes');


    // #35: REAL same-origin Chromium StorageEvents, not dispatchEvent mocks.
    // Each browser profile is disposable; a sibling tab deliberately mutates
    // synthetic KEY/PAYLOAD/RESET to prove a live first-save retry is revoked.
    // A different storage key must NOT revoke the handle. No real user data.
    for(const changedKey of ['fa-synthetic-unrelated',KEY,PAYLOAD,RESET]){
      const eventContext=await browser.newContext({viewport:{width:390,height:844},
        isMobile:true,hasTouch:true,colorScheme:'light'});
      const eventA=await eventContext.newPage();activePage=eventA;
      await openReal(eventA,url);
      const eventB=await eventContext.newPage();
      await openReal(eventB,url);
      await eventA.bringToFront();
      const eventState=await eventA.evaluate(async()=>window.__r(309).load());
      await eventA.evaluate(payload=>{
        window.__faNativeEvents=[];
        window.addEventListener('storage',event=>{
          window.__faNativeEvents.push({key:event.key,trusted:event.isTrusted,
            sameStorage:event.storageArea===localStorage});
        });
        const original=Storage.prototype.setItem;
        Storage.prototype.setItem=function(name,value){
          if(this===localStorage&&name===payload)
            throw new DOMException('Synthetic native-event payload denial','QuotaExceededError');
          return original.call(this,name,value);
        };
        window.__restoreNativeEventSet=()=>{Storage.prototype.setItem=original};
      },PAYLOAD);
      const eventFailure=await eventA.evaluate(async state=>{
        try{await window.__r(309).save(state);return 'UNEXPECTED_SUCCESS'}
        catch(error){return String(error.message)}
      },eventState);
      assert.match(eventFailure,/Prima salvare criptată nu a fost confirmată/);
      await eventA.evaluate(()=>window.__restoreNativeEventSet());
      assert.equal(await eventA.evaluate(()=>window.__r(309).canRetryFirstSave()),true,
        'Fresh live retry must be available before a sibling storage event');
      const eventOrphan=await vaultBytes(eventA);
      assert.match(eventOrphan.key,/^[0-9a-f]{64}$/);
      assert.equal(eventOrphan.payload,null);
      const changedValue=changedKey===KEY?'b'.repeat(64):
        changedKey===PAYLOAD?'synthetic-conflicting-ciphertext':
        changedKey===RESET?'idle-v2:'+'c'.repeat(32):'unrelated';
      await eventB.evaluate(([key,value])=>localStorage.setItem(key,value),
        [changedKey,changedValue]);
      await eventA.waitForFunction(key=>
        window.__faNativeEvents.some(event=>event.key===key),changedKey,{timeout:10000});
      const observed=await eventA.evaluate(key=>
        window.__faNativeEvents.filter(event=>event.key===key),changedKey);
      assert.ok(observed.some(event=>event.trusted&&event.sameStorage),
        'Expected a native trusted cross-tab StorageEvent, not a synthetic dispatch');
      if(changedKey==='fa-synthetic-unrelated'){
        assert.equal(await eventA.evaluate(()=>window.__r(309).canRetryFirstSave()),true,
          'Unrelated native storage event must not revoke first-save retry');
        assert.deepEqual(await vaultBytes(eventA),eventOrphan,
          'Unrelated key must leave all vault bytes unchanged');
      }else{
        assert.equal(await eventA.evaluate(()=>window.__r(309).canRetryFirstSave()),false,
          'Native sibling vault mutation must revoke the live retry');
        const changedSnapshot=await vaultBytes(eventA);
        const rejected=await eventA.evaluate(async keys=>{
          const writes=[],originalSet=Storage.prototype.setItem,
            originalRemove=Storage.prototype.removeItem;
          Storage.prototype.setItem=function(name,value){
            if(keys.includes(String(name)))writes.push(['set',String(name)]);
            return originalSet.call(this,name,value);
          };
          Storage.prototype.removeItem=function(name){
            if(keys.includes(String(name)))writes.push(['remove',String(name)]);
            return originalRemove.call(this,name);
          };
          try{
            await window.__r(309).retryFirstSave();
            return {error:'UNEXPECTED_RETRY',writes};
          }catch(error){return {error:String(error.message),writes}}
          finally{
            Storage.prototype.setItem=originalSet;
            Storage.prototype.removeItem=originalRemove;
          }
        },[KEY,PAYLOAD,RESET]);
        assert.match(rejected.error,/nu mai este disponibilă/i);
        assert.deepEqual(rejected.writes,[],
          'Rejected retry must not write any vault key');
        assert.deepEqual(await vaultBytes(eventA),changedSnapshot,
          'Rejected retry must not overwrite the sibling tab change');
      }
      console.log('PASS Chromium #35 native cross-tab StorageEvent '+changedKey+
        ': trusted event, correct retry fencing and zero unintended vault writes');
      await eventContext.close();
    }

    // The post-reload KEY-only ambiguity remains: if the
    // first payload write fails, the key remains and reload must refuse to
    // create a new ledger. Never auto-delete the ambiguous orphan key.
    const firstContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const firstPage=await firstContext.newPage();activePage=firstPage;
    await openReal(firstPage,url);
    const firstState=await firstPage.evaluate(async()=>window.__r(309).load());
    assert.deepEqual(await vaultBytes(firstPage),{key:null,payload:null,reset:null});
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
    assert.match(firstError,/Prima salvare criptată nu a fost confirmată/);
    await firstPage.evaluate(()=>window.__restoreFirstSet());
    const orphanAfterFirst=await vaultBytes(firstPage);
    assert.match(orphanAfterFirst.key,/^[0-9a-f]{64}$/);
    assert.equal(orphanAfterFirst.payload,null);
    assert.equal(orphanAfterFirst.reset,null);
    await openReal(firstPage,url);
    await firstPage.getByText('Datele locale nu pot fi deschise',{exact:true}).waitFor({state:'visible'});
    assert.deepEqual(await vaultBytes(firstPage),orphanAfterFirst);

    // #35: a second ACTUAL tab opening after the first payload-write failure
    // must not mistake KEY-only for a fresh vault. Neither retrying the first
    // tab nor saving the stale pre-failure state from tab B may repair/delete
    // the ambiguous key. This is a regression guard, NOT a recovery fix.
    const orphanSibling=await firstContext.newPage();activePage=orphanSibling;
    await openReal(orphanSibling,url);
    await orphanSibling.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:15000});
    await orphanSibling.evaluate(keys=>{
      const originalSet=Storage.prototype.setItem;
      const originalRemove=Storage.prototype.removeItem;
      window.__orphanSiblingVaultWrites=[];
      Storage.prototype.setItem=function(name,value){
        if(keys.includes(String(name)))window.__orphanSiblingVaultWrites.push(['set',String(name)]);
        return originalSet.call(this,name,value);
      };
      Storage.prototype.removeItem=function(name){
        if(keys.includes(String(name)))window.__orphanSiblingVaultWrites.push(['remove',String(name)]);
        return originalRemove.call(this,name);
      };
    },[KEY,PAYLOAD,RESET]);
    const siblingAttempt=await orphanSibling.evaluate(async state=>{
      const result={};
      try{await window.__r(309).load();result.load='UNEXPECTED_LOAD'}
      catch(error){result.load=String(error.message)}
      try{await window.__r(309).save(state);result.save='UNEXPECTED_SAVE'}
      catch(error){result.save=String(error.message)}
      return result;
    },firstState);
    assert.match(siblingAttempt.load,/Cheia locală există|datele criptate lipsesc/);
    assert.match(siblingAttempt.save,/Salvarea este blocată/);
    assert.deepEqual(await orphanSibling.evaluate(()=>window.__orphanSiblingVaultWrites),[],
      'Second tab must not write/delete KEY, PAYLOAD or RESET on failed retry');
    assert.deepEqual(await vaultBytes(orphanSibling),orphanAfterFirst,
      'Second tab must preserve the exact original orphan bytes');
    await firstPage.getByText('Reîncearcă deschiderea',{exact:true}).click();
    await firstPage.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible'});
    assert.deepEqual(await vaultBytes(firstPage),orphanAfterFirst,
      'First tab UI retry must not clear the key while another tab is blocked');
    assert.deepEqual(await vaultBytes(orphanSibling),orphanAfterFirst);
    console.log('PASS Chromium #35 two real tabs: failed first payload write remains quarantined; sibling load/save and first-tab retry preserve all vault bytes');

    assert.deepEqual(await vaultBytes(orphan),beforeOrphan,'Independent blocked profile must stay untouched');
    assert.deepEqual(await vaultBytes(populated),seed,'Independent populated profile must stay untouched');
    console.log('PASS Chromium KNOWN UNSAFE first-save payload quota fault: orphan key persists; reload blocks instead of overwriting');

    // #35 RESEARCH ONLY: exercise a hypothetical same-live-tab retry in REAL
    // Chromium with the active WEB 18.51 platform, AES-GCM and navigator.locks.
    // This separate test-only interception models the research handle independently
    // of the shipped bounded retry. KEY-only after reload remains ambiguous.
    const boundedContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'dark'});
    const boundedPage=await boundedContext.newPage();activePage=boundedPage;
    await openReal(boundedPage,url);
    const boundedEpoch=await boundedPage.evaluate(async reset=>{
      const api=window.__r(309);
      await api.load();await api.resetData();
      return localStorage.getItem(reset);
    },RESET);
    assert.match(boundedEpoch,/^idle-v2:[0-9a-f]{32}$/);
    assert.deepEqual(await vaultBytes(boundedPage),{key:null,payload:null,reset:boundedEpoch});
    await openReal(boundedPage,url);
    await boundedPage.evaluate(({key,payload,reset})=>{
      const original=Storage.prototype.setItem;
      window.__restoreBoundedSet=()=>{Storage.prototype.setItem=original};
      Storage.prototype.setItem=function(name,value){
        if(this===localStorage&&name===payload){
          window.__boundedHandle={key:localStorage.getItem(key),payload:String(value),
            epoch:localStorage.getItem(reset)};
          throw new DOMException('Synthetic first PAYLOAD denied','QuotaExceededError');
        }
        return original.call(this,name,value);
      };
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    const boundedError=await boundedPage.evaluate(async()=>{
      const api=window.__r(309),state=await api.load();
      try{await api.save(state);return 'UNEXPECTED_SUCCESS'}
      catch(error){return String(error.message)}
    });
    assert.match(boundedError,/Prima salvare criptată nu a fost confirmată/i);
    await boundedPage.evaluate(()=>window.__restoreBoundedSet());
    const boundedOrphan=await vaultBytes(boundedPage);
    assert.match(boundedOrphan.key,/^[0-9a-f]{64}$/);
    assert.equal(boundedOrphan.payload,null);
    assert.equal(boundedOrphan.reset,boundedEpoch);
    const sibling=await boundedContext.newPage();activePage=sibling;
    await openReal(sibling,url);
    const siblingBlocked=await sibling.evaluate(async()=>{
      try{await window.__r(309).load();return 'UNEXPECTED_SUCCESS'}
      catch(error){return String(error.message)}
    });
    assert.match(siblingBlocked,/Cheia locală există|datele criptate lipsesc/i);
    assert.deepEqual(await vaultBytes(sibling),boundedOrphan,
      'Sibling tab must not initialize or overwrite KEY-only orphan');
    const boundedResult=await boundedPage.evaluate(async ({key,payload,reset})=>{
      const h=window.__boundedHandle;
      if(!h||typeof navigator.locks?.request!=='function')
        throw Error('Missing real Web Locks or live ciphertext handle');
      return navigator.locks.request('financial-autonomy.preview.vault.v1',
        {mode:'exclusive'},()=>{
          const current={key:localStorage.getItem(key),payload:localStorage.getItem(payload),
            epoch:localStorage.getItem(reset)};
          if(!/^idle-v2:[0-9a-f]{32}$/.test(current.epoch??'')||
             current.epoch!==h.epoch||current.key!==h.key||current.payload!==null)
            throw Error('Changed authority: fail closed');
          const shadow={getItem(name){
            if(name===key)return h.key;
            if(name===payload)return h.payload;
            if(name===reset)return h.epoch;
            return null;
          }};
          // The actual WEB 18.50 vault authenticates captured ciphertext
          // before the only permitted write, under the actual browser lock.
          const state=window.__r(310).loadWebVault(shadow);
          localStorage.setItem(payload,h.payload);
          if(localStorage.getItem(key)!==h.key||
             localStorage.getItem(payload)!==h.payload||
             localStorage.getItem(reset)!==h.epoch)
            throw Error('Post-retry revision mismatch');
          return {version:state.version,transactionCount:state.transactions.length};
        });
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    assert.equal(boundedResult.version,4);
    assert.equal(boundedResult.transactionCount,0);
    const boundedCommitted=await vaultBytes(boundedPage);
    assert.equal(boundedCommitted.key,boundedOrphan.key);
    assert.equal(boundedCommitted.reset,boundedEpoch);
    assert.ok(boundedCommitted.payload?.length>50);
    assert.equal(decryptBrowserVault(boundedCommitted).version,4);
    // #35 research-only idempotence gate: a successful bounded commit must
    // NOT permit the same live handle to write again, even if it holds the
    // identical ciphertext. A duplicate write could mask another authority.
    // Observe actual Web Locks and instrument all three vault storage keys.
    const duplicateRetry=await boundedPage.evaluate(async ({key,payload,reset})=>{
      const handle=window.__boundedHandle;
      const names=new Set([key,payload,reset]);
      const writes=[];
      const originalSet=Storage.prototype.setItem;
      const originalRemove=Storage.prototype.removeItem;
      Storage.prototype.setItem=function(name,value){
        if(names.has(String(name)))writes.push(['set',String(name)]);
        return originalSet.call(this,name,value);
      };
      Storage.prototype.removeItem=function(name){
        if(names.has(String(name)))writes.push(['remove',String(name)]);
        return originalRemove.call(this,name);
      };
      try{
        await navigator.locks.request('financial-autonomy.preview.vault.v1',
          {mode:'exclusive'},()=>{
            const current={key:localStorage.getItem(key),
              payload:localStorage.getItem(payload),
              epoch:localStorage.getItem(reset)};
            if(current.epoch!==handle.epoch||
               current.key!==handle.key||current.payload!==null)
              throw Error('Changed authority: fail closed');
            // This branch must never be reached after a successful commit.
            localStorage.setItem(payload,handle.payload);
          });
        return {error:'UNEXPECTED_REPLAY',writes};
      }catch(error){return {error:String(error.message),writes}}
      finally{
        Storage.prototype.setItem=originalSet;
        Storage.prototype.removeItem=originalRemove;
      }
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    assert.match(duplicateRetry.error,/Changed authority: fail closed/);
    assert.deepEqual(duplicateRetry.writes,[],
      'Duplicate live-handle retry must not write or delete any vault key');
    assert.deepEqual(await vaultBytes(boundedPage),boundedCommitted,
      'Rejected replay must preserve committed ciphertext byte-for-byte');
    console.log('PASS Chromium #35 RESEARCH ONLY: duplicate bounded live-handle retry is rejected under real Web Lock with zero vault writes');
    await openReal(boundedPage,url);
    const boundedReload=await boundedPage.evaluate(async()=>window.__r(309).load());
    assert.equal(boundedReload.version,4);
    assert.deepEqual(await vaultBytes(boundedPage),boundedCommitted);
    console.log('PASS Chromium #35 RESEARCH ONLY: real Web Locks + actual WEB 18.50 AES-GCM bounded live-handle retry after reset; reload decrypts, no product recovery shipped');


    // #35 RESEARCH ONLY: a queued hypothetical first-write retry must never
    // survive REAL Chromium page navigation while another tab owns the Web
    // Lock. The handle and lifecycle listener exist only in this test, NOT
    // in WEB 18.50. This is browser lifecycle evidence, not a product fix.
    const lifecycleContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'dark'});
    const lifecyclePage=await lifecycleContext.newPage();activePage=lifecyclePage;
    await openReal(lifecyclePage,url);
    const lifecycleEpoch=await lifecyclePage.evaluate(async reset=>{
      const api=window.__r(309);await api.load();await api.resetData();
      return localStorage.getItem(reset);
    },RESET);
    assert.match(lifecycleEpoch,/^idle-v2:[0-9a-f]{32}$/);
    await openReal(lifecyclePage,url);
    const lifecycleFault=await lifecyclePage.evaluate(async ({key,payload,reset})=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(name,value){
        if(this===localStorage&&name===payload){
          window.__lifeHandle={key:localStorage.getItem(key),payload:String(value),
            epoch:localStorage.getItem(reset),live:true};
          throw new DOMException('Synthetic lifecycle payload denied','QuotaExceededError');
        }
        return original.call(this,name,value);
      };
      try{
        const api=window.__r(309),state=await api.load();
        try{await api.save(state);return 'UNEXPECTED_SUCCESS'}
        catch(error){return String(error.message)}
      }finally{Storage.prototype.setItem=original}
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    assert.match(lifecycleFault,/Prima salvare criptată nu a fost confirmată/i);
    const lifecycleOrphan=await vaultBytes(lifecyclePage);
    assert.match(lifecycleOrphan.key,/^[0-9a-f]{64}$/);
    assert.equal(lifecycleOrphan.payload,null);
    assert.equal(lifecycleOrphan.reset,lifecycleEpoch);
    await lifecyclePage.evaluate(()=>{
      window.addEventListener('pagehide',()=>{
        window.__lifeHandle.live=false;
        sessionStorage.setItem('__faSyntheticPagehideSeen','yes');
      },{once:true});
    });
    const lockHolder=await lifecycleContext.newPage();activePage=lockHolder;
    await openReal(lockHolder,url);
    await lockHolder.evaluate(()=>{
      window.__lifeLockHeld=false;
      navigator.locks.request('financial-autonomy.preview.vault.v1',
        {mode:'exclusive'},async()=>{
          window.__lifeLockHeld=true;
          await new Promise(resolve=>{window.__lifeReleaseLock=resolve});
        }).catch(error=>{window.__lifeLockError=String(error)});
    });
    await lockHolder.waitForFunction(()=>window.__lifeLockHeld===true,null,{timeout:10000});
    await lifecyclePage.evaluate(({key,payload,reset})=>{
      window.__lifeRetryStatus='pending';
      navigator.locks.request('financial-autonomy.preview.vault.v1',
        {mode:'exclusive'},()=>{
          const h=window.__lifeHandle;
          if(!h?.live)throw Error('Expired page lifecycle: fail closed');
          const current={key:localStorage.getItem(key),
            payload:localStorage.getItem(payload),epoch:localStorage.getItem(reset)};
          if(current.key!==h.key||current.epoch!==h.epoch||current.payload!==null)
            throw Error('Changed authority: fail closed');
          const shadow={getItem(name){
            if(name===key)return h.key;
            if(name===payload)return h.payload;
            if(name===reset)return h.epoch;
            return null;
          }};
          window.__r(310).loadWebVault(shadow);
          localStorage.setItem(payload,h.payload);
        }).then(()=>{window.__lifeRetryStatus='UNEXPECTED_COMMIT'},
          error=>{window.__lifeRetryStatus='rejected:'+String(error)});
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    await lockHolder.waitForFunction(async()=>{
      const state=await navigator.locks.query();
      return state.pending.some(lock=>lock.name==='financial-autonomy.preview.vault.v1');
    },null,{timeout:10000});
    assert.deepEqual(await vaultBytes(lockHolder),lifecycleOrphan,
      'Queued hypothetical retry must not write before lock acquisition');
    await lifecyclePage.goto('about:blank',{waitUntil:'load',timeout:15000});
    await lockHolder.evaluate(()=>window.__lifeReleaseLock());
    await lockHolder.waitForFunction(async()=>{
      const state=await navigator.locks.query();
      return !state.held.some(lock=>lock.name==='financial-autonomy.preview.vault.v1')&&
        !state.pending.some(lock=>lock.name==='financial-autonomy.preview.vault.v1');
    },null,{timeout:15000});
    assert.deepEqual(await vaultBytes(lockHolder),lifecycleOrphan,
      'Navigating away while retry waits for Web Lock must not commit ciphertext');
    await openReal(lifecyclePage,url);
    assert.equal(await lifecyclePage.evaluate(()=>
      sessionStorage.getItem('__faSyntheticPagehideSeen')),'yes',
      'Chromium must have fired real pagehide during navigation');
    await lifecyclePage.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:15000});
    assert.deepEqual(await vaultBytes(lifecyclePage),lifecycleOrphan,
      'After pagehide/reload, ambiguous KEY-only must remain quarantined byte-for-byte');
    console.log('PASS Chromium #35 RESEARCH ONLY: real pagehide navigation cancels queued Web Lock retry; KEY-only stays byte-identical and blocked after reload');

    // #35: Nonconforming Storage write-then-throw after PAYLOAD has already
    // committed. This is a fault-injection characterization, NOT native
    // localStorage's usual atomic setItem behavior and NOT shipped recovery.
    // A reported save error must not be mistaken for absent ciphertext.
    const committedFaultContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    const committedFaultPage=await committedFaultContext.newPage();activePage=committedFaultPage;
    await openReal(committedFaultPage,url);
    const committedFaultEpoch=await committedFaultPage.evaluate(async reset=>{
      const api=window.__r(309);await api.load();await api.resetData();
      return localStorage.getItem(reset);
    },RESET);
    assert.match(committedFaultEpoch,/^idle-v2:[0-9a-f]{32}$/);
    await openReal(committedFaultPage,url);
    const committedFaultResult=await committedFaultPage.evaluate(async payload=>{
      const original=Storage.prototype.setItem;
      let injected=false;
      Storage.prototype.setItem=function(name,value){
        if(this===localStorage&&name===payload&&!injected){
          injected=true;
          original.call(this,name,value);
          throw new DOMException('Synthetic write committed before error','UnknownError');
        }
        return original.call(this,name,value);
      };
      try{
        const api=window.__r(309),state=await api.load();
        try{await api.save(state);return {error:'UNEXPECTED_SUCCESS',injected}}
        catch(error){return {error:String(error.message),injected}}
      }finally{Storage.prototype.setItem=original}
    },PAYLOAD);
    assert.equal(committedFaultResult.injected,true);
    assert.match(committedFaultResult.error,/Prima salvare criptată nu a fost confirmată/i);
    const committedFaultBytes=await vaultBytes(committedFaultPage);
    assert.equal(committedFaultBytes.reset,committedFaultEpoch);
    assert.match(committedFaultBytes.key,/^[0-9a-f]{64}$/);
    assert.ok(committedFaultBytes.payload?.length>50);
    assert.equal(decryptBrowserVault(committedFaultBytes).version,4);
    const committedFaultSibling=await committedFaultContext.newPage();
    activePage=committedFaultSibling;
    await openReal(committedFaultSibling,url);
    const committedFaultRead=await committedFaultSibling.evaluate(async()=>window.__r(309).load());
    assert.equal(committedFaultRead.version,4);
    assert.deepEqual(await vaultBytes(committedFaultSibling),committedFaultBytes,
      'An error after PAYLOAD commit must not trigger cleanup or rewrite on another tab');
    await openReal(committedFaultPage,url);
    assert.equal((await committedFaultPage.evaluate(async()=>window.__r(309).load())).version,4);
    assert.deepEqual(await vaultBytes(committedFaultPage),committedFaultBytes);
    console.log('PASS Chromium #35 RESEARCH ONLY: PAYLOAD write-then-throw leaves authenticated ciphertext readable after reload; no auto-cleanup or duplicate write');

    // F08/F09: test-only v2 candidate versus two ACTUAL v18.45 browser tabs.
    // The v2 keys below are research fixtures, NOT an application migration.
    // Both observations must BLOCK automatic recovery: an older tab does not
    // know these keys and its Web Lock does not protect a new schema by itself.
    const STAGE_RESEARCH='financial-autonomy.preview.stage-research.v2';
    const V2_RESEARCH='financial-autonomy.preview.atomic-prototype.v2';
    const researchSnapshot=page=>page.evaluate(keys=>{
      const [key,payload,reset,stage,v2]=keys;
      return {key:localStorage.getItem(key),payload:localStorage.getItem(payload),
        reset:localStorage.getItem(reset),stage:localStorage.getItem(stage),
        v2:localStorage.getItem(v2)};
    },[KEY,PAYLOAD,RESET,STAGE_RESEARCH,V2_RESEARCH]);
    // This is a read-only contract oracle for the hypothetical reader,
    // deliberately NOT exported into or invoked by the product.
    const researchDecision=bytes=>{
      if(bytes.key!==null||bytes.payload!==null||bytes.reset!==null)
        return 'QUARANTINE_LEGACY_OR_RESET_CONFLICT';
      if(bytes.stage!==null&&bytes.v2===null)
        return 'QUARANTINE_AMBIGUOUS_STAGE_ONLY';
      return 'NO_AUTOMATIC_RECOVERY_AUTHORIZED';
    };

    // F08: active WEB 18.50 retains an epoch after reset. Old cached
    // 18.49 ambiguity is separately pinned in the Node compatibility matrix.
    // A staged research record remains quarantined, never auto-activated.
    const resetCoexistContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'});
    const oldResetTab=await resetCoexistContext.newPage();activePage=oldResetTab;
    await openReal(oldResetTab,url);
    await oldResetTab.evaluate(async()=>window.__r(309).load());
    const newStageTab=await resetCoexistContext.newPage();activePage=newStageTab;
    await openReal(newStageTab,url);
    const stageFixture=encryptSyntheticLedger(syntheticLedger());
    const stagedRaw=JSON.stringify({v:2,key:stageFixture.key,payload:stageFixture.payload});
    await newStageTab.evaluate(([name,value])=>localStorage.setItem(name,value),[STAGE_RESEARCH,stagedRaw]);
    const stageOnlyCrash=await researchSnapshot(newStageTab);
    assert.deepEqual(stageOnlyCrash,{key:null,payload:null,reset:null,stage:stagedRaw,v2:null});
    assert.equal(researchDecision(stageOnlyCrash),'QUARANTINE_AMBIGUOUS_STAGE_ONLY');
    await oldResetTab.evaluate(async()=>window.__r(309).resetData());
    const afterOldReset=await researchSnapshot(newStageTab);
    assert.equal(afterOldReset.key,null);assert.equal(afterOldReset.payload,null);
    assert.match(afterOldReset.reset,/^idle-v2:[0-9a-f]{32}$/);
    assert.equal(afterOldReset.stage,stagedRaw);assert.equal(afterOldReset.v2,null);
    assert.equal(researchDecision(afterOldReset),'QUARANTINE_LEGACY_OR_RESET_CONFLICT');
    await openReal(newStageTab,url);
    assert.deepEqual(await researchSnapshot(newStageTab),afterOldReset,
      'Reload must retain epoch and must not promote unrecognized staged ciphertext');
    console.log('PASS Chromium F08: reset epoch quarantines unknown staged data; no resurrection');

    // F09: a real cached v18.45 tab can save a v1 encrypted ledger after a
    // hypothetical v2 single-record commit. The candidate's reader MUST
    // detect both authorities and refuse silent selection or merging.
    const splitContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:'light'});
    const oldWriterTab=await splitContext.newPage();activePage=oldWriterTab;
    await openReal(oldWriterTab,url);
    await oldWriterTab.evaluate(async()=>window.__r(309).load());
    const newRecordTab=await splitContext.newPage();activePage=newRecordTab;
    await openReal(newRecordTab,url);
    const v2Fixture=encryptSyntheticLedger(syntheticLedger());
    const v2Raw=JSON.stringify({v:2,key:v2Fixture.key,payload:v2Fixture.payload});
    await newRecordTab.evaluate(([name,value])=>localStorage.setItem(name,value),[V2_RESEARCH,v2Raw]);
    const beforeOldWrite=await researchSnapshot(newRecordTab);
    assert.equal(beforeOldWrite.key,null);assert.equal(beforeOldWrite.payload,null);
    await oldWriterTab.evaluate(async state=>window.__r(309).save(state),syntheticLedger());
    const split=await researchSnapshot(newRecordTab);
    assert.equal(split.v2,v2Raw,'Legacy writer must not mutate the unknown research v2 record');
    assert.match(split.key,/^[0-9a-f]{64}$/);
    assert.ok(split.payload?.length>50);
    assert.equal(decryptBrowserVault(split).transactions.length,1);
    assert.equal(researchDecision(split),'QUARANTINE_LEGACY_OR_RESET_CONFLICT');
    const unchanged=await researchSnapshot(newRecordTab);
    assert.deepEqual(unchanged,split,'Read-only conflict detection must never modify either authority');
    console.log('PASS Chromium F09 research: real cached v18.45 writer creates v1 beside v2; preserve both and quarantine split authority');

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
