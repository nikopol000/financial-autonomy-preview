// Guard the accessible web shell independently of the currently active release.
// Archived v18.20 is immutable; v18.21 accessibility must not alter financial code.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const version = html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
assert.match(version || '', /^18\.(?:2[0-9]|[3-9][0-9])$/, 'Unexpected active web version');
assert.match(html, /<html lang="ro">/);
assert.match(html, /name="description"/);
assert.match(html, /name="robots" content="noindex, nofollow"/);
assert.match(html, /:focus-visible/);
assert.match(html, /prefers-reduced-motion: reduce/);
assert.match(html, /forced-colors: active/);
assert.match(html, /Activează JavaScript/);

const script = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=(\d+\.\d+)\.\d+"/);
assert.ok(script, 'Missing versioned bundle in HTML');
assert.equal(script[2], version, 'HTML build key must match metadata');
const names = {
  '18.20': '_expo/static/js/web/index-v01820-history-back-navigation-20261014.js',
  '18.21': '_expo/static/js/web/index-v01821-accessibility-shell-20261022.js',
  '18.22': '_expo/static/js/web/index-v01822-reconciliation-20261022.js'
};
if (names[version]) assert.equal(script[1], names[version], 'Unexpected archived release bundle');
else assert.ok(script[1].startsWith('_expo/static/js/web/index-v0' + version.replace('.', '') + '-'), 'Active bundle filename must match release version');
assert.ok(fs.existsSync(script[1]), 'Active bundle must exist');
assert.ok(fs.readFileSync(script[1], 'utf8').includes('version:"' + version + '"'));

const baseline = fs.readFileSync(names['18.20'], 'utf8');
const accessible = fs.readFileSync(names['18.21'], 'utf8');
assert.ok(accessible.includes('version:"18.21"'));
assert.ok(accessible.includes('financial-autonomy-diagnostic-unic-v18.21.json'));
const normalized = accessible.replace('version:"18.21"', 'version:"18.20"')
  .replace('financial-autonomy-diagnostic-unic-v18.21.json', 'financial-autonomy-diagnostic-unic-v18.20.json');
assert.equal(normalized, baseline, 'v18.21 must differ from immutable v18.20 only by diagnostic metadata');
console.log('PASS: active v' + version + ' HTML and bundle match; v18.21 shell keeps v18.20 financial engine unchanged');
