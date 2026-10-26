'use strict';
// Immutable WEB 18.49 -> 18.50 security-only diff guard.
// Only Metro platform 309, vault 310 and synchronized diagnostic metadata may differ.
const assert=require('node:assert/strict'),fs=require('node:fs');
const previous=fs.readFileSync('_expo/static/js/web/index-v01849-responsive-nav-wrap-r3-20261026.js','utf8');
const current=fs.readFileSync('_expo/static/js/web/index-v01850-durable-reset-epoch-r2-20261026.js','utf8');
function strip(s){
  for(const [id,deps] of [[309,'205,310'],[310,'205,311']]){
    const end='},'+id+',['+deps+']);',stop=s.indexOf(end);
    assert.ok(stop>0,'Missing module '+id);
    const start=s.lastIndexOf('__d(function(',stop);
    assert.ok(start>=0,'Missing start '+id);
    s=s.slice(0,start)+'/*RESET-EPOCH-MODULE-'+id+'*/'+s.slice(stop+end.length);
  }
  return s;
}
assert.equal(
  strip(current).replace('version:"18.50"','version:"18.49"')
    .replace('financial-autonomy-diagnostic-unic-v18.50.json','financial-autonomy-diagnostic-unic-v18.49.json'),
  strip(previous),
  'Unexpected change outside vault/platform/diagnostic; financial engine and backup must remain byte-identical'
);
assert.match(current,/pending-v2:/);assert.match(current,/idle-v2:/);
assert.match(current,/financial-autonomy-diagnostic-unic-v18[.]50[.]json/);
console.log('PASS WEB 18.50: only vault/platform reset protocol and synchronized diagnostic changed');
