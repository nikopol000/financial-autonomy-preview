'use strict';
// WEB 18.72: high-contrast focus must not rely on shadows, which forced-colors suppresses.
// Immutable JS differs from 18.71 only in the diagnostic version and export filename.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const previous=read('_expo/static/js/web/index-v01871-dashboard-keyboard-focus-20261101.js');
const current=read('_expo/static/js/web/index-v01872-forced-colors-focus-20261101.js');
let expected=previous;
for(const [from,to] of [
  ['version:"18.71"','version:"18.72"'],
  ['financial-autonomy-diagnostic-unic-v18.71.json','financial-autonomy-diagnostic-unic-v18.72.json']
]){
  assert.equal(expected.split(from).length-1,1,'Expected one occurrence: '+from);
  expected=expected.replace(from,to);
}
assert.equal(current,expected,'WEB 18.72 JS must change ONLY diagnostic version and filename');
const html=read('index.html');
assert.match(html,/<meta name="financial-autonomy-version" content="18\.72"/);
assert.match(html,/index-v01872-forced-colors-focus-20261101\.js\?build=18\.72\.1/);
assert.match(html,/#root \[role="button"\]:focus-visible\s*\{\s*box-shadow:\s*inset 0 0 0 3px #159cb4 !important;/,
  'Ordinary keyboard focus shadow must remain');
assert.match(html,/@media \(forced-colors: active\)\s*\{[\s\S]*?#root \[role="button"\]:focus-visible\s*\{\s*outline:\s*3px solid Highlight !important;/,
  'Forced-colors role-button focus must use an actual 3px system-color outline');
console.log('PASS WEB 18.72: forced-colors outline, immutable diagnostic-only JS, synchronized release');
