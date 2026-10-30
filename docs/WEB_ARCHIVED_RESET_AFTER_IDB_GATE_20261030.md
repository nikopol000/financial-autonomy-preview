# Archived WEB 18.27/18.33/18.34 reset after experimental v2 cutover — 2026-10-30

**P1 research/test only — #4, #29, #35.** WEB 18.64 remains unchanged. This test invokes the **actual archived Metro module 309** `resetData()` and the actual module 310 `clearWebVault()` for each archived release, using disposable Chromium browser contexts and synthetic version-4 ledgers. It does not use or modify user data, production IndexedDB, encrypted backup files, financial formulas or iOS.

## Reproduction and expected outcomes

For each version, an archived v1 tab first saves an authenticated AES-GCM KEY/PAYLOAD pair; a second tab migrates a copy into the test-only atomic IndexedDB authority/witness, without deleting the v1 original. The archived tab then executes its real `resetData()` while the experimental v2 witness exists. Two paths are exercised:

| Archived version | Real v1 reset path | Expected v1 after | Expected experimental v2 |
| --- | --- | --- | --- |
| 18.27, 18.33, 18.34 | Complete reset | KEY absent, PAYLOAD absent | Authority and witness byte-for-byte unchanged |
| 18.27, 18.33, 18.34 | Synthetic `SecurityError` on KEY removal, after PAYLOAD removal | KEY retained, PAYLOAD absent | Authority and witness byte-for-byte unchanged |

In both paths, the **read-only v1/v2 conflict classifier must return `unknown` after reload**; the independent v2 operation acknowledgment can still authenticate its own state, but that does not prove the user intended to keep it after a legacy reset. The archived reset does not write an authenticated reset epoch; a later v1 fallback or automatic v2 resurrection would be unsafe. The synthetic error is deliberately injected into `Storage.prototype.removeItem` and restored in `finally`; it is **not evidence of a real browser failure**. The research classifier still accepts an unauthenticated caller-supplied baseline and MUST NOT be used as a production authority gate.

## Alternatives and recommendation

1. **Auto-reopen the v2 ledger after v1 reset:** reject. A legacy tab may have intentionally deleted its data; reopening v2 without explanation can resurrect apparently deleted financial information.
2. **Delete v2 whenever the legacy pair disappears:** reject. A partial reset may have lost the only v1 PAYLOAD while v2 is the sole intact encrypted copy.
3. **Assume that the valid v2 witness is newer and authoritative:** reject. Authentication proves content integrity, not global recency, user reset intent, or protection against whole-origin rollback.
4. **Quarantine both footprints, explain uncertainty, offer read-only inspection and explicit user-controlled recovery after a reviewed contract:** preferred. Do not automatically replay, merge, delete, reset, rekey or select either register.

## Acceptance blockers and next step

- Confirm the exact PR-head Chromium job prints **six named archived reset PASS lines**, in addition to existing archived late-writer and rollback gates. Run Release CI and merged-main CI independently. No claims of success without logs.
- Next test: IDB denial/transaction abort at an explicitly designed reset boundary, stale archived writer **after** reset, and reset-epoch provenance. Distinguish an intentional complete reset from an interrupted one without relying on an unauthenticated marker.
- Before production integration, specify safe cross-version migration, an authenticated authority/reset protocol, user-visible no-write recovery, missing/evicted IDB, whole-origin rollback limitations, and real Safari iPhone/VoiceOver acceptance. Keep #4/#29/#35 open.
- Keep #14 and #25 numeric semantics in DISCOVERY pending explicit approval.

References: [IndexedDB transaction atomicity](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [prior reset journal/rollback gate](WEB_RESET_JOURNAL_ORIGIN_ROLLBACK_GATE_20261030.md).
