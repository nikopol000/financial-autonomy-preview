'use strict';
// WEB 18.69: honor the persisted Dashboard order for all modules, including
// the six primary cards. No changes to financial calculations or vault storage.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const old=read('_expo/static/js/web/index-v01868-dashboard-reset-a11y-20261101.js');
const next=read('_expo/static/js/web/index-v01869-dashboard-order-restorable-20261101.js');
const edits=[
  [
    'J=(0,a.useMemo)(()=>{const a=(0,m.normalizeDashboardOrder)(e.dashboardLayout?.order);return ["autonomy","space","spending","nextIncome","budget","quickActions",...a.filter(e=>!["autonomy","space","spending","nextIncome","budget","quickActions"].includes(e))]},[e.dashboardLayout?.order])',
    'J=(0,a.useMemo)(()=>(0,m.normalizeDashboardOrder)(e.dashboardLayout?.order),[e.dashboardLayout?.order])'
  ],
  ['version:"18.68"','version:"18.69"'],
  ['financial-autonomy-diagnostic-unic-v18.68.json','financial-autonomy-diagnostic-unic-v18.69.json']
];
let expected=old;
for(const [before,after] of edits){
  assert.equal(expected.split(before).length-1,1,'Expected exactly one source occurrence: '+before.slice(0,70));
  expected=expected.replace(before,after);
}
assert.equal(next,expected,'18.69 may change ONLY dashboard order derivation and diagnostic version/name');
assert.match(next,/J=\(0,a\.useMemo\)\(\(\)=>\(0,m\.normalizeDashboardOrder\)\(e\.dashboardLayout\?\.order\)/);
const html=read('index.html');
// Archived WEB 18.69 bundle remains immutable; active HTML checked by 18.70 guard.
// Archived WEB 18.69 bundle remains immutable; active HTML checked by 18.70 guard.
assert.match(html,/@media \(max-width: 430px\) and \(max-height: 540px\)/);
console.log('PASS WEB 18.69: Dashboard order no longer hard-pins six primary cards; exact immutable diff and synchronized release metadata');
