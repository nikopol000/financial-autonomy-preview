'use strict';
// WEB 18.57 -> 18.58: a truly unconfigured budget must not display calculated-looking 0/0 cards.
// All financial, encrypted-vault and backup code must remain byte-for-byte unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01857-visible-calculation-disclosure-20261027.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01858-budget-empty-state-20261027.js','utf8');
const edits=[
  [
    "style:v.eyebrow,children:\"BUGETE\"",
    "style:v.eyebrow,children:\"PLANIFICARE\""
  ],
  [
    "style:v.h1,children:\"Acelea\\u0219i cheltuieli, v\\u0103zute \\xeen ferestrele care conteaz\\u0103.\"",
    "style:v.h1,children:\"Bugete\""
  ],
  [
    "style:v.body,children:\"Configurarea rămâne în Finanțe. Aici vezi perioadele principale și suplimentare, fără să dublezi nicio tranzacție.\"",
    "style:v.body,children:\"Urmărește limitele și cheltuielile pe perioade. Configurează bugete în Finanțe.\""
  ],
  [
    "(0,b.jsxs)(f.Section,{title:\"Azi\",children:[",
    "L.budgets.length>0&&(0,b.jsxs)(f.Section,{title:\"Azi\",children:["
  ],
  [
    "(0,b.jsxs)(s.default,{style:v.wrap,children:[(0,b.jsx)(f.Button,{label:\"Dup\\u0103 buget\"",
    "L.budgets.length>0&&(0,b.jsxs)(s.default,{style:v.wrap,children:[(0,b.jsx)(f.Button,{label:\"Dup\\u0103 buget\""
  ],
  [
    "style:v.body,children:\"Nu ai \\xeenc\\u0103 niciun buget configurat.\"",
    "style:v.h2,children:\"Buget neconfigurat\""
  ],
  [
    "style:v.note,children:\"Adaug\\u0103 primul buget din Finan\\u021be.\"",
    "style:v.note,children:\"Creează primul buget în Finanțe.\""
  ],
  [
    "version:\"18.57\"",
    "version:\"18.58\""
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.57.json",
    "financial-autonomy-diagnostic-unic-v18.58.json"
  ]
];
let expected=before;
for(const [oldText,newText] of edits){
  assert.equal(expected.split(oldText).length-1,1,'Exactly one edit required: '+oldText.slice(0,75));
  expected=expected.replace(oldText,newText);
}
assert.equal(after,expected,'WEB 18.58 must only change the budget screen empty-state UI and release diagnostics');
assert.match(after,/L\.budgets\.length>0&&\(0,b\.jsxs\)\(f\.Section,\{title:"Azi"/);
assert.match(after,/L\.budgets\.length>0&&\(0,b\.jsxs\)\(s\.default,\{style:v\.wrap/);
assert.match(after,/children:"Buget neconfigurat"/);
const html=fs.readFileSync('index.html','utf8');
// Historical immutable 18.58 diff remains valid after a later active release.
if(html.includes('name="financial-autonomy-version" content="18.58"')){
  assert.match(html,/index-v01858-budget-empty-state-20261027\.js\?build=18\.58\.1/);
}
console.log('PASS WEB 18.58: no unconfigured 0/0 budget card, shorter screen copy, unchanged finance/vault/backup');
