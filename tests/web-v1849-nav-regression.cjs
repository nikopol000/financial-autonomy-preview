'use strict';
// Strict WEB 18.48 -> 18.49 immutable diff: only accessible nav layout/labels and diagnostic version.
// This is an historical artifact guard; it does not claim Safari/iOS accessibility acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01848-finances-budget-primary-label-20261026.js','utf8');
const actual=fs.readFileSync('_expo/static/js/web/index-v01849-responsive-nav-zoom-20261026.js','utf8');
const edits=[
  [
    "style:[he.nav,be&&{width:168,flexDirection:\"column\",borderTopWidth:0,borderRightWidth:1,gap:12,paddingTop:24}]",
    "style:[he.nav,je<240&&!be&&{flexWrap:\"wrap\",justifyContent:\"center\",padding:4,gap:4},be&&{width:168,flexDirection:\"column\",borderTopWidth:0,borderRightWidth:1,gap:12,paddingTop:24}]"
  ],
  [
    "accessibilityRole:\"tab\",\"aria-selected\":I===e",
    "accessibilityRole:\"tab\",accessibilityLabel:e,\"aria-selected\":I===e"
  ],
  [
    "style:[he.navItem,be&&{flex:0,flexDirection:\"row\",justifyContent:\"flex-start\",paddingHorizontal:12,gap:12}",
    "style:[he.navItem,je<240&&!be&&{flex:0,width:\"30%\",minWidth:0,minHeight:56,paddingHorizontal:1},be&&{flex:0,flexDirection:\"row\",justifyContent:\"flex-start\",paddingHorizontal:12,gap:12}"
  ],
  [
    "style:[he.navText,(I===e||\"Mai mult\"===e&&Re.includes(I))&&{color:pe.accent}],children:e",
    "style:[he.navText,{flexShrink:1,maxWidth:\"100%\"},(I===e||\"Mai mult\"===e&&Re.includes(I))&&{color:pe.accent}],children:{\"Acas\\u0103\":\"Aca\\xad s\\u0103\",\"Finan\\u021be\":\"Fina\\xad n\\u021be\",\"\\xcenregistreaz\\u0103\":\"\\xcenregis\\xad treaz\\u0103\",\"Istoric\":\"Isto\\xad ric\"}[e]?.replace(/ /g,\"\")||e"
  ],
  [
    "version:\"18.48\"",
    "version:\"18.49\""
  ]
];
let expected=old;
for(const [before,after] of edits){
  assert.equal(expected.split(before).length-1,1,'Ambiguous nav-only change anchor: '+before);
  expected=expected.replace(before,after);
}
assert.equal(actual,expected,'Unexpected WEB 18.49 change outside navigation and diagnostic version');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18[.]49"/);
assert.ok(html.includes('index-v01849-responsive-nav-zoom-20261026.js?build=18.49.1'));
console.log('PASS immutable WEB 18.49 nav-only diff; financial engine and encrypted vault unchanged');
