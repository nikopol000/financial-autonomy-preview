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
    const loadedScripts = [];
    const failedAssets = [];
    const externalRequests = [];
    // Research origin is intentionally synthetic. Never allow archived code to contact external services.
    await page.route('**/*', async route => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.hostname !== '127.0.0.1') {
        externalRequests.push(requestUrl.origin);
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', response => {
      if (response.status() >= 400) failedAssets.push({url:response.url(),status:response.status()});
    });
    page.on('response', response => {
      if (response.url().includes('/_expo/static/js/web/')) loadedScripts.push({url:response.url(),status:response.status()});
    });
    const response = await page.goto('http://127.0.0.1:'+server.address().port+'/financial-autonomy-preview/', {waitUntil:'networkidle',timeout:30000});
    assert.equal(response.status(),200);
    await page.waitForTimeout(1200);
    const result = await page.evaluate(() => ({
      rootChildren:document.getElementById('root')?.children.length || 0,
      version:document.querySelector('meta[name="financial-autonomy-version"]')?.content,
      keys:Object.keys(localStorage).filter(k=>k.startsWith('financial-autonomy.preview.'))
    }));
    assert.equal(result.version,'18.20');
    assert.ok(loadedScripts.some(s => s.url.endsWith(archived) && s.status === 200),
      'Authentic archived bundle was not observed loading with HTTP 200');
    assert.ok(!loadedScripts.some(s => !s.url.endsWith(archived)),
      'Unexpected alternate WEB application bundle loaded');
    assert.ok(result.rootChildren>0, 'Archived client did not mount');
    assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
    assert.deepEqual(failedAssets,[], 'Missing/failed assets: '+JSON.stringify(failedAssets));
    assert.deepEqual(externalRequests,[], 'Archived bundle attempted external requests: '+JSON.stringify(externalRequests));
    // Synthetic reload boundary: ensure the archived app boots again without erasing unrelated origin storage.
    // This is NOT a vault overwrite/reset test and does not assert any financial state.
    const sentinelKey = 'research.synthetic.unrelated-storage.v1';
    const sentinelValue = 'synthetic-only-do-not-use-real-financial-data';
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [sentinelKey, sentinelValue]);
    await page.reload({waitUntil:'networkidle', timeout:30000});
    await page.waitForTimeout(300);
    const reload = await page.evaluate(key => ({
      sentinel:localStorage.getItem(key),
      rootChildren:document.getElementById('root')?.children.length || 0
    }), sentinelKey);
    assert.equal(reload.sentinel, sentinelValue, 'Archived reload erased unrelated synthetic storage');
    assert.ok(reload.rootChildren > 0, 'Archived client did not mount after reload');
    assert.equal(errors.length, 0, 'Browser errors after reload: '+errors.join('; '));
    assert.deepEqual(failedAssets, [], 'Missing assets after reload: '+JSON.stringify(failedAssets));
    assert.deepEqual(externalRequests, [], 'External requests after reload: '+JSON.stringify(externalRequests));
    await page.evaluate(key => localStorage.removeItem(key), sentinelKey);
    console.log(JSON.stringify({status:'PASS',scope:'archived-v18.20-browser-boot-and-synthetic-reload-only',result,reload,loadedScripts,errors,failedAssets,externalRequests,staleWriterTested:false,resetTested:false,realData:false}));
    await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
