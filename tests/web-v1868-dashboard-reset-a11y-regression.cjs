'use strict';
// WEB 18.68: copy/touch-target-only dashboard layout reset; financial engine untouched.
// Static regression guard. Browser hit-testing/Safari/VoiceOver remain separate checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const prev = read('_expo/static/js/web/index-v01867-short-height-scroll-20261101.js');
const next = read('_expo/static/js/web/index-v01868-dashboard-reset-a11y-20261101.js');
const edits = [
  [
    'accessibilityRole:"button",onPress:()=>{const a=(0,d.planAt)(e,(0,d.monthOf)(D))',
    'accessibilityRole:"button",accessibilityLabel:"Restabilește ordinea cardurilor de pe Acasă",onPress:()=>{const a=(0,d.planAt)(e,(0,d.monthOf)(D))'
  ],
  [
    'style:{alignSelf:"flex-start",paddingVertical:5},children:(0,y.jsx)(n.default,{style:[_.label,{color:k.accent}],children:"Reset la default"})',
    'style:{alignSelf:"flex-start",minHeight:44,justifyContent:"center",paddingVertical:10,paddingHorizontal:12},children:(0,y.jsx)(n.default,{style:[_.label,{color:k.accent}],children:"Restabilește ordinea"})'
  ],
  ['version:"18.67"', 'version:"18.68"'],
  ['financial-autonomy-diagnostic-unic-v18.67.json',
   'financial-autonomy-diagnostic-unic-v18.68.json']
];
let expected = prev;
for (const [before, after] of edits) {
  assert.equal(expected.split(before).length - 1, 1, 'Exactly one source occurrence required: ' + before.slice(0, 65));
  expected = expected.replace(before, after);
}
assert.equal(next, expected, '18.68 may change ONLY the reset control copy/target/accessibility and diagnostic version/name');
assert.doesNotMatch(next, /Reset la default/, 'Mixed-language reset label must not survive');
assert.match(next, /minHeight:44,justifyContent:"center",paddingVertical:10,paddingHorizontal:12/, '44px minimum reset target missing');
assert.match(next, /accessibilityLabel:"Restabilește ordinea cardurilor de pe Acasă"/);
// Archived WEB 18.68 must remain immutable even after 18.69 becomes active.
// Current HTML/version/bundle activation is checked by the 18.69 guard.
const html = read('index.html');
assert.match(html, /@media \(max-width: 430px\) and \(max-height: 540px\)/,
  'Preserve short-height mobile scrolling fallback');
console.log('PASS WEB 18.68 dashboard reset control: Romanian copy, accessible name, >=44px target; exact immutable diff, no financial changes');
