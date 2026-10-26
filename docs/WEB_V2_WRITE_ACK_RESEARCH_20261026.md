# WEB v2 single-record research — uncertain write acknowledgement (issue #35)

Date: 2026-10-26. **RESEARCH ONLY — not a production migration or a WEB version change.**

## Why this case matters

The current WEB 18.54 vault stores KEY and AES-GCM PAYLOAD separately. A hypothetical single-record v2 envelope can remove the *between-two-writes* first-save gap, but it cannot prove whether a storage call committed when an injected `setItem` writes its value and then throws. One-key atomicity and acknowledgement/durability are different guarantees. No actual browser failure is claimed.

The existing `tests/vault-v2-first-write-prototype.cjs` is deliberately isolated from the product and uses the **real immutable bundled AES-GCM**. Two new deterministic scenarios extend its failure model:

| Fault | Persisted result | Required safe behavior |
| --- | --- | --- |
| Initial v2 `setItem` commits, then reports an error | One complete authenticated v2 record, no orphaned KEY | Reload/read-only verification may authenticate it; a second initial write with expected revision `null` must reject as stale, with zero writes. |
| Update v2 `setItem` commits, then reports an error | Newer authenticated ledger is already present | The stale tab's old expected revision must reject; no rollback or blind replay of the old state. |

The prototype does **not** implement a safe product retry button. A future UI must distinguish: (a) a confirmed successful write, (b) an error with an exact authenticated already-committed record, and (c) a missing/changed/unauthenticated record or denied read. In (c), fail closed. An error alone is not permission to overwrite.

## Unresolved blockers before any migration

1. **Cached legacy writers and split-brain:** existing v1 tabs may create KEY/PAYLOAD while a new v2 record exists. A reset/epoch fence must prevent this without reviving data after an intentional reset; see existing `vault-v2-first-write-prototype.cjs` and `vault-reset-fencing-prototype.cjs` unsafe characterizations.
2. **Crash and reset provenance:** stage-only states can represent interrupted first-save or a reset performed by an older client. Do not automatically promote a stage when provenance is ambiguous. KEY-only after reload remains quarantined.
3. **Concurrency:** any v2 compare-and-set must remain under an origin-wide Web Lock; `localStorage` alone is not a multi-tab transaction. Unsupported Web Locks must fail closed for financial writes.
4. **Migration/rollback:** validate old AES-GCM and ledger schema before staging; never delete the last authenticated legacy record before an unambiguous committed transition; do not repurpose `committed-v1` reset semantics. Account for browser storage denial, quota and crash/reload at every transition.
5. **Compatibility:** encrypted backup import/export, diagnostics, demo isolation, no plaintext persistence, accessibility, and previously published immutable bundles need dedicated tests.

## Evidence gate

The new tests run under the existing Release CI research-only v2 prototype step. Their result must be confirmed from the exact commit's CI logs before marking them PASS. This is synthetic Node/VM fault injection with real bundled AES-GCM, not real Safari/iPhone, browser power-loss durability or a user incident.

**Recommendation:** keep WEB 18.54 storage format and KEY-only fail-closed behavior unchanged. Advance a versioned v2 migration only after a separate approved storage contract, complete fault matrix and browser verification. No change to budget formulas or issue #14; no iOS changes.
