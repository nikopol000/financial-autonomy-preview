#!/usr/bin/env node
// RESEARCH ONLY: real archived v18.20 bundle boot in isolated Chromium.
// No production origin, user data, or claim of stale-writer/reset safety.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const archived = '_expo/static/js/web/index-v01820-history-back-navigation-20261014.js';
const root = process.cwd();
assert.ok(fs.existsSync(path.join(root, archived)), 'Archived bundle missing');
const original = fs.readFileSync('index.html', 'utf8');
const html = original.replace(/<script src="\/financial-autonomy-preview\/_expo\/static\/js\/web\/[^"]+" defer><\/script>/,
  '<script src="/financial-autonomy-preview/' + archived + '" defer></script>')
  .replace(/content="18\.74"/, 'content="18.20"');
assert.ok(html.includes(archived), 'Archived HTML rewrite did not take effect');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/' || url.pathname === '/financial-autonomy-preview/' ) {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
    res.end(html); return;
  }
  const relative = decodeURIComponent(url.pathname).replace(/^\/financial-autonomy-preview\//, '').replace(/^\//,'');
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, {'Content-Type': full.endsWith('.js')?'text/javascript':'application/octet-stream'});
  fs.createReadStream(full).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto('http://127.0.0.1:'+server.address().port+'/financial-autonomy-preview/', {waitUntil:'networkidle',timeout:30000});
    assert.equal(response.status(),200);
    await page.waitForTimeout(1200);
    const result = await page.evaluate(() => ({
      rootChildren:document.getElementById('root')?.children.length || 0,
      version:document.querySelector('meta[name="financial-autonomy-version"]')?.content,
      keys:Object.keys(localStorage).filter(k=>k.startsWith('financial-autonomy.preview.'))
    }));
    assert.equal(result.version,'18.20');
    assert.ok(result.rootChildren>0, 'Archived client did not mount');
    assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
    console.log(JSON.stringify({status:'PASS',scope:'archived-v18.20-browser-boot-only',result,errors,staleWriterTested:false,resetTested:false,realData:false}));
    await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
