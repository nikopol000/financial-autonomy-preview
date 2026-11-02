'use strict';
// P1 #4/#29/#35: ACTUAL WEB 18.73 module 309, disposable Chromium real-mode origin.
// Verify missing Web Locks fails closed for first save, later save and reset.
// NOT a proof of safety against archived noncooperating tabs or an approved cutover.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const NAMES=['financial-autonomy.preview.key.v1',
  'financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
const fixture=()=>{
  const date='2026-11-02';
  return {version:4,names:[],nameChanges:[],rolesEffectiveFrom:date,
    balanceChecks:[],checkAudit:[],currency:'RON',started:date,
    accounts:[{id:'p1-lock-checking',name:'Cont sintetic',kind:'current',
      opening:10000,date}],incomes:[],expenses:[],debts:[],recurring:[],
    transactions:[{id:'p1-lock-expense',name:'Operațiune sintetică',kind:'expense',
      accountId:'p1-lock-checking',amount:125,date,details:[]}],
    monthPlans:[{month:'2026-11',budgets:[],expenses:[],debtPayments:[],contribution:0}],
    goals:[],plans:[],reviews:{},audit:[]};
};
function serve(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'||pathname===PREFIX?'index.html':
    pathname.startsWith(PREFIX)?pathname.slice(PREFIX.length):'';
  const file=path.resolve(ROOT,relative);
  if(!relative||(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html'))){
    res.writeHead(404);res.end();return;
  }
  fs.readFile(file,(err,bytes)=>{
    if(err){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?
      'application/javascript; charset=utf-8':'text/html; charset=utf-8',
      'Cache-Control':'no-store'});res.end(bytes);
  });
}
async function ready(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof window.__r==='function'&&
    typeof window.__r(309).save==='function'&&
    typeof window.__r(309).resetData==='function',null,{timeout:30000});
}
async function snapshot(page){
  // Only a digest of the full protected bytes is returned, never secrets.
  return page.evaluate(async names=>{
    const values=names.map(n=>localStorage.getItem(n));
    const bytes=new TextEncoder().encode(JSON.stringify(values));
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
      .map(x=>x.toString(16).padStart(2,'0')).join('');
    return {present:values.map(v=>v!==null),digest:hash};
  },NAMES);
}
async function denyLocks(page,action,state){
  return page.evaluate(async({names,action,state})=>{
    const originalSet=Storage.prototype.setItem;
    const originalRemove=Storage.prototype.removeItem;
    const originalClear=Storage.prototype.clear;
    let writes=0;
    Storage.prototype.setItem=function(name,value){
      if(this===localStorage&&names.includes(name))writes++;
      return originalSet.call(this,name,value);
    };
    Storage.prototype.removeItem=function(name){
      if(this===localStorage&&names.includes(name))writes++;
      return originalRemove.call(this,name);
    };
    Storage.prototype.clear=function(){
      if(this===localStorage)writes++;
      return originalClear.call(this);
    };
    Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});
    let result;
    try{
      assertNeverAvailable();
      if(action==='save')await window.__r(309).save(state);
      else await window.__r(309).resetData();
      result={rejected:false,message:''};
    }catch(error){
      result={rejected:true,message:String(error?.message||error)};
    }finally{
      delete navigator.locks;
      Storage.prototype.setItem=originalSet;
      Storage.prototype.removeItem=originalRemove;
      Storage.prototype.clear=originalClear;
    }
    return {...result,writes,lockRestored:typeof navigator.locks?.request==='function'};
    function assertNeverAvailable(){
      if(window.__r(309).canWriteReal()||typeof navigator.locks?.request==='function')
        throw Error('RESEARCH_LOCK_OVERRIDE_FAILED');
    }
  },{names:NAMES,action,state});
}

async function rejectLockRequest(page,action,state,mode){
  // A LockManager can exist but deny an individual request. This is distinct
  // from navigator.locks being absent, and canWriteReal() still returns true.
  return page.evaluate(async({names,action,state,mode})=>{
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
    const clear=Storage.prototype.clear;
    let writes=0,requests=0,callbackCalled=false;
    Storage.prototype.setItem=function(k,v){
      if(this===localStorage&&names.includes(k))writes++;
      return set.call(this,k,v);
    };
    Storage.prototype.removeItem=function(k){
      if(this===localStorage&&names.includes(k))writes++;
      return remove.call(this,k);
    };
    Storage.prototype.clear=function(){
      if(this===localStorage)writes++;
      return clear.call(this);
    };
    Object.defineProperty(navigator,'locks',{configurable:true,value:{
      request(_name,_options,_callback){
        requests++;
        if(mode==='throw')throw new DOMException('Synthetic Web Lock permission denied','SecurityError');
        return Promise.reject(new DOMException('Synthetic Web Lock permission denied','SecurityError'));
      }
    }});
    const advertised=window.__r(309).canWriteReal();
    let rejected=false,message='';
    try{
      if(action==='save')await window.__r(309).save(state);
      else await window.__r(309).resetData();
    }catch(error){rejected=true;message=String(error?.message||error)}
    finally{
      delete navigator.locks;
      Storage.prototype.setItem=set;
      Storage.prototype.removeItem=remove;
      Storage.prototype.clear=clear;
    }
    return {rejected,message,writes,requests,callbackCalled,advertised,
      lockRestored:typeof navigator.locks?.request==='function'};
  },{names:NAMES,action,state,mode});
}
function expectRejectedLock(result,label){
  assert.equal(result.rejected,true,label+' must reject lock request failure');
  assert.match(result.message,/Synthetic Web Lock permission denied/,label+' must surface rejection');
  assert.equal(result.requests,1,label+' must request one exclusive lock');
  assert.equal(result.writes,0,label+' must not mutate encrypted vault');
  assert.equal(result.lockRestored,true,label+' must restore native lock implementation');
  // Characterization: the synchronous UI predicate sees a request method,
  // not the outcome of the later async request. This is not a safe UI signal.
  assert.equal(result.advertised,true,label+' exposes canWriteReal false-positive');
}

function expectDenied(result,label){
  assert.equal(result.rejected,true,label+' must fail closed');
  assert.match(result.message,/Web Locks/,label+' must give actionable reason');
  assert.equal(result.writes,0,label+' must make zero protected writes');
  assert.equal(result.lockRestored,true,'real browser Web Locks must be restored');
}
async function main(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    const context=await browser.newContext({serviceWorkers:'block'});
    const page=await context.newPage();
    await ready(page,url);
    const initial=await page.evaluate(()=>window.__r(309).load());
    assert.ok(initial&&Array.isArray(initial.transactions));
    const before=await snapshot(page);
    assert.deepEqual(before.present,[false,false,false]);
    const deniedFirst=await denyLocks(page,'save',fixture());
    expectDenied(deniedFirst,'fresh first save without Web Locks');
    assert.deepEqual(await snapshot(page),before,'first-save denial must preserve empty vault');
    const deniedEmptyReset=await denyLocks(page,'reset',null);
    expectDenied(deniedEmptyReset,'empty reset without Web Locks');
    assert.deepEqual(await snapshot(page),before,'empty reset denial must preserve vault');
    console.log('PASS P1 real WEB 18.73: missing Web Locks rejects first save and reset, zero protected writes');
    for(const action of ['save','reset']){
      const denied=await rejectLockRequest(page,action,action==='save'?fixture():null,'throw');
      expectRejectedLock(denied,'fresh '+action+' synchronous LockManager SecurityError');
      assert.deepEqual(await snapshot(page),before,'lock-request throw must preserve empty vault');
    }
    console.log('PASS P1 real WEB 18.73: present LockManager synchronous denial rejects first save/reset with zero writes; UI predicate overstates availability');

    await page.evaluate(state=>window.__r(309).save(state),fixture());
    const committed=await snapshot(page);
    assert.deepEqual(committed.present.slice(0,2),[true,true]);
    const changed=fixture();
    changed.transactions.push({...changed.transactions[0],id:'p1-lock-newer',amount:375});
    const deniedUpdate=await denyLocks(page,'save',changed);
    expectDenied(deniedUpdate,'existing vault update without Web Locks');
    assert.deepEqual(await snapshot(page),committed,'update denial must preserve authenticated bytes');
    const deniedReset=await denyLocks(page,'reset',null);
    expectDenied(deniedReset,'existing vault reset without Web Locks');
    assert.deepEqual(await snapshot(page),committed,'reset denial must preserve authenticated bytes');
    await ready(page,url);
    const reloaded=await page.evaluate(()=>window.__r(309).load());
    assert.deepEqual(reloaded.transactions.map(t=>t.id),['p1-lock-expense'],
      'reload must authenticate the original synthetic transaction only');
    assert.deepEqual(await snapshot(page),committed);
    console.log('PASS P1 real WEB 18.73: missing Web Locks rejects update and destructive reset; reload retains authenticated ledger');
    for(const action of ['save','reset']){
      const denied=await rejectLockRequest(page,action,action==='save'?changed:null,'reject');
      expectRejectedLock(denied,'existing '+action+' async LockManager SecurityError');
      assert.deepEqual(await snapshot(page),committed,'async lock denial must preserve authenticated bytes');
    }
    await ready(page,url);
    assert.deepEqual((await page.evaluate(()=>window.__r(309).load())).transactions.map(t=>t.id),
      ['p1-lock-expense'],'lock request denials must not alter reloaded ledger');
    console.log('PASS P1 real WEB 18.73: present LockManager async rejection blocks update/reset; authenticated ledger unchanged');
    // Characterize the ACTUAL reset-confirmation UI after a LockManager denial.
    // The UI may keep the confirmation modal open while placing its error alert
    // behind that modal. This is research, NOT a destructive reset workaround.
    await ready(page,url);
    await page.getByRole('button',{name:'Setări de aspect'}).waitFor({state:'visible',timeout:15000});
    for(let step=0;step<6;step++){
      const recap=await page.getByText(/RECAPITULARE\\s*·/).count();
      if(!recap)break;
      const next=page.getByRole('button',{name:/Am văzut|Continuă|Gata|Închide/i}).first();
      if(!(await next.count()))break;
      await next.click({timeout:3000});
    }
    await page.getByRole('button',{name:'Setări de aspect'}).click({timeout:5000});
    await page.getByRole('button',{name:'Șterge toate datele',exact:true}).click({timeout:5000});
    await page.getByRole('button',{name:'Da, șterge toate datele'}).waitFor({state:'visible'});
    const beforeUiDenied=await snapshot(page);
    await page.evaluate(names=>{
      const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
      window.__p1DeniedUi={writes:0,requests:0,restore(){
        delete navigator.locks;
        Storage.prototype.setItem=set;Storage.prototype.removeItem=remove;Storage.prototype.clear=clear;
      }};
      Storage.prototype.setItem=function(k,v){
        if(this===localStorage&&names.includes(k))window.__p1DeniedUi.writes++;
        return set.call(this,k,v);
      };
      Storage.prototype.removeItem=function(k){
        if(this===localStorage&&names.includes(k))window.__p1DeniedUi.writes++;
        return remove.call(this,k);
      };
      Storage.prototype.clear=function(){
        if(this===localStorage)window.__p1DeniedUi.writes++;
        return clear.call(this);
      };
      Object.defineProperty(navigator,'locks',{configurable:true,value:{
        request(){window.__p1DeniedUi.requests++;return Promise.reject(
          new DOMException('Synthetic Web Lock permission denied','SecurityError'));}
      }});
    },NAMES);
    let deniedUi;
    try{
      await page.getByRole('button',{name:'Da, șterge toate datele'}).click({timeout:5000});
      await page.waitForFunction(()=>[...document.querySelectorAll('[role="alert"]')]
        .some(el=>el.textContent.includes('Synthetic Web Lock permission denied')),
        null,{timeout:8000});
      await page.getByRole('button',{name:'Da, șterge toate datele'}).waitFor({state:'hidden',timeout:8000});
      const alert=page.locator('#fa-app-error-alert');
      await alert.waitFor({state:'visible',timeout:8000});
      assert.match(await alert.innerText(),/Ștergerea nu a fost confirmată/);
      assert.match(await alert.innerText(),/Starea datelor poate fi incertă/);
      assert.match(await alert.innerText(),/Nu șterge datele site-ului/);
      assert.equal(await alert.getAttribute('role'),'alert');
      assert.equal(await alert.getAttribute('aria-live'),'assertive');
      await page.waitForFunction(()=>document.activeElement?.id==='fa-app-error-alert',null,{timeout:8000});
      deniedUi=await page.evaluate(()=>{
        const alerts=[...document.querySelectorAll('[role="alert"]')];
        const error=alerts.find(el=>el.textContent.includes('Synthetic Web Lock permission denied'));
        const heading=[...document.querySelectorAll('*')].find(el=>
          el.children.length===0&&el.textContent?.trim()==='Ștergi toate datele?');
        const visible=el=>!!el&&!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
        return {writes:window.__p1DeniedUi.writes,requests:window.__p1DeniedUi.requests,
          errorInDom:!!error,errorVisibleByCss:visible(error),
          confirmationStillVisible:visible(heading),
          errorText:error?.textContent.slice(0,180)||''};
      });
    }finally{await page.evaluate(()=>window.__p1DeniedUi?.restore());}
    assert.equal(deniedUi.confirmationStillVisible,false,'failed reset confirmation must close');
    assert.equal(deniedUi.errorVisibleByCss,true,'error must be visible after modal dismissal');
    assert.equal(deniedUi.requests,1,'UI reset must request one lock');
    assert.equal(deniedUi.writes,0,'UI denial must not touch protected storage');
    assert.deepEqual(await snapshot(page),beforeUiDenied,'UI denial preserves ciphertext');
    await ready(page,url);
    assert.deepEqual((await page.evaluate(()=>window.__r(309).load())).transactions.map(t=>t.id),
      ['p1-lock-expense'],'UI denial reload must authenticate original transaction');
    console.log('PASS P1 WEB 18.73 UI reset LockManager denial: accessible alert, modal dismissed, focus restored, '+JSON.stringify(deniedUi));
    // Success path: real exclusive lock still resets only a disposable synthetic vault.
    await page.getByRole('button',{name:'Setări de aspect'}).click({timeout:5000});
    await page.getByRole('button',{name:'Șterge toate datele',exact:true}).click({timeout:5000});
    await page.getByRole('button',{name:'Da, șterge toate datele'}).click({timeout:5000});
    await page.getByText(/Datele au fost șterse/).waitFor({state:'visible',timeout:8000});
    const successful=await snapshot(page);
    assert.deepEqual(successful.present.slice(0,2),[false,false],
      'successful reset must remove both synthetic vault entries');
    console.log('PASS P1 WEB 18.73 UI successful reset: modal dismissed, success feedback, vault entries cleared');

    // Fault injection: payload removal succeeds, key removal fails. The error
    // must not claim the vault is intact or attempt any automatic repair.
    const partialContext=await browser.newContext({serviceWorkers:'block'});
    const partialPage=await partialContext.newPage();
    await ready(partialPage,url);
    await partialPage.evaluate(state=>window.__r(309).save(state),fixture());
    await ready(partialPage,url);
    await partialPage.getByRole('button',{name:'Setări de aspect'}).waitFor({state:'visible'});
    for(let step=0;step<6;step++){
      if(!(await partialPage.getByText(/RECAPITULARE\\s*·/).count()))break;
      const next=partialPage.getByRole('button',{name:/Am văzut|Continuă|Gata|Închide/i}).first();
      if(!(await next.count()))break;
      await next.click({timeout:3000});
    }
    await partialPage.getByRole('button',{name:'Setări de aspect'}).click({timeout:5000});
    await partialPage.getByRole('button',{name:'Șterge toate datele',exact:true}).click({timeout:5000});
    await partialPage.evaluate(()=>{
      const original=Storage.prototype.removeItem;
      window.__partialRestore=()=>{Storage.prototype.removeItem=original;};
      Storage.prototype.removeItem=function(name){
        if(this===localStorage&&name==='financial-autonomy.preview.key.v1')
          throw new DOMException('Synthetic partial reset key removal denied','SecurityError');
        return original.call(this,name);
      };
    });
    try{
      await partialPage.getByRole('button',{name:'Da, șterge toate datele'}).click({timeout:5000});
      await partialPage.getByRole('button',{name:'Da, șterge toate datele'}).waitFor({state:'hidden',timeout:8000});
      const warning=partialPage.locator('#fa-app-error-alert');
      await warning.waitFor({state:'visible',timeout:8000});
      const copy=await warning.innerText();
      assert.match(copy,/Starea datelor poate fi incertă/);
      assert.match(copy,/Nu șterge datele site-ului/);
      assert.doesNotMatch(copy,/datele (au rămas|sunt) intacte/i);
      assert.deepEqual((await snapshot(partialPage)).present.slice(0,2),[true,false],
        'injected second removal failure must be acknowledged as a partial reset');
      console.log('PASS P1 WEB 18.73 partial-delete UI: uncertainty warning, no false intact claim, modal dismissed');
    }finally{await partialPage.evaluate(()=>window.__partialRestore?.());await partialContext.close();}
    console.log('UI RESEARCH LIMIT: DOM alert and modal visibility do not prove screen-reader announcement or Safari behavior');
    console.log('LIMIT: cooperative current bundle only; archived v1 cached writers remain KNOWN UNSAFE; no Safari, crash, cutover or recovery proof');
    await context.close();
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
