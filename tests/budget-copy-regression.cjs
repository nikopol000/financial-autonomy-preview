'use strict';
// Regression: v18.42 changes visible Romanian budget copy and diagnostic metadata
// only. Financial-model and storage bytes must remain identical to v18.41.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const oldPath = '_expo/static/js/web/index-v01841-opening-chronology-20261024.js';
const newPath = '_expo/static/js/web/index-v01842-budget-language-20261024.js';
const old = fs.readFileSync(oldPath, 'utf8');
const updated = fs.readFileSync(newPath, 'utf8');
const substitutions = [
  [
    "Primary window",
    "Perioada principală"
  ],
  [
    "Additional tracking windows",
    "Alte perioade urmărite"
  ],
  [
    "Primary este perspectiva principal\\u0103 a acestui buget. Suma de mai sus este limita unui ciclu Primary.",
    "Perioada principal\\u0103 stabile\\u0219te ritmul de baz\\u0103 al acestui buget. Limita de mai sus este folosit\\u0103 pentru calculul perioadei."
  ],
  [
    "Dac\\u0103 este activ, ritmul zilnic al acestui buget intr\\u0103 \\xeen cei doi indicatori de pe Home. Ferestrele de tracking r\\u0103m\\xe2n disponibile indiferent de aceast\\u0103 setare.",
    "C\\xe2nd activezi aceast\\u0103 op\\u021biune, ritmul zilnic al bugetului intr\\u0103 \\xeen indicatorii Buget azi \\u0219i Sigur azi de pe Acas\\u0103. Celelalte perioade r\\u0103m\\xe2n disponibile."
  ],
  [
    "Sunt perspective asupra acelora\\u0219i tranzac\\u021bii. Nu creeaz\\u0103 cheltuieli sau bugete noi. O fereastr\\u0103 poate fi urm\\u0103rit\\u0103 f\\u0103r\\u0103 s\\u0103 fie afi\\u0219at\\u0103 pe Home; dac\\u0103 o pin-uie\\u0219ti, r\\u0103m\\xe2ne l\\xe2ng\\u0103 Primary-ul acestui buget.",
    "Aceste perioade arat\\u0103 acelea\\u0219i tranzac\\u021bii, f\\u0103r\\u0103 s\\u0103 creeze cheltuieli sau bugete noi. Po\\u021bi urm\\u0103ri o perioad\\u0103 \\u0219i f\\u0103r\\u0103 s\\u0103 o afi\\u0219ezi pe Acas\\u0103."
  ],
  [
    "Pin pe Home l\\xe2ng\\u0103 Primary",
    "Afi\\u0219eaz\\u0103 pe Acas\\u0103 l\\xe2ng\\u0103 perioada principal\\u0103"
  ],
  [
    "Limit\\u0103 Auto din Primary",
    "Limit\\u0103 calculat\\u0103 din perioada principal\\u0103"
  ],
  [
    "Limit\\u0103 Primary \\xb7 RON",
    "Limit\\u0103 pentru perioada principal\\u0103 \\xb7 RON"
  ],
  [
    "Doar tranzac\\u021biile cu rol Bugetat\\u0103 \\u0219i Budget ID explicit consum\\u0103 limite. Fixed, Debt, Savings, Transfer, Unbudgeted \\u0219i Neexplicat nu consum\\u0103 bugetele.",
    "Doar cheltuielile marcate ca bugetate \\u0219i atribuite unui buget reduc limita acestuia. Cheltuielile fixe, pl\\u0103\\u021bile datoriilor, economiile, transferurile, cheltuielile nebugetate \\u0219i diferen\\u021bele neexplicate nu o reduc."
  ]
];
let expected = old;
for (const [before, after] of substitutions) {
  assert.equal(expected.split(before).length - 1, 1, 'Expected one UI literal: ' + before);
  expected = expected.replace(before, after);
  assert.ok(updated.includes(after), 'Missing translated UI literal: ' + after);
}
expected = expected.replace('version:"18.41"', 'version:"18.42"')
  .replace('financial-autonomy-diagnostic-unic-v18.41.json', 'financial-autonomy-diagnostic-unic-v18.42.json');
assert.equal(updated, expected, 'Unexpected change outside budget UI copy and diagnostic metadata');
const html = fs.readFileSync('index.html','utf8');
const version = html.match(/name="financial-autonomy-version" content="([^"]+)"/)?.[1];
if (version === '18.42') {
  assert.ok(html.includes(newPath + '?build=18.42.1'), 'Active HTML does not reference exact immutable v18.42');
}
console.log('PASS: immutable v18.42 only changes 9 Romanian UI literals + diagnostic metadata');
