'use strict';
// Strict WEB 18.48 -> 18.49 immutable diff: only accessible nav layout/labels and diagnostic version.
// This is an historical artifact guard; it does not claim Safari/iOS accessibility acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const old=fs.readFileSync('_expo/static/js/web/index-v01848-finances-budget-primary-label-20261026.js','utf8');
const actual=fs.readFileSync('_expo/static/js/web/index-v01849-responsive-nav-wrap-r3-20261026.js','utf8');
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
  ],
  [
    "financial-autonomy-diagnostic-unic-v18.48.json",
    "financial-autonomy-diagnostic-unic-v18.49.json"
  ],
  [
    "style:[he.header,ge&&{paddingHorizontal:16,paddingVertical:10}]",
    "style:[he.header,ge&&{paddingHorizontal:12,paddingVertical:10,flexWrap:\"wrap\"}]"
  ],
  [
    "style:{flexDirection:\"row\",alignItems:\"center\",gap:12,flex:1},children:[!ge",
    "style:{flexDirection:\"row\",alignItems:\"center\",gap:12,flex:1,minWidth:120},children:[!ge"
  ],
  [
    "children:\"BANII T\\u0102I. DIREC\\u021aIA TA. \\xb7 v0\"+",
    "children:\"v0\"+"
  ],
  [
    "style:[he.banner,{borderWidth:2,borderColor:pe.accent,gap:8}]",
    "style:[he.banner,{borderWidth:2,borderColor:pe.accent,gap:8},ge&&{padding:12}]"
  ],
  [
    "children:\"Exemple pentru explorare. Modificările rămân doar în memorie; backupul, diagnosticul, importul și ștergerea datelor sunt blocate.\"",
    "children:\"Date fictive, doar în memorie. Backupul, diagnosticul, importul și ștergerea datelor sunt blocate.\""
  ],
  [
    "label:\"Ieși din demo / Începe cu date reale\"",
    "label:\"Ieși din demo\""
  ],
  [
    "style:[he.nav,je<240&&!be&&{flexWrap:\"wrap\",justifyContent:\"center\",padding:4,gap:4},be&&{width:168,flexDirection:\"column\",borderTopWidth:0,borderRightWidth:1,gap:12,paddingTop:24}]",
    "style:[he.nav,!be&&{flexWrap:\"wrap\"},be&&{width:168,flexDirection:\"column\",borderTopWidth:0,borderRightWidth:1,gap:12,paddingTop:24}]"
  ],
  [
    "style:[he.navItem,je<240&&!be&&{flex:0,width:\"30%\",minWidth:0,minHeight:56,paddingHorizontal:1},be&&{flex:0,flexDirection:\"row\",justifyContent:\"flex-start\",paddingHorizontal:12,gap:12}",
    "style:[he.navItem,!be&&{minWidth:56},be&&{flex:0,flexDirection:\"row\",justifyContent:\"flex-start\",paddingHorizontal:12,gap:12}"
  ],
  [
    "\"\\xcenregistreaz\\u0103\":\"\\xcenregis\\xad treaz\\u0103\"",
    "\"\\xcenregistreaz\\u0103\":\"Adaugă\""
  ]
];
let expected=old;
for(const [before,after] of edits){
  assert.equal(expected.split(before).length-1,1,'Ambiguous nav-only change anchor: '+before);
  expected=expected.replace(before,after);
}
assert.equal(actual,expected,'Unexpected WEB 18.49 change outside navigation and diagnostic version');
const html=fs.readFileSync('index.html','utf8');
// Historical immutable diff stays valid after later releases become active.
if(html.includes('name="financial-autonomy-version" content="18.49"'))
  assert.ok(html.includes('index-v01849-responsive-nav-wrap-r3-20261026.js?build=18.49.3'));
console.log('PASS immutable WEB 18.49 nav-only diff; financial engine and encrypted vault unchanged');
