#!/usr/bin/env node
'use strict';
// Synthetic source-characterization only. Not a browser or recovery safety acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const html = fs.readFileSync('index.html', 'utf8');
const bundle = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle, 'active versioned bundle missing');
const source = fs.readFileSync(bundle, 'utf8');
const start = source.indexOf('function faIdleReset(');
const end = source.indexOf('function faVaultConflict()', start);
assert.ok(start >= 0 && end > start, 'reset functions missing');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET_MARKER = 'financial-autonomy.preview.reset.v1';
const context = { KEY, PAYLOAD, RESET_MARKER, globalThis: { crypto: crypto.webcrypto } };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context, { filename: bundle });

function storageWithSilentWrite(initial, ignore) {
  const state = new Map(initial);
  const mutations = [];
  return {
    state, mutations,
    getItem(k) { return state.has(k) ? state.get(k) : null; },
    setItem(k, v) {
      mutations.push(['set', k, String(v)]);
      if (!ignore(k, String(v))) state.set(k, String(v));
    },
    removeItem(k) { mutations.push(['remove', k]); state.delete(k); }
  };
}
const pair = [[KEY, 'SYNTHETIC_KEY'], [PAYLOAD, 'SYNTHETIC_PAYLOAD']];

// Silent write loss on initial intent: read-back must block BOTH deletions.
{
  const storage = storageWithSilentWrite(pair, k => k === RESET_MARKER);
  assert.throws(() => context.faBeginCommittedReset(storage), /Marcajul de resetare nu a fost confirmat/);
  assert.equal(storage.getItem(KEY), 'SYNTHETIC_KEY');
  assert.equal(storage.getItem(PAYLOAD), 'SYNTHETIC_PAYLOAD');
  assert.equal(storage.getItem(RESET_MARKER), null);
  assert.equal(storage.mutations.filter(m => m[0] === 'remove').length, 0);
  console.log('PASS CHARACTERIZATION silent pending intent write; safety acceptance: NO');
}

// Legacy committed-v1 upgrade must also be read back before either deletion.
{
  const storage = storageWithSilentWrite([...pair, [RESET_MARKER, 'committed-v1']], (k,v) => k === RESET_MARKER && v.startsWith('pending-v2:'));
  assert.throws(() => context.faFinishCommittedReset(storage), /Marcajul de resetare nu a fost confirmat/);
  assert.equal(storage.getItem(RESET_MARKER), 'committed-v1');
  assert.equal(storage.getItem(KEY), 'SYNTHETIC_KEY');
  assert.equal(storage.getItem(PAYLOAD), 'SYNTHETIC_PAYLOAD');
  assert.equal(storage.mutations.filter(m => m[0] === 'remove').length, 0);
  console.log('PASS CHARACTERIZATION silent legacy upgrade write; safety acceptance: NO');
}

// Silent final idle write: deletion already happened; read-back detects it but cannot undo it.
{
  const storage = storageWithSilentWrite(pair, (k,v) => k === RESET_MARKER && v.startsWith('idle-v2:'));
  assert.throws(() => context.faBeginCommittedReset(storage), /Finalizarea resetării nu a putut fi confirmată/);
  assert.match(storage.getItem(RESET_MARKER), /^pending-v2:[0-9a-f]{32}$/);
  assert.equal(storage.getItem(KEY), null);
  assert.equal(storage.getItem(PAYLOAD), null);
  assert.deepEqual(storage.mutations.filter(m => m[0] === 'remove').map(m => m[1]), [PAYLOAD, KEY]);
  console.log('PASS CHARACTERIZATION silent final idle write; safety acceptance: NO');
}
console.log(JSON.stringify({activeBundle:bundle,syntheticOnly:true,browserReloadTested:false,safetyPass:false}));
