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
