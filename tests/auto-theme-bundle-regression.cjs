'use strict';
// WEB v18.46 -> v18.47 immutable visual-only release guard.
// The only changes are two obsolete dark-palette comparisons and diagnostic metadata.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const old = fs.readFileSync('_expo/static/js/web/index-v01846-blocked-vault-nondestructive-copy-20261025.js','utf8');
const actual = fs.readFileSync('_expo/static/js/web/index-v01847-auto-theme-color-scheme-20261025.js','utf8');
const obsolete = '"#101521"===ye.colors.background';
const corrected = '"#0D1426"===ye.colors.background';
assert.equal(old.split(obsolete).length-1,2,'Expected obsolete color comparisons in auto theme and status bar');
let expected = old.split(obsolete).join(corrected);
for(const [before,after] of [
  ['version:"18.46"','version:"18.47"'],
  ['financial-autonomy-diagnostic-unic-v18.46.json','financial-autonomy-diagnostic-unic-v18.47.json']
]){
  assert.equal(expected.split(before).length-1,1,'Expected one old occurrence: '+before);
  expected=expected.replace(before,after);
}
assert.equal(actual,expected,'Unexpected product change beyond auto-theme/StatusBar and diagnostics');
// This is an ARCHIVED release-diff regression. A later active HTML version
// must not invalidate the immutability proof for the historical v18.47 bundle.
assert.ok(fs.existsSync('_expo/static/js/web/index-v01847-auto-theme-color-scheme-20261025.js'));
assert.match(actual,/version:"18[.]47"/);
assert.match(actual,/financial-autonomy-diagnostic-unic-v18[.]47[.]json/);
console.log('PASS: v18.47 differs from immutable v18.46 only in two dark palette comparisons and diagnostic metadata');
