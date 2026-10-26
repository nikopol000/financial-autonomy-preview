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

## Additional deterministic concurrency characterization (2026-10-26)

The v2 prototype also tests an **interleaved compare-then-set without Web Locks**. Two synthetic tabs read the same authenticated v2 revision. Tab A passes its revision check; before its `setItem`, Tab B checks the same revision and commits its own transaction. Tab A then commits a complete but stale v2 record. **Both writes return successfully and B's transaction disappears.** The named `KNOWN UNSAFE` test intentionally passes when it reproduces this loss; PASS is *evidence of a residual hazard*, not a successful mitigation. The test uses the actual bundled AES-GCM with deterministic synchronous interleaving in Node/VM; it does not prove a particular browser's scheduling.

A single localStorage record eliminates the *two-key torn write*, but does not provide an atomic compare-and-swap. **Required production contract:** all real ledger save/reset/migration transitions must acquire the same origin-wide exclusive Web Lock before reading/validating the expected revision and writing; if Web Locks are unavailable, fail closed with a visible read-only explanation. Recheck the revision **inside** the lock. This serializes cooperating current tabs only: cached legacy clients, direct module calls and external storage deletion remain separate unresolved threats. Do not silently merge transactions or treat the single-record format as sufficient to close #4 or #35.

**Verification (candidate only):** [Release CI 40408953368](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40408953368) SUCCESS, named interleaved `KNOWN UNSAFE` test PASS and **47/47** v2 prototype tests PASS (0 failures). [PR #131](https://github.com/nikopol000/financial-autonomy-preview/pull/131) merged as `4a7961c963c103d2754b7498f3919fa4309a7d25`. This confirms the deterministic hazard, not a fixed race or an actual browser incident. Exact merged-main CI/Pages and Vercel served browser are separate verification gates.

## Unresolved blockers before any migration

1. **Cached legacy writers and split-brain:** existing v1 tabs may create KEY/PAYLOAD while a new v2 record exists. A reset/epoch fence must prevent this without reviving data after an intentional reset; see existing `vault-v2-first-write-prototype.cjs` and `vault-reset-fencing-prototype.cjs` unsafe characterizations.
2. **Crash and reset provenance:** stage-only states can represent interrupted first-save or a reset performed by an older client. Do not automatically promote a stage when provenance is ambiguous. KEY-only after reload remains quarantined.
3. **Concurrency:** any v2 compare-and-set must remain under an origin-wide Web Lock; `localStorage` alone is not a multi-tab transaction. Unsupported Web Locks must fail closed for financial writes.
4. **Migration/rollback:** validate old AES-GCM and ledger schema before staging; never delete the last authenticated legacy record before an unambiguous committed transition; do not repurpose `committed-v1` reset semantics. Account for browser storage denial, quota and crash/reload at every transition.
5. **Compatibility:** encrypted backup import/export, diagnostics, demo isolation, no plaintext persistence, accessibility, and previously published immutable bundles need dedicated tests.

## Evidence gate

The new tests run under the existing Release CI research-only v2 prototype step. Their result must be confirmed from the exact commit's CI logs before marking them PASS. This is synthetic Node/VM fault injection with real bundled AES-GCM, not real Safari/iPhone, browser power-loss durability or a user incident.

**Recommendation:** keep WEB 18.54 storage format and KEY-only fail-closed behavior unchanged. Advance a versioned v2 migration only after a separate approved storage contract, complete fault matrix and browser verification. No change to budget formulas or issue #14; no iOS changes.

## 2026-10-27 — exclusive-lock compare-and-set research (not a product migration)

**Independent checkpoint evidence:** exact previous `main` HEAD `de9f290e9bed503ffc2d4e7b0ae716e7c27b8ef8` has [Release CI 40409299621](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40409299621), [Pages workflow 40409299629](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40409299629) and [Pages build 40409300063](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40409300063) all **SUCCESS**. This closes the previous *merged-main CI* verification debt only; Vercel still reports `build-rate-limit` and served Safari/UI remain unverified.

The new **research-only** tests in `tests/vault-v2-first-write-prototype.cjs` contrast the existing **KNOWN UNSAFE** unguarded interleaving with a hypothetical *cooperating new-tab* protocol. A deterministic asynchronous exclusive-lock queue holds tab A while tab B queues an update from the same authenticated revision. A commits; B then re-reads the revision **inside** the lock and is rejected with zero additional writes. A second test rejects both missing and denied Web Locks without falling back to an unguarded write. A third checks that a rejected stale operation releases the queue so a later valid revision can save. Tests use actual bundled AES-GCM with synthetic localStorage and simulated Web Locks. **CI confirmation pending until the candidate run is inspected**; no Safari, real browser concurrency or storage durability claim.

**Boundary:** this does *not* prove migration safety. The existing actual legacy v1 writer can ignore a v2 envelope; an older reset can remove a proposed v1-key fence, and a stage-only record can be indistinguishable from an intentional old-client reset. Even a correct exclusive lock protects only clients participating in the same protocol. A safe production v2 contract must first specify a monotonic reset generation/epoch, legacy tab fencing that survives a reset, authenticated stage promotion and rollback, failure at each read/write/remove, and what to do when the old client cannot be fenced. Until that contract is testable, keep WEB 18.54 and KEY-only fail-closed behavior. No financial formulas, #14 modes, real vaults, backups or iOS are changed.

**Proposed acceptance matrix for future research (not approval to implement):** (1) two new tabs competing from same revision, (2) missing/denied lock, (3) cached v1 tab saving/resetting during v2 migration, (4) crash after stage but before fence, (5) crash after fence but before activation, (6) reset before/after activation, (7) write-then-throw at each stage, (8) denied/corrupt marker read, (9) repeated reset and new ledger creation, (10) fresh load and reload with stale tabs. For each case assert exact ciphertext/marker bytes, number of writes, absence of unintended resurrection, and explicit user-visible blocked state. Do not auto-delete a legacy footprint or interpret unknown provenance as a clean vault.
