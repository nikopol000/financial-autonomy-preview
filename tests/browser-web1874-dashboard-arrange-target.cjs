'use strict';
// WEB 18.74: actual Chromium Dashboard arrangement entry/reset accessibility.
// Disposable empty-origin contexts only. No financial entries or backup writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
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
async function dismissRecap(page){
  for(let i=0;i<6;i++){
    if(!(await page.getByText(/RECAPITULARE\s*·/).count()))return;
    const next=page.getByRole('button',{name:/Am văzut|Continuă|Gata|Închide/i}).first();
    if(!(await next.count()))return;
    await next.click({timeout:8000});
  }
  assert.equal(await page.getByText(/RECAPITULARE\s*·/).count(),0,'recap must be dismissed');
}
async function run(browser,url,width,height,scheme){
  const label=width+'x'+height+'-'+scheme;
  const context=await browser.newContext({viewport:{width,height},colorScheme:scheme,serviceWorkers:'block'});
  try{
    const page=await context.newPage();
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByRole('tab',{name:'Mai mult',exact:true}).waitFor({state:'visible',timeout:30000});
    await dismissRecap(page);
    const enter=page.getByRole('button',{name:'Aranjează cardurile de pe Acasă',exact:true});
    await enter.waitFor({state:'visible',timeout:10000});
    const entry=await enter.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {height:r.height,width:r.width,hit:hit===el||el.contains(hit)};
    });
    assert.ok(entry.height>=44,label+' arrangement entry must be >=44 CSS px');
    assert.ok(entry.width>=44,label+' arrangement entry must be >=44 CSS px wide');
    assert.equal(entry.hit,true,label+' entry center must be hit-testable');
    await enter.click({timeout:10000});
    const reset=page.getByRole('button',{name:'Restabilește ordinea cardurilor de pe Acasă',exact:true});
    await reset.waitFor({state:'visible',timeout:10000});
    const resetHeight=await reset.evaluate(el=>el.getBoundingClientRect().height);
    assert.ok(resetHeight>=44,label+' reset control must retain >=44px target');
    const finish=page.getByRole('button',{name:'Încheie aranjarea cardurilor',exact:true});
    await finish.click({timeout:10000});
    assert.equal(await reset.count(),0,label+' reset action hidden after arranging ends');
    const keys=await page.evaluate(()=>Object.keys(localStorage).filter(k=>
      k.startsWith('financial-autonomy.preview.key')||
      k.startsWith('financial-autonomy.preview.payload')));
    assert.deepEqual(keys,[],label+' no real vault footprint from arrangement inspection');
    console.log('PASS WEB 18.74 ARRANGE '+label+' '+JSON.stringify({entry,resetHeight,keys:keys.length}));
  }finally{await context.close();}
}
(async()=>{
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  const url='http://127.0.0.1:'+server.address().port+PREFIX;
  try{
    for(const width of [320,390])
      for(const height of [422,844])
        for(const scheme of ['light','dark'])
          await run(browser,url,width,height,scheme);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
