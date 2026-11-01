'use strict';
// WEB 18.66: strict immutable diff gate for five Romanian naming labels/errors.
// No financial logic, state schema, encrypted vault, backup or transaction change.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync("_expo/static/js/web/index-v01865-budget-validation-romanian-20261029.js",'utf8');
const after=fs.readFileSync("_expo/static/js/web/index-v01866-romanian-name-terminology-20261031.js",'utf8');
const replacements=[
  [
    "Introdu un Name de cel mult120caractere.",
    "Introdu o denumire de cel mult 120 de caractere."
  ],
  [
    "Lista Name invalid\\u0103.",
    "Lista de denumiri este invalid\\u0103."
  ],
  [
    "Name inexistent.",
    "Denumire inexistent\\u0103."
  ],
  [
    "Istoric Name invalid.",
    "Istoricul denumirilor este invalid."
  ],
  [
    "Cheltuieli dup\\u0103 Name",
    "Cheltuieli dup\\u0103 denumire"
  ],
  [
    "version:\"18.65\"",
    "version:\"18.66\""
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.65.json",
    "financial-autonomy-diagnostic-unic-v18.66.json"
  ]
];
let expected=before;
for(const [from,to] of replacements){
  assert.equal(expected.split(from).length-1,1,'Source occurrence must be unique: '+from);
  expected=expected.replace(from,to);
}
assert.equal(after,expected,'Immutable WEB 18.66 must change only approved copy and diagnostic metadata');
// Active HTML belongs to the current release guard; this checks immutable history.
for(const [from] of replacements.slice(0,5))
  assert.ok(!after.includes(from),'English user-facing naming copy remains: '+from);
console.log('PASS WEB 18.66: five Romanian naming copy fixes, immutable exact diff, financial/vault/backup unchanged');
