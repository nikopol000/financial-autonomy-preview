'use strict';
// WEB 18.59 -> 18.60: compact DEMO-only warning on narrow screens.
// Exact full-bundle diff guards financial calculations, vault, backup, navigation,
// real-mode warnings and all non-demo behavior.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const before=fs.readFileSync('_expo/static/js/web/index-v01859-budget-direct-configure-20261027.js','utf8');
const after=fs.readFileSync('_expo/static/js/web/index-v01860-compact-demo-warning-20261028.js','utf8');
const edits=[
  [
    'style:[he.banner,{borderWidth:2,borderColor:pe.accent,gap:8},ge&&{padding:12}],children:[\n  (0,k.jsx)(o.default,{accessibilityRole:"header",style:he.h2,children:"DEMO · DATE FICTIVE"}),',
    'style:[he.banner,{borderWidth:2,borderColor:pe.accent,gap:ge?6:8},ge&&{paddingHorizontal:12,paddingVertical:8}],children:[\n  (0,k.jsx)(o.default,{accessibilityRole:"header",style:[he.h2,ge&&{fontSize:16,lineHeight:22}],children:"DEMO · DATE FICTIVE"}),'
  ],
  [
    'Date fictive, doar în memorie. Backupul, diagnosticul, importul și ștergerea datelor sunt blocate.',
    'Date fictive, doar în memorie. Backup, diagnostic, import și ștergere dezactivate.'
  ],
  ['version:"18.59"','version:"18.60"'],
  ['financial-autonomy-diagnostic-unic-v18.59.json','financial-autonomy-diagnostic-unic-v18.60.json']
];
let expected=before;
for(const [oldText,newText] of edits){
  assert.equal(expected.split(oldText).length-1,1,'Exactly one edit required: '+oldText.slice(0,90));
  expected=expected.replace(oldText,newText);
}
assert.equal(after,expected,'18.60 must change only demo banner geometry/copy and diagnostics');
assert.match(after,/label:"Ieși din demo",secondary:!0/,'Demo exit action must remain available');
assert.match(after,/Backup, diagnostic, import și ștergere dezactivate/,'Demo safety warning must remain visible');
const html=fs.readFileSync('index.html','utf8');
if(html.includes('name="financial-autonomy-version" content="18.60"')){
  assert.match(html,/index-v01860-compact-demo-warning-20261028\.js\?build=18\.60\.1/);
}
console.log('PASS WEB 18.60: compact mobile DEMO warning with preserved exit, unchanged financial/vault/backup/real mode');
