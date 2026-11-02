'use strict';
// #85 C18: measure original open More menu safety controls under mobile CDP pinch.
// Disposable localhost DEMO only. No app mutations, vault import, or financial changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const OUT=path.join(ROOT,'artifacts','web85-c18-open-menu-pinch');
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
 assert.equal(version,'18.72','C18 targets exact immutable WEB 18.72; review before later version');
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
  const vp=visualViewport,vx=vp?.offsetLeft??0,vy=vp?.offsetTop??0,vw=vp?.width??innerWidth,vh=vp?.height??innerHeight;
  const hit=x>=vx&&y>=vy&&x<vx+vw&&y<vy+vh?document.elementFromPoint(x,y):null;
  return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,visible:r.top>=vy&&r.bottom<=vy+vh&&r.left>=vx&&r.right<=vx+vw,
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
async function touchSwipe(cdp,x,fromY,toY){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:fromY}]});
 for(let i=1;i<=8;i++){
  const y=Math.round(fromY+(toY-fromY)*i/8);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  await new Promise(resolve=>setTimeout(resolve,22));
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
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
  for(const width of [320,390])for(const height of [422])for(const theme of ['light','dark'])for(const scale of [1,2]){
   const label=[width,height,theme,'scale'+scale].join('-');
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});
   const page=await context.newPage();
   try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByText('DEMO · DATE FICTIVE',{exact:true}).waitFor({state:'visible',timeout:30000});
    const recap=await recapDismiss(page);
    const more=page.getByRole('tab',{name:'Mai mult',exact:true});
    const open=await safe(()=>more.click({timeout:2500}));
    const exitButton=page.getByRole('button',{name:/Ieși din demo/});
    const openGeometry=await page.evaluate(measure);
    const cdp=await context.newCDPSession(page);
    const pinch=scale===2?await safe(()=>cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2})):{ok:true,skipped:true};
    const initial=await page.evaluate(measure);
    const scrollState=()=>page.evaluate(()=>({windowY:window.scrollY,documentTop:document.scrollingElement?.scrollTop??null,
      scrollables:[...document.querySelectorAll('*')].filter(el=>el.scrollHeight>el.clientHeight+2&&/auto|scroll/.test(getComputedStyle(el).overflowY))
       .slice(0,15).map(el=>({tag:el.tagName,role:el.getAttribute('role'),top:el.scrollTop,height:el.clientHeight,total:el.scrollHeight}))}));
    const initialScroll=await scrollState(),history=[];
    const visualHeight=Math.max(100,Math.floor(height/scale)),visualWidth=Math.max(100,Math.floor(width/scale));
    const startY=Math.round(visualHeight*.28),endY=Math.round(visualHeight*.83);
    for(let i=0;i<12;i++){
      const before=await page.evaluate(measure);
      if(before.warning?.visible&&before.exit?.visible&&before.exit?.centerHit)break;
      const swipe=await safe(()=>touchSwipe(cdp,Math.round(visualWidth*.5),startY,endY));
      await page.waitForTimeout(110);
      const after=await page.evaluate(measure);
      history.push({index:i+1,swipe,before:{warning:before.warning,exit:before.exit},after:{warning:after.warning,exit:after.exit},scroll:await scrollState()});
      if(!swipe.ok)break;
    }
    const afterScroll=await page.evaluate(measure);
    const touchReached=!!(afterScroll.warning?.visible&&afterScroll.exit?.visible&&afterScroll.exit?.centerHit);
    const exitTouch=touchReached?await safe(()=>page.touchscreen.tap(afterScroll.exit.x+afterScroll.exit.w/2,afterScroll.exit.y+afterScroll.exit.h/2)):
      {ok:false,skipped:true,reason:'safety controls not both visible and hit-testable after touch-only scroll'};
    const afterTouch=await page.evaluate(measure);
    await page.screenshot({path:path.join(OUT,label+'-after-touch.png')});
    const storage=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),KEYS);
    assert.deepEqual(storage,[null,null,null],'C18 must not create or touch real encrypted vault');
    const row={label,version:id.version,scale,recap,open,openGeometry,pinch,initial,initialScroll,history,afterScroll,touchReached,exitTouch,afterTouch,noVault:true,
      scope:'WEB 18.72 original More; CDP touch scroll, no keyboard/focus/scrollIntoView; scale 2 is not real Safari; research only'};
    results.push(row);
    console.log('C18 WEB85 '+JSON.stringify({label,recapRemaining:recap.remaining,open,scale:initial.visualScale,
      initialWarning:initial.warning,initialExit:initial.exit,initialScroll,
      swipes:history.length,lastSwipe:history.at(-1)?.swipe,touchWarning:afterScroll.warning,touchExit:afterScroll.exit,
      touchReached,exitTouch,noVault:true}));
   }finally{await context.close();}
  }
  assert.equal(results.length,8,'All eight C18 configurations must be characterized');
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({release:id,results},null,2));
  console.log('C18 COMPLETE '+JSON.stringify({cases:results.length,recapCleared:results.filter(r=>!r.recap.remaining).length,
    menuOpened:results.filter(r=>r.open.ok).length,touchReached:results.filter(r=>r.touchReached).length,
    actualTouchExit:results.filter(r=>r.exitTouch.ok).length,noVault:results.filter(r=>r.noVault).length,
    note:'Research only; green CI is not physical Safari, real pinch or WCAG acceptance.'}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
