'use strict';
// Exact immutable v18.44 -> v18.45 copy-only whitelist; no financial engine/vault changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01844-reset-journal-20261025.js','utf8');
const actual=fs.readFileSync('_expo/static/js/web/index-v01845-blocked-vault-guidance-20261025.js','utf8');
const edits=[
  [
    "O&&(0,k.jsxs)(d.default,{accessibilityRole:\"alert\",style:he.banner,children:[(0,k.jsx)(o.default,{style:he.body,children:O}),(0,k.jsx)(h.Button,{label:\"\\xcenchide mesajul\",secondary:!0,onPress:()=>V(\"\")})]}",
    "O&&(0,k.jsxs)(d.default,{accessibilityRole:\"alert\",style:he.banner,children:[(0,k.jsx)(o.default,{style:he.body,children:O}),e&&(0,k.jsx)(h.Button,{label:\"\\xcenchide mesajul\",secondary:!0,onPress:()=>V(\"\")})]}"
  ],
  [
    "):(0,k.jsxs)(d.default,{style:he.content,children:[(0,k.jsx)(o.default,{style:he.h1,children:\"Un spa\\u021biu pentru claritate.\"}),(0,k.jsx)(o.default,{style:he.body,children:\"Deschide seiful de pe dispozitivul t\\u0103u.\"}),(0,k.jsx)(h.Button,{label:\"Deschide aplica\\u021bia\",disabled:_,onPress:()=>{we(Ae)}})]}",
    "):(0,k.jsxs)(d.default,{style:he.content,children:[(0,k.jsx)(o.default,{accessibilityRole:\"header\",style:he.h1,children:O?\"Datele locale nu pot fi deschise\":\"Un spa\\u021biu pentru claritate.\"}),(0,k.jsx)(o.default,{style:he.body,children:O?\"Nu șterge datele site-ului și nu reseta aplicația. Păstrează orice backup criptat; această pagină nu poate restaura datele cât timp seiful este blocat. Reîncearcă doar deschiderea, fără să modifici stocarea.\":\"Deschide seiful de pe dispozitivul t\\u0103u.\"}),(0,k.jsx)(h.Button,{label:O?\"Reîncearcă deschiderea\":\"Deschide aplica\\u021bia\",disabled:_,onPress:()=>{we(Ae)}})]}"
  ],
  [
    "version:\"18.44\"",
    "version:\"18.45\""
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.44.json",
    "financial-autonomy-diagnostic-unic-v18.45.json"
  ]
];
let expected=old;
for(const [before,after] of edits){
  assert.equal(expected.split(before).length-1,1,'Expected exactly one original occurrence');
  expected=expected.replace(before,after);
}
assert.equal(actual,expected,'Unexpected engine, vault, backup or UI change outside blocked-state copy');
// Historical immutable v18.45 regression: do not require v18.45 to remain active.
assert.match(actual,/version:"18[.]45"/);
assert.match(actual,/financial-autonomy-diagnostic-unic-v18[.]45[.]json/);
console.log('PASS: v18.45 differs from immutable v18.44 only in blocked-state UI and diagnostic metadata');
