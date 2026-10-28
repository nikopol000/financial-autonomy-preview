'use strict';
// WEB 18.62: strict immutable diff guard for non-financial Romanian UI copy.
// This is a product-copy release; no budget formulas, vault, backup or ledger changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const prev=fs.readFileSync(path.join(root,'_expo/static/js/web/index-v01861-keyboard-tab-focus-20261028.js'),'utf8');
const next=fs.readFileSync(path.join(root,'_expo/static/js/web/index-v01862-budget-copy-clarity-20261028.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const replacements=[
  ['Urmărește limitele și cheltuielile pe perioade. Configurează bugete în Finanțe.',
   'Limite planificate și cheltuieli înregistrate, pe fiecare perioadă.'],
  ['MAI MULT\\u0102 CLARITATE','SEC\\u021aIUNI'],
  ['Prive\\u0219te \\xeen urm\\u0103. Alege ce urmeaz\\u0103.','Mai mult'],
  ['version:"18.61"','version:"18.62"'],
  ['financial-autonomy-diagnostic-unic-v18.61.json','financial-autonomy-diagnostic-unic-v18.62.json']
];
let expected=prev;
for(const [oldText,newText] of replacements){
  assert.equal(expected.split(oldText).length-1,1,'Expected one original occurrence: '+oldText);
  expected=expected.replace(oldText,newText);
  assert.equal(next.split(newText).length-1,1,'Expected one replacement: '+newText);
}
assert.equal(next,expected,'18.62 may only change the three reviewed UI copy strings and diagnostic version/name');
assert.match(html,/<meta name="financial-autonomy-version" content="18\\.62"/);
assert.match(html,/index-v01862-budget-copy-clarity-20261028\\.js\\?build=18\\.62\\.1/);
assert.ok(!html.includes('index-v01861-keyboard-tab-focus-20261028.js'),'Active HTML must not load previous bundle');
console.log('PASS WEB 18.62: exact copy-only immutable diff; formulas, vault and backups byte-identical to 18.61');
