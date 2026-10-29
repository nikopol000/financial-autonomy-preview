'use strict';
// WEB 18.63 exact immutable-diff guard: only backup candidate invalidation
// and diagnostic version may differ from the previous WEB 18.62 bundle.
// Financial formulas, ledger, encryption and backup format stay identical.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01862-budget-copy-clarity-20261028.js','utf8');
const next=fs.readFileSync('_expo/static/js/web/index-v01863-backup-preview-safety-20261029.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const replacements=[
  ['label:"Parol\\u0103 backup \\xb7 minimum 12 caractere",secret:!0,revealable:!0,value:j,onChange:h',
   'label:"Parol\\u0103 backup \\xb7 minimum 12 caractere",secret:!0,revealable:!0,value:j,onChange:e=>{h(e),D(null)}'],
  ['null!==e&&(D((0,u.migrate)(await(0,c.restore)(e,j))),h(""))',
   'null!==e&&(D(null),D((0,u.migrate)(await(0,c.restore)(e,j))),h(""))'],
  ['version:"18.62"','version:"18.63"'],
  ['financial-autonomy-diagnostic-unic-v18.62.json','financial-autonomy-diagnostic-unic-v18.63.json']
];
let expected=old;
for(const [from,to] of replacements){
  assert.equal(expected.split(from).length-1,1,'exact old bundle occurrence: '+from);
  expected=expected.replace(from,to);
}
assert.equal(next,expected,'Only the reviewed candidate-revocation and diagnostic replacements are allowed');
const active=html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/);
assert.ok(active&&Number(active[1])>=18.63,'Active release must not regress below 18.63');
if(active[1]==='18.63'){
  assert.match(html,/index-v01863-backup-preview-safety-20261029\.js\?build=18\.63\.1/);
  assert.doesNotMatch(html,/index-v01862-budget-copy-clarity-20261028/);
}
console.log('PASS WEB 18.63 immutable diff: backup candidate invalidation only; financial model and backup crypto unchanged');
