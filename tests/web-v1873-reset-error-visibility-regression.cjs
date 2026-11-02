'use strict';
// WEB 18.73: only reset-error presentation and immutable diagnostic may differ
// from 18.72. Protect the financial engine, vault protocol and success path.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const previous=read('_expo/static/js/web/index-v01872-forced-colors-focus-20261101.js');
const current=read('_expo/static/js/web/index-v01873-reset-error-visibility-20261103.js');
let expected=previous;
const replacements=[
  ['await R.resetData(),me.current++,re(!1),q(null)',
   'try{await R.resetData()}catch(error){re(!1);V("Ștergerea nu a fost confirmată. Starea datelor poate fi incertă. Nu șterge datele site-ului și nu reîncerca înainte să verifici starea datelor. Păstrează backupul criptat. Detalii: "+(error?.message||"Eroare necunoscută."));setTimeout(()=>document.getElementById("fa-app-error-alert")?.focus(),0);return}me.current++,re(!1),q(null)'],
  ['O&&(0,k.jsxs)(d.default,{accessibilityRole:"alert",style:he.banner,children:',
   'O&&(0,k.jsxs)(d.default,{accessibilityRole:"alert",accessibilityLiveRegion:"assertive",nativeID:"fa-app-error-alert",tabIndex:-1,style:he.banner,children:'],
  ['version:"18.72"','version:"18.73"'],
  ['financial-autonomy-diagnostic-unic-v18.72.json','financial-autonomy-diagnostic-unic-v18.73.json']
];
for(const [from,to] of replacements){
  assert.equal(expected.split(from).length-1,1,'Expected one exact replacement anchor');
  expected=expected.replace(from,to);
}
assert.equal(current,expected,'WEB 18.73 must change only reset error presentation and diagnostic version');
const html=read('index.html');
const active=html.match(/<meta name="financial-autonomy-version" content="(\\d+\\.\\d+)"/)?.[1];
assert.ok(active&&Number(active)>=18.73,'Current version must not regress below 18.73');
assert.ok(fs.existsSync(path.join(root,'_expo/static/js/web/index-v01873-reset-error-visibility-20261103.js')),
  'Immutable WEB 18.73 bundle must remain available');
console.log('PASS WEB 18.73: reset error UX-only immutable diff, financial engine unchanged');
