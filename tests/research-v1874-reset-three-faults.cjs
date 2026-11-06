#!/usr/bin/env node
'use strict';
// Characterization, not safety acceptance. Synthetic in-memory storage only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const html = fs.readFileSync('index.html', 'utf8');
const bundle = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle, 'versioned active bundle missing');
const source = fs.readFileSync(bundle, 'utf8');
const start = source.indexOf('function faIdleReset(');
const end = source.indexOf('function faVaultConflict()', start);
assert.ok(start > 0 && end > start, 'reset functions missing');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET_MARKER = 'financial-autonomy.preview.reset.v1';
const context = { KEY, PAYLOAD, RESET_MARKER, globalThis: { crypto: crypto.webcrypto } };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context, { filename: bundle });
for (const fault of ['marker-write', 'payload-remove', 'key-remove']) {
  const state = new Map([[KEY, 'SYNTHETIC_KEY'], [PAYLOAD, 'SYNTHETIC_PAYLOAD']]);
  let deny = true;
  const storage = {
    getItem(k) { return state.has(k) ? state.get(k) : null; },
    setItem(k, v) { if (deny && fault === 'marker-write' && k === RESET_MARKER) throw Error('INJECTED_MARKER_WRITE'); state.set(k, String(v)); },
    removeItem(k) { if (deny && ((fault === 'payload-remove' && k === PAYLOAD) || (fault === 'key-remove' && k === KEY))) throw Error('INJECTED_REMOVE'); state.delete(k); }
  };
  assert.throws(() => context.faBeginCommittedReset(storage), /INJECTED_/);
  if (fault === 'marker-write') {
    assert.equal(storage.getItem(KEY), 'SYNTHETIC_KEY');
    assert.equal(storage.getItem(PAYLOAD), 'SYNTHETIC_PAYLOAD');
    assert.equal(storage.getItem(RESET_MARKER), null);
    deny = false;
    assert.throws(() => context.faFinishCommittedReset(storage));
    assert.equal(storage.getItem(KEY), 'SYNTHETIC_KEY');
    assert.equal(storage.getItem(PAYLOAD), 'SYNTHETIC_PAYLOAD');
  } else {
    assert.match(storage.getItem(RESET_MARKER), /^pending-v2:[0-9a-f]{32}$/);
    assert.equal(storage.getItem(KEY), 'SYNTHETIC_KEY');
    assert.equal(storage.getItem(PAYLOAD), fault === 'payload-remove' ? 'SYNTHETIC_PAYLOAD' : null);
    deny = false;
    context.faFinishCommittedReset(storage);
    assert.equal(storage.getItem(KEY), null);
    assert.equal(storage.getItem(PAYLOAD), null);
    assert.match(storage.getItem(RESET_MARKER), /^idle-v2:[0-9a-f]{32}$/);
  }
  console.log(`PASS CHARACTERIZATION ${fault}; safety acceptance: NO`);
}
console.log(JSON.stringify({activeBundle:bundle,syntheticOnly:true,browserReloadTested:false,safetyPass:false}));
