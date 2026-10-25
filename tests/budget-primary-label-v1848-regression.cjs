'use strict';
// WEB 18.48: copy-only Finanțe budget-row label. Financial engine and vault
// must be byte-identical to immutable WEB 18.47 except release metadata.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const oldPath='_expo/static/js/web/index-v01847-auto-theme-color-scheme-20261025.js';
const newPath='_expo/static/js/web/index-v01848-finances-budget-primary-label-20261026.js';
const old=fs.readFileSync(oldPath,'utf8');
const updated=fs.readFileSync(newPath,'utf8');
let expected=old;
const changes=[
  ['note:`Primary \\xb7 ${','note:`Perioada principală \\xb7 ${'],
  ['version:"18.47"','version:"18.48"'],
  ['financial-autonomy-diagnostic-unic-v18.47.json','financial-autonomy-diagnostic-unic-v18.48.json']
];
for(const [from,to] of changes){
  assert.equal(expected.split(from).length-1,1,'Copy/release anchor must occur exactly once: '+from);
  expected=expected.replace(from,to);
}
assert.equal(updated,expected,'v18.48 changed bytes outside Romanian budget-row copy and release metadata');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/<meta name="financial-autonomy-version" content="18\.48"/);
assert.ok(html.includes('/financial-autonomy-preview/'+newPath+'?build=18.48.1'));
assert.ok(updated.includes('financial-autonomy-diagnostic-unic-v18.48.json'));
assert.ok(!updated.includes('note:`Primary \\xb7 ${'));
console.log('PASS WEB 18.48 copy-only primary budget label; financial engine and vault unchanged');
