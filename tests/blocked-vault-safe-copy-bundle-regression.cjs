'use strict';
// WEB v18.45 -> v18.46 immutable copy-only release guard.
// Enforces exactly two blocked-vault warning strings and diagnostic metadata;
// no encryption, storage, financial formula, or other UI changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const old = fs.readFileSync('_expo/static/js/web/index-v01845-blocked-vault-guidance-20261025.js','utf8');
const actual = fs.readFileSync('_expo/static/js/web/index-v01846-blocked-vault-nondestructive-copy-20261025.js','utf8');
const edits = [
  [
    'Cheia locală există fără datele criptate. Nu inițializăm automat date noi; restaurează un backup sau folosește resetarea explicită.',
    'Cheia locală există, dar datele criptate lipsesc. Nu vom șterge cheia și nu vom crea automat date noi.'
  ],
  [
    'Cheia locală există fără datele criptate. Salvarea este blocată până la resetarea explicită sau restaurarea datelor.',
    'Cheia locală există, dar datele criptate lipsesc. Salvarea este blocată pentru a proteja datele existente.'
  ],
  ['version:"18.45"','version:"18.46"'],
  ['financial-autonomy-diagnostic-unic-v18.45.json','financial-autonomy-diagnostic-unic-v18.46.json']
];
let expected = old;
for (const [before,after] of edits) {
  assert.equal(expected.split(before).length-1,1,'Expected one old occurrence: '+before);
  expected=expected.replace(before,after);
}
assert.equal(actual,expected,'Unexpected non-copy difference in immutable WEB v18.46');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18[.]46"/);
assert.ok(html.includes('_expo/static/js/web/index-v01846-blocked-vault-nondestructive-copy-20261025.js?build=18.46.1'));
assert.match(actual,/version:"18[.]46"/);
assert.match(actual,/financial-autonomy-diagnostic-unic-v18[.]46[.]json/);
console.log('PASS: v18.46 differs from immutable v18.45 only in two blocked-vault warnings and diagnostic metadata');
