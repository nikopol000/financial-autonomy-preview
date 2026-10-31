'use strict';
// RESEARCH ONLY: not imported by the WEB bundle; no real vault keys or data.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const PHRASE = 'ȘTERGE DATELE LOCALE';
const fingerprint = evidence => createHash('sha256').update(JSON.stringify(evidence)).digest('hex');

function createGate({ inspect, authenticate, withLock, onWrite, timeoutMs = 15000 }) {
  let epoch = 0;
  let cancelled = false;
  let invalidateActive = null;
  const audit = { writes: 0, inspections: 0, proofs: 0 };
  const block = reason => Object.freeze({ state: 'BLOCKED', reason });
  const STALE = Symbol('STALE_REQUEST');
  const TIMEOUT = Symbol('TIMEOUT');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) throw Error('Invalid research timeout');
  const gate = {
    audit,
    cancel() {
      epoch++;
      cancelled = true;
      invalidateActive?.();
      invalidateActive = null;
    },
    async preview({ phrase, backupVerified, selectedSource, locksAvailable }) {
      const ticket = ++epoch;
      // Supersede an older pending inspection even when its IDB/lock promise
      // never settles. No operation in this gate has a write capability.
      invalidateActive?.();
      cancelled = false;
      let invalidate;
      const invalidated = new Promise(resolve => {
        invalidate = () => resolve(STALE);
      });
      invalidateActive = invalidate;
      let timer;
      let expired = false;
      const deadline = new Promise(resolve => {
        timer = setTimeout(() => { expired = true; resolve(TIMEOUT); }, timeoutMs);
      });
      const current = () => !cancelled && !expired && ticket === epoch;
      const wait = promise => Promise.race([Promise.resolve(promise), invalidated, deadline]);
      const interruption = (value, reason) =>
        value === STALE ? block('STALE_REQUEST') :
        value === TIMEOUT ? block(reason) : null;
      try {
        if (!locksAvailable) return block('NO_LOCKS');
        if (phrase !== PHRASE) return block('NO_EXPLICIT_PHRASE');
        if (!backupVerified || selectedSource !== 'verified-backup') return block('NO_VERIFIED_SOURCE');
        if (typeof inspect !== 'function' || typeof authenticate !== 'function' || typeof withLock !== 'function') return block('UNSUPPORTED');
        audit.inspections++;
        const before = await wait(inspect());
        const interruptedBefore = interruption(before, 'INSPECTION_TIMEOUT');
        if (interruptedBefore) return interruptedBefore;
        if (!current()) return block('STALE_REQUEST');
        if (!before || before.status !== 'CONFLICT' || !before.bytes) return block('UNVERIFIABLE');
        const beforeDigest = fingerprint(before);
        audit.proofs++;
        const proved = await wait(authenticate()); // mock proof; do not retain passwords.
        const interruptedProof = interruption(proved, 'PROOF_TIMEOUT');
        if (interruptedProof) return interruptedProof;
        if (!current()) return block('STALE_REQUEST');
        if (proved !== true) return block('AUTH_FAILED');
        const locked = await wait(withLock(async () => {
          if (!current()) return block('STALE_REQUEST');
          audit.inspections++;
          const after = await wait(inspect());
          const interruptedAfter = interruption(after, 'REINSPECTION_TIMEOUT');
          if (interruptedAfter) return interruptedAfter;
          if (!current()) return block('STALE_REQUEST');
          if (!after || after.status !== 'CONFLICT' || fingerprint(after) !== beforeDigest) return block('EVIDENCE_CHANGED');
          // This is never authorization to delete, reset, restore or migrate.
          return Object.freeze({ state: 'READY_FOR_DESIGN_REVIEW', reason: 'READ_ONLY_RECHECK', fingerprint: beforeDigest });
        }));
        return interruption(locked, 'LOCK_TIMEOUT') || locked;
      } catch {
        return block('UNVERIFIABLE');
      } finally {
        clearTimeout(timer);
        if (invalidateActive === invalidate) invalidateActive = null;
      }
    },
  };
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

test('cancelled while queued for a lock never performs the second inspection', async () => {
  let entered, release;
  const enteredLock = new Promise(resolve => { entered = resolve; });
  const heldLock = new Promise(resolve => { release = resolve; });
  const { gate, input } = fixture({
    withLock: async action => {
      entered();
      await heldLock;
      return action();
    },
  });
  const pending = gate.preview(input);
  await enteredLock;
  gate.cancel();
  release();
  assert.equal((await pending).reason, 'STALE_REQUEST');
  assert.equal(gate.audit.inspections, 1);
  assert.equal(gate.audit.proofs, 1);
  assert.equal(gate.audit.writes, 0);
  assert.equal(typeof gate.commit, 'undefined');
});

test('negative boundary: archived writer after final locked read is not fenced by a cooperating lock', async () => {
  let evidence = { status: 'CONFLICT', bytes: 'authenticated-synthetic-revision-7', revision: 7 };
  const { gate, input } = fixture({
    inspect: async () => structuredClone(evidence),
    // Models a cached v1 writer that does not participate in the v2 Web Lock.
    withLock: async action => {
      const result = await action();
      evidence = { ...evidence, bytes: 'noncooperating-v1-write-after-recheck', revision: 8 };
      return result;
    },
  });
  const outcome = await gate.preview(input);
  assert.equal(outcome.state, 'READY_FOR_DESIGN_REVIEW');
  assert.notEqual(outcome.fingerprint, fingerprint(evidence));
  assert.equal(gate.audit.inspections, 2);
  assert.equal(gate.audit.writes, 0);
  assert.equal(typeof gate.commit, 'undefined');
  // Passing this test demonstrates a LIMIT, not safe reset/restore authorization.
});

test('bounded pending IDB-like inspection fails closed and later result cannot authorize a write', async () => {
  let release;
  let calls = 0;
  const { gate, input } = fixture({
    timeoutMs: 30,
    inspect: () => ++calls === 1 ?
      new Promise(resolve => { release = resolve; }) :
      Promise.resolve({ status: 'CONFLICT', bytes: 'synthetic-retry', revision: 7 }),
  });
  const first = await gate.preview(input);
  assert.equal(first.reason, 'INSPECTION_TIMEOUT');
  assert.equal(gate.audit.inspections, 1);
  release({ status: 'CONFLICT', bytes: 'late-untrusted-result', revision: 7 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(gate.audit.writes, 0);
  assert.equal(typeof gate.commit, 'undefined');
  const retry = await gate.preview(input);
  assert.equal(retry.state, 'READY_FOR_DESIGN_REVIEW');
  assert.equal(gate.audit.writes, 0);
});

test('cancel immediately supersedes a never-settling lock without waiting for its release', async () => {
  let entered, release;
  const enteredLock = new Promise(resolve => { entered = resolve; });
  const heldLock = new Promise(resolve => { release = resolve; });
  const { gate, input } = fixture({
    timeoutMs: 5000,
    withLock: async action => { entered(); await heldLock; return action(); },
  });
  const pending = gate.preview(input);
  await enteredLock;
  gate.cancel();
  assert.equal((await pending).reason, 'STALE_REQUEST');
  assert.equal(gate.audit.inspections, 1);
  release();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(gate.audit.inspections, 1);
  assert.equal(gate.audit.writes, 0);
});

test('bounded lock timeout prevents late reinspection even if a legacy tab later releases it', async () => {
  let entered, release;
  const enteredLock = new Promise(resolve => { entered = resolve; });
  const heldLock = new Promise(resolve => { release = resolve; });
  const { gate, input } = fixture({
    timeoutMs: 30,
    withLock: async action => { entered(); await heldLock; return action(); },
  });
  const pending = gate.preview(input);
  await enteredLock;
  assert.equal((await pending).reason, 'LOCK_TIMEOUT');
  release();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(gate.audit.inspections, 1);
  assert.equal(gate.audit.writes, 0);
  assert.equal(typeof gate.commit, 'undefined');
});
