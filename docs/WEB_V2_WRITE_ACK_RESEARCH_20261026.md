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


## 2026-10-27 — fenced activation acknowledgement and cached legacy reset (research-only)

Three deterministic additions to `tests/vault-v2-first-write-prototype.cjs` exercise a *hypothetical* already-authenticated staged envelope with a v1 fence:

1. **Activation commits, then throws:** the full v2 ciphertext is already present although the API reports an error. A subsequent check must authenticate the identical staged bytes and return without writing again; the stage and fence are preserved.
2. **Conflicting v2 after uncertain acknowledgement:** if the v2 slot changes before the retry, the staged ciphertext must **not** be replayed over it. Quarantine all records without writes.
3. **KNOWN UNSAFE — direct cached legacy reset after activation:** the actual bundled legacy `clearWebVault` removes the v1 fence while leaving the v2 ciphertext untouched. The conservative `recoverFencedStage` rejects this footprint, but a naive v2-only reader could still open data intentionally reset by the user. The test deliberately demonstrates an **unresolved hazard**, not a mitigation.

These are Node/VM fault-injection tests with actual bundled AES-GCM and synthetic storage. They do not prove Safari durability, actual tab lifecycle, or that a v2 migration is safe. The tested guard is prototype-only and is **not** wired into WEB 18.54.

**Decision gate before any shipping v2:** define a reset/epoch protocol respected by every client capable of writing the same ledger, including cached old bundles, or explicitly block migration while those clients can still write. Web Locks alone do not make legacy clients understand new v2/reset keys. Never auto-promote a stage-only record, delete an ambiguous key, restore after intentional reset, or silently overwrite an active record.

**Next test:** real Chromium two-tab lifecycle using actual Web Locks and a staged migration test harness, followed by an exhaustive crash matrix at each staging/fence/activation/reset boundary. Record exact CI proof before counting these new cases as passing.


## 2026-10-27 — real Chromium two-tab Web Locks and cached reset research (no product activation)

[PR #137](https://github.com/nikopol000/financial-autonomy-preview/pull/137) adds `tests/browser-v2-locks-research.cjs` to the existing Chromium workflow. This uses **two real tabs in one disposable localhost browser context**, actual `navigator.locks`, `localStorage`, native `StorageEvent` and browser `crypto.subtle` AES-GCM. Unlike the earlier Node/VM tests, the lock queue and storage events are exercised in Chromium; **unlike production tests**, this is a self-contained hypothetical v2 harness, **not** the bundled vault implementation.

- **Guarded race:** tab A holds an exclusive origin-wide lock; tab B queues from the same expected revision. After A writes, B rechecks *inside* the lock and rejects as stale, with zero writes. A subsequent B save from the current revision succeeds. A real cross-tab `StorageEvent` is observed.
- **KNOWN UNSAFE unguarded race:** two tabs pass a pre-write check, pause, and then write in the opposite order. Both report success; tab B's synthetic transaction is lost. A PASS here demonstrates a real browser scheduling hazard, **not** a fix.
- **KNOWN UNSAFE cached-reset analogue:** a legacy-style reset removes v1 KEY/PAYLOAD/RESET but does not know about the hypothetical v2 key. The v2 ciphertext remains decryptable. A research-only guarded reader refuses the now-absent fence, whereas a naive v2-only reader would expose reset data.

Candidate [Chromium CI 40429966347](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40429966347) **SUCCESS** with all five named PASS lines. Candidate [Release CI 40429966447](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40429966447) **SUCCESS**. Merged research commit: `cdd09d106849eeacfc5a765cd78d241d4c89ed91`. Exact merged-main checks must be verified separately.

**Remaining production blockers:** old cached clients do not participate in v2 fencing, reset provenance is ambiguous, and Web Locks protect only cooperating tabs. This test does not establish power-loss durability, browser compatibility beyond tested Chromium, safe stage promotion, Safari iPhone behavior or permission to migrate. Keep active WEB **18.54** unchanged and fail closed on ambiguous KEY-only/stage-only/reset footprints. No user data, encrypted backup, formula, iOS or backend change.


## 2026-10-27 — Chromium native AES-GCM acknowledgement-fault matrix (research-only)

Candidate `tests/browser-v2-locks-research.cjs` extends the existing disposable localhost two-tab Chromium harness. It exercises two synthetic failures **inside the same origin-wide exclusive Web Lock** with native browser `crypto.subtle`, localStorage and a real second-tab read. This does not call the product's v1 vault or activate a v2 schema.

| Fault injection | Expected persisted bytes | Safe interpretation |
| --- | --- | --- |
| Error **before** `setItem` | Identical authenticated ciphertext and revision; zero writes | No commit observed. The application must not infer a new successful save. |
| Error **after** `setItem` | New complete authenticated ciphertext is visible in another tab, even though caller received an error | Treat the acknowledgement as uncertain; authenticate the exact current bytes read-only. A retry using the old revision is stale and must perform **zero** writes. |

This test is deliberately about **acknowledgement**, not crash durability or atomic multi-key migration. Authentication of current bytes does not prove persistence after power loss. It does not establish safe recovery from a KEY-only v1 footprint, stage-only v2, cached legacy reset, or stale tab outside the lock. The earlier `KNOWN UNSAFE` legacy reset test remains a migration blocker: v2 ciphertext can remain decryptable after an old client intentionally resets v1. Any reader ignoring the missing fence can resurrect deleted data. **Do not ship v2 migration until the legacy compatibility/reset epoch contract is proven or migration is explicitly blocked for incompatible clients.**

**Verification gate:** candidate CI must show both new named Chromium PASS messages; merged-main Chromium and Release CI must be checked independently. Research-only; no product bundle/version, financial formulas, actual ledger, backup, iOS or backend changes.


### Verification update — 2026-10-27

- [PR #139](https://github.com/nikopol000/financial-autonomy-preview/pull/139) merged as `97647c3a446fd0ffa52d6926172d09abfe4007ed`. Candidate [Chromium 40436105930](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436105930) **SUCCESS**, log contains both named fault PASS lines; [Release CI 40436106044](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436106044) **SUCCESS**. Exact #139 merged-main [Chromium 40436250327](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436250327), [Release 40436250426](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436250426), [Pages workflow 40436250561](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436250561), [Pages build 40436249514](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436249514) all **SUCCESS**.
- [PR #140](https://github.com/nikopol000/financial-autonomy-preview/pull/140) merged as `12dd1d81c358a326518185bbecec9f6adf3836b3`, adding explicit write-counter assertions. Candidate [Chromium 40436308730](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436308730) **SUCCESS** with both named fault PASS lines, and [Release CI 40436308775](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40436308775) **SUCCESS**. Exact merged-main checks pending at documentation edit time; verify separately.
- Combined Vercel status for both research merges reports `build-rate-limit`; **do not claim production READY or served-browser acceptance**. The browser harness is synthetic, not an actual production v2 migration. The migration blocker (legacy clients and reset provenance) remains unchanged.


## 2026-10-27 — null-revision ABA after locked reset (Chromium research candidate)

**Research only; not a production behavior claim.** A new deterministic scenario in `tests/browser-v2-locks-research.cjs` captures an actual tab B in-memory draft and its expected `null` v2 revision before any initial save. Tab A later commits an authenticated v2 record and executes a **naive reset** that removes the sole v2 key while holding the same exclusive browser Web Lock. The store is `null` again. Tab B's old `null` revision now passes a fresh check *inside the lock*, allowing its pre-reset draft to be written. This is an **ABA problem**: the lock prevents overlapping writes, but `null → record → null` loses the generation history. The hypothetical v1-fence guard still quarantines the result; a naive v2-only reader would not. The test deliberately asserts the unsafe outcome, so a named PASS proves a **hazard**, not a fix. Candidate CI and browser output must be verified before marking it passed.

**Implications for a future storage contract:** a reset cannot simply remove the only revision key and return to an indistinguishable empty state. A durable reset tombstone or monotonic generation checked *under the lock* could prevent a cooperating new tab from writing a pre-reset snapshot; however, an old cached client that ignores the generation can still reset or write legacy keys. A tombstone itself has failure, retention, and storage-denial semantics, and must not be treated as sufficient for legacy compatibility. Alternatives: (A) retain a generation/tombstone and explicitly reject stale generations for all participating clients, with a safe bootstrap after reset; (B) block v2 migration until old clients are no longer capable of writing the origin; (C) isolate incompatible formats by origin with an explicitly reviewed data-transfer process. **Recommendation for now: B; keep v2 migration blocked.** Option A may become part of a new protocol only with an end-to-end fault matrix and proof that legacy writes/resets cannot bypass it. Option C has substantial migration and usability costs and is not authorized.

**Required future tests:** interrupted tombstone write, denied read, tombstone removal by old clients, stale `null` writer after reset, multiple sequential resets, reset then new ledger, fresh tab bootstrap, corrupted record, cross-tab StorageEvent, and backup restore. Distinguish a legitimate new post-reset ledger from a stale pre-reset draft without resurrecting deleted data. Keep ambiguous provenance fail-closed. No production v2, formulas, issue #14 modes, real ledger, backup, or iOS change.
