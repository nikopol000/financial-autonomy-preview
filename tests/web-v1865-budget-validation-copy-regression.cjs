'use strict';
// WEB 18.65: immutable copy-only validation and field-label change.
// No financial classification, amount, balance, vault, backup, or persistence logic change.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01864-backup-async-epoch-20261029.js','utf8');
const next=fs.readFileSync('_expo/static/js/web/index-v01865-budget-validation-romanian-20261029.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const replacements=[
  ['Numai Budgeted Expense poate avea buget.',
   'Doar cheltuielile alocate unui buget pot avea o categorie de buget.'],
  ['Unbudgeted nu achit\\u0103 automat o obliga\\u021bie.',
   'O cheltuial\\u0103 \\xeen afara bugetului nu achit\\u0103 automat o obliga\\u021bie.'],
  ['Name \\xb7 denumire','Denumire'],
  ['version:"18.64"','version:"18.65"'],
  ['financial-autonomy-diagnostic-unic-v18.64.json',
   'financial-autonomy-diagnostic-unic-v18.65.json']
];
let expected=old;
for(const [from,to] of replacements){
  assert.equal(expected.split(from).length-1,1,'Expected exactly one source occurrence: '+from);
  expected=expected.replace(from,to);
}
assert.equal(next,expected,'Only three Romanian copy strings and diagnostic version/name may change');
assert.match(html,/<meta name="financial-autonomy-version" content="18\.65"/);
assert.match(html,/index-v01865-budget-validation-romanian-20261029\.js\?build=18\.65\.1/);
assert.doesNotMatch(html,/index-v01864-backup-async-epoch-20261029/);
for(const obsolete of ['Numai Budgeted Expense poate avea buget.','Unbudgeted nu achit\\u0103 automat o obliga\\u021bie.','Name \\xb7 denumire'])
  assert.ok(!next.includes(obsolete),'Untranslated copy must not remain: '+obsolete);
console.log('PASS WEB 18.65: exact Romanian copy-only immutable diff, no formula/vault/backup code changes');
