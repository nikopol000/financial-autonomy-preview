'use strict';
// P1 #4/#29/#35: actual WEB 18.73 reset failure on short/tall mobile
// viewports and system light/dark. All data are disposable synthetic AES-GCM.
// This is Chromium geometry/keyboard research, NOT Safari/VoiceOver certification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const KEYS=['financial-autonomy.preview.key.v1','financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
const fixture=()=>({version:4,names:[],nameChanges:[],rolesEffectiveFrom:'2026-11-03',
  balanceChecks:[],checkAudit:[],currency:'RON',started:'2026-11-03',
  accounts:[{id:'mobile-p1-checking',name:'Cont sintetic',kind:'current',opening:1000,date:'2026-11-03'}],
  incomes:[],expenses:[],debts:[],recurring:[],
  transactions:[{id:'mobile-p1-expense',name:'Tranzacție sintetică',kind:'expense',
    accountId:'mobile-p1-checking',amount:25,date:'2026-11-03',details:[]}],
  monthPlans:[{month:'2026-11',budgets:[],expenses:[],debtPayments:[],contribution:0}],
  goals:[],plans:[],reviews:{},audit:[]});
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
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript; charset=utf-8':
      'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(bytes);
  });
}
async function ready(page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof window.__r==='function'&&
    typeof window.__r(309).save==='function'&&typeof window.__r(309).resetData==='function',
    null,{timeout:30000});
  // __r is available before React mounts; wait for actual mobile UI.
  await page.getByRole('tab',{name:'Mai mult',exact:true}).waitFor({state:'visible',timeout:20000});
}
async function dismissRecap(page){
  for(let i=0;i<6;i++){
    if(!(await page.getByText(/RECAPITULARE\s*·/).count()))return;
    const next=page.getByRole('button',{name:/Am văzut|Continuă|Gata|Închide/i}).first();
    if(!(await next.count()))return;
    await next.click({timeout:5000});
  }
  assert.equal(await page.getByText(/RECAPITULARE\s*·/).count(),0,'recap must close');
}
async function digest(page){
  return page.evaluate(async names=>{
    const entries=names.map(k=>localStorage.getItem(k));
    const bytes=new TextEncoder().encode(JSON.stringify(entries));
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    return {present:entries.map(v=>v!==null),sha256:Array.from(new Uint8Array(hash))
      .map(v=>v.toString(16).padStart(2,'0')).join('')};
  },KEYS);
}
async function probe(browser,url,width,height,theme){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,
    serviceWorkers:'block'});
  const page=await context.newPage();
  const label=width+'x'+height+'-'+theme;
  try{
    await ready(page,url);
    await page.evaluate(state=>window.__r(309).save(state),fixture());
    // Keep the already-mounted real-mode shell; the reset UI test does not
    // require a second mount before exercising the denied-lock handler.
    await dismissRecap(page);
    // Narrow WEB shell exposes Settings inside the original More tab.
    const more=page.getByRole('tab',{name:'Mai mult',exact:true});
    if(await more.count()){
      await more.click({timeout:10000});
      await page.getByText('Setări',{exact:true}).last().click({timeout:10000});
    }
    // The app's AUTO theme follows local solar time, not prefers-color-scheme.
    // Explicitly choose the actual app palette in this disposable context.
    await page.getByRole('button',{name:theme==='dark'?'Întunecată':'Luminoasă',exact:true})
      .click({timeout:10000});
    await page.waitForFunction(expected=>document.documentElement.style.colorScheme===expected,
      theme,{timeout:10000});
    assert.equal(await page.evaluate(()=>document.documentElement.style.colorScheme),theme,
      label+' must render the requested actual app palette');
    const navState=await page.evaluate(()=>({tabs:[...document.querySelectorAll('[role="tab"]')].map(e=>({text:e.textContent?.slice(0,40),selected:e.getAttribute('aria-selected')})),buttons:[...document.querySelectorAll('button,[role="button"]')].map(e=>e.getAttribute('aria-label')||e.textContent?.slice(0,60)).slice(0,35),body:document.body.innerText.slice(0,550)}));
    console.log('P1 MOBILE NAV '+label+' '+JSON.stringify(navState));
    await page.getByRole('button',{name:'Șterge toate datele',exact:true}).waitFor({state:'visible',timeout:15000});
    const before=await digest(page);
    assert.deepEqual(before.present.slice(0,2),[true,true],label+' must start with encrypted fixture');
    await page.getByRole('button',{name:'Șterge toate datele',exact:true}).click({timeout:10000});
    const confirm=page.getByRole('button',{name:'Da, șterge toate datele'});
    await confirm.waitFor({state:'visible',timeout:8000});
    await page.evaluate(names=>{
      const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
      window.__mobileP1={requests:0,writes:0,restore(){
        delete navigator.locks;Storage.prototype.setItem=set;
        Storage.prototype.removeItem=remove;Storage.prototype.clear=clear;
      }};
      Storage.prototype.setItem=function(k,v){
        if(this===localStorage&&names.includes(k))window.__mobileP1.writes++;
        return set.call(this,k,v);
      };
      Storage.prototype.removeItem=function(k){
        if(this===localStorage&&names.includes(k))window.__mobileP1.writes++;
        return remove.call(this,k);
      };
      Storage.prototype.clear=function(){
        if(this===localStorage)window.__mobileP1.writes++;
        return clear.call(this);
      };
      Object.defineProperty(navigator,'locks',{configurable:true,value:{
        request(){window.__mobileP1.requests++;
          return Promise.reject(new DOMException('Synthetic mobile lock denial','SecurityError'));}
      }});
    },KEYS);
    let geometry;
    try{
      await confirm.click({timeout:10000});
      await confirm.waitFor({state:'hidden',timeout:8000});
      const alert=page.locator('#fa-app-error-alert');
      await alert.waitFor({state:'visible',timeout:8000});
      await page.waitForFunction(()=>document.activeElement?.id==='fa-app-error-alert',
        null,{timeout:8000});
      assert.equal(await alert.getAttribute('role'),'alert',label+' alert role');
      assert.equal(await alert.getAttribute('aria-live'),'assertive',label+' live region');
      const copy=await alert.innerText();
      assert.match(copy,/Ștergerea nu a fost confirmată/,label);
      assert.match(copy,/Starea datelor poate fi incertă/,label);
      assert.doesNotMatch(copy,/datele (au rămas|sunt) intacte/i,label);
      geometry=await page.evaluate(()=>{
        const el=document.getElementById('fa-app-error-alert'),r=el.getBoundingClientRect();
        const x=Math.min(innerWidth-1,Math.max(1,r.left+r.width/2));
        const y=Math.min(innerHeight-1,Math.max(1,r.top+r.height/2));
        const hit=document.elementFromPoint(x,y);
        return {width:innerWidth,height:innerHeight,top:r.top,bottom:r.bottom,
          left:r.left,right:r.right,visible:!!el.getClientRects().length,
          fullyInViewport:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,
          centerHit:!!hit&&(hit===el||el.contains(hit)),focused:document.activeElement===el,
          requests:window.__mobileP1.requests,writes:window.__mobileP1.writes,
          prefersDark:matchMedia('(prefers-color-scheme: dark)').matches,
          appColorScheme:document.documentElement.style.colorScheme};
      });
      assert.equal(geometry.requests,1,label+' must request one lock');
      assert.equal(geometry.writes,0,label+' must not write protected bytes');
      assert.equal(geometry.focused,true,label+' focus must land on warning');
      assert.equal(geometry.appColorScheme,theme,label+' actual app palette after reset');
      assert.equal(geometry.visible,true,label+' warning must be rendered');
      assert.deepEqual(await digest(page),before,label+' ciphertext unchanged on denied lock');
      const folder=path.join(ROOT,'artifacts','p1-reset-alert-mobile');
      fs.mkdirSync(folder,{recursive:true});
      await page.screenshot({path:path.join(folder,label+'.png'),fullPage:true});
    }finally{await page.evaluate(()=>window.__mobileP1?.restore());}
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>typeof window.__r==='function'&&typeof window.__r(309).load==='function',null,{timeout:30000});
    const loaded=await page.evaluate(()=>window.__r(309).load());
    assert.deepEqual(loaded.transactions.map(t=>t.id),['mobile-p1-expense'],
      label+' reload must authenticate original ledger');
    console.log('P1 MOBILE RESET ALERT RESEARCH '+label+' '+JSON.stringify(geometry));
    return geometry;
  }finally{await context.close();}
}
async function main(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    const results=[];
    for(const width of [320,390])for(const height of [422,844])
      for(const theme of ['light','dark'])results.push(await probe(browser,url,width,height,theme));
    assert.equal(results.length,8);
    console.log('PASS P1 WEB 18.73: eight synthetic mobile reset-denial paths retain ciphertext, alert and keyboard focus');
    console.log('LIMIT: geometric results characterize Chromium only; center-hit/viewport flags are reported, not accepted as Safari/VoiceOver evidence');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
