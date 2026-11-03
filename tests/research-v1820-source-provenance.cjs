#!/usr/bin/env node
// Research-only provenance gate for the *actual archived* WEB 18.20 bundle.
// Does not execute the browser, decrypt a vault, or prove concurrency safety.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const path = '_expo/static/js/web/index-v01820-history-back-navigation-20261014.js';
const bytes = fs.readFileSync(path);
const text = bytes.toString('utf8');
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const names = ['financial-autonomy.preview.key.v1', 'financial-autonomy.preview.payload.v1'];
for (const name of names) {
  const count = text.split(name).length - 1;
  assert.equal(count, 1, 'Unexpected archived storage contract for ' + name);
}
for (const expression of [
  'loadWebVault(globalThis.localStorage)',
  'saveWebVault(globalThis.localStorage',
  'clearWebVault(globalThis.localStorage)'
]) {
  assert.ok(text.includes(expression), 'Missing archived adapter call: ' + expression);
}
assert.ok(!text.includes('indexedDB'), 'Unexpected IndexedDB in archived bundle');
console.log(JSON.stringify({status:'PASS',scope:'archived-source-provenance-only',
  path,bytes:bytes.length,sha256,legacyKeyNames:names,
  browserExecution:false,storageMutation:false},null,2));
