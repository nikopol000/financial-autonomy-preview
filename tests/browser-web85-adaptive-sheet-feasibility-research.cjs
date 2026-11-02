'use strict';
// #85 C11: disposable SEMANTIC PROTOTYPE, not a product component.
// No app bundle, vault, financial state, backup or user data is loaded.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const OUT=path.join(__dirname,'..','artifacts','web85-c11-adaptive-sheet');
const html=String.raw\`<!doctype html><html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;font-family:system-ui,sans-serif}
body{background:var(--bg);color:var(--fg)}
body[data-theme="light"]{--bg:#f5f7fb;--fg:#172338;--panel:#fff;--border:#8c98aa}
body[data-theme="dark"]{--bg:#101827;--fg:#f1f4fc;--panel:#1c2940;--border:#9da9bc}
button{font:inherit;color:inherit;cursor:pointer;min-height:44px}
button:focus-visible{outline:3px solid #159cb4;outline-offset:-3px}
#trigger{margin:8px;background:var(--panel);border:1px solid var(--border)}
[hidden]{display:none!important}
#sheet{position:fixed;inset:0;z-index:10;background:var(--panel);
 display:flex;flex-direction:column;min-height:0;overflow:hidden;
 padding:env(safe-area-inset-top,0px) 8px env(safe-area-inset-bottom,0px)}
#safety{flex:none;display:flex;flex-direction:column;gap:4px;padding:4px 0;
 border-bottom:1px solid var(--border);background:var(--panel);z-index:1}
#close,#exit{width:100%;background:transparent;border:1px solid var(--border);border-radius:8px}
#demo{border:1px solid var(--border);border-radius:8px;padding:6px;
 line-height:1.2;overflow-wrap:anywhere}
#demo strong{display:block;font-size:.85rem}
#demo span{display:block;font-size:.8rem}
#destinations{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;
 display:flex;flex-direction:column;gap:4px;padding:6px 0;scroll-padding:6px}
#destinations button{flex:none;width:100%;text-align:left;background:var(--bg);
 border:1px solid var(--border);border-radius:8px;padding:6px;min-height:44px}
</style></head><body data-theme="light">
<button id="trigger" type="button">Mai mult</button>
<section id="sheet" role="dialog" aria-modal="true" aria-labelledby="title" hidden>
 <div id="safety"><button id="close" type="button">Închide meniul</button>
 <div id="demo" role="note"><strong id="title">DEMO · DATE FICTIVE</strong>
 <span>Date fictive, doar în memorie. Backup, diagnostic, import și ștergere dezactivate.</span></div>
 <button id="exit" type="button">Ieși din demo</button></div>
 <nav id="destinations" aria-label="Secțiuni">
 <button type="button">Acasă</button><button type="button">Finanțe</button>
 <button type="button">Adaugă</button><button type="button">Istoric</button>
 <button type="button">Bugete</button></nav>
</section>
<script>
const trigger=document.querySelector('#trigger'),sheet=document.querySelector('#sheet');
const close=document.querySelector('#close'),exit=document.querySelector('#exit');
const destinations=document.querySelector('#destinations');
let lastAction=null;
function hide(){sheet.hidden=true;trigger.focus();}
function show(){sheet.hidden=false;close.focus();}
trigger.addEventListener('click',show);
close.addEventListener('click',hide);
exit.addEventListener('click',()=>{lastAction='exit';});
destinations.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
 lastAction=button.textContent.trim();
}));
sheet.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();hide();return;}
 if(event.key!=='Tab')return;
 const controls=[close,exit,...destinations.querySelectorAll('button')];
 const i=controls.indexOf(document.activeElement);
 if(event.shiftKey&&i===0){event.preventDefault();controls.at(-1).focus();}
 else if(!event.shiftKey&&i===controls.length-1){event.preventDefault();controls[0].focus();}
});
window.c11=()=>({lastAction,open:!sheet.hidden});
</script></body></html>\`;
function geometry(){
 const get=id=>{
  const el=document.querySelector(id),r=el.getBoundingClientRect();
  const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
  const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
   document.elementFromPoint(x,y):null;
  return {top:r.top,bottom:r.bottom,height:r.height,
   fullyVisible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,
   hit:!!hit&&(hit===el||el.contains(hit))};
 };
 const buttons=[...document.querySelectorAll('#destinations button')];
 return {viewport:{width:innerWidth,height:innerHeight},
  safety:get('#safety'),warning:get('#demo'),exit:get('#exit'),
  close:get('#close'),list:get('#destinations'),target:get('#destinations button:last-child'),
  listScrollHeight:document.querySelector('#destinations').scrollHeight,
  listClientHeight:document.querySelector('#destinations').clientHeight,
  tabCount:buttons.length,focus:document.activeElement?.textContent?.trim()};
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const width of [320,390])for(const height of [422,844])
   for(const theme of ['light','dark'])for(const scale of [1,2]){
    const page=await browser.newPage({viewport:{width,height},colorScheme:theme,
      isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});
    const label=[width,height,theme,scale].join('-');
    try{
     await page.setContent(html);
     await page.locator('body').evaluate((el,t)=>el.dataset.theme=t,theme);
     await page.evaluate(s=>{document.documentElement.style.fontSize=(s*100)+'%';},scale);
     await page.getByRole('button',{name:'Mai mult'}).click();
     assert.equal(await page.getByRole('dialog').count(),1);
     assert.equal(await page.locator('#destinations button').count(),5);
     assert.equal(await page.locator('#close').evaluate(el=>document.activeElement===el),true);
     await page.keyboard.press('Shift+Tab');
     assert.equal(await page.getByRole('button',{name:'Bugete'}).evaluate(el=>document.activeElement===el),true,
      'Reverse focus must wrap to final destination');
     await page.keyboard.press('Tab');
     assert.equal(await page.locator('#close').evaluate(el=>document.activeElement===el),true,
      'Forward focus must wrap to close');
     const budget=page.getByRole('button',{name:'Bugete'});
     await budget.focus();
     await budget.evaluate(el=>el.scrollIntoView({block:'nearest'}));
     const measured=await page.evaluate(geometry);
     const safe=measured.warning.fullyVisible&&measured.warning.hit&&
      measured.exit.fullyVisible&&measured.exit.hit&&measured.close.hit;
     const listUsable=measured.list.height>=44&&measured.listClientHeight>0;
     let pointer=false,error=null;
     try{await budget.click({timeout:1200});pointer=(await page.evaluate(()=>window.c11().lastAction))==='Bugete';}
     catch(e){error=String(e.message).split('\n')[0].slice(0,160);}
     const accepted=safe&&listUsable&&pointer;
     await page.keyboard.press('Escape');
     const focusRestored=await page.locator('#trigger').evaluate(el=>document.activeElement===el);
     assert.equal(focusRestored,true,'Escape must restore focus to More trigger');
     assert.equal(await page.getByRole('dialog').count(),0,'Escape must close dialog');
     assert.equal(await page.evaluate(()=>localStorage.length),0,'Prototype must not write storage');
     const result={label,width,height,theme,textScale:scale,accepted,safe,listUsable,
      pointer,focusRestored,geometry:measured,error,
      scope:'isolated HTML prototype; not actual WEB, Safari, VoiceOver, or WCAG certification'};
     results.push(result);
     console.log('C11 ADAPTIVE SHEET #85 '+JSON.stringify(result));
     await page.screenshot({path:path.join(OUT,label+'.png')});
    }finally{await page.close();}
   }
  assert.equal(results.length,16);
  assert.equal(results.filter(r=>r.textScale===1&&!r.accepted).length,0,
   'Normal-text prototype must pass all 320/390 x 422/844 x light/dark combinations');
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(results,null,2));
  console.log('C11 COMPLETE #85 '+JSON.stringify({cases:results.length,
   accepted:results.filter(r=>r.accepted).length,
   enlargedAccepted:results.filter(r=>r.textScale===2&&r.accepted).length,
   caveat:'A passing research harness is not a production accessibility fix'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
