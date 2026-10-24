'use strict';
// New immutable WEB 18.44 may change only the platform/vault modules and diagnostic metadata.
const assert=require('node:assert/strict'),fs=require('node:fs');
const previous=fs.readFileSync('_expo/static/js/web/index-v01843-budget-language-followup-20261024.js','utf8');
const current=fs.readFileSync('_expo/static/js/web/index-v01844-reset-journal-20261025.js','utf8');
function withoutVaultModules(s){
  for(const [id,deps] of [[309,'205,310'],[310,'205,311']]){
    const end='},'+id+',['+deps+']);',stop=s.indexOf(end);
    assert.ok(stop>0,'Missing module '+id);
    const start=s.lastIndexOf('__d(function(',stop);
    assert.ok(start>=0,'Missing start '+id);
    s=s.slice(0,start)+'/*RESET-JOURNAL-MODULE-'+id+'*/'+s.slice(stop+end.length);
  }
  return s;
}
assert.equal(
  withoutVaultModules(current)
    .replace('version:"18.44"','version:"18.43"')
    .replace('financial-autonomy-diagnostic-unic-v18.44.json','financial-autonomy-diagnostic-unic-v18.43.json'),
  withoutVaultModules(previous),
  'Unexpected non-vault financial engine, UI, schema or backup change'
);
assert.match(current,/financial-autonomy\.preview\.reset\.v1/);
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18\.44"/);
assert.ok(html.includes('_expo/static/js/web/index-v01844-reset-journal-20261025.js?build=18.44.1'));
console.log('PASS: v18.44 only platform/vault reset journal and diagnostic metadata changed');
