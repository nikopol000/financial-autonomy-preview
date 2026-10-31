'use strict';
// RESEARCH ONLY: not imported by the WEB bundle; no real vault keys or data.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const PHRASE = 'ȘTERGE DATELE LOCALE';
const fingerprint = evidence => createHash('sha256').update(JSON.stringify(evidence)).digest('hex');

function createGate({ inspect, authenticate, withLock, onWrite }) {
  let epoch = 0;
  let cancelled = false;
  const audit = { writes: 0, inspections: 0, proofs: 0 };
  const block = reason => Object.freeze({ state: 'BLOCKED', reason });
  const gate = {
    audit,
    cancel() { epoch++; cancelled = true; },
    async preview({ phrase, backupVerified, selectedSource, locksAvailable }) {
      const ticket = ++epoch;
      cancelled = false;
      if (!locksAvailable) return block('NO_LOCKS');
      if (phrase !== PHRASE) return block('NO_EXPLICIT_PHRASE');
      if (!backupVerified || selectedSource !== 'verified-backup') return block('NO_VERIFIED_SOURCE');
      if (typeof inspect !== 'function' || typeof authenticate !== 'function' || typeof withLock !== 'function') return block('UNSUPPORTED');
      const current = () => !cancelled && ticket === epoch;
      try {
        // A snapshot is only evidence, never proof of freshness outside this origin.
        audit.inspections++;
        const before = await inspect();
        if (!current()) return block('STALE_REQUEST');
        if (!before || before.status !== 'CONFLICT' || !before.bytes) return block('UNVERIFIABLE');
        const beforeDigest = fingerprint(before);
        audit.proofs++;
        const proved = await authenticate(); // mock proof; do not retain passwords.
        if (!current()) return block('STALE_REQUEST');
        if (proved !== true) return block('AUTH_FAILED');
        // This is a read-only reinspection under a cooperating lock, not a write.
        return await withLock(async () => {
          if (!current()) return block('STALE_REQUEST');
          audit.inspections++;
          const after = await inspect();
          if (!current()) return block('STALE_REQUEST');
          if (!after || after.status !== 'CONFLICT' || fingerprint(after) !== beforeDigest) return block('EVIDENCE_CHANGED');
          // No commit/delete/restore capability is exposed by this research gate.
          return Object.freeze({ state: 'READY_FOR_DESIGN_REVIEW', reason: 'READ_ONLY_RECHECK', fingerprint: beforeDigest });
        });
      } catch { return block('UNVERIFIABLE'); }
    },
  };
  // Explicitly reject any attempted injection of a destructive callback.
  if (onWrite !== undefined) throw Error('Research gate cannot accept a write callback');
  return gate;
}

const fixture = (overrides = {}) => {
  let evidence = { status: 'CONFLICT', bytes: 'synthetic-ciphertext-1', reset: 'pending', revision: 7 };
  const gate = createGate({
    inspect: async () => structuredClone(evidence),
    authenticate: async () => true,
    withLock: async action => action(),
    ...overrides,
  });
  const input = { phrase: PHRASE, backupVerified: true, selectedSource: 'verified-backup', locksAvailable: true };
  return { gate, input, setEvidence: value => { evidence = value; } };
};

test('unchanged synthetic evidence permits read-only design review, never mutation', async () => {
  const { gate, input } = fixture();
  const outcome = await gate.preview(input);
  assert.equal(outcome.state, 'READY_FOR_DESIGN_REVIEW');
  assert.equal(gate.audit.writes, 0);
  assert.equal(gate.audit.inspections, 2);
  assert.equal(gate.audit.proofs, 1);
  assert.equal(typeof gate.commit, 'undefined');
});

test('no Web Locks, missing phrase or unverified backup fail before inspection', async () => {
  for (const patch of [
    { locksAvailable: false }, { phrase: 'șterge datele locale' },
    { backupVerified: false }, { selectedSource: 'current-origin' },
  ]) {
    const { gate, input } = fixture();
    assert.equal((await gate.preview({ ...input, ...patch })).state, 'BLOCKED');
    assert.equal(gate.audit.inspections, 0);
    assert.equal(gate.audit.writes, 0);
  }
});

test('wrong authentication and denied storage do not expose a destructive action', async () => {
  const a = fixture({ authenticate: async () => false });
  assert.equal((await a.gate.preview(a.input)).reason, 'AUTH_FAILED');
  const b = fixture({ inspect: async () => { throw Error('SecurityError'); } });
  assert.equal((await b.gate.preview(b.input)).reason, 'UNVERIFIABLE');
  assert.equal(a.gate.audit.writes + b.gate.audit.writes, 0);
});

test('late archived writer invalidates the consent evidence even after proof', async () => {
  let n = 0;
  const { gate, input } = fixture({ inspect: async () => ({ status: 'CONFLICT', bytes: n++ ? 'late-legacy-write' : 'original', revision: 7 }) });
  assert.equal((await gate.preview(input)).reason, 'EVIDENCE_CHANGED');
  assert.equal(gate.audit.writes, 0);
});

test('cancellation while password proof is pending rejects late completion', async () => {
  let release;
  const { gate, input } = fixture({ authenticate: () => new Promise(resolve => { release = resolve; }) });
  const pending = gate.preview(input);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(typeof release, 'function');
  gate.cancel();
  release(true);
  assert.equal((await pending).reason, 'STALE_REQUEST');
  assert.equal(gate.audit.writes, 0);
});

test('second inspection supersedes first even if first proof finishes later', async () => {
  let firstRelease;
  let calls = 0;
  const { gate, input } = fixture({ authenticate: () => ++calls === 1 ? new Promise(resolve => { firstRelease = resolve; }) : Promise.resolve(true) });
  const first = gate.preview(input);
  await new Promise(resolve => setImmediate(resolve));
  const second = await gate.preview(input);
  assert.equal(second.state, 'READY_FOR_DESIGN_REVIEW');
  firstRelease(true);
  assert.equal((await first).reason, 'STALE_REQUEST');
  assert.equal(gate.audit.writes, 0);
});

test('evicted, missing or rolled-back evidence cannot be auto-initialized', async () => {
  for (const value of [null, { status: 'EMPTY' }, { status: 'UNKNOWN', bytes: 'x' }]) {
    const { gate, input } = fixture({ inspect: async () => value });
    assert.equal((await gate.preview(input)).reason, 'UNVERIFIABLE');
    assert.equal(gate.audit.writes, 0);
  }
});

test('a destructive callback cannot be injected into the research gate', () => {
  assert.throws(() => createGate({ onWrite() {} }), /cannot accept a write callback/);
});

test('negative boundary: fully rolled-back but internally consistent origin cannot prove freshness', async () => {
  const { gate, input } = fixture({ inspect: async () => ({ status: 'CONFLICT', bytes: 'authentic-but-old-revision-1', revision: 1 }) });
  // This passes the local consistency gate: it MUST NOT be treated as permission to erase.
  assert.equal((await gate.preview(input)).state, 'READY_FOR_DESIGN_REVIEW');
  assert.equal(gate.audit.writes, 0);
  assert.equal(typeof gate.commit, 'undefined');
});
