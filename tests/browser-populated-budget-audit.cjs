'use strict';
// WEB #17: actual immutable UI, configured budget through normal demo controls.
// Disposable localhost Chromium contexts only. No real vault, backup or financial formula changes.
// 200% CSS zoom is a layout stress approximation, NOT iOS Dynamic Type certification.
const assert=require('node:assert/strict');
require('./web-v1849-nav-regression.cjs');
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
  const names=['Acasă','Finanțe','Adaugă','Istoric','Mai mult'];
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
        if(node.textContent.trim().replace(/\u00ad/g,'')!==(label))continue;
        const range=document.createRange();
        range.selectNodeContents(node);
        const rect=range.getBoundingClientRect();
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
      }
      return null;
    },name);
    tabs.push({name,hitTarget:box,text});
  }
  const textOverlapPairs=[],hitTargetOverlapPairs=[];
  for(let i=0;i<tabs.length;i++)for(let j=i+1;j<tabs.length;j++){
    const area=overlapArea(tabs[i].text,tabs[j].text);
    if(area>0)textOverlapPairs.push({a:tabs[i].name,b:tabs[j].name,areaCssPx2:area});
    // A non-overlapping label is insufficient if two pressable targets overlap.
    const hitArea=overlapArea(tabs[i].hitTarget,tabs[j].hitTarget);
    if(hitArea>1)hitTargetOverlapPairs.push({a:tabs[i].name,b:tabs[j].name,areaCssPx2:hitArea});
  }
  const textOutsideHitTarget=tabs.filter(t=>t.text&&(
    t.text.x<t.hitTarget.x-1||
    t.text.x+t.text.width>t.hitTarget.x+t.hitTarget.width+1
  )).map(t=>t.name);
  return {tabs,textOverlapPairs,hitTargetOverlapPairs,textOutsideHitTarget,
    caveat:'Text-node rectangles and CSS zoom are Chromium diagnostics, not Safari Dynamic Type certification'};
}



/**
 * #85 DISCOVERY: compare two reversible navigation layouts in the ACTUAL
 * populated DEMO UI under Chromium root CSS zoom. CSS is injected only into
 * this disposable page and removed before continuing. Geometry is evidence,
 * not a shipped fix or Safari / WCAG / Dynamic Type certification.
 */
async function zoomNavigationCandidate(page,label,variant,css){
  const style=await page.addStyleTag({content:css});
  try{
    await page.waitForTimeout(100);
    const footprint=await navFootprint(page);
    const geometry=await page.evaluate(()=>{
      const tabs=[...document.querySelectorAll('[role="tab"]')];
      const parent=tabs[0]?.parentElement;
      const box=el=>{
        const r=el.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
          width:r.width,height:r.height};
      };
      const computed=parent?getComputedStyle(parent):null;
      return {viewport:{width:innerWidth,height:innerHeight},
        parent:parent?{tag:parent.tagName,role:parent.getAttribute('role'),
          display:computed.display,flexWrap:computed.flexWrap,
          overflowX:computed.overflowX,scrollWidth:parent.scrollWidth,
          clientWidth:parent.clientWidth,rect:box(parent)}:null,
        rows:new Set(tabs.map(t=>Math.round(box(t).top))).size,
        tabs:tabs.map(t=>({name:t.getAttribute('aria-label')||t.textContent.trim(),
          rect:box(t)}))};
    });
    // A scrollable strip must expose every destination after focus and
    // scrollIntoView; do not confuse a DOM-present tab with a visible tab.
    const focusReachability=[];
    for(const name of ['Acasă','Finanțe','Adaugă','Istoric','Mai mult']){
      const tab=page.getByRole('tab',{name,exact:true});
      await tab.focus();
      await tab.scrollIntoViewIfNeeded();
      const check=await tab.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
          document.elementFromPoint(x,y):null;
        return {focused:document.activeElement===el,
          centerExposed:!!hit&&(hit===el||el.contains(hit)),
          rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
          parentScrollLeft:el.parentElement?.scrollLeft||0};
      });
      focusReachability.push({name,...check});
    }
    await page.screenshot({path:path.join(OUT,'zoom-nav-'+variant+'-'+label+'.png'),
      fullPage:true});
    const result={variant,geometry,footprint,
      focusReachability,allFiveFocusExposed:focusReachability.every(t=>t.focused&&t.centerExposed),
      caveat:'Disposable Chromium root CSS zoom; no Safari, Dynamic Type or WCAG pass claim'};
    console.log('ZOOM NAV CANDIDATE #85 '+label+' '+JSON.stringify({
      variant,rows:geometry.rows,parent:geometry.parent,
      overlaps:footprint.textOverlapPairs.length,
      outside:footprint.textOutsideHitTarget,
      allFiveFocusExposed:result.allFiveFocusExposed}));
    return result;
  }finally{
    await style.evaluate(el=>el.remove());
    await page.waitForTimeout(60);
  }
}

/**
 * #85 DISCOVERY: no scrollIntoViewIfNeeded rescue. The first focus sets a
 * known keyboard starting point; subsequent Tab presses and CDP touch input
 * exercise Chromium's own scrolling. Findings are diagnostic, not acceptance
 * of the layout or a claim about Safari / VoiceOver.
 */
async function naturalZoomNavInput(page,label,css){
  const style=await page.addStyleTag({content:css});
  try{
    const names=['Acasă','Finanțe','Adaugă','Istoric','Mai mult'];
    const home=page.getByRole('tab',{name:names[0],exact:true});
    await home.focus();
    const inspect=()=>page.evaluate(()=>{
      const el=document.activeElement;
      const tabs=[...document.querySelectorAll('[role="tab"]')];
      const parent=tabs[0]?.parentElement;
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
        document.elementFromPoint(x,y):null;
      return {name:el.getAttribute('aria-label')||el.textContent?.trim(),
        role:el.getAttribute('role'),focusVisible:el.matches(':focus-visible'),
        centerExposed:!!hit&&(hit===el||el.contains(hit)),
        scrollLeft:parent?.scrollLeft||0,scrollWidth:parent?.scrollWidth||0,
        clientWidth:parent?.clientWidth||0};
    });
    const keyboard=[await inspect()];
    for(let i=1;i<names.length;i++){
      await page.keyboard.press('Tab');
      await page.waitForTimeout(40);
      keyboard.push(await inspect());
    }
    // A failed sequence is evidence of an inaccessible candidate, not a
    // failure of the shipped UI (the candidate is never promoted).
    const naturalOrder=keyboard.every((item,i)=>item.role==='tab'&&item.name===names[i]);
    const naturallyExposed=keyboard.every(item=>item.centerExposed);
    const touch=await page.evaluate(()=>{
      const tabs=[...document.querySelectorAll('[role="tab"]')];
      const parent=tabs[0]?.parentElement;
      if(!parent)return null;
      parent.scrollLeft=0;
      const r=parent.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        before:parent.scrollLeft,touchAction:getComputedStyle(parent).touchAction};
    });
    let swipe=null;
    if(touch&&touch.right-touch.left>30&&touch.bottom-touch.top>30){
      const cdp=await page.context().newCDPSession(page);
      try{
        const y=(touch.top+touch.bottom)/2;
        const x1=touch.left+(touch.right-touch.left)*0.8;
        const x2=touch.left+(touch.right-touch.left)*0.2;
        const send=(type,x)=>cdp.send('Input.dispatchTouchEvent',{
          type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
        await send('touchStart',x1);
        for(let step=1;step<=8;step++){
          await send('touchMove',x1+(x2-x1)*step/8);
          await page.waitForTimeout(16);
        }
        await send('touchEnd',x2);
        await page.waitForTimeout(150);
        swipe=await page.evaluate(()=>{
          const parent=document.querySelector('[role="tab"]')?.parentElement;
          return {after:parent?.scrollLeft||0,scrollWidth:parent?.scrollWidth||0,
            clientWidth:parent?.clientWidth||0};
        });
      }catch(error){swipe={error:String(error.message).slice(0,220)};}
      finally{await cdp.detach();}
    }
    const vault=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),VAULT_KEYS);
    assert.deepEqual(vault,[null,null,null],
      'Natural navigation research must never write the real encrypted vault');
    const result={keyboard,naturalOrder,naturallyExposed,touch,swipe,
      caveat:'Disposable Chromium 200% CSS zoom; first focus seeded, later Tab natural; CDP touch gesture is not physical iPhone Safari'};
    console.log('NATURAL ZOOM NAV INPUT #85 '+label+' '+JSON.stringify(result));
    await page.screenshot({path:path.join(OUT,'zoom-nav-natural-'+label+'.png'),fullPage:true});
    return result;
  }finally{
    await style.evaluate(el=>el.remove());
    await page.waitForTimeout(60);
  }
}


/**
 * #85 DISCOVERY C2: test-only focus-following scroll in the actual DEMO
 * navigation. Unlike C, the scrolling rule is installed in the candidate
 * itself, never rescued by a Playwright scrollIntoViewIfNeeded call.
 * Diagnostic results are NOT Safari / VoiceOver / WCAG acceptance.
 */
async function focusFollowingZoomNavInput(page,label,css){
  const style=await page.addStyleTag({content:css+
    '#root :has(> [role="tab"]){scroll-snap-type:none!important;'+
    'scrollbar-width:thin!important;scrollbar-color:currentColor transparent!important}'});
  const names=['Acasă','Finanțe','Adaugă','Istoric','Mai mult'];
  try{
    await page.evaluate(()=>{
      const tabs=[...document.querySelectorAll('[role="tab"]')];
      const strip=tabs[0]?.parentElement;
      if(tabs.length!==5||!strip||tabs.some(tab=>tab.parentElement!==strip))
        throw Error('C2 needs exactly five sibling tabs in the real navigation strip');
      const follow=event=>{
        const tab=event.target.closest?.('[role="tab"]');
        if(!tab||tab.parentElement!==strip)return;
        const outer=strip.getBoundingClientRect();
        const target=tab.getBoundingClientRect();
        // getBoundingClientRect is zoomed, scrollLeft/clientWidth are not.
        const scale=outer.width/strip.clientWidth||1;
        strip.scrollLeft+=((target.left+target.right)-(outer.left+outer.right))/(2*scale);
      };
      strip.addEventListener('focusin',follow);
      strip.__web85C2Follow=follow;
    });
    const inspect=()=>page.evaluate(()=>{
      const tab=document.activeElement;
      const strip=tab.parentElement;
      const r=tab.getBoundingClientRect();
      const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
      const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
        document.elementFromPoint(x,y):null;
      return {name:tab.getAttribute('aria-label')||tab.textContent?.trim(),
        role:tab.getAttribute('role'),focusVisible:tab.matches(':focus-visible'),
        centerExposed:!!hit&&(hit===tab||tab.contains(hit)),
        scrollLeft:strip.scrollLeft,scrollWidth:strip.scrollWidth,
        clientWidth:strip.clientWidth,scrollbarWidth:getComputedStyle(strip).scrollbarWidth};
    });
    await page.getByRole('tab',{name:names[0],exact:true}).focus();
    await page.waitForTimeout(80);
    const forward=[await inspect()];
    for(let i=1;i<names.length;i++){
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
      forward.push(await inspect());
    }
    const reverse=[];
    for(let i=names.length-2;i>=0;i--){
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(80);
      reverse.push(await inspect());
    }
    const forwardOrder=forward.every((item,i)=>item.role==='tab'&&item.name===names[i]);
    const reverseOrder=reverse.every((item,i)=>item.role==='tab'&&item.name===names[names.length-2-i]);
    const exposed=forward.concat(reverse).every(item=>item.centerExposed&&item.focusVisible);
    // #85 C2 FOLLOW-UP (diagnostic only): actual keyboard Enter navigation
    // must be checked separately from focusing the five tabs. A React
    // rerender can replace the tab strip and discard a DOM-attached handler.
    // Record focus/selected exposure after activation without claiming
    // Safari, touch, or a production fix from Chromium CSS zoom.
    const activation=[];
    for(const name of ['Istoric','Mai mult']){
      const tab=page.getByRole('tab',{name,exact:true});
      await tab.focus();
      await page.waitForTimeout(80);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      const selected=await tab.getAttribute('aria-selected');
      const geometry=await tab.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
          document.elementFromPoint(x,y):null;
        const strip=el.parentElement;
        return {centerExposed:!!hit&&(hit===el||el.contains(hit)),
          focusRetained:document.activeElement===el,
          scrollLeft:strip.scrollLeft,
          followListenerRetained:!!strip.__web85C2Follow};
      });
      activation.push({name,selected, ...geometry});
      assert.equal(selected,'true',
        'C2 research: keyboard Enter must activate '+name);
    }
    // #85 DISCOVERY: preserve the *natural pointer* actionability result
    // before using a harness-only DOM click to restore the budget page.
    // A Playwright trial click scrolls as a normal click would, but never
    // activates the row. A failure is recorded as a known UX limitation,
    // not turned into a false passing click or a shipped-product failure.
    const menuRow=page.getByText('Bugete',{exact:true}).last();
    const readMenuGeometry=()=>menuRow.evaluate(el=>{
      const box=node=>{
        const r=node.getBoundingClientRect();
        return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),
          width:+r.width.toFixed(1),height:+r.height.toFixed(1)};
      };
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const inside=x>=0&&x<innerWidth&&y>=0&&y<innerHeight;
      const hit=inside?document.elementFromPoint(x,y):null;
      const row=el.closest('button,[role="button"],[role="menuitem"],a,[tabindex]')||el.parentElement;
      const ancestors=[];
      for(let node=el.parentElement;node&&ancestors.length<9;node=node.parentElement){
        const style=getComputedStyle(node);
        ancestors.push({tag:node.tagName,role:node.getAttribute('role'),
          position:style.position,overflowY:style.overflowY,
          scrollTop:node.scrollTop,scrollHeight:node.scrollHeight,
          clientHeight:node.clientHeight,rect:box(node)});
      }
      return {viewport:{width:innerWidth,height:innerHeight},
        target:box(el),row:row?box(row):null,centerInsideViewport:inside,
        centerHitTarget:!!hit&&(hit===el||el.contains(hit)||(row&&(hit===row||row.contains(hit)))),
        hit:hit?{tag:hit.tagName,role:hit.getAttribute('role'),
          text:(hit.getAttribute('aria-label')||hit.textContent||'').trim().slice(0,100),
          position:getComputedStyle(hit).position,rect:box(hit)}:null,
        ancestors};
    });
    const menuBefore=await readMenuGeometry();
    let pointerTrial={actionable:false,error:null};
    try{
      await menuRow.click({trial:true,timeout:1600});
      pointerTrial={actionable:true,error:null};
    }catch(error){
      pointerTrial={actionable:false,error:String(error.message).split('\\n')[0].slice(0,240)};
    }
    const menuAfter=await readMenuGeometry();
    const menuOcclusion={before:menuBefore,after:menuAfter,pointerTrial,
      caveat:'Disposable Chromium 200% CSS zoom. Trial click is not activation, and DOM restore below is harness-only.'};
    console.log('MORE MENU POINTER GEOMETRY #85 '+label+' '+JSON.stringify(menuOcclusion));
    // #85: two *reversible, diagnostic-only* vertical-space candidates.
    // Preserve the baseline pointer failure above. These are not production
    // styles and a successful trial click is not actual menu activation.
    const menuVerticalCandidates=[];
    for(const variant of ['flow-min-height','fixed-panel']){
      const patch=await menuRow.evaluate((el,kind)=>{
        let scroll=null;
        for(let node=el.parentElement;node;node=node.parentElement){
          const style=getComputedStyle(node);
          if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+2){
            scroll=node;break;
          }
        }
        if(!scroll)return {error:'No vertically scrollable menu ancestor'};
        const original=scroll.getAttribute('style');
        const nav=document.querySelector('[role="tab"]')?.parentElement?.getBoundingClientRect();
        if(!nav)return {error:'Navigation rectangle missing'};
        scroll.setAttribute('data-web85-vertical-probe','');
        scroll.style.setProperty('overflow-y','auto','important');
        scroll.style.setProperty('min-height','120px','important');
        scroll.style.setProperty('flex-shrink','0','important');
        if(kind==='fixed-panel'){
          // Root CSS zoom=200% scales CSS lengths; convert measured pixels
          // to the local CSS coordinate system. Keep above the fixed nav.
          const scale=Number(getComputedStyle(document.documentElement).zoom)||1;
          scroll.style.setProperty('position','fixed','important');
          scroll.style.setProperty('top',Math.max(120,(nav.top-340)/scale)+'px','important');
          scroll.style.setProperty('bottom',Math.max(16,(innerHeight-nav.top+8)/scale)+'px','important');
          scroll.style.setProperty('left','8px','important');
          scroll.style.setProperty('right','8px','important');
          scroll.style.setProperty('height','auto','important');
          scroll.style.setProperty('max-height','none','important');
          scroll.style.setProperty('z-index','40','important');
          scroll.style.setProperty('background','Canvas','important');
        }
        return {original,variant:kind,navTop:nav.top};
      },variant);
      let trial={actionable:false,error:null},after=null,safety=null;
      try{
        if(!patch.error){
          try{
            await menuRow.click({trial:true,timeout:1600});
            trial.actionable=true;
          }catch(error){
            trial.error=String(error.message).split('\\n')[0].slice(0,240);
          }
          after=await readMenuGeometry();
          safety=await page.evaluate(()=>{
            const point=el=>{
              if(!el)return {present:false,exposed:false};
              const r=el.getBoundingClientRect();
              const x=r.left+r.width/2,y=r.top+r.height/2;
              const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
                document.elementFromPoint(x,y):null;
              return {present:true,exposed:!!hit&&(hit===el||el.contains(hit)),
                top:r.top,bottom:r.bottom};
            };
            const warning=[...document.querySelectorAll('*')].find(el=>
              el.children.length===0&&el.textContent?.trim()==='DEMO · DATE FICTIVE');
            const exit=[...document.querySelectorAll('button,[role="button"]')].find(el=>
              (el.getAttribute('aria-label')||el.textContent||'').includes('Ieși din demo'));
            const scroll=document.querySelector('[data-web85-vertical-probe]');
            return {warning:point(warning),exit:point(exit),
              menuClientHeight:scroll?.clientHeight??null,
              menuScrollHeight:scroll?.scrollHeight??null,
              menuRect:scroll?.getBoundingClientRect().toJSON()??null};
          });
        }
      }finally{
        await page.evaluate(original=>{
          const scroll=document.querySelector('[data-web85-vertical-probe]');
          if(!scroll)return;
          if(original===null)scroll.removeAttribute('style');
          else scroll.setAttribute('style',original);
          scroll.removeAttribute('data-web85-vertical-probe');
        },patch.original??null);
      }
      const result={variant,patchError:patch.error||null,trial,
        menuClientHeight:safety?.menuClientHeight??null,
        targetCenterExposed:after?.centerHitTarget??null,
        demoWarning:safety?.warning??null,demoExit:safety?.exit??null,
        caveat:'Test-only Chromium CSS-zoom geometry; no actual click or Safari proof'};
      menuVerticalCandidates.push(result);
      console.log('MORE MENU VERTICAL CANDIDATE #85 '+label+' '+JSON.stringify(result));
    }
    assert.equal(menuVerticalCandidates.length,2,'Both reversible menu candidates must be measured');
    assert.deepEqual(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),VAULT_KEYS),
      [null,null,null],'Vertical-space probes must never create real vault keys');

    // Return to the same configured DEMO budget so subsequent checks are
    // unaffected by this reversible navigation research.
    console.log('C2 ENTER ACTIVATION #85 '+label+' '+JSON.stringify(activation));
    // Harness-only restoration: this click is NOT counted as natural input
    // evidence. At CSS zoom 200% the menu row may be covered by fixed nav.
    await menuRow.evaluate(el=>el.click());
    await page.getByText(/Lunar · principală/).last().waitFor({state:'visible',timeout:10000});
    const demo=await page.evaluate(()=>({
      warning:[...document.querySelectorAll('*')].some(el=>
        el.children.length===0&&el.textContent?.trim()==='DEMO · DATE FICTIVE'),
      exit:[...document.querySelectorAll('button,[role="button"]')].some(el=>
        (el.getAttribute('aria-label')||el.textContent||'').includes('Ieși din demo'))
    }));
    assert.ok(demo.warning&&demo.exit,'C2 research must retain DEMO warning and exit');
    const vault=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),VAULT_KEYS);
    assert.deepEqual(vault,[null,null,null],'C2 research must not write encrypted vault');
    const result={forward,reverse,forwardOrder,reverseOrder,exposed,activation,menuOcclusion,demo,
      caveat:'Reversible focusin handler on disposable Chromium CSS zoom; not shipped or native Safari evidence'};
    console.log('FOCUS FOLLOW ZOOM NAV C2 #85 '+label+' '+JSON.stringify(result));
    await page.screenshot({path:path.join(OUT,'zoom-nav-focus-follow-c2-'+label+'.png'),fullPage:true});
    return result;
  }finally{
    await page.evaluate(()=>{
      const strip=document.querySelector('[role="tab"]')?.parentElement;
      if(strip?.__web85C2Follow){
        strip.removeEventListener('focusin',strip.__web85C2Follow);
        delete strip.__web85C2Follow;
      }
    });
    await style.evaluate(el=>el.remove());
    await page.waitForTimeout(60);
  }
}

/**
 * #85: real keyboard traversal and visible focus in Chromium. This checks
 * DOM keyboard order and CSS :focus-visible; it is NOT VoiceOver/Safari.
 */
async function keyboardNavFocus(page){
  const home=page.getByRole('tab',{name:'Acasă',exact:true});
  await home.focus();
  const inspect=()=>page.evaluate(()=>{
    const el=document.activeElement;
    const css=getComputedStyle(el);
    return {label:el.getAttribute('aria-label'),role:el.getAttribute('role'),
      focusVisible:el.matches(':focus-visible'),outlineStyle:css.outlineStyle,
      outlineWidthPx:parseFloat(css.outlineWidth)||0,tag:el.tagName,
      tabindex:el.getAttribute('tabindex'),insideRoot:document.getElementById('root')?.contains(el),
      cssSelectorMatch:el.matches('#root :is(button, a, input, select, textarea, [role="button"], [tabindex]):focus-visible'),
      outlineColor:css.outlineColor,boxShadow:css.boxShadow,
      // Focus can have a ring but still be covered by a fixed overlay.
      centerExposed:(()=>{
        const r=el.getBoundingClientRect();
        const x=r.left+r.width/2,y=r.top+r.height/2;
        if(x<0||x>=innerWidth||y<0||y>=innerHeight)return false;
        const hit=document.elementFromPoint(x,y);
        return !!hit&&(el===hit||el.contains(hit));
      })()};
  });
  await page.keyboard.press('Tab');
  const forward=await inspect();
  assert.equal(forward.label,'Finanțe','Tab must reach next distinct navigation destination');
  assert.equal(forward.role,'tab','Keyboard focus must remain on a navigation tab');
  assert.equal(forward.focusVisible,true,'Keyboard-focused tab must match :focus-visible');
  assert.equal(forward.centerExposed,true,'Focused Finanțe tab must not be occluded at its center');
  assert.ok((forward.outlineStyle!=='none'&&forward.outlineWidthPx>=2)||forward.boxShadow.includes('inset'),
    'Keyboard-focused navigation tab must have a visible ring: '+JSON.stringify(forward));
  await page.keyboard.press('Shift+Tab');
  const backward=await inspect();
  assert.equal(backward.label,'Acasă','Shift+Tab must return to previous navigation destination');
  assert.equal(backward.focusVisible,true,'Reverse keyboard focus must remain visibly indicated');
  assert.equal(backward.centerExposed,true,'Focused Acasă tab must not be occluded at its center');
  assert.ok((backward.outlineStyle!=='none'&&backward.outlineWidthPx>=2)||backward.boxShadow.includes('inset'),
    'Reverse keyboard focus must have a visible ring: '+JSON.stringify(backward));
  return {forward,backward,caveat:'Chromium keyboard CSS focus, not Safari or VoiceOver'};
}

/** #85: verify last populated budget detail is reachable above fixed navigation.
 * scrollIntoViewIfNeeded exercises actual scroll container; elementFromPoint
 * catches a row positioned underneath a fixed footer. Chromium only.
 */
async function budgetScrollReachability(page,phase,allowOcclusion=false){
  const lastDetail=page.getByText(/Lunar · principală/).last();
  assert.ok(await lastDetail.count()>=1,'Populated budget must expose a period detail');
  await lastDetail.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const geometry=await lastDetail.evaluate((el,phase)=>{
    const rect=el.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?document.elementFromPoint(x,y):null;
    const nav=[...document.querySelectorAll('[role="tab"]')].map(tab=>{
      const r=tab.getBoundingClientRect();
      return {name:tab.getAttribute('aria-label')||tab.textContent.trim(),top:r.top,bottom:r.bottom};
    });
    const scrollChain=[];
    for(let p=el.parentElement;p;p=p.parentElement){
      const style=getComputedStyle(p);
      if(p.scrollHeight>p.clientHeight+2&&/auto|scroll/.test(style.overflowY))
        scrollChain.push({tag:p.tagName,scrollTop:p.scrollTop,maxScroll:p.scrollHeight-p.clientHeight});
    }
    return {phase,viewport:{width:innerWidth,height:innerHeight},target:{top:rect.top,bottom:rect.bottom,
      centerX:x,centerY:y},centerExposed:!!hit&&(hit===el||el.contains(hit)),
      hitTag:hit?.tagName||null,nav,scrollChain,documentScrollTop:document.scrollingElement?.scrollTop||0};
  },phase);
  assert.ok(geometry.target.centerY>=0&&geometry.target.centerY<geometry.viewport.height,
    'Last budget detail must be vertically reachable: '+JSON.stringify(geometry));
  if(!allowOcclusion)assert.equal(geometry.centerExposed,true,
    'Last budget detail must not be obscured by fixed navigation/overlay: '+JSON.stringify(geometry));
  return geometry;
}

/**
 * #85: last actual budget-page interactive control must remain fully reachable
 * above fixed navigation, including when keyboard focus scrolls it into view.
 * This is Chromium geometry, not native iPhone text/VoiceOver acceptance.
 */
async function budgetInteractiveReachability(page,phase,allowOcclusion=false){
  const selector='button, [role="button"], a[href], input, select, textarea';
  const controls=page.locator(selector);
  const candidates=await controls.evaluateAll(elements=>elements.map((el,index)=>{
    const style=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    const label=(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,100);
    return {index,label,visible:r.width>0&&r.height>0&&style.display!=='none'&&
      style.visibility!=='hidden'&&style.pointerEvents!=='none'&&
      !el.closest('[aria-hidden="true"],[inert],[role="tab"],[role="tablist"]')&&
      !/Ieși din demo/.test(label)};
  }).filter(x=>x.visible));
  assert.ok(candidates.length>=2,'Populated Bugete must have interactive controls: '+JSON.stringify(candidates));
  const last=candidates[candidates.length-1];
  const targets=[
    {name:'După fereastră',locator:page.getByRole('button',{name:'După fereastră',exact:true})},
    {name:'După buget',locator:page.getByRole('button',{name:'După buget',exact:true})},
    {name:'last DOM-order budget control: '+last.label,locator:controls.nth(last.index)}
  ];
  const checks=[];
  for(const target of targets){
    assert.equal(await target.locator.count(),1,'Expected one budget control: '+target.name);
    await target.locator.focus();
    await target.locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(40);
    const geometry=await target.locator.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?document.elementFromPoint(x,y):null;
      const navTop=Math.min(innerHeight,...[...document.querySelectorAll('[role="tab"]')]
        .map(tab=>tab.getBoundingClientRect().top));
      return {target:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},
        viewport:{width:innerWidth,height:innerHeight},navTop,
        centerExposed:!!hit&&(hit===el||el.contains(hit)),
        focused:document.activeElement===el,hitTag:hit?.tagName||null};
    });
    assert.equal(geometry.focused,true,'Budget control must accept keyboard focus: '+target.name);
    if(!allowOcclusion){
      assert.equal(geometry.centerExposed,true,
        'Budget control must be hit-test exposed: '+target.name+' '+JSON.stringify(geometry));
      assert.ok(geometry.target.y>=-1&&geometry.target.bottom<=geometry.navTop+1,
        'Budget control must fit above fixed navigation: '+target.name+' '+JSON.stringify(geometry));
    }
    checks.push({name:target.name,...geometry});
  }
  return {phase,visibleCandidateCount:candidates.length,lastCandidate:last,checks,
    caveat:'Chromium DOM-order/focus/geometry only; not Safari, VoiceOver or text-only enlargement'};
}

/**
 * #85: locate the *actual* navigation surface and the scrollable budget
 * ancestor at 200% CSS zoom. Record a manual scroll-to-end probe separately
 * from Playwright's scrollIntoViewIfNeeded() result. Diagnostic only: no
 * DOM/CSS changes, no storage writes, no Safari accessibility claim.
 */
async function zoomFooterGeometry(page,phase){
  const detail=page.getByText(/Lunar · principală/).last();
  return detail.evaluate(async (el,phase)=>{
    const round=n=>Math.round(n*100)/100;
    const box=node=>{
      const r=node.getBoundingClientRect();
      return {top:round(r.top),bottom:round(r.bottom),left:round(r.left),
        right:round(r.right),width:round(r.width),height:round(r.height)};
    };
    const describe=node=>{
      const s=getComputedStyle(node);
      return {tag:node.tagName,role:node.getAttribute('role'),
        position:s.position,overflowY:s.overflowY,pointerEvents:s.pointerEvents,
        zIndex:s.zIndex,rect:box(node)};
    };
    const tabs=[...document.querySelectorAll('[role="tab"]')];
    const navAncestors=[];
    for(let node=tabs[0];node&&navAncestors.length<12;node=node.parentElement)
      navAncestors.push(describe(node));
    const scrollNodes=[];
    for(let node=el.parentElement;node;node=node.parentElement){
      const s=getComputedStyle(node);
      if(node.scrollHeight>node.clientHeight+2&&/auto|scroll/.test(s.overflowY))
        scrollNodes.push(node);
    }
    const snapshot=()=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
        document.elementFromPoint(x,y):null;
      const hitPath=[];
      for(let node=hit;node&&hitPath.length<7;node=node.parentElement)
        hitPath.push({tag:node.tagName,role:node.getAttribute('role'),
          className:typeof node.className==='string'?node.className.slice(0,70):''});
      return {target:box(el),centerExposed:!!hit&&(hit===el||el.contains(hit)),
        hitPath,scrollAncestors:scrollNodes.slice(0,5).map(node=>({
          ...describe(node),scrollTop:round(node.scrollTop),
          maxScroll:round(node.scrollHeight-node.clientHeight),
          scrollHeight:node.scrollHeight,clientHeight:node.clientHeight}))};
    };
    const afterAutoScroll=snapshot();
    let afterManualScrollToEnd=null;
    if(scrollNodes.length){
      const node=scrollNodes[0],before=node.scrollTop;
      try{
        node.scrollTop=node.scrollHeight;
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        afterManualScrollToEnd=snapshot();
      }finally{node.scrollTop=before;}
    }
    return {phase,viewport:{width:innerWidth,height:innerHeight},tabCount:tabs.length,
      navAncestors,afterAutoScroll,afterManualScrollToEnd,
      caveat:'CSS zoom proxy and manual scroll probe; not Safari/Dynamic Type/VoiceOver'};
  },phase);
}

/**
 * #85: reversible layout candidate probe in a disposable Chromium demo only.
 * No product stylesheet, persisted vault, formulas, or accessibility pass claim.
 * Record failures explicitly rather than treating a green diagnostic as a fix.
 */
async function shortHeightLayoutCandidate(page,label,name,css){
  const style=css?await page.addStyleTag({content:css}):null;
  const box=el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
      width:r.width,height:r.height};
  };
  try{
    await page.waitForTimeout(80);
    const detail=page.getByText(/Lunar · principală/).last();
    await detail.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
    await page.waitForTimeout(80);
    const lastDetail=await detail.evaluate(el=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=(x>=0&&x<innerWidth&&y>=0&&y<innerHeight)?
        document.elementFromPoint(x,y):null;
      return {rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},
        centerInViewport:y>=0&&y<innerHeight,
        hitOwnOrDescendant:!!hit&&(hit===el||el.contains(hit)),
        hitAncestor:!!hit&&hit.contains(el),
        hitTag:hit?.tagName||null,
        bodyScrollTop:document.scrollingElement?.scrollTop||0};
    });
    const tabs=[];
    for(const tabName of ['Acasă','Finanțe','Adaugă','Istoric','Mai mult']){
      const tab=page.getByRole('tab',{name:tabName,exact:true});
      let error=null;
      try{
        await tab.focus();
        await tab.scrollIntoViewIfNeeded({timeout:2000});
      }catch(e){error=String(e.message).slice(0,180);}
      const state=await tab.evaluate(el=>{
        const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=(x>=0&&x<innerWidth&&y>=0&&y<innerHeight)?
          document.elementFromPoint(x,y):null;
        return {top:r.top,bottom:r.bottom,focused:document.activeElement===el,
          centerInViewport:y>=0&&y<innerHeight,
          hitTab:!!hit&&(hit===el||el.contains(hit)),
          focusVisible:el.matches(':focus-visible'),
          scrollTop:document.scrollingElement?.scrollTop||0};
      });
      tabs.push({name:tabName,error,...state});
    }
    const demo=await page.evaluate(()=>{
      const leaf=[...document.querySelectorAll('*')].find(el=>
        el.children.length===0&&el.textContent?.trim()==='DEMO · DATE FICTIVE');
      const exit=[...document.querySelectorAll('button,[role="button"]')].find(el=>
        (el.getAttribute('aria-label')||el.textContent||'').includes('Ieși din demo'));
      const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,height:r.height};};
      return {warningPresent:!!leaf,exitPresent:!!exit,warning:rect(leaf),exit:rect(exit),
        tabCount:document.querySelectorAll('[role="tab"]').length,
        bodyOverflowY:getComputedStyle(document.body).overflowY,
        rootHeight:document.getElementById('root')?.getBoundingClientRect().height,
        documentScrollHeight:document.scrollingElement?.scrollHeight,
        documentClientHeight:document.scrollingElement?.clientHeight,
        documentScrollTop:document.scrollingElement?.scrollTop||0,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    const vault=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),VAULT_KEYS);
    assert.deepEqual(vault,[null,null,null],'Experimental layout must never write a real encrypted vault');
    assert.equal(demo.tabCount,5,'All five navigation destinations must remain in the DOM');
    assert.equal(demo.warningPresent,true,'DEMO warning must remain present');
    assert.equal(demo.exitPresent,true,'DEMO exit must remain present');
    // Strict operability is exercised only for the smaller outer-scroll
    // candidate. The shell-flow alternative remains a geometry comparator.
    // These actions run exclusively against the disposable in-memory DEMO.
    let strict=null;
    if(name==='outer-scroll'||name==='product-short-height'){
      const probe=async (locator,description,focus=false)=>{
        await locator.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
        // Establish keyboard input modality before focusing; programmatic
        // focus after a pointer click does not necessarily match :focus-visible.
        if(focus){await page.keyboard.press('Tab');await locator.focus();}
        await page.waitForTimeout(60);
        const state=await locator.evaluate(el=>{
          const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
          const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
            document.elementFromPoint(x,y):null;
          return {centerInViewport:x>=0&&x<innerWidth&&y>=0&&y<innerHeight,
            hitOwnOrRelated:!!hit&&(hit===el||el.contains(hit)||hit.contains(el)),
            focused:document.activeElement===el,
            focusVisible:el.matches(':focus-visible'),
            scrollTop:document.scrollingElement?.scrollTop||0};
        });
        assert.ok(state.centerInViewport&&state.hitOwnOrRelated,
          'Short-height '+description+' must be reachable: '+JSON.stringify(state));
        if(focus)assert.ok(state.focused&&state.focusVisible,
          'Short-height '+description+' must retain visible keyboard focus: '+JSON.stringify(state));
        return state;
      };
      const warning=await probe(page.getByText('DEMO · DATE FICTIVE',{exact:true}),
        'DEMO warning');
      const exit=await probe(page.getByRole('button',{name:'Ieși din demo'}),
        'DEMO exit (not activated)',true);
      const filters=[];
      for(const filterName of ['După fereastră','După buget']){
        const control=page.getByRole('button',{name:filterName,exact:true});
        const state=await probe(control,'budget filter '+filterName,true);
        await control.click({timeout:5000});
        filters.push({name:filterName,...state,clicked:true});
      }
      const activations=[];
      for(const tabName of ['Acasă','Finanțe','Adaugă','Istoric','Mai mult']){
        const tab=page.getByRole('tab',{name:tabName,exact:true});
        const state=await probe(tab,'navigation '+tabName,true);
        await tab.click({timeout:5000});
        assert.equal(await tab.getAttribute('aria-selected'),'true',
          'Short-height navigation must actually activate '+tabName);
        activations.push({name:tabName,...state,activated:true});
      }
      // Leave the synthetic page on Bugete for the next candidate and
      // ensure switching destinations did not lose the configured budget.
      await page.getByText('Bugete',{exact:true}).last().click({timeout:5000});
      await page.getByText(/Alimente DEMO · TEST/).first()
        .waitFor({state:'visible',timeout:5000});
      strict={warning,exit,filters,activations,returnedToBudget:true};
    }
    const outcome={label,candidate:name,lastDetail,tabs,demo,strict,
      fullyReachable:lastDetail.centerInViewport&&
        (lastDetail.hitOwnOrDescendant||lastDetail.hitAncestor)&&
        tabs.every(t=>t.centerInViewport&&t.hitTab)&&!demo.horizontalOverflow&&
        (!['outer-scroll','product-short-height'].includes(name)||(strict?.returnedToBudget&&
          strict.activations.length===5))};
    console.log('REVERSIBLE SHORT HEIGHT CANDIDATE #85 '+JSON.stringify(outcome));
    await page.screenshot({path:path.join(OUT,
      'short-height-candidate-'+name+'-'+label+'.png'),fullPage:false});
    return outcome;
  }finally{
    if(style)await style.evaluate(el=>el.remove());
    await page.evaluate(()=>{if(document.scrollingElement)document.scrollingElement.scrollTop=0;});
    await page.waitForTimeout(60);
  }
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
    // WEB 18.60: compact DEMO warning must remain explicit and exit reachable.
    await page.getByText('DEMO · DATE FICTIVE',{exact:true}).waitFor({state:'visible'});
    assert.ok(await page.getByText('Date fictive, doar în memorie.',{exact:false}).count()>=1,
      'Compact banner must still identify memory-only fictional data');
    assert.ok(await page.getByText(/Backup, diagnostic, import și ștergere dezactivate/).isVisible(),
      'Compact banner must still identify unavailable destructive/export actions');
    assert.ok(await page.getByRole('button',{name:'Ieși din demo'}).isVisible(),
      'Compact banner must retain a visible exit action');
    await page.screenshot({path:path.join(OUT,'demo-banner-'+label+'.png'),fullPage:true});
    // WEB 18.57: test the real disclosure UI, not only a static bundle string.
    // Demo is in memory and no financial vault is created.
    await page.getByRole('tab',{name:'Acasă'}).click();
    // WEB 18.68: real disposable-demo Dashboard reset control, light/dark at 320/390.
    // This action belongs to the explicit card-arrangement mode.
    await page.getByRole('button',{name:'Aranjează',exact:true}).click();
    const layoutReset=page.getByRole('button',{name:'Restabilește ordinea cardurilor de pe Acasă',exact:true});
    assert.equal(await layoutReset.count(),1,'Dashboard layout reset needs one accessible button');
    assert.equal(await layoutReset.innerText(),'Restabilește ordinea','Reset action must use visible Romanian copy');
    const layoutResetBox=await layoutReset.boundingBox();
    assert.ok(layoutResetBox&&layoutResetBox.height>=43.5,
      'Dashboard layout reset touch target must be at least 44 CSS px tall');
    // #400: verify the reset ACTUALLY restores a changed order, not just that
    // the button is clickable while the default order is already selected.
    // Use the real accessible reorder controls; never mutate app state directly.
    const autonomyUp=page.getByRole('button',{name:'Mută Autonomie mai sus',exact:true});
    const autonomyDown=page.getByRole('button',{name:'Mută Autonomie mai jos',exact:true});
    assert.equal(await autonomyUp.isDisabled(),true,
      'Autonomie must start first in the default dashboard order');
    assert.equal(await autonomyDown.isEnabled(),true,
      'Autonomie must be movable down before resetting the order');
    await autonomyDown.click();
    assert.equal(await autonomyUp.isEnabled(),true,
      'Moving Autonomie down must change the actual dashboard order');
    await layoutReset.click();
    // #400: Budget and Quick Actions must respect the user's order, including
    // the default order. This catches a hidden render-only .sort override.
    const budgetUp=page.getByRole('button',{name:'Mută Buget mai sus',exact:true});
    const actionsUp=page.getByRole('button',{name:'Mută Acțiuni rapide mai sus',exact:true});
    const budgetY=async()=> (await budgetUp.boundingBox()).y;
    const actionsY=async()=> (await actionsUp.boundingBox()).y;
    assert.ok(await budgetY()<await actionsY(),
      'Default Dashboard order must place Buget before Acțiuni rapide');
    await actionsUp.click();
    assert.ok(await actionsY()<await budgetY(),
      'Moving Acțiuni rapide up must display it above Buget');
    // #400: the selected order must survive leaving arrangement mode and
    // switching sections, not merely a transient drag/reorder render.
    // This remains disposable DEMO memory; never touch the encrypted vault.
    await page.getByRole('button',{name:'Gata',exact:true}).click();
    await page.getByRole('tab',{name:'Finanțe',exact:true}).click();
    await page.getByRole('tab',{name:'Acasă',exact:true}).click();
    await page.getByRole('button',{name:'Aranjează',exact:true}).click();
    assert.ok(await actionsY()<await budgetY(),
      'Custom Dashboard order must survive leaving arrangement mode and navigating away/back');
    await layoutReset.click();
    assert.ok(await budgetY()<await actionsY(),
      'Reset must restore Buget above Acțiuni rapide');
    assert.equal(await autonomyUp.isDisabled(),true,
      'Reset must restore Autonomie to the first position, not merely acknowledge a click');
    assert.equal(await layoutReset.count(),1,'Reset control must remain available after restoring default card order');
    // #400: keyboard-only reorder and reset must work in the rendered DEMO.
    // Unlike a mouse-click test, this detects inaccessible Pressable handlers.
    // Chromium focus/activation evidence is not Safari or VoiceOver acceptance.
    await page.keyboard.press('Tab');
    await actionsUp.focus();
    const keyboardReorderFocus=await actionsUp.evaluate(el=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=document.elementFromPoint(x,y);
      const css=getComputedStyle(el);
      return {focused:document.activeElement===el,focusVisible:el.matches(':focus-visible'),
        centerExposed:!!hit&&(hit===el||el.contains(hit)),
        outlineWidth:parseFloat(css.outlineWidth)||0,outlineStyle:css.outlineStyle,
        boxShadow:css.boxShadow};
    });
    assert.equal(keyboardReorderFocus.focused,true,'Keyboard reorder control must accept focus');
    assert.equal(keyboardReorderFocus.focusVisible,true,'Keyboard reorder control must show focus-visible');
    assert.equal(keyboardReorderFocus.centerExposed,true,'Keyboard reorder control must not be covered');
    const keyboardFocusRing=(keyboardReorderFocus.outlineStyle!=='none'&&keyboardReorderFocus.outlineWidth>=2)||
      keyboardReorderFocus.boxShadow.includes('inset');
    assert.equal(keyboardFocusRing,true,
      'Keyboard reorder control must show a perceptible focus ring: '+JSON.stringify(keyboardReorderFocus));
    // #400/#85 DISCOVERY: Windows high-contrast / forced-colors Chromium proxy.
    // Browser CSS box-shadows may be suppressed; log actual focus treatment
    // without claiming Safari, Windows AT, or WCAG conformance.
    await page.emulateMedia({forcedColors:'active'});
    // Media change may rerender RN Web classes; inspect the settled state,
    // not a synchronous intermediate style while the DOM is reconciling.
    await page.waitForTimeout(250);
    const forcedColorsFocus=await actionsUp.evaluate(el=>{
      const css=getComputedStyle(el);
      return {focused:document.activeElement===el,
        focusVisible:el.matches(':focus-visible'),
        outlineStyle:css.outlineStyle,outlineWidth:parseFloat(css.outlineWidth)||0,
        outlineColor:css.outlineColor,boxShadow:css.boxShadow};
    });
    console.log('FORCED COLORS #400 '+label+' '+JSON.stringify(forcedColorsFocus));
    assert.equal(forcedColorsFocus.focused,true,
      'Forced-colors focus must stay on the active Dashboard reorder button');
    assert.equal(forcedColorsFocus.focusVisible,true,
      'Forced-colors focused Dashboard button must match :focus-visible');
    assert.ok(forcedColorsFocus.outlineStyle!=='none'&&forcedColorsFocus.outlineWidth>=2,
      'Forced-colors Dashboard button must retain a real outline, not only a suppressed shadow: '+
        JSON.stringify(forcedColorsFocus));
    await page.emulateMedia({forcedColors:'none'});
    assert.equal(await actionsUp.evaluate(el=>document.activeElement===el),true,
      'Changing forced-colors media must preserve focused reorder control');
    await page.keyboard.press('Enter');
    assert.ok(await actionsY()<await budgetY(),
      'Enter on focused Acțiuni rapide reorder control must actually move its card');
    await layoutReset.focus();
    await page.keyboard.press('Enter');
    assert.ok(await budgetY()<await actionsY(),
      'Enter on focused reset control must restore default card order');
    console.log('PASS #400: keyboard Enter reorders and resets Dashboard with visible focus ('+label+')');
    await page.getByRole('button',{name:'Gata',exact:true}).click();
    const disclosureButtons=page.getByRole('button',{name:'Vezi calculul',exact:true});
    assert.ok(await disclosureButtons.count()>=2,'Home must expose labeled calculation disclosures');
    const firstDisclosure=disclosureButtons.first();
    assert.match(await firstDisclosure.innerText(),/Vezi calculul/,'Disclosure label must be visible, not only accessible');
    const disclosureBox=await firstDisclosure.boundingBox();
    assert.ok(disclosureBox&&disclosureBox.height>=43.5,'Disclosure touch target must be at least 44 CSS px high');
    await firstDisclosure.click();
    assert.equal(await page.getByRole('button',{name:'Ascunde calculul',exact:true}).count(),1,
      'Expanded disclosure must expose the matching visible/accessibility name');
    await page.getByRole('button',{name:'Ascunde calculul',exact:true}).click();
    await page.screenshot({path:path.join(OUT,'home-calculation-'+label+'.png'),fullPage:true});
    // WEB 18.58: an unconfigured budget must not masquerade as a calculated 0/0 limit.
    await page.getByRole('tab',{name:'Mai mult'}).click();
    // WEB 18.62: navigation and planning copy is short, factual, and non-coaching.
    await page.getByText('SECȚIUNI',{exact:true}).waitFor({state:'visible',timeout:10000});
    await page.getByText('Bugete',{exact:true}).last().click();
    await page.getByText('Limite planificate și cheltuieli înregistrate, pe fiecare perioadă.',{exact:true})
      .waitFor({state:'visible',timeout:10000});
    await page.getByText('Buget neconfigurat',{exact:true}).waitFor({state:'visible',timeout:10000});
    assert.equal(await page.getByText('Buget azi',{exact:true}).count(),0,
      'No daily budget result card may appear before a budget is configured');
    assert.equal(await page.getByRole('button',{name:'După buget'}).count(),0,
      'Unconfigured budget page must not show irrelevant filter controls');
    await page.screenshot({path:path.join(OUT,'empty-budget-'+label+'.png'),fullPage:true});
    // WEB 18.59: direct empty-state action opens the SAME existing editor.
    // Save a disposable demo budget, then verify it is visible in Finanțe and Bugete.
    const setup=page.getByRole('button',{name:'Configurează primul buget',exact:true});
    assert.equal(await setup.count(),1,'Empty budget page must expose one direct setup action');
    const setupBox=await setup.boundingBox();
    assert.ok(setupBox&&setupBox.height>=43.5,'Budget setup target must be at least 44 CSS px tall');
    await setup.click();
    await page.getByText('Categorie de buget',{exact:true}).waitFor({state:'visible',timeout:10000});
    // #17: assert the ACTUAL editor copy, not just literals in the bundle.
    // Chromium / disposable memory-only DEMO; no Safari or VoiceOver certification.
    await page.getByText('Alte perioade urmărite',{exact:true})
      .waitFor({state:'visible',timeout:10000});
    for(const legacy of ['Primary window','Additional tracking windows',
      'Budget ID explicit','Fixed, Debt, Savings, Transfer, Unbudgeted']){
      assert.equal(await page.getByText(legacy,{exact:false}).count(),0,
        'Budget editor must not expose legacy technical copy: '+legacy);
    }
    await page.getByRole('textbox',{name:'Nume'}).fill('Alimente DEMO · TEST');
    await page.getByRole('textbox',{name:'Limită pentru perioada principală · RON'}).fill('2000');
    await page.getByRole('button',{name:'Salvează configurația'}).click();
    assert.equal(await setup.count(),0,'Configured budget must no longer display the empty-state action');
    assert.equal(await page.getByRole('tab',{name:'Finanțe'}).count(),1,'Finance tab missing');
    await page.getByRole('tab',{name:'Finanțe'}).click();
    await page.getByRole('button',{name:/^Bugete/}).click();
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
    const scrollNormal=await budgetScrollReachability(page,'normal');
    const interactiveNormal=await budgetInteractiveReachability(page,'normal');
    const navNormal=await navFootprint(page);
    const focusNormal=await keyboardNavFocus(page);
    assert.deepEqual(navNormal.textOverlapPairs,[], 'Navigation text must not overlap at normal size');
    assert.deepEqual(navNormal.hitTargetOverlapPairs,[], 'normal navigation pressable targets must not overlap');
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
    // #85: B/C comparison is read-only research in disposable DEMO Chromium.
    // Use CSS :has() to target the existing RN Web parent of the five tabs.
    // These candidates are NOT product changes; restore the DOM after each.
    const twoRowNavCSS=
      '#root :has(> [role="tab"]){flex-wrap:wrap!important;overflow-x:visible!important}'+
      '#root [role="tab"]{flex:0 0 33.333%!important;min-width:0!important}';
    const scrollNavCSS=
      '#root :has(> [role="tab"]){flex-wrap:nowrap!important;overflow-x:auto!important;'+
      'scrollbar-width:auto!important;scroll-snap-type:x proximity}'+
      '#root [role="tab"]{flex:0 0 120px!important;min-width:120px!important;'+
      'scroll-snap-align:center}';
    const navCandidates={
      twoRow:await zoomNavigationCandidate(page,label,'two-row',twoRowNavCSS),
      horizontal:await zoomNavigationCandidate(page,label,'horizontal-scroll',scrollNavCSS)
    };
    const naturalNav=await naturalZoomNavInput(page,label,scrollNavCSS);
    const focusFollowingC2=await focusFollowingZoomNavInput(page,label,scrollNavCSS);
    assert.deepEqual(navZoom.textOverlapPairs,[], 'Navigation labels must not overlap at 200% CSS zoom');
    assert.deepEqual(navZoom.hitTargetOverlapPairs,[], '200% CSS zoom navigation pressable targets must not overlap');
    assert.deepEqual(navZoom.textOutsideHitTarget,[], 'Navigation labels must fit hit targets at 200% CSS zoom');
    // #85: overlapping-free labels are insufficient if budget controls are
    // hidden by the fixed footer or keyboard focus becomes imperceptible.
    // This remains a Chromium CSS-zoom stress proxy, NOT Safari/Dynamic Type.
    const scrollZoom=await budgetScrollReachability(page,'csszoom200',true);
    const interactiveZoom=await budgetInteractiveReachability(page,'csszoom200',true);
    const footerZoom=await zoomFooterGeometry(page,'csszoom200');
    assert.equal(footerZoom.tabCount,5,'Footer diagnosis must inspect all five navigation tabs');
    assert.ok(footerZoom.afterAutoScroll.scrollAncestors.length>0,
      'Footer diagnosis must identify a scrollable budget ancestor');
    console.log('ZOOM FOOTER GEOMETRY #85 '+label+' '+JSON.stringify({
      nav:footerZoom.navAncestors.slice(0,6),auto:footerZoom.afterAutoScroll,
      manual:footerZoom.afterManualScrollToEnd}));
    // CSS zoom can expose a real hit-test occlusion even when nav labels fit.
    // Preserve it in geometry instead of silently converting it to a pass.
    const zoomOccluded=(!scrollZoom.centerExposed?1:0)+
      interactiveZoom.checks.filter(check=>!check.centerExposed||check.target.bottom>check.navTop+1).length;
    if(zoomOccluded)console.log('KNOWN UX LIMIT #85: 200% CSS zoom occluded '+zoomOccluded+
      ' budget detail/control targets at '+label+'; see artifact geometry');
    const zoom=await page.evaluate(()=>({
      viewport:innerWidth,documentScrollWidth:document.documentElement.scrollWidth,
      rootZoom:getComputedStyle(document.documentElement).zoom,
      visibleText:document.body.innerText.slice(0,1800)
    }));
    // A real browser at 200% zoom has fewer layout CSS pixels, unlike root CSS zoom.
    // Half-width layout is an additional proxy, not a Safari/Dynamic Type certification.
    await page.evaluate(()=>{document.documentElement.style.zoom='';});
    await page.setViewportSize({width:Math.floor(width/2),height:844});
    await page.waitForTimeout(150);
    const scrollNarrow=await budgetScrollReachability(page,'half-width');
    const interactiveNarrow=await budgetInteractiveReachability(page,'half-width');
    const navNarrow=await navFootprint(page);
    const focusNarrow=await keyboardNavFocus(page);
    assert.deepEqual(navNarrow.textOverlapPairs,[], 'Narrow layout navigation must not overlap');
    assert.deepEqual(navNarrow.hitTargetOverlapPairs,[], 'half-width navigation pressable targets must not overlap');
    assert.deepEqual(navNarrow.textOutsideHitTarget,[], 'Narrow layout navigation labels must stay within targets');
    const narrowRows=new Set(navNarrow.tabs.map(t=>Math.round(t.hitTarget.y))).size;
    assert.ok(narrowRows>=2,'Extremely narrow navigation must wrap into at least two rows');
    await page.screenshot({path:path.join(OUT,'populated-budget-'+label+'-half-width.png'),fullPage:true});
    // #85: unlike root CSS zoom, browser zoom reduces BOTH effective layout
    // width and height. Inspect a 50% x 50% viewport without touching the DOM,
    // storage or formulas. Diagnostic only: do not convert known occlusion to PASS.
    const halfHeight=Math.floor(844/2);
    await page.setViewportSize({width:Math.floor(width/2),height:halfHeight});
    await page.waitForTimeout(150);
    const halfBoth=await zoomFooterGeometry(page,'half-width-half-height');
    const halfBothShell=await page.evaluate(()=>{
      const box=el=>{
        if(!el)return null;
        const r=el.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
          width:r.width,height:r.height};
      };
      const tabs=[...document.querySelectorAll('[role="tab"]')];
      const root=document.getElementById('root');
      const demoText=[...document.querySelectorAll('*')].find(el=>
        el.children.length===0&&el.textContent?.trim()==='DEMO · DATE FICTIVE');
      const exit=[...document.querySelectorAll('button,[role="button"]')].find(el=>
        (el.getAttribute('aria-label')||el.textContent||'').includes('Ieși din demo'));
      return {viewport:{width:innerWidth,height:innerHeight},
        root:box(root),body:box(document.body),
        demoWarning:box(demoText),demoExit:box(exit),
        tabCount:tabs.length,tabs:tabs.map(el=>({
          name:el.getAttribute('aria-label')||el.textContent?.trim(),
          rect:box(el)}))};
    });
    assert.equal(halfBothShell.tabCount,5,
      'Half-width/half-height diagnostic must preserve five DOM navigation tabs');
    console.log('HALF WIDTH HEIGHT GEOMETRY #85 '+label+' '+JSON.stringify({
      shell:halfBothShell,scroll:halfBoth.afterAutoScroll,
      manual:halfBoth.afterManualScrollToEnd,
      nav:halfBoth.navAncestors.slice(0,6)}));
    await page.screenshot({path:path.join(OUT,'populated-budget-'+label+'-half-width-half-height.png'),fullPage:true});
    // Two reversible candidates; never modify the product CSS or classify
    // diagnostic CI success as an accessibility fix.
    const outerScrollCSS=
      'html,body{height:auto!important;min-height:100vh!important;overflow-y:auto!important}'+
      '#root{height:auto!important;min-height:100vh!important;overflow:visible!important}';
    // WEB 18.67: strict product acceptance WITHOUT injected CSS.
    const productShort=await shortHeightLayoutCandidate(page,label,'product-short-height','');
    assert.equal(productShort.fullyReachable,true,
      'Shipped short-height mobile layout must expose DEMO controls, budget and five tabs');
    const candidateOuter=await shortHeightLayoutCandidate(page,label,'outer-scroll',outerScrollCSS);
    assert.equal(candidateOuter.fullyReachable,true,
      'Strict outer-scroll half-width/half-height candidate must be fully operable');
    const candidateShell=await shortHeightLayoutCandidate(page,label,'shell-flow',
      'html,body{height:auto!important;min-height:100vh!important;overflow-y:auto!important}'+
      '#root{height:auto!important;min-height:100vh!important;overflow:visible!important}'+
      '#root>div{height:auto!important;min-height:100vh!important;overflow:visible!important}'+
      '#root>div>div{height:auto!important;min-height:0!important;overflow:visible!important}');
    // Also exercise the actual 320/390px width at reduced 422px height.
    // The previous test only exercised 160/195px at 422px.
    await page.setViewportSize({width,height:halfHeight});
    await page.waitForTimeout(100);
    const productReduced=await shortHeightLayoutCandidate(page,
      label+'-reduced-height','product-short-height','');
    assert.equal(productReduced.fullyReachable,true,
      'Shipped reduced-height mobile layout must be fully operable');
    const candidateReduced=await shortHeightLayoutCandidate(page,
      label+'-reduced-height','outer-scroll',outerScrollCSS);
    assert.equal(candidateReduced.fullyReachable,true,
      'Strict outer-scroll reduced-height candidate must be fully operable');
    console.log('SHORT HEIGHT CANDIDATE COMPARISON #85 '+label+' '+
      JSON.stringify({product:productShort.fullyReachable,
        outer:candidateOuter.fullyReachable,shell:candidateShell.fullyReachable,
        productReduced:productReduced.fullyReachable,reduced:candidateReduced.fullyReachable}));
    // Restore the previously verified half-width layout for strict navigation
    // operability checks; reduced-height geometry is research, not certification.
    await page.setViewportSize({width:Math.floor(width/2),height:844});
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflowY),'hidden',
      'Normal-height mobile layout must retain its original non-scrolling shell');
    for(const name of ['Acasă','Finanțe','Adaugă','Istoric','Mai mult']){
      const tab=page.getByRole('tab',{name,exact:true});
      await tab.click();
      assert.equal(await tab.getAttribute('aria-selected'),'true','Destination must remain operable: '+name);
    }
    const footprint=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),VAULT_KEYS);
    assert.deepEqual(footprint,[null,null,null],'Demo must not create encrypted vault entries');
    assert.ok(normal.bodyText.includes('Alimente DEMO · TEST'),'Configured budget must render in the real UI');
    assert.equal(normal.colorScheme,scheme,'Actual theme must match requested palette');
    const result={viewport:width,scheme,configuredBudget:'Alimente DEMO · TEST',
      limitRON:2000,englishPrimaryRowCount:englishPrimaryRow,
      normal:{...normal,navigation:navNormal,keyboardFocus:focusNormal,budgetScroll:scrollNormal,budgetInteractive:interactiveNormal},zoom:{...zoom,navigation:navZoom,navCandidates,naturalNav,focusFollowingC2,budgetScroll:scrollZoom,budgetInteractive:interactiveZoom,footerGeometry:footerZoom,occludedTargets:zoomOccluded},halfWidth:{width:Math.floor(width/2),navigation:navNarrow,keyboardFocus:focusNarrow,budgetScroll:scrollNarrow,budgetInteractive:interactiveNarrow,rows:narrowRows},halfWidthHalfHeight:{...halfBothShell,scroll:halfBoth},shortHeightCandidates:{product:productShort,outer:candidateOuter,shell:candidateShell,
        productReduced,reduced:candidateReduced},encryptedVaultUntouched:true};
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
