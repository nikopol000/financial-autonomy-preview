'use strict';
// #85: preserve the exact WEB 18.67 immutable bundle and its scoped short-height
// accessibility fallback. Static release guard only; Chromium interaction,
// Safari/VoiceOver, and served Vercel HTML require independent verification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const old = read('_expo/static/js/web/index-v01866-romanian-name-terminology-20261031.js');
const next = read('_expo/static/js/web/index-v01867-short-height-scroll-20261101.js');
const replacements = [
  ['version:"18.66"', 'version:"18.67"'],
  ['financial-autonomy-diagnostic-unic-v18.66.json',
   'financial-autonomy-diagnostic-unic-v18.67.json']
];
let expected = old;
for (const [from, to] of replacements) {
  assert.equal(expected.split(from).length - 1, 1,
    'Exactly one immutable source occurrence required: ' + from);
  expected = expected.replace(from, to);
}
assert.equal(next, expected,
  'WEB 18.67 immutable bundle must differ from 18.66 ONLY in diagnostic version/name');
assert.equal(next.split('version:"18.67"').length - 1, 1,
  'WEB 18.67 diagnostic version must appear once');

const html = read('index.html');
const version = html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/)?.[1];
assert.ok(version && Number(version) >= 18.67, 'Active WEB release must not regress below 18.67');
const src = html.match(/<script src="([^"]+)" defer><\/script>/)?.[1];
assert.ok(src, 'Active WEB script reference missing');
if (version === '18.67') {
  assert.equal(src,
    '/financial-autonomy-preview/_expo/static/js/web/index-v01867-short-height-scroll-20261101.js?build=18.67.1',
    'WEB 18.67 must activate its exact immutable diagnostic bundle');
}
// A later product release may extend the layout but must preserve the
// short-height reachability contract until a tested replacement is available.
const rule = html.match(/@media\s*\(max-width:\s*430px\)\s*and\s*\(max-height:\s*540px\)\s*\{([\s\S]*?)<\/style>/)?.[1];
assert.ok(rule, 'Missing narrow AND short viewport accessibility fallback');
assert.match(rule, /html,\s*body\s*\{[^}]*height:\s*auto\s*!important[^}]*min-height:\s*100vh\s*!important[^}]*overflow-y:\s*auto\s*!important/s,
  'Document must be vertically scrollable in short mobile viewport');
assert.match(rule, /#root\s*\{[^}]*height:\s*auto\s*!important[^}]*min-height:\s*100vh\s*!important[^}]*overflow:\s*visible\s*!important/s,
  'App root must grow with content in short mobile viewport');
assert.match(html, /body\s*\{\s*overflow:\s*hidden;/,
  'Normal-height shell body scrolling contract must remain explicit');
assert.match(html, /#root \[role="tab"\]:focus-visible\s*\{[^}]*box-shadow:/s,
  'Keyboard focus ring for mobile navigation must remain present');
console.log('PASS WEB 18.67 immutable diagnostic-only bundle and scoped short-height/focus CSS contract (#85); static, not Safari or served-browser proof');
