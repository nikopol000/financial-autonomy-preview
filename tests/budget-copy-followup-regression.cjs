'use strict';
// Immutable WEB v18.43 is a copy-only follow-up to v18.42.
// Reconstruct every changed byte; no financial model, schema or vault changes allowed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const oldPath = '_expo/static/js/web/index-v01842-budget-language-20261024.js';
const newPath = '_expo/static/js/web/index-v01843-budget-language-followup-20261024.js';
const old = fs.readFileSync(oldPath,'utf8');
const updated = fs.readFileSync(newPath,'utf8');
const edits = [
  [
    "children:\"Ritmul permis este recalculat",
    "Ritmul permis este recalculat din ce a rămas în perioadele principale cu ritm zilnic. Cheltuiala introdusă azi nu micșorează retroactiv reperul aceleiași zile."
  ],
  [
    "children:\"Limita zilei este recalculat",
    "Limita zilei este recalculată din ce era disponibil înainte de cheltuielile de azi în perioadele principale cu ritm zilnic."
  ],
  [
    "\"Primary-ul actual nu folose",
    "Perioada principală actuală nu folosește un ritm zilnic."
  ],
  [
    "children:\"Configurarea r\\u0103m\\xe2ne",
    "Configurarea rămâne în Finanțe. Aici vezi perioadele principale și suplimentare, fără să dublezi nicio tranzacție."
  ],
  [
    "custom:\"Custom\"",
    "Personalizat"
  ],
  [
    "name:\"Custom\"",
    "Personalizat"
  ],
  [
    "label:\"\\xcenceput Custom",
    "Început personalizat · YYYY-MM-DD"
  ],
  [
    "label:\"Sf\\xe2r\\u0219it Custom",
    "Sfârșit personalizat · YYYY-MM-DD"
  ],
  [
    "name:\"Limit\\u0103 Custom\"",
    "Limită personalizată"
  ],
  [
    "label:\"Limit\\u0103 Custom \\xb7 RON\"",
    "Limită personalizată · RON"
  ]
];
let expected = old;
for (const [anchor,replacement] of edits) {
  assert.equal(expected.split(anchor).length-1,1,'Expected unique UI anchor: '+anchor);
  const start=expected.indexOf(anchor);
  const quoteStart=expected.indexOf('"',start);
  const quoteEnd=expected.indexOf('"',quoteStart+1);
  assert.ok(quoteStart>=0&&quoteEnd>quoteStart,'Quoted UI literal missing: '+anchor);
  const before=expected.slice(start,quoteEnd+1);
  assert.equal(expected.split(before).length-1,1,'Expected unique UI context: '+anchor);
  const after=anchor.slice(0,quoteStart-start)+JSON.stringify(replacement);
  expected=expected.replace(before,after);
  assert.ok(updated.includes(after),'Missing new UI copy: '+replacement);
}
for (const [before,after] of [
  ['version:"18.42"','version:"18.43"'],
  ['financial-autonomy-diagnostic-unic-v18.42.json','financial-autonomy-diagnostic-unic-v18.43.json']
]) {
  assert.equal(expected.split(before).length-1,1,'Diagnostic metadata occurrence: '+before);
  expected=expected.replace(before,after);
}
assert.equal(updated,expected,'Unexpected change outside ten UI literals and diagnostic metadata');
const html=fs.readFileSync('index.html','utf8');
// Historical v18.43 immutability remains tested after newer releases.
assert.ok(fs.existsSync(newPath),'Archived v18.43 bundle must remain immutable');
console.log('PASS: v18.43 exact 10 UI-only Romanian replacements and synchronized diagnostic metadata');
