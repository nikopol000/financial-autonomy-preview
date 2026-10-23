'use strict';

// Conservative read-only eligibility gate for a FUTURE in-memory demo.
// NOT imported by the active v18.29 UI. A real/legacy/unknown storage footprint
// must never be mistaken for an empty browser or silently overwritten.
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
function inspectDemoEligibility(storage) {
  const blocked = reason => Object.freeze({ eligible:false, reason });
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.key !== 'function') {
    return blocked('storage-uninspectable');
  }
  try {
    // Presence, not truthiness: an empty/corrupt ciphertext is still user data.
    if (storage.getItem(KEY) !== null || storage.getItem(PAYLOAD) !== null) {
      return blocked('vault-present');
    }
    const count = storage.length;
    if (!Number.isSafeInteger(count) || count < 0) return blocked('storage-uninspectable');
    // Fail closed on unknown/legacy keys. Do not guess the old schema or delete it.
    for (let i=0; i<count; i++) {
      if (typeof storage.key(i) !== 'string') return blocked('storage-uninspectable');
      return blocked('other-storage-present');
    }
    // A second read reduces (but cannot eliminate) concurrent-tab races.
    if (storage.getItem(KEY) !== null || storage.getItem(PAYLOAD) !== null) {
      return blocked('vault-present');
    }
    return Object.freeze({ eligible:true, reason:'fresh-browser' });
  } catch {
    // Privacy: do not expose stored key names, values or exception messages.
    return blocked('storage-unavailable');
  }
}
module.exports = { inspectDemoEligibility };
