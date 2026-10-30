'use strict';
// Issue #4/#35: ACTUAL WEB 18.64 confirmed-backup UI, synthetic disposable Chromium
// profiles only. This characterizes storage failures; a PASS does NOT imply
// atomic recovery or that a key-only origin is safe to reset automatically.
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
const PASSWORD='SyntheticRestoreFault!2026';
const ACK_SOURCE=fs.readFileSync(path.join(ROOT,'tests/support/restore-acknowledgment.cjs'),'utf8');
const date=new Date().toISOString().slice(0,10);
const fixture={
  version:4,names:[],nameChanges:[],rolesEffectiveFrom:date,balanceChecks:[],
  checkAudit:[],currency:'RON',started:date,
  accounts:[{id:'restore-fault-checking',name:'Cont sintetic restore',kind:'current',
    opening:123456,date}],
  incomes:[],expenses:[],debts:[],recurring:[],
  transactions:[{id:'restore-fault-expense',name:'Operațiune sintetică',kind:'expense',
    accountId:'restore-fault-checking',amount:1250,date,details:[]}],
  monthPlans:[{month:date.slice(0,7),budgets:[],expenses:[],debtPayments:[],contribution:0}],
  goals:[],plans:[],reviews:{},audit:[]
};
function serve(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'||pathname===PREFIX?'index.html':
    pathname.startsWith(PREFIX)?pathname.slice(PREFIX.length):'';
  if(!relative||relative.includes('..')){res.writeHead(404);res.end();return}
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html')){
    res.writeHead(403);res.end();return
  }
  fs.readFile(file,(err,bytes)=>{
    if(err){res.writeHead(404);res.end();return}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?
      'application/javascript; charset=utf-8':'text/html; charset=utf-8',
      'Cache-Control':'no-store'});
    res.end(bytes)
  })
}
async function openReal(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>/deschide aplicația|autonomie|datele locale nu pot fi deschise/i
    .test(document.body?.innerText||''),null,{timeout:25000});
  const start=page.getByText('Deschide aplicația',{exact:true});
  if(await start.isVisible())await start.click()
}
async function toolsScreen(page){
  await page.getByRole('tab',{name:/Mai mult/}).click();
  await page.getByText('Instrumente',{exact:true}).click();
  await page.getByText('Backup criptat',{exact:true}).waitFor({state:'visible',timeout:15000})
}
async function selectBackup(page,backup){
  const [chooser]=await Promise.all([
    page.waitForEvent('filechooser',{timeout:15000}),
    page.getByText('Verifică și restaurează backup',{exact:true}).click()
  ]);
  await chooser.setFiles({name:'synthetic-restore-fault.backup.json',
    mimeType:'application/json',buffer:backup})
}
async function bytes(page){
  return page.evaluate(([key,payload,reset])=>({
    key:localStorage.getItem(key),payload:localStorage.getItem(payload),
    reset:localStorage.getItem(reset)
  }),[KEY,PAYLOAD,RESET])
}
// The exact test-only classifier runs inside the REAL Chromium origin against
// localStorage and the active immutable AES-GCM module. The injected util shim
// compares JSON-only synthetic state; no app code or real financial data touched.
async function observeAck(page,beforeBytes,expectedState){
  const observed=await page.evaluate(({source,beforeBytes,expectedState,names})=>{
    const deep=(a,b)=>{
      if(Object.is(a,b))return true;
      if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
      const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
      return ak.length===bk.length&&ak.every((key,i)=>key===bk[i]&&deep(a[key],b[key]));
    };
    const require=name=>{
      if(name!=='node:util')throw Error('Unexpected test-only dependency');
      return {isDeepStrictEqual:deep};
    };
    const module={exports:{}};
    new Function('module','require',source)(module,require);
    const [key,payload,reset]=names;
    const before={[key]:beforeBytes.key,[payload]:beforeBytes.payload,
      [reset]:beforeBytes.reset};
    let writes=0;
    const readOnly={
      getItem:name=>localStorage.getItem(name),
      setItem(){writes++;throw Error('Read-only probe attempted a write')},
      removeItem(){writes++;throw Error('Read-only probe attempted a delete')}
    };
    const outcome=module.exports.classifyRestoreAcknowledgment({
      before,storage:readOnly,expectedState,
      authenticate:store=>window.__r(310).loadWebVault(store)
    });
    return {outcome,writes};
  },{source:ACK_SOURCE,beforeBytes,expectedState,names:[KEY,PAYLOAD,RESET]});
  assert.equal(observed.writes,0,'Classifier must never write protected data');
  return observed.outcome
}
async function prepare(page,url,backup){
  await openReal(page,url);
  await toolsScreen(page);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await selectBackup(page,backup);
  await page.getByText(/Backup valid: 1 conturi și 1 operațiuni/)
    .waitFor({state:'visible',timeout:60000});
  assert.deepEqual(await bytes(page),{key:null,payload:null,reset:null},
    'Preview must not write the empty target')
}
async function prepareExisting(page,url,backup,liveState){
  await openReal(page,url);
  await page.evaluate(async state=>{
    await window.__r(309).load();
    await window.__r(309).save(state);
  },liveState);
  const original=await bytes(page);
  assert.match(original.key,/^[0-9a-f]{64}$/);
  assert.ok(original.payload?.length>50);
  await toolsScreen(page);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await selectBackup(page,backup);
  await page.getByText(/Backup valid: 1 conturi și 1 operațiuni/)
    .waitFor({state:'visible',timeout:60000});
  assert.deepEqual(await bytes(page),original,
    'Preview of older backup must not mutate the newer live vault');
  return original
}
async function arm(page,mode){
  await page.evaluate(({key,payload,mode})=>{
    const original=Storage.prototype.setItem;
    window.__faFaultHits=0;
    Storage.prototype.setItem=function(name,value){
      if(this===localStorage&&
          ((mode==='deny-key'&&name===key)||
           (mode!=='deny-key'&&name===payload))){
        window.__faFaultHits++;
        if(mode==='write-then-throw'){
          original.call(this,name,value);
        }
        throw new DOMException('Synthetic restore storage denial','QuotaExceededError');
      }
      return original.call(this,name,value)
    };
    window.__faDisarmFault=()=>{Storage.prototype.setItem=original}
  },{key:KEY,payload:PAYLOAD,mode})
}
async function confirmFault(page){
  await page.getByText('Confirm înlocuirea datelor',{exact:true}).click();
  await page.waitForFunction(()=>window.__faFaultHits>0,null,{timeout:15000});
  // Allow the actual UI promise rejection to render its error state.
  await page.waitForTimeout(200);
  assert.equal(await page.getByText('Backup restaurat.',{exact:true}).count(),0,
    'A failed restore must not report success');
  await page.evaluate(()=>window.__faDisarmFault())
}
async function run(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
  let browser,page;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await context.newPage();
    await openReal(page,url);
    const backupText=await page.evaluate(async({state,password})=>
      window.__r(311).backup(state,password,n=>crypto.getRandomValues(new Uint8Array(n))),
      {state:fixture,password:PASSWORD});
    const backup=Buffer.from(backupText,'utf8');
    const expectedBackupState=await page.evaluate(async ({text,password})=>
      window.__r(205).migrate(await window.__r(311).restore(text,password)),
      {text:backupText,password:PASSWORD});
    assert.ok(!backupText.includes('restore-fault-expense'),
      'Portable backup must not contain plaintext financial IDs');
    await context.close();

    const keyContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await keyContext.newPage();
    await prepare(page,url,backup);
    await arm(page,'deny-key');
    await confirmFault(page);
    assert.deepEqual(await bytes(page),{key:null,payload:null,reset:null},
      'Denied KEY write must leave target completely empty');
    await openReal(page,url);
    await prepare(page,url,backup);
    await page.getByText('Confirm înlocuirea datelor',{exact:true}).click();
    await page.getByText('Backup restaurat.',{exact:true})
      .waitFor({state:'visible',timeout:20000});
    const recovered=await bytes(page);
    assert.match(recovered.key,/^[0-9a-f]{64}$/);
    assert.ok(recovered.payload?.length>50);
    await openReal(page,url);
    const loaded=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(loaded.transactions.length,1);
    assert.equal(loaded.transactions[0].id,fixture.transactions[0].id);
    assert.deepEqual(await bytes(page),recovered);
    await keyContext.close();
    console.log('PASS Chromium actual backup UI: denied first KEY write leaves no vault; explicit retry after reload restores synthetic transaction');

    const payloadContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'dark'});
    page=await payloadContext.newPage();
    await prepare(page,url,backup);
    await arm(page,'deny-payload');
    await confirmFault(page);
    const orphan=await bytes(page);
    const orphanAck=await observeAck(page,{key:null,payload:null,reset:null},expectedBackupState);
    assert.equal(orphanAck.status,'unknown','KEY-only must never be accepted as a restored vault');
    console.log('PASS Chromium read-only acknowledgment: empty-target PAYLOAD denial leaves KEY-only classified unknown, zero writes');
    assert.match(orphan.key,/^[0-9a-f]{64}$/);
    assert.equal(orphan.payload,null);
    assert.equal(orphan.reset,null);
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:15000});
    assert.deepEqual(await bytes(page),orphan,
      'Reload must preserve KEY-only evidence; do not auto-reset or invent payload');
    // A blocked KEY-only origin cannot be classified as a fresh empty vault.
    // The existing "retry opening" control must be read-only: it may report
    // the same block again, but it must not silently delete/rekey the only
    // remaining encrypted evidence. This is a current-UI characterization,
    // NOT an implementation of recovery or proof of missing payload origin.
    await page.evaluate(({key,payload,reset})=>{
      const protectedNames=new Set([key,payload,reset]);
      const originalSet=Storage.prototype.setItem;
      const originalRemove=Storage.prototype.removeItem;
      window.__faBlockedRetryWrites=[];
      Storage.prototype.setItem=function(name,value){
        if(this===localStorage&&protectedNames.has(name))
          window.__faBlockedRetryWrites.push('set:'+name);
        return originalSet.call(this,name,value)
      };
      Storage.prototype.removeItem=function(name){
        if(this===localStorage&&protectedNames.has(name))
          window.__faBlockedRetryWrites.push('remove:'+name);
        return originalRemove.call(this,name)
      };
      window.__faDisarmBlockedRetry=()=>{
        Storage.prototype.setItem=originalSet;
        Storage.prototype.removeItem=originalRemove;
      };
    },{key:KEY,payload:PAYLOAD,reset:RESET});
    await page.getByText('Reîncearcă deschiderea',{exact:true}).click();
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:15000});
    await page.waitForTimeout(250);
    assert.deepEqual(await page.evaluate(()=>window.__faBlockedRetryWrites),[],
      'Blocked retry must not write, remove or rotate KEY/PAYLOAD/RESET');
    await page.evaluate(()=>window.__faDisarmBlockedRetry());
    assert.deepEqual(await bytes(page),orphan,
      'Blocked retry must preserve the original KEY-only footprint');
    await openReal(page,url);
    await page.getByText('Datele locale nu pot fi deschise',{exact:true})
      .waitFor({state:'visible',timeout:15000});
    assert.deepEqual(await bytes(page),orphan,
      'Repeated reload after blocked retry must preserve KEY-only evidence');
    console.log('PASS Chromium actual blocked KEY-only UI: retry opening makes zero vault writes and preserves orphan key across reload');
    await payloadContext.close();
    console.log('PASS KNOWN UNSAFE Chromium actual backup UI: denied PAYLOAD write strands KEY-only vault; reload blocks without deleting evidence');

    const committedContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await committedContext.newPage();
    await prepare(page,url,backup);
    await arm(page,'write-then-throw');
    await confirmFault(page);
    const persisted=await bytes(page);
    assert.match(persisted.key,/^[0-9a-f]{64}$/);
    assert.ok(persisted.payload?.length>50);
    await openReal(page,url);
    const committed=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(committed.transactions.length,1);
    assert.equal(committed.transactions[0].id,fixture.transactions[0].id);
    assert.deepEqual(await bytes(page),persisted);
    await committedContext.close();
    console.log('PASS Chromium actual backup UI: PAYLOAD write-then-throw reports failure but encrypted ledger is recoverable after reload');
    // Existing authenticated v1 vaults reuse their AES key on save. Unlike
    // empty targets, a denied PAYLOAD write should therefore preserve both
    // original key and ciphertext. Confirm with real WEB UI and reload.
    const liveState={...fixture,transactions:[
      ...fixture.transactions,
      {...fixture.transactions[0],id:'newer-live-only',
        name:'Tranzacție sintetică mai recentă',amount:975}
    ]};
    const existingDeniedContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await existingDeniedContext.newPage();
    const beforeDenied=await prepareExisting(page,url,backup,liveState);
    const beforeAck=await observeAck(page,beforeDenied,liveState);
    assert.equal(beforeAck.status,'verified_unchanged');
    await arm(page,'deny-payload');
    await confirmFault(page);
    const deniedAck=await observeAck(page,beforeDenied,expectedBackupState);
    assert.equal(deniedAck.status,'verified_unchanged');
    console.log('PASS Chromium read-only acknowledgment: denied existing PAYLOAD write remains byte-identical, zero writes');
    assert.deepEqual(await bytes(page),beforeDenied,
      'Denied PAYLOAD write must preserve existing AES key, ciphertext and reset marker');
    await openReal(page,url);
    const stillLive=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(stillLive.transactions.length,2);
    assert.ok(stillLive.transactions.some(t=>t.id==='newer-live-only'));
    assert.deepEqual(await bytes(page),beforeDenied);
    await existingDeniedContext.close();
    console.log('PASS Chromium actual backup UI: existing authenticated vault survives denied restore PAYLOAD write and reload without key rotation');

    // A deliberately nonconforming Storage adapter commits PAYLOAD then
    // throws. The UI cannot infer from the exception whether the restore
    // committed: this must be treated as an ambiguous acknowledgment, not
    // an invitation to silently repeat the restore.
    const existingCommittedContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'dark'});
    page=await existingCommittedContext.newPage();
    const beforeCommitted=await prepareExisting(page,url,backup,liveState);
    await arm(page,'write-then-throw');
    await confirmFault(page);
    const afterCommitted=await bytes(page);
    const committedAck=await observeAck(page,beforeCommitted,expectedBackupState);
    if(committedAck.status!=='verified_target_present'){
      const diagnosis=await page.evaluate(expected=>{
        try{
          const actual=window.__r(310).loadWebVault(localStorage);
          return {actualKeys:Object.keys(actual),expectedKeys:Object.keys(expected),
            sameJson:JSON.stringify(actual)===JSON.stringify(expected),
            transactionCount:actual.transactions?.length};
        }catch(error){return {errorName:error.name,errorMessage:error.message}}
      },expectedBackupState);
      console.log('ACK TEST DIAGNOSIS (synthetic only):',committedAck,diagnosis);
    }
    assert.equal(committedAck.status,'verified_target_present',
      'Authenticated older target is present; this does NOT prove the attempt committed');
    console.log('PASS Chromium read-only acknowledgment: write-then-throw older target authenticated, not falsely labeled committed');
    assert.equal(afterCommitted.key,beforeCommitted.key,
      'Existing vault must reuse the authenticated AES key');
    assert.notEqual(afterCommitted.payload,beforeCommitted.payload,
      'The explicitly confirmed older backup may have committed before the throw');
    assert.equal(afterCommitted.reset,beforeCommitted.reset);
    await openReal(page,url);
    const restoredOlder=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(restoredOlder.transactions.length,1);
    assert.equal(restoredOlder.transactions[0].id,fixture.transactions[0].id);
    assert.equal(restoredOlder.transactions.some(t=>t.id==='newer-live-only'),false);
    assert.deepEqual(await bytes(page),afterCommitted,
      'Reload must not silently replay a failed acknowledgment');
    await existingCommittedContext.close();
    console.log('PASS KNOWN AMBIGUOUS Chromium actual backup UI: existing vault PAYLOAD write-then-throw reports failure although explicitly confirmed older backup committed; reload authenticates older state');

    // A failed read is distinct from a failed write. The restore must not
    // treat an unreadable existing vault as an empty target or overwrite it.
    // Inject a spec-compatible SecurityError for the existing PAYLOAD read
    // after the backup has already been authenticated by the real UI.
    const readDeniedContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await readDeniedContext.newPage();
    const beforeReadDenial=await prepareExisting(page,url,backup,liveState);
    await page.evaluate(payload=>{
      const originalGet=Storage.prototype.getItem;
      window.__faReadFaultHits=0;
      Storage.prototype.getItem=function(name){
        if(this===localStorage&&name===payload){
          window.__faReadFaultHits++;
          throw new DOMException('Synthetic read access denied','SecurityError');
        }
        return originalGet.call(this,name)
      };
      window.__faDisarmReadFault=()=>{Storage.prototype.getItem=originalGet};
    },PAYLOAD);
    await page.getByText('Confirm înlocuirea datelor',{exact:true}).click();
    await page.waitForFunction(()=>window.__faReadFaultHits>0,null,{timeout:15000});
    await page.waitForTimeout(200);
    assert.equal(await page.getByText('Backup restaurat.',{exact:true}).count(),0,
      'Denied live PAYLOAD read must not be acknowledged as a restore');
    await page.evaluate(()=>window.__faDisarmReadFault());
    assert.deepEqual(await bytes(page),beforeReadDenial,
      'Denied read must preserve original encrypted key, payload and reset marker');
    await openReal(page,url);
    const afterReadDenial=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(afterReadDenial.transactions.length,2);
    assert.ok(afterReadDenial.transactions.some(t=>t.id==='newer-live-only'));
    assert.deepEqual(await bytes(page),beforeReadDenial,
      'Reload must not silently apply an older backup after denied read');
    await readDeniedContext.close();
    console.log('PASS Chromium actual backup UI: denied existing-vault PAYLOAD read aborts confirmed restore without writes; newer ledger survives reload');


    // Remaining preflight reads are as important as PAYLOAD. A denied KEY or
    // RESET read must never be interpreted as an empty destination.
    for(const [label,deniedName] of [['KEY',KEY],['RESET',RESET]]){
      const readContext=await browser.newContext({viewport:{width:390,height:844},
        isMobile:true,hasTouch:true,colorScheme:'dark'});
      page=await readContext.newPage();
      const before=await prepareExisting(page,url,backup,liveState);
      await page.evaluate(name=>{
        const originalGet=Storage.prototype.getItem;
        window.__faReadFaultHits=0;
        Storage.prototype.getItem=function(key){
          if(this===localStorage&&key===name){
            window.__faReadFaultHits++;
            throw new DOMException('Synthetic denied authority read','SecurityError');
          }
          return originalGet.call(this,key)
        };
        window.__faDisarmReadFault=()=>{Storage.prototype.getItem=originalGet};
      },deniedName);
      await page.getByText('Confirm înlocuirea datelor',{exact:true}).click();
      await page.waitForFunction(()=>window.__faReadFaultHits>0,null,{timeout:15000});
      await page.waitForTimeout(200);
      assert.equal(await page.getByText('Backup restaurat.',{exact:true}).count(),0,
        'Denied '+label+' preflight read must not acknowledge restore');
      await page.evaluate(()=>window.__faDisarmReadFault());
      assert.deepEqual(await bytes(page),before,'Denied '+label+' read must cause zero writes');
      await openReal(page,url);
      const retained=await page.evaluate(async()=>window.__r(309).load());
      assert.equal(retained.transactions.length,2);
      assert.ok(retained.transactions.some(t=>t.id==='newer-live-only'));
      assert.deepEqual(await bytes(page),before);
      await readContext.close();
      console.log('PASS Chromium actual backup UI: denied existing-vault '+label+
        ' read aborts confirmed restore without writes; newer ledger survives reload');
    }

    // The WEB 18.64 save path re-reads revision after PAYLOAD setItem. A
    // SecurityError on that read can make an already committed restore look
    // unsuccessful. This is a characterization of ambiguous acknowledgment,
    // NOT evidence of a naturally occurring browser failure.
    const readbackContext=await browser.newContext({viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,colorScheme:'light'});
    page=await readbackContext.newPage();
    const beforeReadback=await prepareExisting(page,url,backup,liveState);
    await page.evaluate(({key,payload})=>{
      const originalSet=Storage.prototype.setItem;
      const originalGet=Storage.prototype.getItem;
      window.__faPayloadCommitted=false;
      window.__faReadbackFaultHits=0;
      Storage.prototype.setItem=function(name,value){
        const result=originalSet.call(this,name,value);
        if(this===localStorage&&name===payload)window.__faPayloadCommitted=true;
        return result
      };
      Storage.prototype.getItem=function(name){
        if(this===localStorage&&name===key&&window.__faPayloadCommitted){
          window.__faReadbackFaultHits++;
          throw new DOMException('Synthetic post-write readback denial','SecurityError');
        }
        return originalGet.call(this,name)
      };
      window.__faDisarmReadback=()=>{
        Storage.prototype.setItem=originalSet;
        Storage.prototype.getItem=originalGet;
      };
    },{key:KEY,payload:PAYLOAD});
    await page.getByText('Confirm înlocuirea datelor',{exact:true}).click();
    await page.waitForFunction(()=>window.__faReadbackFaultHits>0,null,{timeout:15000});
    await page.waitForTimeout(200);
    assert.equal(await page.getByText('Backup restaurat.',{exact:true}).count(),0,
      'Committed-but-unverified restore must not display success');
    await page.evaluate(()=>window.__faDisarmReadback());
    const afterReadback=await bytes(page);
    const readbackAck=await observeAck(page,beforeReadback,expectedBackupState);
    assert.equal(readbackAck.status,'verified_target_present',
      'Post-write read denial is ambiguous even when target authenticates');
    console.log('PASS Chromium read-only acknowledgment: post-write KEY read denial yields authenticated target, no automatic retry');
    assert.equal(afterReadback.key,beforeReadback.key,
      'Existing AES key must be preserved');
    assert.notEqual(afterReadback.payload,beforeReadback.payload,
      'PAYLOAD was committed before readback failed');
    assert.equal(afterReadback.reset,beforeReadback.reset);
    await openReal(page,url);
    const readbackRestored=await page.evaluate(async()=>window.__r(309).load());
    assert.equal(readbackRestored.transactions.length,1);
    assert.equal(readbackRestored.transactions[0].id,fixture.transactions[0].id);
    assert.equal(readbackRestored.transactions.some(t=>t.id==='newer-live-only'),false);
    assert.deepEqual(await bytes(page),afterReadback);
    await readbackContext.close();
    console.log('PASS KNOWN AMBIGUOUS Chromium actual backup UI: post-PAYLOAD readback denial reports failure although older backup committed; reload authenticates committed state');

  }catch(err){
    if(page)try{console.error('Browser excerpt:',(await page.locator('body').innerText()).slice(0,1200))}
    catch{}
    throw err
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve))
  }
}
run().catch(err=>{console.error(err.stack||err);process.exitCode=1});
