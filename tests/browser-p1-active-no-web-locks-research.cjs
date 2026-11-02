'use strict';
// P1 #4/#29/#35: ACTUAL WEB 18.72 module 309, disposable Chromium real-mode origin.
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
    console.log('PASS P1 real WEB 18.72: missing Web Locks rejects first save and reset, zero protected writes');

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
    console.log('PASS P1 real WEB 18.72: missing Web Locks rejects update and destructive reset; reload retains authenticated ledger');
    console.log('LIMIT: cooperative current bundle only; archived v1 cached writers remain KNOWN UNSAFE; no Safari, crash, cutover or recovery proof');
    await context.close();
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
