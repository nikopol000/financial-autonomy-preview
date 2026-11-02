'use strict';
// #85 C16: characterize real WEB 18.72 after legitimate recap dismissal.
// Disposable localhost DEMO only. No app mutations, vault import, or financial changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const OUT=path.join(ROOT,'artifacts','web85-c16-keyboard-pinch');
const KEYS=['financial-autonomy.preview.key.v1','financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
function serve(req,res){
 const url=new URL(req.url,'http://localhost');
 const rel=url.pathname==='/'||url.pathname===PREFIX||url.pathname===PREFIX.slice(0,-1)
  ?'index.html':url.pathname.startsWith(PREFIX)?url.pathname.slice(PREFIX.length):'';
 const file=path.resolve(ROOT,rel);
 if(!rel||(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html'))){
  res.writeHead(403);res.end('Forbidden');return;
 }
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(body);
 });
}
function release(){
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const version=html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/)?.[1];
 const src=html.match(/<script src="([^"]+)" defer><\/script>/)?.[1];
 assert.ok(['18.72','18.73'].includes(version),'#85 research targets only reviewed 18.72/18.73 More DOM; re-review future versions');
 assert.ok(src&&src.startsWith(PREFIX));
 assert.ok(fs.existsSync(path.join(ROOT,new URL(src,'http://localhost').pathname.slice(PREFIX.length))));
 return {version,src};
}
function measure(){
 const tabs=[...document.querySelectorAll('[role="tab"]')];
 const rect=el=>{
  if(!el)return null;
  const r=el.getBoundingClientRect();
  const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
  const hit=x>=0&&y>=0&&x<innerWidth&&y<innerHeight?document.elementFromPoint(x,y):null;
  return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,
   centerHit:!!hit&&(hit===el||el.contains(hit))};
 };
 const name=el=>el?.getAttribute('aria-label')||el?.textContent?.trim().slice(0,100)||null;
 const leaf=t=>[...document.querySelectorAll('*')].find(el=>el.children.length===0&&el.textContent?.trim()===t);
 const warning=leaf('DEMO · DATE FICTIVE');
 const exit=[...document.querySelectorAll('button,[role="button"]')].find(el=>name(el)?.includes('Ieși din demo'));
 const items=tabs.map(el=>({name:name(el),rect:rect(el)}));
 const overlap=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i].rect,b=items[j].rect;
  if(a&&b&&Math.max(a.x,b.x)<Math.min(a.x+a.w,b.x+b.w)&&Math.max(a.y,b.y)<Math.min(a.y+a.h,b.y+b.h))overlap.push([items[i].name,items[j].name]);
 }
 return {innerWidth,innerHeight,devicePixelRatio,visualScale:visualViewport?.scale??null,
  visualWidth:visualViewport?.width??null,scrollWidth:document.documentElement.scrollWidth,
  active:{tag:document.activeElement?.tagName,role:document.activeElement?.getAttribute('role'),name:name(document.activeElement)},
  tabs:items,overlap,warning:rect(warning),exit:rect(exit)};
}
async function safe(action){
 try{return {ok:true,value:await action()};}
 catch(e){return {ok:false,error:String(e.message).split('\n')[0].slice(0,180)};}
}
async function recapDismiss(page){
 const steps=[];
 for(let i=0;i<8;i++){
  const visible=await page.evaluate(()=>[...document.querySelectorAll('*')].some(el=>el.children.length===0&&/RECAPITULARE\s*·/.test(el.textContent||'')&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'));
  if(!visible){steps.push({step:i,cleared:true});break;}
  const choice=page.getByRole('button',{name:/Am văzut|continuă|Continuă|Gata|Închide/i}).first();
  const label=await safe(()=>choice.innerText());
  const click=await safe(()=>choice.click({timeout:2500}));
  steps.push({step:i,label:label.value?.trim().slice(0,100),click});
  if(!click.ok)break;
 }
 const remaining=await page.evaluate(()=>[...document.querySelectorAll('*')].some(el=>el.children.length===0&&/RECAPITULARE\s*·/.test(el.textContent||'')&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'));
 return {steps,remaining};
}
async function keyboardFind(page,label,max=90){
 const visited=[];
 for(let i=0;i<max;i++){
  await page.keyboard.press('Tab');
  const a=await page.evaluate(()=>{
   const el=document.activeElement;
   return {name:el?.getAttribute('aria-label')||el?.innerText?.trim().slice(0,90)||'',
    role:el?.getAttribute('role')||null,tag:el?.tagName||null};
  });
  visited.push(a);
  if(a.name===label||a.name.includes(label))return {found:true,tabs:i+1,visited};
 }
 return {found:false,tabs:max,visited:visited.slice(-12)};
}
(async()=>{
 const id=release();
 fs.mkdirSync(OUT,{recursive:true});
 const server=http.createServer(serve);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const url='http://127.0.0.1:'+server.address().port+PREFIX;
  const results=[];
  for(const width of [320,390])for(const height of [422,844])for(const theme of ['light','dark']){
   const label=[width,height,theme].join('-');
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,
    isMobile:true,hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});
   const page=await context.newPage();
   try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByText('DEMO · DATE FICTIVE',{exact:true}).waitFor({state:'visible',timeout:30000});
    const recap=await recapDismiss(page);
    const baseline=await page.evaluate(measure);
    // Keyboard navigation from a fresh document focus, without focusing a target by JS.
    await page.evaluate(()=>document.activeElement?.blur());
    const tabToMore=await keyboardFind(page,'Mai mult');
    const enter=tabToMore.found?await safe(()=>page.keyboard.press('Enter')):{ok:false,error:'More not reached via Tab'};
    const budgetVisible=await safe(()=>page.getByText('Bugete',{exact:true}).last().waitFor({state:'visible',timeout:1500}));
    const tabToBudget=enter.ok&&budgetVisible.ok?await keyboardFind(page,'Bugete',45):{found:false,visited:[]};
    const budgetEnter=tabToBudget.found?await safe(()=>page.keyboard.press('Enter')):{ok:false,error:'Bugete not reached via Tab'};
    // Open again with genuine pointer and test Escape/focus restoration (no DOM click bypass).
    const more=page.getByRole('tab',{name:'Mai mult',exact:true});
    const reopen=await safe(()=>more.click({timeout:1800}));
    const escape=reopen.ok?await safe(()=>page.keyboard.press('Escape')):{ok:false,error:'More not reopened'};
    const afterEscape=await page.evaluate(measure);
    // CDP native pinch/page-scale emulation, NOT browser Ctrl+ zoom or Safari Dynamic Type.
    const cdp=await context.newCDPSession(page);
    const pinch=await safe(()=>cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2}));
    const afterPinch=await page.evaluate(measure);
    await page.screenshot({path:path.join(OUT,label+'-pinch.png')});
    await safe(()=>cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1}));
    // Actual DEMO exit on disposable context; never import, restore or switch to real mode.
    const openForExit=await safe(()=>more.click({timeout:1800}));
    const exitButton=page.getByRole('button',{name:/Ieși din demo/});
    const exit=await safe(()=>exitButton.click({timeout:1800}));
    const afterExit=await page.evaluate(measure);
    const storage=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),KEYS);
    assert.deepEqual(storage,[null,null,null],'C16 must not create or touch real encrypted vault');
    const row={label,version:id.version,recap,baseline,tabToMore:{...tabToMore,visited:tabToMore.visited.slice(-15)},
     enter,budgetVisible,tabToBudget:{...tabToBudget,visited:tabToBudget.visited.slice(-15)},
     budgetEnter,reopen,escape,afterEscape,pinch,afterPinch,openForExit,exit,afterExit,
     noVault:true,scope:'actual original WEB 18.72; native CDP pinch only; no Safari/VoiceOver/browser Ctrl+ zoom'};
    results.push(row);
    console.log('C16 WEB85 '+JSON.stringify({label,recapRemaining:recap.remaining,tabToMore:row.tabToMore,
     enter,budgetVisible,tabToBudget:row.tabToBudget,budgetEnter,reopen,escape,
     focusAfterEscape:afterEscape.active,navOverlap:baseline.overlap,pinchScale:afterPinch.visualScale,
     pinchNavOverlap:afterPinch.overlap,warning:afterPinch.warning,exitGeometry:afterPinch.exit,
     openForExit,realExit:exit,afterExitWarning:afterExit.warning,noVault:true}));
   }finally{await context.close();}
  }
  assert.equal(results.length,8,'All eight C16 configurations must be characterized');
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({release:id,results},null,2));
  console.log('C16 COMPLETE '+JSON.stringify({cases:results.length,recapCleared:results.filter(r=>!r.recap.remaining).length,
   moreViaKeyboard:results.filter(r=>r.tabToMore.found&&r.enter.ok).length,
   budgetViaKeyboard:results.filter(r=>r.tabToBudget.found&&r.budgetEnter.ok).length,
   escapeRestoresMore:results.filter(r=>r.afterEscape.active.name==='Mai mult').length,
   actualDemoExitClicks:results.filter(r=>r.exit.ok).length,
   note:'Characterization only. Green CI is NOT an accessibility pass. Pinch is not browser Ctrl+ zoom or iOS Dynamic Type.'}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
