'use strict';
// #85 C13: research a reversible bounded More layout on the ACTUAL WEB 18.72 screen before
// applying a structural sheet. Disposable localhost DEMO only, read-only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const OUT=path.join(ROOT,'artifacts','web85-c13-real-dom');
const KEYS=['financial-autonomy.preview.key.v1','financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
function serve(req,res){
 const url=new URL(req.url,'http://localhost');
 const relative=url.pathname==='/'||url.pathname===PREFIX||url.pathname===PREFIX.slice(0,-1)
  ?'index.html':url.pathname.startsWith(PREFIX)?url.pathname.slice(PREFIX.length):'';
 const file=path.resolve(ROOT,relative);
 if(!relative||(!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html'))){
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
 assert.equal(version,'18.72','C13 topology must explicitly target WEB 18.72; re-review before later versions');
 assert.ok(src&&src.startsWith(PREFIX),'Expected active immutable bundle');
 assert.ok(fs.existsSync(path.join(ROOT,new URL(src,'http://localhost').pathname.slice(PREFIX.length))));
 return {version,src};
}
function inspect(){
 const findText=t=>[...document.querySelectorAll('*')].find(el=>el.children.length===0&&el.textContent?.trim()===t);
 const warning=findText('DEMO · DATE FICTIVE');
 const exit=[...document.querySelectorAll('button,[role="button"]')].find(el=>
  (el.getAttribute('aria-label')||el.textContent||'').includes('Ieși din demo'));
 const budget=findText('Bugete');
 const more=[...document.querySelectorAll('[role="tab"]')].find(el=>
  (el.getAttribute('aria-label')||el.textContent||'').trim()==='Mai mult');
 const box=el=>{
  if(!el)return null;
  const r=el.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
  const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?document.elementFromPoint(x,y):null;
  return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,
   fullyVisible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,
   centerHit:!!hit&&(hit===el||el.contains(hit))};
 };
 const lineage=el=>{
  const out=[];
  for(let n=el,i=0;n&&i<10;n=n.parentElement,i++){
   const cs=getComputedStyle(n);
   out.push({tag:n.tagName,role:n.getAttribute('role'),label:n.getAttribute('aria-label'),
    className:typeof n.className==='string'?n.className.slice(0,100):'',
    children:n.children.length,display:cs.display,position:cs.position,
    overflowY:cs.overflowY,flexDirection:cs.flexDirection,
    box:box(n),text:(n.innerText||'').trim().slice(0,130)});
   if(n.id==='root')break;
  }
  return out;
 };
 return {viewport:{width:innerWidth,height:innerHeight},
  warning:box(warning),exit:box(exit),budget:box(budget),more:box(more),
  warningTree:lineage(warning),exitTree:lineage(exit),
  budgetTree:lineage(budget),moreTree:lineage(more),
  nav:[...document.querySelectorAll('[role="tab"]')].map(el=>({
   name:el.getAttribute('aria-label')||el.textContent?.trim(),box:box(el)})),
  warningCopy:[...document.querySelectorAll('*')].filter(el=>el.children.length===0&&
   /Date fictive, doar în memorie\.|Backup, diagnostic, import și ștergere dezactivate/.test(el.textContent||''))
   .slice(0,6).map(el=>({text:el.textContent?.trim().slice(0,160),box:box(el)})),
  focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.trim().slice(0,100)};
}
(async()=>{
 const id=release();fs.mkdirSync(OUT,{recursive:true});
 const server=http.createServer(serve);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const url='http://127.0.0.1:'+server.address().port+PREFIX;
  const results=[];
  for(const width of [320,390])for(const height of [422,844])
   for(const theme of ['light','dark'])for(const scale of [1,2]){
    const label=[width,height,theme,scale].join('-');
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,
     isMobile:true,hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});
    const page=await context.newPage();
    try{
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
     await page.getByText('DEMO · DATE FICTIVE',{exact:true}).waitFor({state:'visible',timeout:30000});
     await page.evaluate(s=>{document.documentElement.style.fontSize=(100*s)+'%';},scale);
     // Reversible candidate CSS on disposable DEMO only. The real short-height
     // document-scroll fallback can place the bottom tab under other content.
     await page.addStyleTag({content:`@media(max-width:430px) and (max-height:540px){
       html,body{height:100% !important;min-height:0 !important;overflow:hidden !important}
       #root{height:100% !important;min-height:0 !important;overflow:hidden !important}
     }`});
     // A blocked real pointer is a NEGATIVE accessibility finding, not a
     // reason to skip DOM topology. Bypass only to inspect the underlying screen.
     const more=page.getByRole('tab',{name:'Mai mult',exact:true});
     let realMorePointer=true,morePointerError=null;
     try{await more.click({timeout:1500});}
     catch(error){
      realMorePointer=false;
      morePointerError=String(error.message).split('\n')[0].slice(0,180);
      await more.evaluate(el=>el.click()); // TEST HARNESS BYPASS, never acceptance
     }
     await page.getByText('Bugete',{exact:true}).last().waitFor({state:'visible',timeout:10000});
     // C13: manipulate the ORIGINAL React-rendered nodes; do not clone, remove,
     // replace, or synthesize click handlers. This layout is not shipped.
     const candidate=await page.evaluate(()=>{
       const leaf=[...document.querySelectorAll('*')].find(el=>el.children.length===0&&el.textContent?.trim()==='DEMO · DATE FICTIVE');
       const budgetLeaf=[...document.querySelectorAll('*')].find(el=>el.children.length===0&&el.textContent?.trim()==='Bugete');
       const banner=leaf?.parentElement;
       const button=budgetLeaf?.closest('button,[role="button"]');
       const scroll=button?.parentElement?.parentElement;
       if(!banner||!button||!scroll||getComputedStyle(scroll).overflowY!=='auto')
         return {applied:false,reason:'Original banner, button or scroll ancestor not found'};
       const set=(el,styles)=>Object.entries(styles).forEach(([k,v])=>el.style.setProperty(k,v,'important'));
       set(banner,{position:'fixed',top:'0px',left:'0px',right:'0px',
         'z-index':'10002','max-height':'50vh','overflow-y':'auto','box-sizing':'border-box'});
       const bannerHeight=Math.min(banner.getBoundingClientRect().height,innerHeight/2);
       set(scroll,{position:'fixed',top:bannerHeight+'px',bottom:'72px',
         left:'0px',right:'0px',width:'100%','max-height':'none',
         'overflow-y':'auto','z-index':'10001','box-sizing':'border-box'});
       return {applied:true,bannerHeight,scrollHeight:scroll.getBoundingClientRect().height,
         originalHandlers:true,warningText:banner.innerText.trim().slice(0,200)};
     });
     const budgetControl=page.getByText('Bugete',{exact:true}).last().locator('xpath=ancestor::button[1]');
     let exitTrial=false,exitError=null,budgetPointer=false,budgetError=null;
     try{await page.getByRole('button',{name:/Ieși din demo/}).click({trial:true,timeout:1500});exitTrial=true;}
     catch(error){exitError=String(error.message).split('\\n')[0].slice(0,160);}
     const beforeBudget=await page.evaluate(()=>{
       const leaf=[...document.querySelectorAll('*')].find(el=>el.children.length===0&&el.textContent?.trim()==='Bugete');
       const button=leaf?.closest('button,[role="button"]');
       const rect=button?.getBoundingClientRect();
       const x=rect&&(rect.left+rect.right)/2,y=rect&&(rect.top+rect.bottom)/2;
       const hit=rect&&document.elementFromPoint(x,y);
       return {buttonRect:rect&&{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
         buttonHit:!!button&&!!hit&&(button===hit||button.contains(hit))};
     });
     const initial=await page.evaluate(inspect);
     assert.equal(initial.nav.length,5,'Original app must retain five tabs');
     assert.ok(initial.warning&&initial.exit&&initial.budget,'Actual DEMO safety and Bugete controls required');
     await page.getByText('Bugete',{exact:true}).last().evaluate(el=>{
      const control=el.closest('button,[role="button"],[role="menuitem"],a,[tabindex]');
      if(control)control.focus();
     });
     const focused=await page.evaluate(inspect);
     await page.screenshot({path:path.join(OUT,label+'.png')});
     // The actual original destination must accept a real Playwright pointer.
     // A blocked click is recorded as a NEGATIVE result; never bypass it.
     try{await budgetControl.click({timeout:1500});budgetPointer=true;}
     catch(error){budgetError=String(error.message).split('\\n')[0].slice(0,160);}
     const storage=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),KEYS);
     assert.deepEqual(storage,[null,null,null],'C13 must never create a real encrypted vault');
     const result={label,version:id.version,realMorePointer,morePointerError,candidate,exitTrial,exitError,beforeBudget,budgetPointer,budgetError,initial,focused,
      warningSafe:focused.warning.fullyVisible&&focused.warning.centerHit,
      exitSafe:focused.exit.fullyVisible&&focused.exit.centerHit,
      scope:'actual WEB DOM, unmodified product; root font-size stress proxy, not Safari/VoiceOver/WCAG'};
     results.push(result);
     console.log('C13 REAL WEB DOM #85 '+JSON.stringify({label,realMorePointer,morePointerError,candidate,exitTrial,exitError,beforeBudget,budgetPointer,budgetError,warning:focused.warning,
      exit:focused.exit,budget:focused.budget,nav:focused.nav.length,
      warningTree:initial.warningTree.slice(0,6),exitTree:initial.exitTree.slice(0,6),
      budgetTree:initial.budgetTree.slice(0,7)}));
    }finally{await context.close();}
   }
  assert.equal(results.length,16);
  fs.writeFileSync(path.join(OUT,'topology.json'),JSON.stringify({release:id,results},null,2));
  console.log('C13 COMPLETE #85 '+JSON.stringify({cases:results.length,
   realMorePointer:results.filter(x=>x.realMorePointer).length, candidateApplied:results.filter(x=>x.candidate.applied).length,exitTrial:results.filter(x=>x.exitTrial).length,budgetPointer:results.filter(x=>x.budgetPointer).length,
   warningSafe:results.filter(x=>x.warningSafe).length,
   exitSafe:results.filter(x=>x.exitSafe).length,
   note:'Reversible original-DOM layout research ONLY; green CI does NOT imply pointer accessibility or a shipped fix.'}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
