'use strict';
// #17: guard active WEB budget copy, not just archived v18.42/v18.43.
// Static bundle check: no claim of visible mobile/Safari/VoiceOver acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const version=html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
const src=html.match(/<script src="([^"]+)" defer><\/script>/)?.[1];
assert.ok(version&&src,'Active WEB release metadata and script are required');
const prefix='/financial-autonomy-preview/';
const url=new URL(src,'https://example.invalid');
assert.ok(url.pathname.startsWith(prefix),'Active WEB bundle must be under deployment prefix');
const bundlePath=path.join(__dirname,'..',url.pathname.slice(prefix.length));
const bundle=fs.readFileSync(bundlePath,'utf8');
assert.ok(url.pathname.includes('index-v0'+version.replace('.','')+'-'),
  'Active WEB bundle filename must match HTML release version');
for(const stale of [
  'Primary window',
  'Additional tracking windows',
  'Budget ID explicit',
  'Fixed, Debt, Savings',
  'Limită Primary'
]){
  assert.equal(bundle.includes(stale),false,'Legacy technical budget copy returned: '+stale);
}
for(const current of [
  'Perioada principală',
  'Alte perioade urmărite',
  'Buget neconfigurat'
]){
  assert.ok(bundle.includes(current),'Expected user-facing Romanian budget copy missing: '+current);
}
// The platform CustomEvent API is not a user-facing English label.
assert.equal(/(?:name|label|custom):"Custom"/.test(bundle),false,
  'Legacy visible Custom budget label returned');
console.log('PASS active WEB '+version+' budget terminology guard (#17); static only, no formula/storage edits');
