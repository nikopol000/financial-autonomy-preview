'use strict';
// WEB 18.55 -> 18.56: bound mobile header brand to two lines, without touching accounting or vault.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01855-nav-accessible-name-20261027.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01856-mobile-header-two-line-20261027.js','utf8');
const edits=[
  ['style:{flexDirection:"row",alignItems:"center",gap:12,flex:1,minWidth:120},children:[!ge',
   'style:{flexDirection:"row",alignItems:"center",gap:12,flex:1,minWidth:0},children:[!ge'],
  ['style:[he.brand,ge&&{fontSize:18}],children:"Financial Autonomy"',
   'style:[he.brand,ge&&{fontSize:18}],numberOfLines:ge?2:void 0,ellipsizeMode:"tail",children:"Financial Autonomy"'],
  ['version:"18.55"','version:"18.56"'],
  ['financial-autonomy-diagnostic-unic-v18.55.json','financial-autonomy-diagnostic-unic-v18.56.json']
];
let expected=before;
for(const [oldText,newText] of edits){
  assert.equal(expected.split(oldText).length-1,1,'Unique edit required: '+oldText);
  expected=expected.replace(oldText,newText);
}
assert.equal(after,expected,'Unexpected change outside mobile brand and diagnostic version');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/name="financial-autonomy-version" content="18\.56"/);
assert.match(html,/index-v01856-mobile-header-two-line-20261027\.js\?build=18\.56\.1/);
console.log('PASS WEB 18.56: mobile brand capped at two lines; immutable diff confirms no financial, vault or navigation changes');
