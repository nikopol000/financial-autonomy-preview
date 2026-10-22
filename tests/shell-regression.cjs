// Node.js regression guard: v18.21 web-shell accessibility without financial-engine changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const version = html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
assert.equal(version, '18.21');
assert.match(html, /<html lang="ro">/);
assert.match(html, /name="description"/);
assert.match(html, /name="robots" content="noindex, nofollow"/);
assert.match(html, /:focus-visible/);
assert.match(html, /prefers-reduced-motion: reduce/);
assert.match(html, /forced-colors: active/);
assert.match(html, /Activează JavaScript/);
const path = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=18\.21\.1"/)?.[1];
assert.equal(path, '_expo/static/js/web/index-v01821-accessibility-shell-20261022.js');
const current = fs.readFileSync(path, 'utf8');
const baseline = fs.readFileSync('_expo/static/js/web/index-v01820-history-back-navigation-20261014.js', 'utf8');
assert.ok(current.includes('version:"18.21"'));
assert.ok(current.includes('financial-autonomy-diagnostic-unic-v18.21.json'));
const normalized = current.replace('version:"18.21"', 'version:"18.20"')
  .replace('financial-autonomy-diagnostic-unic-v18.21.json', 'financial-autonomy-diagnostic-unic-v18.20.json');
assert.equal(normalized, baseline, 'No application or financial engine code may change in this shell-only release');
console.log('PASS: v18.21 accessible shell; JS engine byte-identical to v18.20 after version normalization');
