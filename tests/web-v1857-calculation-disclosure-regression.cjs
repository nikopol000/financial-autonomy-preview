'use strict';
// WEB 18.56 -> 18.57: calculation disclosures become visible, keyboard/screen-reader named,
// and at least 44 CSS px tall. Exact immutable diff protects the financial and vault engines.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01856-mobile-header-two-line-20261027.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01857-visible-calculation-disclosure-20261027.js','utf8');
const edits=[
  [
    'style:{width:44,height:36,justifyContent:"center",alignItems:"center",alignSelf:"flex-end"},children:(0,u.jsx)(a.default,{style:{fontWeight:"800",fontSize:20,lineHeight:28,color:c.hero==="#111D48"?"#D8E1FF":"#FFFFFF"},children:f?"\\u25b2":"\\u25bc"})',
    'style:{minHeight:44,maxWidth:"100%",paddingHorizontal:12,paddingVertical:8,justifyContent:"center",alignItems:"center",alignSelf:"flex-end",borderRadius:12,backgroundColor:c.hero==="#111D48"?"#273B73":"#111D48",borderWidth:1,borderColor:c.hero==="#111D48"?"#6B83C5":"#111D48"},children:(0,u.jsx)(a.default,{style:{fontWeight:"700",fontSize:14,lineHeight:20,color:"#FFFFFF",textAlign:"center"},children:f?"Ascunde calculul \\u25b2":"Vezi calculul \\u25bc"})'
  ],
  ['version:"18.56"','version:"18.57"'],
  ['financial-autonomy-diagnostic-unic-v18.56.json','financial-autonomy-diagnostic-unic-v18.57.json']
];
let expected=before;
for(const [oldText,newText] of edits){
  assert.equal(expected.split(oldText).length-1,1,'Unique intended edit required: '+oldText.slice(0,65));
  expected=expected.replace(oldText,newText);
}
assert.equal(after,expected,'WEB 18.57 must change only calculation disclosure UI and diagnostic metadata');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18\.57"/);
assert.match(html,/index-v01857-visible-calculation-disclosure-20261027\.js\?build=18\.57\.1/);
assert.match(after,/accessibilityLabel:f\?"Ascunde calculul":o/);
assert.match(after,/minHeight:44,maxWidth:"100%"/);
console.log('PASS WEB 18.57: visible calculation disclosures, >=44px target, unchanged finance/vault engine');
