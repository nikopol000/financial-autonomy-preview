// Node.js regression guard: v18.22 reconciliation release with accessibility shell preserved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const version = html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
assert.equal(version, '18.22');
assert.match(html, /<html lang="ro">/);
assert.match(html, /name="description"/);
assert.match(html, /name="robots" content="noindex, nofollow"/);
assert.match(html, /:focus-visible/);
assert.match(html, /prefers-reduced-motion: reduce/);
assert.match(html, /forced-colors: active/);
assert.match(html, /Activează JavaScript/);
const path = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=18\.21\.1"/)?.[1];
assert.equal(path, '_expo/static/js/web/index-v01822-reconciliation-20261022.js');
const current = fs.readFileSync(path, 'utf8');
const baseline = fs.readFileSync('_expo/static/js/web/index-v01821-accessibility-shell-20261022.js', 'utf8');
assert.ok(current.includes('version:"18.22"'));
assert.ok(current.includes('financial-autonomy-diagnostic-unic-v18.22.json'));
const normalized = current.replace('version:"18.22"', 'version:"18.21"')
  .replace('financial-autonomy-diagnostic-unic-v18.22.json', 'financial-autonomy-diagnostic-unic-v18.21.json')
  .replace('v=k-u', 'h=n.opening+b(e,t,s,d)+l(e,d),v=k-h');
assert.equal(normalized, baseline, 'v18.22 must contain only the approved reconciliation correction and version updates');
console.log('PASS: v18.22 shell retained; only reconciliation correction differs from v18.21');
