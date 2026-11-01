'use strict';
// WEB 18.71: focus-visible treatment for React Native Web role=button
// Pressables; immutable JS remains financially identical to WEB 18.70.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const previous=read('_expo/static/js/web/index-v01870-dashboard-budget-actions-order-20261101.js');
const current=read('_expo/static/js/web/index-v01871-dashboard-keyboard-focus-20261101.js');
let expected=previous;
for(const [from,to] of [
  ['version:"18.70"','version:"18.71"'],
  ['financial-autonomy-diagnostic-unic-v18.70.json','financial-autonomy-diagnostic-unic-v18.71.json']
]){
  assert.equal(expected.split(from).length-1,1,'Expected one diagnostic occurrence: '+from);
  expected=expected.replace(from,to);
}
assert.equal(current,expected,'WEB 18.71 JS must change ONLY diagnostic version and filename');
const html=read('index.html');
// Archived WEB 18.71 immutable diff guard; current HTML is validated by active-version tests.
assert.match(html,/#root \[role="button"\]:focus-visible\s*\{\s*box-shadow:\s*inset 0 0 0 3px #159cb4 !important;/);
assert.match(html,/#root \[role="tab"\]:focus-visible/,'Existing keyboard tab focus must remain');
assert.match(html,/@media \(forced-colors: active\)/,'Forced colors fallback must remain');
console.log('PASS WEB 18.71: role-button keyboard focus; JS diagnostic-only immutable diff; metadata synchronized');
