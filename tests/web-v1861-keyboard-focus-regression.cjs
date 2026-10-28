'use strict';
// WEB 18.60 -> 18.61: focus CSS only; unchanged immutable financial JS.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01860-compact-demo-warning-20261028.js','utf8');
const next=fs.readFileSync('_expo/static/js/web/index-v01861-keyboard-tab-focus-20261028.js','utf8');
let expected=old;
for(const [from,to] of [
  ['version:"18.60"','version:"18.61"'],
  ['financial-autonomy-diagnostic-unic-v18.60.json','financial-autonomy-diagnostic-unic-v18.61.json']
]){
  assert.equal(expected.split(from).length-1,1,'Expected exactly one diagnostic edit: '+from);
  expected=expected.replace(from,to);
}
assert.equal(next,expected,'18.61 JS must be identical to 18.60 except version and diagnostic filename');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18\\.61"/);
assert.match(html,/index-v01861-keyboard-tab-focus-20261028\\.js\\?build=18\\.61\\.1/);
assert.match(html,/#root \[role="tab"\]:focus-visible \{\s*box-shadow: inset 0 0 0 3px #159cb4 !important;/);
console.log('PASS WEB 18.61: tab focus fallback, unchanged finance/vault/backup JS');
