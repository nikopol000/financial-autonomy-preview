'use strict';
// WEB 18.48: Romanian budget terminology only; immutable v18.47 is the baseline.
// This test rejects any changed accounting formulas, schema, vault or UI code
// outside the exact user-facing strings and diagnostic release identity.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const oldPath='_expo/static/js/web/index-v01847-auto-theme-color-scheme-20261025.js';
const newPath='_expo/static/js/web/index-v01848-finances-budget-primary-label-20261026.js';
const old=fs.readFileSync(oldPath,'utf8');
const actual=fs.readFileSync(newPath,'utf8');
let expected=old;
const edits=[
  [
    "note:`Primary \\xb7 ${",
    "note:`Perioada principală \\xb7 ${",
    1
  ],
  [
    "e.primary?\" \\xb7 Primary\":\"\"",
    "e.primary?\" \\xb7 principală\":\"\"",
    2
  ],
  [
    "ferestrele pinned l\\xe2ng\\u0103 Primary.",
    "perioadele fixate l\\xe2ng\\u0103 perioada principală.",
    1
  ],
  [
    "caden\\u021ba real\\u0103 a Primary.",
    "caden\\u021ba real\\u0103 a perioadei principale.",
    1
  ],
  [
    "Ciclurile Primary nu se suprapun coerent.",
    "Ciclurile perioadei principale nu se suprapun coerent.",
    1
  ],
  [
    "\"Auto din Primary\"",
    "\"Calculată din perioada principală\"",
    1
  ],
  [
    "\"Custom\"",
    "\"Personalizat\"",
    1
  ],
  [
    "\" \\xb7 pe Dashboard\"",
    "\" \\xb7 pe Acasă\"",
    1
  ],
  [
    "version:\"18.47\"",
    "version:\"18.48\"",
    1
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.47.json",
    "financial-autonomy-diagnostic-unic-v18.48.json",
    1
  ]
];
for(const [before,after,count] of edits){
  assert.equal(expected.split(before).length-1,count,'Expected exact copy anchor: '+before);
  expected=expected.split(before).join(after);
}
assert.equal(actual,expected,'Unexpected change outside budget microcopy and diagnostic metadata');
// Historical immutable-release regression: later releases may activate a newer bundle.
// The exact 18.48 artifact is verified above independently of active index.html.
assert.ok(actual.includes('financial-autonomy-diagnostic-unic-v18.48.json'));
console.log('PASS WEB 18.48 exact Romanian budget copy only; financial engine and vault unchanged');
