'use strict';
// WEB 18.70: remove a render-only sort that silently overrode the selected
// order between Budget and Quick Actions. Financial model and vault untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const old=read('_expo/static/js/web/index-v01869-dashboard-order-restorable-20261101.js');
const next=read('_expo/static/js/web/index-v01870-dashboard-budget-actions-order-20261101.js');
const edits=[
  [
    'de=K.map(e=>le[e]).filter(e=>!!e).sort((e,t)=>e.id==="quickActions"&&t.id==="budget"?-1:e.id==="budget"&&t.id==="quickActions"?1:0)',
    'de=K.map(e=>le[e]).filter(e=>!!e)'
  ],
  ['version:"18.69"','version:"18.70"'],
  ['financial-autonomy-diagnostic-unic-v18.69.json','financial-autonomy-diagnostic-unic-v18.70.json']
];
let expected=old;
for(const [before,after] of edits){
  assert.equal(expected.split(before).length-1,1,'Expected exactly one source occurrence: '+before.slice(0,70));
  expected=expected.replace(before,after);
}
assert.equal(next,expected,'18.70 may change ONLY Budget/QuickActions render order and diagnostic version/name');
assert.doesNotMatch(next,/de=K\.map\(e=>le\[e\]\)\.filter\(e=>!!e\)\.sort\(/,
  'Dashboard must not override normalized user order with a render-only sort');
const html=read('index.html');
// Archived WEB 18.70 bundle remains immutable after activation of later versions.
// Active HTML version/path is guarded by the newest release regression.
assert.match(html,/@media \(max-width: 430px\) and \(max-height: 540px\)/);
console.log('PASS WEB 18.70: Budget/QuickActions render respects user order; immutable exact diff and synchronized metadata');
