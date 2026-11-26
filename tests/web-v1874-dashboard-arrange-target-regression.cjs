'use strict';
// WEB 18.74: enlarge Dashboard arrangement entry touch target and name both
// states explicitly; no financial, storage, or vault logic is authorized here.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const prev=read('_expo/static/js/web/index-v01873-reset-error-visibility-20261103.js');
const next=read('_expo/static/js/web/index-v01874-dashboard-arrange-target-20261103.js');
const changes=[
  ['accessibilityRole:"button",onPress:o,style:{paddingVertical:6,paddingHorizontal:4}',
   'accessibilityRole:"button",accessibilityLabel:t?"Încheie aranjarea cardurilor":"Aranjează cardurile de pe Acasă",onPress:o,style:{minHeight:44,justifyContent:"center",paddingVertical:10,paddingHorizontal:12}'],
  ['version:"18.73"','version:"18.74"'],
  ['financial-autonomy-diagnostic-unic-v18.73.json','financial-autonomy-diagnostic-unic-v18.74.json']
];
let expected=prev;
for(const [before,after] of changes){
  assert.equal(expected.split(before).length-1,1,'One exact occurrence required: '+before.slice(0,65));
  expected=expected.replace(before,after);
}
assert.equal(next,expected,'WEB 18.74 must change ONLY arrangement entry target/name and diagnostic metadata');
assert.match(next,/accessibilityLabel:t\?"Încheie aranjarea cardurilor":"Aranjează cardurile de pe Acasă"/);
assert.match(next,/minHeight:44,justifyContent:"center",paddingVertical:10,paddingHorizontal:12/);
const html=read('index.html');
// The archived 18.74 bundle stays immutable; newer releases are allowed.
const activeVersion=html.match(/<meta name="financial-autonomy-version" content="(18\.\d+)"/)?.[1];
assert.ok(activeVersion&&Number(activeVersion)>=18.74,'Active version must not regress below 18.74');
const activeBundle=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=(18\.\d+)\.\d+"/);
assert.ok(activeBundle,'Active preview must reference an immutable versioned bundle');
assert.equal(activeBundle[2],activeVersion,'Active bundle cache key must match HTML metadata');
assert.ok(fs.existsSync(path.join(root,activeBundle[1])),'Active bundle must exist');
console.log('PASS WEB 18.74 Dashboard arrangement entry >=44px and named states; exact immutable diff, financial/vault engine unchanged');
