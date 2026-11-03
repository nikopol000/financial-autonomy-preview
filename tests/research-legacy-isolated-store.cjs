#!/usr/bin/env node
// Research-only synthetic model. NOT application code or a proof of production safety.
// Run: node tests/research-legacy-isolated-store.cjs
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const key = crypto.randomBytes(32);
const encrypt = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
};
const decrypt = (value) => {
  const b = Buffer.from(value, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, b.subarray(0, 12));
  decipher.setAuthTag(b.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString());
};
const legacyKey = 'legacy:payload';
const isolatedKey = 'candidate:v2:payload';
const selectedKey = 'candidate:v2:selection';
const store = new Map();
const oldWrite = (ledger) => store.set(legacyKey, encrypt(ledger));
const candidateCommit = (ledger) => {
  store.set(isolatedKey, encrypt(ledger));
  store.set(selectedKey, 'v2');
};
const candidateRead = () => {
  if (store.get(selectedKey) !== 'v2') return {status: 'blocked', reason: 'no committed selection'};
  if (!store.has(isolatedKey)) return {status: 'blocked', reason: 'selected payload missing'};
  try { return {status: 'authenticated', ledger: decrypt(store.get(isolatedKey))}; }
  catch { return {status: 'blocked', reason: 'authentication failed'}; }
};
oldWrite({transactions: ['original']});
candidateCommit({transactions: ['original', 'new']});
const originalCandidateBytes = store.get(isolatedKey);
oldWrite({transactions: ['original', 'stale']});
assert.deepEqual(candidateRead(), {status:'authenticated',ledger:{transactions:['original','new']}});
assert.equal(store.get(isolatedKey), originalCandidateBytes);
console.log('PASS isolated v2 ciphertext survives stale legacy overwrite');
store.delete(legacyKey); // legacy reset cannot delete isolated record in this model
assert.equal(candidateRead().status, 'authenticated');
console.log('PASS legacy reset leaves selected isolated record (resurrection policy NOT decided)');
store.delete(isolatedKey); // injected partial deletion
assert.equal(candidateRead().status, 'blocked');
console.log('PASS missing selected payload fails closed');
store.set(isolatedKey, originalCandidateBytes);
store.set(isolatedKey, originalCandidateBytes.slice(0,-4)+'AAAA');
assert.equal(candidateRead().status, 'blocked');
console.log('PASS tampered candidate ciphertext fails authentication');
store.set(isolatedKey, originalCandidateBytes);
store.delete(selectedKey);
assert.equal(candidateRead().status, 'blocked');
console.log('PASS absent selection marker fails closed');
console.log('RESEARCH ONLY: this mock does not exercise browser storage, archived bundles, migration, reset contract or production vault.');
