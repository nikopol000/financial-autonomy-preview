'use strict';
// WEB 18.54 -> 18.55: navigation accessibility name only, plus release diagnostics.
// Does not assert WCAG, 200% zoom, iOS Safari or VoiceOver acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01854-first-save-expiry-20261026.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01855-nav-accessible-name-20261027.js','utf8');
const changes=[
  [
    'accessibilityRole:"tab",accessibilityLabel:e,"aria-selected"',
    'accessibilityRole:"tab",accessibilityLabel:e==="\\xcenregistreaz\\u0103"?"Adaugă":e,"aria-selected"'
  ],
  ['version:"18.54"','version:"18.55"'],
  ['financial-autonomy-diagnostic-unic-v18.54.json','financial-autonomy-diagnostic-unic-v18.55.json']
];
let expected=before;
for(const [oldValue,newValue] of changes){
  assert.equal(expected.split(oldValue).length-1,1,'Unique change anchor required: '+oldValue);
  expected=expected.replace(oldValue,newValue);
}
assert.equal(after,expected,'Unexpected difference outside accessible nav name and release diagnostics');
assert.match(after,/accessibilityRole:"tab",accessibilityLabel:e==="\\xcenregistreaz\\u0103"\?"Adaugă":e/);
assert.match(after,/"\\xcenregistreaz\\u0103":"Adaugă"/);
assert.match(after,/onPress:\(\)=>T\(e\)/);
const html=fs.readFileSync('index.html','utf8');
// Historical immutable diff stays valid after a later WEB version becomes active.
if(html.includes('name="financial-autonomy-version" content="18.55"')){
  assert.match(html,/index-v01855-nav-accessible-name-20261027\.js\?build=18\.55\.1/);
}
console.log('PASS WEB 18.55: Add tab visible/accessibility labels match; route, engine and vault unchanged');
