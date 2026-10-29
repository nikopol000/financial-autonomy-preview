'use strict';
// WEB 18.64 immutable diff: a late backup decrypt must not restore an invalidated candidate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01863-backup-preview-safety-20261029.js','utf8');
const next=fs.readFileSync('_expo/static/js/web/index-v01864-backup-async-epoch-20261029.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const replacements=[
  [
    "[C,D]=(0,t.useState)(null);return",
    "[C,D]=(0,t.useState)(null),R=(0,t.useRef)(0);return"
  ],
  [
    "onChange:e=>{h(e),D(null)}",
    "onChange:e=>{R.current++,h(e),D(null)}"
  ],
  [
    "onPress:()=>f(async()=>{const e=await d.pickText(\"backup\");null!==e&&(D(null),D((0,u.migrate)(await(0,c.restore)(e,j))),h(\"\"))})",
    "onPress:()=>f(async()=>{const q=++R.current;const e=await d.pickText(\"backup\");if(null===e||q!==R.current)return;D(null);const n=(0,u.migrate)(await(0,c.restore)(e,j));q===R.current&&(D(n),h(\"\"))})"
  ],
  [
    "version:\"18.63\"",
    "version:\"18.64\""
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.63.json",
    "financial-autonomy-diagnostic-unic-v18.64.json"
  ]
];
let expected=old;
for(const [from,to] of replacements){
  assert.equal(expected.split(from).length-1,1,'Exact old occurrence required: '+from);
  expected=expected.replace(from,to);
}
assert.equal(next,expected,'Only request epoch, restore candidate handling and diagnostic version may change');
// Historical immutable diff remains mandatory after a later active release.
const active=html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/);
assert.ok(active&&Number(active[1])>=18.64,'Active release must not regress below 18.64');
if(active[1]==='18.64'){
  assert.match(html,/index-v01864-backup-async-epoch-20261029\.js\?build=18\.64\.1/);
  assert.doesNotMatch(html,/index-v01863-backup-preview-safety-20261029/);
}
console.log('PASS WEB 18.64: exact async-restore epoch diff; no financial or cryptographic changes');
