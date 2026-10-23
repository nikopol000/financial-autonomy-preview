// Regression for fail-closed web vault loading against the actual active bundle.
// Run: node tests/vault-orphan-regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const path = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path, 'Active bundle path missing');
const source = fs.readFileSync(path, 'utf8');
const marker = 'e.loadWebVault=function(o)';
const at = source.indexOf(marker);
assert.ok(at >= 0, 'Web vault loader missing');
const start = source.lastIndexOf('__d(function(', at);
const end = source.indexOf('},310,[205,311]);', at);
assert.ok(start >= 0 && end > start, 'Vault module boundaries changed');
const factory = vm.runInNewContext('(' + source.slice(start + 4, end + 1) + ')');
const fresh = { version: 4, accounts: [], transactions: [], balanceChecks: [] };
const saved = { version: 4, accounts: [{ id: 'saved' }], transactions: [], balanceChecks: [] };
const model = { emptyState: () => fresh, migrate: x => x, validateState: () => {} };
const crypto = { hexToBytes: () => new Uint8Array(32), unseal: () => JSON.stringify(saved) };
const api = {};
factory({}, id => id === 205 ? model : crypto, () => {}, null, {}, api, [205, 311]);
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
function storage(initial = {}, denied = false) {
  const data = { ...initial };
  let writes = 0;
  return {
    getItem(k) { if (denied) throw Error('Storage denied'); return data[k] ?? null; },
    setItem() { writes++; throw Error('Vault load must not write'); },
    removeItem(k) { delete data[k]; },
    get writes() { return writes; }
  };
}
function test(name, fn) {
  try { fn(); console.log('PASS', name); }
  catch (err) { console.error('FAIL', name, err.message); process.exitCode = 1; }
}
test('Fresh browser is the only uninitialized vault state', () => {
  const s = storage();
  assert.equal(api.loadWebVault(s), fresh);
  assert.equal(s.writes, 0);
});
test('Orphan encryption key never silently initializes a new ledger', () => {
  const s = storage({ [KEY]: 'a'.repeat(64) });
  assert.throws(() => api.loadWebVault(s), /Cheia locală există fără datele criptate/);
  assert.equal(s.writes, 0);
});
test('Existing encrypted payload with missing key remains blocked', () => {
  const s = storage({ [PAYLOAD]: 'ciphertext' });
  assert.throws(() => api.loadWebVault(s), /cheia lor lipsește/);
  assert.equal(s.writes, 0);
});
test('Existing encrypted data, including a deliberately empty ledger, stays real', () => {
  const s = storage({ [KEY]: 'a'.repeat(64), [PAYLOAD]: 'ciphertext' });
  assert.equal(api.loadWebVault(s), saved);
  assert.equal(s.writes, 0);
});
test('Storage permission errors never fall back to an empty ledger', () => {
  assert.throws(() => api.loadWebVault(storage({}, true)), /Storage denied/);
});
test('Explicit clearing of both keys permits a fresh start', () => {
  const s = storage({ [KEY]: 'a'.repeat(64) });
  assert.throws(() => api.loadWebVault(s), /Cheia locală există fără datele criptate/);
  s.removeItem(KEY);
  assert.equal(api.loadWebVault(s), fresh);
});
