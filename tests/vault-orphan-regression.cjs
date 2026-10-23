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
const emptySaved = { version: 4, accounts: [], transactions: [], balanceChecks: [] };
let decoded = saved;
const model = { emptyState: () => fresh, migrate: x => x, validateState: () => {} };
const crypto = { hexToBytes: () => new Uint8Array(32), bytesToHex: () => 'b'.repeat(64), seal: () => 'sealed-vault', unseal: () => JSON.stringify(decoded) };
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
  assert.deepEqual(JSON.parse(JSON.stringify(api.loadWebVault(s))), saved);
  decoded = emptySaved;
  assert.deepEqual(JSON.parse(JSON.stringify(api.loadWebVault(s))), emptySaved);
  decoded = saved;
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

function writableStorage(initial = {}, failPayload = false) {
  const data = { ...initial };
  let writes = 0;
  return {
    getItem(k) { return data[k] ?? null; },
    setItem(k, v) {
      writes++;
      if (failPayload && k === PAYLOAD) throw Error('Simulated quota failure');
      data[k] = v;
    },
    removeItem(k) { delete data[k]; },
    get writes() { return writes; },
    get data() { return data; }
  };
}
const randomBytes = n => new Uint8Array(n).fill(11);
test('Orphan encryption key blocks save as well as load without writing', () => {
  const s = writableStorage({ [KEY]: 'a'.repeat(64) });
  assert.throws(() => api.saveWebVault(s, saved, randomBytes), /Salvarea este blocată/);
  assert.equal(s.writes, 0);
  assert.equal(s.data[KEY], 'a'.repeat(64));
  assert.equal(s.data[PAYLOAD], undefined);
});
test('Fresh browser can initialize both encrypted vault keys on first save', () => {
  const s = writableStorage();
  api.saveWebVault(s, saved, randomBytes);
  assert.equal(s.writes, 2);
  assert.equal(s.data[KEY], 'b'.repeat(64));
  assert.equal(s.data[PAYLOAD], 'sealed-vault');
});
test('Existing complete encrypted vault updates payload but preserves encryption key', () => {
  const s = writableStorage({ [KEY]: 'a'.repeat(64), [PAYLOAD]: 'previous-vault' });
  api.saveWebVault(s, saved, randomBytes);
  assert.equal(s.writes, 1);
  assert.equal(s.data[KEY], 'a'.repeat(64));
  assert.equal(s.data[PAYLOAD], 'sealed-vault');
});
test('Payload without key blocks save without modifying the ciphertext', () => {
  const s = writableStorage({ [PAYLOAD]: 'previous-vault' });
  assert.throws(() => api.saveWebVault(s, saved, randomBytes), /cheia lor lipsește/);
  assert.equal(s.writes, 0);
  assert.equal(s.data[PAYLOAD], 'previous-vault');
});
test('Failed initial payload write leaves a guarded orphan instead of silent overwrite', () => {
  const s = writableStorage({}, true);
  assert.throws(() => api.saveWebVault(s, saved, randomBytes), /nu a putut salva/);
  assert.equal(s.data[KEY], 'b'.repeat(64));
  assert.equal(s.data[PAYLOAD], undefined);
  assert.throws(() => api.loadWebVault(s), /Cheia locală există fără datele criptate/);
  const writesBeforeRetry = s.writes;
  assert.throws(() => api.saveWebVault(s, saved, randomBytes), /Salvarea este blocată/);
  assert.equal(s.writes, writesBeforeRetry);
});
