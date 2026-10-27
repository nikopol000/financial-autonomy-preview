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
(async()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  assert.match(html,/<meta name="financial-autonomy-version" content="18\.59"/);
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    await caseLiveRetry(browser,url);
    await caseReloadBeforeRetry(browser,url);
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});
