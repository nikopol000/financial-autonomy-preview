'use strict';
// RESEARCH-ONLY contract oracle. Never imported by the WEB product.
// This reads synthetic localStorage footprints; it neither decrypts nor writes.
// Passing these tests does NOT establish browser atomicity, crash durability,
// Safari compatibility, or approval of a v2 migration/recovery UI.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const KEYS = Object.freeze({
  key: 'financial-autonomy.preview.key.v1',
  payload: 'financial-autonomy.preview.payload.v1',
  reset: 'financial-autonomy.preview.reset.v1',
  stage: 'financial-autonomy.preview.stage-research.v2',
  v2: 'financial-autonomy.preview.atomic-prototype.v2'
});
const COMMITTED_RESET = 'committed-v1';
const IDLE_V2 = /^idle-v2:[0-9a-f]{32}$/;
const PENDING_V2 = /^pending-v2:[0-9a-f]{32}$/;

function inspectReadOnly(storage) {
  const bytes = {};
  try {
    for (const [name, key] of Object.entries(KEYS)) bytes[name] = storage.getItem(key);
  } catch (_) {
    return { state: 'STORAGE_UNREADABLE', automaticRecovery: false };
  }
  const has = name => bytes[name] !== null;
  // Deliberately never parse or return secret/ciphertext bytes.
  let state;
  const marker = bytes.reset;
  const idle = typeof marker === 'string' && IDLE_V2.test(marker);
  const pending = typeof marker === 'string' && PENDING_V2.test(marker);
  // WEB 18.50 retains a durable idle-v2 reset generation. This is not an
  // unknown marker, nor proof of a never-used browser. It never authorizes
  // this research oracle to initialize, migrate, replay or delete records.
  if (has('reset') && marker !== COMMITTED_RESET && !idle && !pending)
    state = 'UNKNOWN_RESET';
  else if (marker === COMMITTED_RESET || pending)
    state = 'RESET_IN_PROGRESS';
  else if (idle) {
    if (has('stage') || has('v2')) state = 'POST_RESET_CONFLICT';
    else if (has('key') && has('payload')) state = 'POST_RESET_V1_PAIR_UNVERIFIED';
    else if (has('key')) state = 'POST_RESET_KEY_ONLY_AMBIGUOUS';
    else if (has('payload')) state = 'POST_RESET_PAYLOAD_ONLY_AMBIGUOUS';
    else state = 'RESET_COMPLETED_EMPTY';
  }
  else if (has('stage') && (has('key') || has('payload') || has('v2'))) state = 'STAGE_CONFLICT';
  else if (has('v2') && (has('key') || has('payload'))) state = 'DUAL_AUTHORITY';
  else if (has('stage')) state = 'STAGE_ONLY_AMBIGUOUS';
  else if (has('v2')) state = 'V2_ONLY_UNAPPROVED';
  else if (has('key') && !has('payload')) state = 'KEY_ONLY_AMBIGUOUS';
  else if (!has('key') && has('payload')) state = 'PAYLOAD_ONLY_AMBIGUOUS';
  else if (has('key') && has('payload')) state = 'V1_PAIR_PRESENT_UNVERIFIED';
  else state = 'EMPTY';
  return { state, automaticRecovery: false };
}

function manualRecoveryRoute({backupValidated, isolatedProfile, explicitConsent}) {
  // This is guidance, NOT a backup reader, restore implementation, or mutation.
  return backupValidated === true && isolatedProfile === true && explicitConsent === true
    ? 'USE_EXISTING_RESTORE_UI_IN_SEPARATE_PROFILE'
    : 'PRESERVE_ORIGINAL_AND_REQUEST_VERIFIED_BACKUP';
}

function fixture(present, options = {}) {
  const values = new Map(Object.entries(KEYS).filter(([name]) => present.includes(name))
    .map(([name, key]) => [key, name === 'reset' ? (options.resetValue || COMMITTED_RESET) : 'synthetic-encrypted-placeholder']));
  const before = new Map(values);
  let writes = 0;
  const storage = {
    getItem(key) {
      if (options.deniedKey === key) throw new Error('SecurityError');
      return values.has(key) ? values.get(key) : null;
    },
    setItem() { writes++; throw new Error('Forbidden write in research oracle'); },
    removeItem() { writes++; throw new Error('Forbidden deletion in research oracle'); }
  };
  return {storage, assertUnchanged() {
    assert.equal(writes, 0, 'No write or deletion permitted');
    assert.deepEqual([...values.entries()], [...before.entries()], 'Every original byte must remain unchanged');
  }};
}

const cases = [
  ['empty profile', [], 'EMPTY'],
  ['existing v1 pair', ['key','payload'], 'V1_PAIR_PRESENT_UNVERIFIED'],
  ['orphan key after first payload failure', ['key'], 'KEY_ONLY_AMBIGUOUS'],
  ['payload without key', ['payload'], 'PAYLOAD_ONLY_AMBIGUOUS'],
  ['F08 stage-only after old-tab reset OR interrupted stage', ['stage'], 'STAGE_ONLY_AMBIGUOUS'],
  ['F09 old tab writes v1 beside v2', ['key','payload','v2'], 'DUAL_AUTHORITY'],
  ['v2 alone still unapproved', ['v2'], 'V2_ONLY_UNAPPROVED'],
  ['stage and v2 coexist', ['stage','v2'], 'STAGE_CONFLICT'],
  ['stage and v1 coexist', ['stage','key','payload'], 'STAGE_CONFLICT'],
  ['reset journal plus v1 pair', ['reset','key','payload'], 'RESET_IN_PROGRESS'],
  ['reset journal plus stage', ['reset','stage'], 'RESET_IN_PROGRESS'],
  ['reset journal alone', ['reset'], 'RESET_IN_PROGRESS'],
  ['v1 key and v2', ['key','v2'], 'DUAL_AUTHORITY'],
  ['v1 payload and v2', ['payload','v2'], 'DUAL_AUTHORITY']
];
for (const [label, present, expected] of cases) {
  test('research quarantine: ' + label, () => {
    const f = fixture(present);
    const decision = inspectReadOnly(f.storage);
    assert.deepEqual(decision, {state: expected, automaticRecovery: false});
    f.assertUnchanged();
  });
}
// WEB 18.50 reset-epoch footprint classification. All cases remain read-only;
// even a valid idle marker never grants automatic first-save recovery (#35).
const EPOCH = 'a'.repeat(32);
const epochCases = [
  ['completed reset with no vault', ['reset'], 'RESET_COMPLETED_EMPTY', 'idle-v2:' + EPOCH],
  ['first-save orphan key after reset', ['reset','key'], 'POST_RESET_KEY_ONLY_AMBIGUOUS', 'idle-v2:' + EPOCH],
  ['missing key after reset', ['reset','payload'], 'POST_RESET_PAYLOAD_ONLY_AMBIGUOUS', 'idle-v2:' + EPOCH],
  ['complete v1 pair after reset', ['reset','key','payload'], 'POST_RESET_V1_PAIR_UNVERIFIED', 'idle-v2:' + EPOCH],
  ['research stage after reset', ['reset','stage'], 'POST_RESET_CONFLICT', 'idle-v2:' + EPOCH],
  ['research v2 after reset', ['reset','v2'], 'POST_RESET_CONFLICT', 'idle-v2:' + EPOCH],
  ['interrupted v2 reset before deletion', ['reset','key','payload'], 'RESET_IN_PROGRESS', 'pending-v2:' + EPOCH],
  ['interrupted v2 reset after deletion', ['reset'], 'RESET_IN_PROGRESS', 'pending-v2:' + EPOCH]
];
for (const [label, present, expected, resetValue] of epochCases) {
  test('WEB 18.50 read-only epoch: ' + label, () => {
    const f = fixture(present, {resetValue});
    assert.deepEqual(inspectReadOnly(f.storage), {state:expected, automaticRecovery:false});
    f.assertUnchanged();
  });
}
for (const bad of ['idle-v2:bad','pending-v2:bad','idle-v2:'+'A'.repeat(32),
  'pending-v2:'+'b'.repeat(31),'idle-v2:'+'c'.repeat(33)]) {
  test('malformed reset generation remains unknown: '+bad.slice(0,22), () => {
    const f=fixture(['reset','key'],{resetValue:bad});
    assert.deepEqual(inspectReadOnly(f.storage),
      {state:'UNKNOWN_RESET',automaticRecovery:false});
    f.assertUnchanged();
  });
}
test('denied WEB 18.50 idle marker read never authorizes recovery', () => {
  const f=fixture(['reset','key'],{resetValue:'idle-v2:'+EPOCH,deniedKey:KEYS.reset});
  assert.deepEqual(inspectReadOnly(f.storage),
    {state:'STORAGE_UNREADABLE',automaticRecovery:false});
  f.assertUnchanged();
});

test('unknown future reset marker never authorizes recovery', () => {
  const f = fixture(['reset','key','payload'], {resetValue:'future-v99'});
  assert.equal(inspectReadOnly(f.storage).state, 'UNKNOWN_RESET');
  f.assertUnchanged();
});
test('storage read permission denial never authorizes recovery', () => {
  const f = fixture(['key','payload'], {deniedKey:KEYS.payload});
  assert.deepEqual(inspectReadOnly(f.storage), {state:'STORAGE_UNREADABLE',automaticRecovery:false});
  f.assertUnchanged();
});
test('manual recovery requires three independent explicit conditions', () => {
  for (let mask=0;mask<8;mask++) {
    const route=manualRecoveryRoute({
      backupValidated:Boolean(mask&1),
      isolatedProfile:Boolean(mask&2),
      explicitConsent:Boolean(mask&4)
    });
    assert.equal(route,mask===7?'USE_EXISTING_RESTORE_UI_IN_SEPARATE_PROFILE':'PRESERVE_ORIGINAL_AND_REQUEST_VERIFIED_BACKUP');
  }
});
test('no ciphertext, key or reset value is ever returned by classifier', () => {
  const f=fixture(['key','payload','stage','v2','reset']);
  const result=inspectReadOnly(f.storage);
  assert.deepEqual(Object.keys(result).sort(),['automaticRecovery','state']);
  assert.equal(JSON.stringify(result).includes('synthetic-encrypted-placeholder'),false);
  f.assertUnchanged();
});
