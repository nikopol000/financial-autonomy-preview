'use strict';
// WEB #17: actual immutable UI, configured budget through normal demo controls.
// Disposable localhost Chromium contexts only. No real vault, backup or financial formula changes.
// 200% CSS zoom is a layout stress approximation, NOT iOS Dynamic Type certification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const OUT=path.join(ROOT,'artifacts','browser-populated-budget');
const VAULT_KEYS=['financial-autonomy.preview.key.v1','financial-autonomy.preview.payload.v1','financial-autonomy.preview.reset.v1'];
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
  assert.ok(version&&src,'Active release metadata missing');
  const parsed=new URL(src,'http://localhost');
  assert.ok(parsed.pathname.startsWith(PREFIX),'Bundle prefix mismatch');
  assert.ok(parsed.pathname.includes('index-v0'+version.replace('.','')+'-'),'Bundle version mismatch');
  assert.ok(fs.existsSync(path.join(ROOT,parsed.pathname.slice(PREFIX.length))),'Bundle missing');
  return {version,bundle:src};
}

function overlapArea(a,b){
  if(!a||!b)return 0;
  const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
  const h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return Math.round(w*h*100)/100;
}
async function navFootprint(page){
  const names=['Acasă','Finanțe','Înregistrează','Istoric','Mai mult'];
  const tabs=[];
  for(const name of names){
    const locator=page.getByRole('tab',{name,exact:true});
    assert.equal(await locator.count(),1,'Navigation destination must have one accessible tab: '+name);
    const box=await locator.boundingBox();
    assert.ok(box&&box.width>0&&box.height>0,'Navigation tab must have a measurable hit target: '+name);
    const text=await locator.evaluate((el,label)=>{
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode())){
        if(node.textContent.trim().replace(/\u00ad/g,'')!==label)continue;
        const range=document.createRange();
        range.selectNodeContents(node);
        const rect=range.getBoundingClientRect();
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
      }
      return null;
    },name);
    tabs.push({name,hitTarget:box,text});
  }
  const textOverlapPairs=[];
  for(let i=0;i<tabs.length;i++)for(let j=i+1;j<tabs.length;j++){
    const area=overlapArea(tabs[i].text,tabs[j].text);
    if(area>0)textOverlapPairs.push({a:tabs[i].name,b:tabs[j].name,areaCssPx2:area});
  }
  const textOutsideHitTarget=tabs.filter(t=>t.text&&(
    t.text.x<t.hitTarget.x-1||
    t.text.x+t.text.width>t.hitTarget.x+t.hitTarget.width+1
  )).map(t=>t.name);
  return {tabs,textOverlapPairs,textOutsideHitTarget,
    caveat:'Text-node rectangles and CSS zoom are Chromium diagnostics, not Safari Dynamic Type certification'};
}

async function audit(browser,url,width,scheme){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,
    isMobile:true,hasTouch:true,colorScheme:scheme,timezoneId:'Europe/Bucharest',reducedMotion:'reduce'});
  const page=await context.newPage();
  const label=width+'-'+scheme;
  try{
    await page.clock.setFixedTime(new Date(scheme==='light'?'2026-10-23T12:00:00Z':'2026-10-23T00:00:00Z'));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByText('DEMO · DATE FICTIVE',{exact:true}).waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(expected=>document.documentElement.style.colorScheme===expected,scheme,{timeout:10000});
    assert.equal(await page.getByRole('tab',{name:'Finanțe'}).count(),1,'Finance tab missing');
    await page.getByRole('tab',{name:'Finanțe'}).click();
    await page.getByRole('button',{name:/^Bugete/}).click();
    await page.getByRole('button',{name:'Adaugă categorie de buget'}).click();
    await page.getByText('Categorie de buget',{exact:true}).waitFor({state:'visible',timeout:10000});
    await page.getByRole('textbox',{name:'Nume'}).fill('Alimente DEMO · TEST');
    await page.getByRole('textbox',{name:'Limită pentru perioada principală · RON'}).fill('2000');
    await page.getByRole('button',{name:'Salvează configurația'}).click();
    await page.getByText('Alimente DEMO · TEST',{exact:true}).waitFor({state:'visible',timeout:10000});
    const englishPrimaryRow=await page.getByText(/Primary ·/).count();
    const romanianPrimaryRow=await page.getByText(/Perioada principală ·/).count();
    assert.equal(englishPrimaryRow,0,'Visible Finanțe budget row must not use English Primary');
    assert.ok(romanianPrimaryRow>=1,'Visible Finanțe budget row must use Romanian label');
    await page.getByRole('tab',{name:'Mai mult'}).click();
    await page.getByText('Bugete',{exact:true}).last().click();
    await page.getByText(/Alimente DEMO · TEST/).first().waitFor({state:'visible',timeout:10000});
    await page.getByRole('button',{name:'După fereastră'}).click();
    await page.getByRole('button',{name:'După buget'}).click();
    assert.equal(await page.getByText(/Primary/).count(),0,
      'Populated budget page must not expose English Primary terminology');
    assert.ok(await page.getByText(/Lunar · principală/).count()>=1,
      'Primary monthly window must be clearly labeled in Romanian');
    const navNormal=await navFootprint(page);
    assert.deepEqual(navNormal.textOverlapPairs,[], 'Navigation text must not overlap at normal size');
    assert.deepEqual(navNormal.textOutsideHitTarget,[], 'Navigation labels must fit their hit targets at normal size');
    const normal=await page.evaluate(()=>{
      const root=document.documentElement;
      return {viewport:innerWidth,documentScrollWidth:root.scrollWidth,
        colorScheme:root.style.colorScheme,bodyText:document.body.innerText.slice(0,2000),
        focusableCount:document.querySelectorAll('button,[role="button"],input,[tabindex]').length};
    });
    await page.screenshot({path:path.join(OUT,'populated-budget-'+label+'.png'),fullPage:true});
    // CSS zoom is explicitly a stress proxy; no claim of real iPhone Dynamic Type.
    await page.evaluate(()=>{document.documentElement.style.zoom='200%';});
    await page.screenshot({path:path.join(OUT,'populated-budget-'+label+'-csszoom200.png'),fullPage:true});
    const navZoom=await navFootprint(page);
    assert.deepEqual(navZoom.textOverlapPairs,[], 'Navigation labels must not overlap at 200% CSS zoom');
    assert.deepEqual(navZoom.textOutsideHitTarget,[], 'Navigation labels must fit hit targets at 200% CSS zoom');
    const zoom=await page.evaluate(()=>({
      viewport:innerWidth,documentScrollWidth:document.documentElement.scrollWidth,
      rootZoom:getComputedStyle(document.documentElement).zoom,
      visibleText:document.body.innerText.slice(0,1800)
    }));
    const footprint=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),VAULT_KEYS);
    assert.deepEqual(footprint,[null,null,null],'Demo must not create encrypted vault entries');
    assert.ok(normal.bodyText.includes('Alimente DEMO · TEST'),'Configured budget must render in the real UI');
    assert.equal(normal.colorScheme,scheme,'Actual theme must match requested palette');
    const result={viewport:width,scheme,configuredBudget:'Alimente DEMO · TEST',
      limitRON:2000,englishPrimaryRowCount:englishPrimaryRow,
      normal:{...normal,navigation:navNormal},zoom:{...zoom,navigation:navZoom},encryptedVaultUntouched:true};
    console.log('PASS populated budget Chromium '+label+'; Primary row='+englishPrimaryRow+
      '; zoom200 scrollWidth='+zoom.documentScrollWidth+
      '; nav text overlaps='+navZoom.textOverlapPairs.length+
      '; labels outside targets='+navZoom.textOutsideHitTarget.join(','));
    return result;
  }catch(error){
    await page.screenshot({path:path.join(OUT,'FAIL-'+label+'.png'),fullPage:true}).catch(()=>{});
    const text=await page.locator('body').innerText().catch(()=>'<body unavailable>');
    console.error('BUDGET AUDIT FAILED '+label+' visible text: '+text.slice(0,3500));
    throw error;
  }finally{await context.close();}
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
    for(const width of [320,390])for(const scheme of ['light','dark'])
      results.push(await audit(browser,url,width,scheme));
    fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify({
      product:'WEB '+id.version,bundle:id.bundle,origin:'localhost disposable demo only',
      zoomCaveat:'CSS zoom and text-node geometry are Chromium diagnostics, not Safari/iOS Dynamic Type',results},null,2));
    console.log('PASS 4/4 populated budget demo UI audit with synthetic 2000 RON budgets');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
