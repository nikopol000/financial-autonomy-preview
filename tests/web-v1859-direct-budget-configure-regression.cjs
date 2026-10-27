'use strict';
// WEB 18.58 -> 18.59: direct empty-budget setup uses the existing budget editor.
// Exact full-bundle diff prevents unintended finance/vault/backup/navigation changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01858-budget-empty-state-20261027.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01859-budget-direct-configure-20261027.js','utf8');
const edits=[
  [
    "(0,k.jsx)(C.Budgets,{s:e,date:E,onEdit:e=>q({kind:\"budget\",item:e})})",
    "(0,k.jsx)(C.Budgets,{s:e,date:E,onEdit:e=>q({kind:\"budget\",item:e}),onCreate:()=>q({kind:\"budget\"})})"
  ],
  [
    "_e.Budgets=function({s:e,date:t,onEdit:x})",
    "_e.Budgets=function({s:e,date:t,onEdit:x,onCreate:R})"
  ],
  [
    "(0,b.jsx)(n.default,{style:v.note,children:\"Creează primul buget în Finanțe.\"})]}),",
    "(0,b.jsx)(n.default,{style:v.note,children:\"Stabilește o limită pentru perioada aleasă.\"}),(0,b.jsx)(f.Button,{label:\"Configurează primul buget\",onPress:R})]}),"
  ],
  [
    "version:\"18.58\"",
    "version:\"18.59\""
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.58.json",
    "financial-autonomy-diagnostic-unic-v18.59.json"
  ]
];
let expected=before;
for(const [oldText,newText] of edits){
  assert.equal(expected.split(oldText).length-1,1,'Exactly one edit required: '+oldText.slice(0,100));
  expected=expected.replace(oldText,newText);
}
assert.equal(after,expected,'18.59 must change only empty-budget setup UI, callback wiring and release diagnostics');
assert.match(after,/L\.budgets\.length>0&&\(0,b\.jsxs\)\(f\.Section,\{title:"Azi"/);
assert.match(after,/onCreate:\(\)=>q\(\{kind:"budget"\}\)/);
assert.match(after,/label:"Configurează primul buget",onPress:R/);
const html=fs.readFileSync('index.html','utf8');
// Historical immutable diff remains valid after a newer WEB release.
if(html.includes('name="financial-autonomy-version" content="18.59"')){
  assert.match(html,/index-v01859-budget-direct-configure-20261027\.js\?build=18\.59\.1/);
}
console.log('PASS WEB 18.59: direct budget setup; unchanged financial, vault, backup and populated-budget engine');
