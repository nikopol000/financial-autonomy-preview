'use strict';
// WEB v18.47 blocked-vault visual/accessibility audit against the ACTUAL app.
// Research/test only. Synthetic storage, disposable localhost contexts, no writes
// to any real user profile, no financial data, no product UX activation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PREFIX = '/financial-autonomy-preview/';
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const OUT = path.join(ROOT, 'artifacts', 'browser-vault-ui');
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
function serve(req,res) {
  const pathname = new URL(req.url,'http://localhost').pathname;
  const relative = pathname === '/' || pathname === PREFIX || pathname === PREFIX.slice(0,-1)
    ? 'index.html' : pathname.startsWith(PREFIX) ? pathname.slice(PREFIX.length) : '';
  const absolute = path.resolve(ROOT,relative);
  if(!relative || !absolute.startsWith(ROOT+path.sep) && absolute !== path.join(ROOT,'index.html')){
    res.writeHead(403);res.end('Forbidden');return;
  }
  fs.readFile(absolute,(error,body)=>{
    if(error){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(absolute)]||'application/octet-stream',
      'Cache-Control':'no-store'});res.end(body);
  });
}
async function snapshot(page) {
  return page.evaluate(keys=>keys.map(k=>window.__vaultAuditRawGet?window.__vaultAuditRawGet(k):localStorage.getItem(k)),[KEY,PAYLOAD,RESET]);
}
async function audit(browser,url,{width,scheme,unknownReset=false,deniedRead=false}) {
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,
    isMobile:true,hasTouch:true,colorScheme:scheme,timezoneId:'Europe/Bucharest',reducedMotion:'reduce'});
  // The only seeded bytes are deliberately invalid synthetic placeholders.
  await context.addInitScript(({key,payload,reset,unknownReset,deniedRead})=>{
    localStorage.setItem(key,'a'.repeat(64));
    if(unknownReset)localStorage.setItem(reset,'synthetic-unknown-reset-v99');
    if(deniedRead){
      const rawGet=Storage.prototype.getItem;
      const rawSet=Storage.prototype.setItem;
      const rawRemove=Storage.prototype.removeItem;
      window.__vaultAuditRawGet=k=>rawGet.call(localStorage,k);
      window.__vaultAuditWriteCalls=[];
      // Inject a real SecurityError at the reset-journal read boundary.
      // Do not alter stored bytes or interfere with non-vault preferences.
      Storage.prototype.getItem=function(k){
        if(this===localStorage&&k===reset)
          throw new DOMException('Synthetic reset read denied','SecurityError');
        return rawGet.call(this,k);
      };
      Storage.prototype.setItem=function(k,v){
        if(this===localStorage&&[key,payload,reset].includes(String(k)))
          window.__vaultAuditWriteCalls.push(['set',String(k)]);
        return rawSet.call(this,k,v);
      };
      Storage.prototype.removeItem=function(k){
        if(this===localStorage&&[key,payload,reset].includes(String(k)))
          window.__vaultAuditWriteCalls.push(['remove',String(k)]);
        return rawRemove.call(this,k);
      };
    }
  },{key:KEY,payload:PAYLOAD,reset:RESET,unknownReset,deniedRead});
  const page=await context.newPage();
  try {
    // The app's default appearance is AUTO based on local time in Romania,
    // not the browser's prefers-color-scheme. A colorScheme-only emulation
    // previously produced byte-identical light/dark screenshots. Freeze Date
    // to noon vs midnight without freezing timers or changing vault storage.
    await page.clock.setFixedTime(new Date(scheme==='light'
      ? '2026-06-15T12:00:00Z' : '2026-06-15T00:00:00Z'));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    const title=page.getByText('Datele locale nu pot fi deschise',{exact:true});
    await title.waitFor({state:'visible',timeout:30000});
    const themeState=await page.evaluate(()=>({now:new Date().toString(),
      mode:document.documentElement.style.colorScheme,body:getComputedStyle(document.body).backgroundColor}));
    console.log('AUDIT actual app theme '+scheme+' '+JSON.stringify(themeState));
    await page.waitForFunction(expected=>document.documentElement.style.colorScheme===expected,
      scheme,{timeout:10000});
    const appColorScheme=await page.evaluate(()=>document.documentElement.style.colorScheme);
    assert.equal(appColorScheme,scheme,'The actual app palette must use the requested theme');
    const guidance=page.getByText(/Nu șterge datele site-ului și nu reseta aplicația/);
    await guidance.waitFor({state:'visible',timeout:10000});
    if(!unknownReset&&!deniedRead){
      const banner=page.getByText(/Cheia locală există, dar datele criptate lipsesc/).first();
      await banner.waitFor({state:'visible',timeout:10000});
      assert.match(await banner.innerText(),/Nu vom șterge cheia și nu vom crea automat date noi/);
      assert.equal(await page.getByText(/folosește resetarea explicită|până la resetarea explicită/i).count(),0,
        'Blocked-vault warning must never suggest reset as recovery');
    }
    const retry=page.getByRole('button',{name:'Reîncearcă deschiderea'});
    await retry.waitFor({state:'visible',timeout:10000});
    const before=await snapshot(page);
    assert.equal(before[0],'a'.repeat(64));
    assert.equal(before[1],null);
    assert.equal(before[2],unknownReset?'synthetic-unknown-reset-v99':null);
    assert.equal(await page.getByRole('button',{name:/șterge|resetează|înlocuiește/i}).count(),0,
      'Blocked state must not offer a destructive button');
    const box=await retry.boundingBox();
    assert.ok(box,'Retry must have a visible hit target');
    // Record exact geometry, contrast-related computed styles and semantics.
    // Computed CSS is diagnostic, not an unearned WCAG certification.
    const visual=await page.evaluate(()=>{
      const text=[...document.querySelectorAll('body *')];
      const title=text.find(x=>x.textContent?.trim()==='Datele locale nu pot fi deschise');
      const guidance=text.find(x=>x.textContent?.trim().startsWith('Nu șterge datele site-ului') &&
        x.children.length===0);
      const style=x=>x?{color:getComputedStyle(x).color,fontSize:getComputedStyle(x).fontSize,
        lineHeight:getComputedStyle(x).lineHeight,background:getComputedStyle(x).backgroundColor}:null;
      return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        headingRole:document.querySelector('[role="heading"],h1,h2')!==null,
        titleStyle:style(title),guidanceStyle:style(guidance)};
    });
    assert.ok(box.width>=44 && box.height>=44,
      'Retry target must be at least 44x44 CSS pixels at mobile viewport');
    assert.ok(visual.scrollWidth<=visual.viewport+2,
      'Blocked-vault screen must not cause horizontal page overflow');
    await retry.focus();
    const focus=await retry.evaluate(el=>({active:document.activeElement===el,
      outline:getComputedStyle(el).outlineStyle,outlineWidth:getComputedStyle(el).outlineWidth}));
    // React Native Web may delegate focus to a child; report without falsely
    // claiming keyboard/screen-reader certification.
    const label=(deniedRead?'denied-reset-read-':unknownReset?'unknown-reset-':'key-only-')+width+'-'+scheme;
    await page.screenshot({path:path.join(OUT,label+'.png'),fullPage:true});
    await retry.click();
    await title.waitFor({state:'visible',timeout:10000});
    assert.deepEqual(await snapshot(page),before,'Retry must preserve all original bytes');
    const vaultWrites=await page.evaluate(()=>window.__vaultAuditWriteCalls||[]);
    if(deniedRead)assert.deepEqual(vaultWrites,[],
      'Denied reset-marker reads must never cause vault writes or deletions');
    const result={case:label,viewport:width,theme:scheme,appColorScheme,
      simulatedTimeUTC:scheme==='light'?'2026-06-15T12:00:00Z':'2026-06-15T00:00:00Z',
      unknownReset,deniedRead,
      vaultWriteCalls:vaultWrites.length,
      retryTarget:{width:box.width,height:box.height},visual,focus,
      retryPreservedBytes:true,destructiveControls:0};
    console.log('PASS blocked WEB mobile UI '+label+'; target '+Math.round(box.width)+'x'+Math.round(box.height));
    return result;
  } finally {await context.close();}
}
function activeReleaseIdentity() {
  // Audit artifacts must describe the exact immutable release served by this
  // localhost test, never a manually copied version from a previous run.
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const version=html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
  const src=html.match(/<script src="([^"]+)" defer><\/script>/)?.[1];
  assert.ok(version && /^\d+\.\d+$/.test(version),'Missing valid active HTML release version');
  assert.ok(src,'Missing active HTML bundle reference');
  const parsed=new URL(src,'http://localhost');
  assert.ok(parsed.pathname.startsWith(PREFIX),'Bundle must use preview prefix');
  const token='v0'+version.replace('.','');
  assert.ok(parsed.pathname.includes('index-'+token+'-'),
    'Active immutable bundle filename must match HTML version');
  const build=parsed.searchParams.get('build');
  assert.ok(build && (build===version || build.startsWith(version+'.')),
    'Bundle cache key must match HTML version');
  assert.ok(fs.existsSync(path.resolve(ROOT,parsed.pathname.slice(PREFIX.length))),
    'Referenced immutable bundle must exist on disk');
  return {version,bundle:src};
}
async function main() {
  const release=activeReleaseIdentity();
  fs.mkdirSync(OUT,{recursive:true});
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    const results=[];
    for(const width of [320,390])for(const scheme of ['light','dark'])
      results.push(await audit(browser,url,{width,scheme}));
    results.push(await audit(browser,url,{width:390,scheme:'dark',unknownReset:true}));
    results.push(await audit(browser,url,{width:390,scheme:'light',deniedRead:true}));
    for(const width of [320,390]){
      const light=fs.readFileSync(path.join(OUT,'key-only-'+width+'-light.png'));
      const dark=fs.readFileSync(path.join(OUT,'key-only-'+width+'-dark.png'));
      assert.ok(!light.equals(dark),
        'Actual '+width+'px app light/dark screenshots must not be byte-identical');
    }
    fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify({
      product:'WEB '+release.version,bundle:release.bundle,origin:'localhost synthetic-only',results},null,2));
    console.log('PASS 6/6 actual Chromium blocked-vault UI states; real auto-theme light/dark differentiated at 320/390px');
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
