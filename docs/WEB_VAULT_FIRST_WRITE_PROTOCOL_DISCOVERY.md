# WEB vault first-save protocol — discovery and safety contract (2026-10-25)

**Status: RESEARCH / NOT APPROVED FOR PRODUCT ACTIVATION.** Scope: WEB preview only, issue #35, with #29 reset and #4 concurrency as dependencies. Active immutable product v18.45 remains unchanged. This document is a decision record and test contract, **not** a migration or a claim of physical durability.

## Verified starting point

- Actual WEB module 310, `saveWebVault`: first save writes `financial-autonomy.preview.key.v1` then `financial-autonomy.preview.payload.v1`. A failed payload write can leave KEY-only; the current reader refuses to replace it.
- Actual WEB module 310, `clearWebVault`: reset journal `financial-autonomy.preview.reset.v1=committed-v1`, then remove PAYLOAD, KEY, journal. The marker is a destructive intent, not a recoverable encrypted copy.
- Actual WEB module 309: real saves/reset require an exclusive Web Lock and compare the loaded key/payload/reset revision. An **already-open older bundle** need not respect a new marker, schema, or Web Lock protocol.
- Chromium fault injection reproduces KEY-only on a failed first payload write. The existing backup-in-a-separate-profile path is tested with **synthetic** populated data; it does not repair KEY-only in place.

## Non-negotiable invariants

1. A KEY-only state is **ambiguous**: it can be an interrupted initial write **or** a formerly valid ciphertext removed externally/partially. No automatic deletion, rekeying, reinitialization or reset from this observation alone.
2. Never infer that a reset was authorized from a staged first-write record. A reset can be committed by a legacy tab that does not understand the new record. **Do not automatically resurrect ciphertext after an intentional reset.**
3. Preserve every existing encrypted byte until a new state is independently validated and the transition has an unambiguous authorization. Never treat available credit as owned cash; no financial formula or schema change is part of this work.
4. Web Locks serialize **cooperating** tabs only. A new tab cannot prove that an older tab is absent; BroadcastChannel/presence heartbeats are advisory and may miss suspended/background tabs.
5. An exception from `localStorage.setItem` is not proof that the value was not written; test *write-then-throw* as well as *throw-before-write*. `getItem`/journal reads may also throw. Physical power loss and browser storage eviction remain distinct from injected API faults.
6. A migration cannot silently choose between diverging legacy and new records. Preserve both, fail closed, expose a recovery decision path with explicit provenance and a verified backup. Do not silently merge transactions.

## Alternatives evaluated

| Candidate | Benefit | Critical limitation | Recommendation |
| --- | --- | --- | --- |
| A. Compensating deletion of KEY on failed first PAYLOAD write | Small code change; can repair simple quota fault in one tab | Rollback may fail; a legacy tab can write concurrently; write-then-throw means PAYLOAD may actually exist. Deleting KEY could destroy the only decryption key. | **Reject as guaranteed repair.** Do not auto-delete. |
| B. Stage a second encrypted pair and auto-promote on reload | Can survive interrupted writes if stage is intact | Old tabs do not honor stage/reset; stage can resurrect data intentionally erased. Multiple localStorage writes are not a transaction. | **Reject auto-promotion while legacy tabs are possible.** |
| C. New single-record authenticated envelope for fresh vaults | One `setItem` contains key metadata + ciphertext; no cross-key KEY-only state on fresh writes | New record conflicts with legacy two-key readers/writers; write success is not physical-durability proof. An already-open legacy tab may create a second authoritative ledger. | **Investigate in isolation**, gated rollout with conflict detection; no silent migration. |
| D. Keep legacy reader fail-closed, improve explicit recovery and backups | No new destructive behavior; preserves ambiguous originals | Does not automatically repair first-save failures; requires an existing backup for recovery of populated data | **Preferred interim policy**, already partially supported by v18.45 UI and synthetic browser tests. |

A single-record envelope does **not** make the encryption key secret from the local origin: the current architecture stores the key locally. Security claims must not be expanded merely because the two fields are co-located.

## Proposed bounded next experiment (test-only, not production)

Prototype a **fresh-profile-only** v2 single-record envelope in a separate module/test harness, without changing active `index.html` or module 309/310. On each read and write, inspect both v1 and v2 footprints; if both are present, **fail closed without writes** and preserve all records. Do not auto-migrate existing v1 data, delete a v1 orphan, or auto-replay v2 after a v1 reset. Prove behavior with an old-version tab running the real v18.45 module simultaneously, not merely a simulated writer. If safe coexistence cannot be demonstrated, keep v2 disabled and retain the documented recovery path.

This is an **experiment direction**, not approval to activate a new vault format. Any activation requires a reviewed security/data-lifecycle contract, explicit migration and rollback rules, an immutable versioned release and end-to-end browser acceptance.

## Mandatory acceptance vectors before activation

| ID | Synthetic initial state / fault | Required outcome |
| --- | --- | --- |
| F01 | Fresh; KEY write throws before mutation | No KEY/PAYLOAD; retry possible after permission recovery. |
| F02 | Fresh; PAYLOAD write throws before mutation | Current v1 KEY-only is preserved/blocked; never auto-delete. |
| F03 | Fresh; PAYLOAD writes successfully **then throws** | Reload decrypts the valid pair; no rollback of KEY. |
| F04 | Existing authenticated pair; any read fails | No mutation, no replacement, permission recovery returns same ledger. |
| F05 | Existing pair; unknown reset marker | Load/save/reset blocked; marker and encrypted bytes preserved after reload. |
| F06 | Existing pair; reset-marker read denied | Load/save/reset blocked, zero writes; permission recovery safe. |
| F07 | Committed reset; PAYLOAD or KEY deletion denied | Journal persists, reload completes authorized reset; no resurrection. |
| F08 | Legacy tab reset after new staging, then new tab reloads | **Never** auto-restore staged data erased intentionally by legacy reset. |
| F09 | Legacy tab writes v1 while a v2 candidate exists | Preserve both; detect ambiguity, no silent choice/merge/deletion. |
| F10 | Two cooperating tabs with Web Locks; stale revision | Serialized; stale writer rejected without writes; fresh reload allowed. |
| F11 | No Web Locks / denied storage / quota / corrupt ciphertext | Fail closed; no destructive fallback or guessed initialization. |
| F12 | Wrong-password, tampered backup, separate clean profile | No writes on invalid backup; explicit confirmed restore survives reload; original profile untouched. |
| F13 | Browser crash / power loss / eviction | Separate real-browser/durability investigation; do not claim proven from fault injection. |

## Decision and continuation

**Decision for this run:** retain v18.45 fail-closed behavior; no automatic orphan-key cleanup or staging replay. Extend Chromium coverage for F05/F06 (issue #29) and then F01/F03 plus F08/F09 in an isolated prototype. Prioritize user data integrity over convenience. A commercial release needs an explicit explanation of recovery limitations and Safari/iPhone tests. The issue #14 budget perspectives remain a separate unapproved financial-contract discovery and are **not** part of vault work.
