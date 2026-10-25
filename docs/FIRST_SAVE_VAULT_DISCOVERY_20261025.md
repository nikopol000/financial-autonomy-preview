# WEB P1 #35 — first encrypted save: fault model and recovery alternatives

Date: 2026-10-25. Status: **DISCOVERY / TESTS ONLY**. Reference: WEB v18.44, active immutable module 310 and platform module 309. This document is not an authorization to change vault storage format or silently remove stored data.

## Verified code path

On a first real-mode save, `saveWebVault` checks the reset marker, reads `PAYLOAD`, reads `KEY`, validates the new ledger, creates a random 32-byte key, seals an AES-GCM ciphertext, then executes `setItem(KEY, hexKey)` followed by `setItem(PAYLOAD, sealed)`. Both are independent localStorage operations. If the second operation throws, a key-only footprint remains. Subsequent load/save deliberately reject it. A user may still have a backup, but the current code cannot establish whether the orphan key was created by a failed first save or by loss of a previously valid ciphertext. **Never infer that key-only means safe to delete.**

The explicit-reset journal in v18.44 protects deletion intent but does not make initial creation atomic. Web Locks serialize cooperating tabs, not two-key localStorage writes or power-loss durability. Browser/OS crash behavior has not been tested. No real-user incident is evidenced.

## Failure states and safe policy

| State at read | Current behavior | Required invariant |
| --- | --- | --- |
| no key, no payload, no reset marker | empty state; first save permitted under Web Lock | no fabricated ledger, no silent persistence in demo |
| valid key + authenticated payload | load and validate | never overwrite without current revision and Web Lock |
| key only | load/save refuse | no automatic deletion or new vault; preserve backup recovery |
| payload only | load/save refuse | no automatic key replacement; preserve ciphertext |
| invalid key or tampered ciphertext | refuse | no mutation, no fallback to empty |
| committed reset marker | finish explicit deletion under lock | never resurrect old ledger; unknown marker fails closed |
| getItem denied or Web Locks unavailable | refuse real mutation | zero writes; retry only after access restored |
| first KEY write denied | first save fails before writing any pair | a subsequent deliberate retry may succeed |
| first PAYLOAD write denied after KEY succeeds | **KNOWN UNSAFE** orphan key | fail closed; recovery contract needed |
| another tab has stale empty revision after orphan appears | refuse stale write | do not overwrite orphan or create new data |

`tests/vault-real-crypto-regression.cjs` now adds three deterministic synthetic cases: first-key-write denial + retry, payload-only fail-closed, and stale second tab after orphan creation. These complement the existing key-only characterization. They do **not** demonstrate real-browser atomicity.

## Alternatives

**A. Reverse the write order (payload then key): reject.** It merely moves the irrecoverable half-commit to a payload-only state. The random AES key may be lost when the page terminates.

**B. Keep two keys and auto-delete an orphan after failure: reject.** A key-only footprint is indistinguishable from previously existing data whose ciphertext was externally removed. Silent deletion can make recovery harder. A temporary in-memory flag is lost on reload.

**C. First-write staging marker with two-key finalization: conditional.** Could store enough authenticated recovery material to finish a first write after reload, but requires a crash-safe staging protocol, key/nonce integrity, explicit stale-tab revision inclusion, cleanup semantics, and proof that old data are not mistaken for a new initialization. A staging marker without recovery material only introduces a third non-atomic write.

**D. Single atomic localStorage record for newly initialized vaults: recommended research direction.** Store versioned AES key material and ciphertext together in one serialized envelope under a new key, with one `setItem` as the first commit point. It retains the current same-origin threat model: the existing key already lives in localStorage, so this is **not** password-based encryption or a security upgrade. A per-key localStorage operation is synchronous and treated as indivisible at the API level, but browser durability/power-loss guarantees are not implied. A failed write must leave no new record and permit a clean retry. Keep the existing v1 pair readable without destructive migration.

## Migration hazards to solve before implementation

1. Prefer a strictly validated v2 record only after authenticating/decrypting it; never interpret corrupt v2 as empty or silently fall back to v1.
2. If v1 exists, do not migrate by deleting v1 first. A staged v2 write plus preserved v1 rollback can create **dual-authority** and stale-tab problems; define which copy is canonical, when the old pair may be removed, and how older deployed tabs are blocked from writing v1 after v2 becomes authoritative.
3. Update the platform revision fingerprint, reset marker cleanup, demo eligibility, backup/import flows and cross-tab guards together. Test mixed v1/v2/partial/corrupt states and browsers with cached older bundles. A new storage key must not bypass fail-closed detection of legacy footprints.
4. Consider a read-only v1 compatibility path until a separately verified migration protocol is approved. Do not assume changing the active bundle makes every open tab upgrade immediately.
5. Preserve AES-GCM nonce uniqueness, validation, zeroization, existing encrypted backup file format and no-backend/local-only architecture.

## Proposed acceptance matrix before a product release

- Fresh v2: first write success, denied write, quota exception, reload, repeated save, correct AES-GCM authentication and independent decryption.
- Legacy v1: read, save, reset, interrupted reset, partial v1, unknown reset marker, corrupted key/ciphertext, and explicit backup restore; no silent migration/data loss.
- Dual v1/v2: old tab vs new tab, stale revisions, writes during migration, failure after v2 commit, deletion/cleanup denied, and reopening an old cached bundle.
- Fault injection at **every** get/set/remove operation; read permission revoked and restored; no Web Locks; interrupted reload; demo isolation; import/export parity.
- No plaintext financial records in storage, no credit-as-cash accounting changes, no #14 budget modes, no iOS or stable source edits.
- CI/release guard/JS syntax and immutable versioned bundle, then actual browser two-tab/iPhone light/dark smoke. Vercel READY is not browser proof.

## Decision / next

**Do not ship a v2 vault based only on this analysis.** First build a synthetic prototype of the single-record approach with a precise v1 coexistence contract and failure matrix, then review it against #4/#29 and run real-browser tests where authorized. Existing key-only footprints remain blocked, not erased. Product version remains 18.44; this document and tests are not a release.

## Isolated single-record proof of concept — 2026-10-25 (PR #39)

A **research-only** test harness `tests/vault-v2-first-write-prototype.cjs` now imports the active immutable WEB AES-GCM implementation (module 311) and wraps it in a hypothetical `v2` single-key localStorage envelope. The prototype is not imported by the application and has **no migration, reset, production save or UI integration**. The key material remains in same-origin localStorage beside ciphertext, as in v1; this is a write-atomicity experiment, **not** stronger encryption.

The prototype's proposed first-write commit is one `setItem(v2, JSON.stringify({v:2,key,payload}))` after successful encryption and validation. Its read path fails closed if **any** legacy v1 key/payload footprint or reset marker exists, including damaged and incomplete states. Existing v2 records must authenticate and validate before overwrite; raw-record revision equality is checked before writing. This comparison is **not** a replacement for Web Locks.

Synthetic cases in CI cover first-write roundtrip with the real bundled AES-GCM module; quota and SecurityError denial with zero partial records and explicit retry; denied reads; complete/key-only/payload-only v1; committed/unknown reset markers; malformed/tampered v2; stale revision; repeat-save nonce; and dual authority. The dual-authority case invokes the **actual current WEB v18.44 vault writer** after the hypothetical v2 commit. It can still create v1 key+payload because the older writer knows nothing about the new v2 key. The prototype then correctly refuses to choose an authority, but this is **a release-blocking coexistence hazard** rather than a solved old-tab problem.

**Unresolved before shipping:** define how a cached v1 tab is fenced *before* a new v2 first write (or defer v2 activation until an explicit migration barrier); prove no old-tab write or silent split brain; integrate reset journal, revision fingerprints, demo eligibility, import/export, and legacy read-only path; test browser Web Locks, reload, interruption, and all failure points. LocalStorage's per-call behavior does not guarantee power-loss durability. No live v2 rollout or v1 auto-deletion is approved.

Test execution status must be confirmed from the final PR/head CI and documented in the checkpoint. WEB remains **v18.44**.

## Cached v18.44 tab fencing — six synthetic direct-module cases (research only)

The actual active v18.44 module 310 rejects a non-hex legacy key before saving. Its clearWebVault operation knows only the v1 key, v1 payload and reset marker. Platform module 309 additionally requires a Web Lock and matching revision for real mutations. The new tests invoke module 310 directly and deliberately bypass platform 309: they characterize module capabilities and counterexamples, NOT actual browser UI exploits.

A hypothetical invalid-key legacy fence blocks the actual v18.44 loader/writer without writes. However, **fence first, then v2** can strand an unsaved pending ledger if interrupted between writes. **V2 first, then fence** permits the legacy writer to create dual authority in that interval. Direct legacy clearWebVault can remove the fence without knowing about v2, but the actual platform revision guard may prevent a stale UI reset; that browser scenario is unverified. A denied fence write leaves no new record.

The six test cases cover: (1) v1 read/write refusal on invalid-key sentinel; (2) fence-before-v2 blocking legacy writes after commit while the existing v2 prototype still rejects the sentinel; (3) KNOWN UNSAFE crash after fence before v2 (no encrypted pending state); (4) KNOWN UNSAFE v2 before fence (split authority); (5) KNOWN UNSAFE direct v1 reset removing the fence (platform bypassed); (6) denied fence write with zero footprint. These are synthetic cases using the real v18.44 AES-GCM and vault modules. CI status must be checked separately.

### Alternatives and release blockers

- **Single legacy fence then v2 commit:** insufficient; the pending first ledger is not recoverable after a crash between operations.
- **V2 commit then legacy fence:** insufficient; a cached v1 writer can produce two independent copies.
- **Encrypted staging record, then legacy fence, then v2 activation:** investigate next. Stage a full authenticated ledger before altering v1 footprints. On crash after staging, preserve staging; if v1 appeared meanwhile, detect conflict and fail closed without choosing a copy. On crash after fencing, recover from the authenticated stage. Do not delete staging until canonical v2 authentication and the old-tab contract are proven.
- **Compatibility-first v1 rollout:** teach the new v1 writer about a future v2 marker before enabling v2, but never assume cached v18.44 tabs have reloaded. A physical legacy-write barrier and recovery for interrupted barrier operations are still necessary.

Do not reuse RESET_MARKER for migration: the existing committed-v1 value instructs the legacy reset journal to delete the vault. Do not silently erase key-only/payload-only footprints or call the hypothetical fence a safe fix.

Before shipping: test every read/write/remove failure, stale and concurrent tabs through actual platform Web Locks/revisions, direct legacy reset risk, demo eligibility, import/export/backup, and real-browser reload. A passing KNOWN UNSAFE test confirms a risk, not a protection. WEB stays v18.44; no formula, budget perspective #14, real data, backup format or iOS changes.


## Encrypted staging and recoverable activation — isolated test extension (PR #43, 2026-10-25)

This is a **research-only counterexample and recovery harness**, not a recommended deployable migration. The isolated prototype uses the **actual WEB v18.44 AES-GCM module 311 and legacy vault module 310**, but the hypothetical staging/fence/activation functions live exclusively in tests/vault-v2-first-write-prototype.cjs.

**Candidate sequence:** (1) validate that no v1/v2/reset/stage footprint exists; (2) AES-GCM encrypt the pending ledger and atomically write one authenticated staging envelope; (3) write a deliberately invalid legacy-key sentinel to block *direct* old-v1 saves; (4) copy the authenticated stage to the hypothetical v2 key; (5) **retain** stage and sentinel pending a separate migration/reset contract. An interruption after (2) or (3) can be resumed from authenticated ciphertext; denied staging write leaves no partial footprint; denied sentinel or activation write leaves recoverable stage. After (4), a repeated recovery is idempotent. Authentication, reset markers, unexpected legacy footprints, mismatched active records and denied reads fail closed before recovery writes. Stage contains a key alongside ciphertext, matching the existing same-origin threat model, **not** providing password protection.

**Crucial unresolved safety gaps:**
- **Stage-before-fence race:** cached v18.44 tab may write a valid v1 pair after staging but before the sentinel. Recovery must detect two authorities and **refuse**; it cannot safely choose a winner. A Web Lock may serialize cooperating platform writers but not bypassed/direct module calls or unrelated old clients; real platform/browser proof is outstanding.
- **Legacy direct reset:** v18.44 direct clearWebVault can remove the sentinel without touching stage/v2. A subsequent old save can create v1 authority again. The test deliberately bypasses platform module 309 Web Locks/revision checks; **do not call this a proven UI exploit**. Do not delete sentinel or stage merely because v2 exists.
- **First-stage commit is a change of meaning:** a staged ledger is recoverable but not yet an active v2 ledger. UI behavior after a crash, when a user sees “saved”, requires an explicit contract. No promise of disk durability from localStorage.
- **No automatic cleanup:** old v1 key-only/payload-only, corrupted stage, conflicting v1/v2, unknown reset marker and old backup/import footprints remain blocked and preserved. A separate verified reset, migration, recovery UX and rollback protocol is necessary.
- **Not a release-ready v2 reader:** existing readV2 intentionally rejects all v1 footprints, including a sentinel. This research harness only tests staged activation, not the complete post-activation application read/save, transaction history, import/export, backup, demo and stale-tab revision integration.

**Synthetic cases added:** staged first-write roundtrip and recovery, interruption after sentinel, idempotent repeated recovery, quota/permission errors on each write stage, tampered stage, cached v1 race, incomplete v1 footprint, reset marker, denied stage read, and KNOWN UNSAFE direct old-v1 reset. Existing prototype and bundled-vault regression suites remain independent; exact CI result and totals must be checked from PR #43 before claiming PASS.

**Next decision gate:** test the *actual* platform 309 Web Locks/revision sequence with cached old tabs, old reset, new staging, and every read/write/remove failure in a real browser; define a compatibility phase and a user-visible recovery policy. If no reliable old-tab fence can be proven, **do not activate v2 automatically**; prefer retaining v1 with explicit safe recovery and guidance. No production JS/index/diagnostic, financial formulas, budget modes #14, real data, encrypted backup format, backend, telemetry or iOS changes.


## Actual legacy platform 309 against staged-v2 research — PR #45 (2026-10-25)

Three additional **synthetic Node VM tests** instantiate the **actual immutable v18.44 platform module 309**, legacy vault module 310, and a cooperating origin-wide Web Locks scheduler. They extend the earlier direct-module tests; they are not interactive browser results, and no v2 product implementation exists.

1. **KNOWN UNSAFE: stage-only does not fence an old tab.** The old tab loads an empty v1 revision, then the hypothetical new client writes encrypted STAGE. The old tab's real `save` acquires its Web Lock and nevertheless creates a valid v1 key/payload pair: its revision fingerprint reads only KEY/PAYLOAD/RESET, not STAGE. Recovery detects two authorities and refuses to choose. A Web Lock alone does not fix an unknown storage-key protocol.
2. **KNOWN UNSAFE: old explicit reset can erase its own reset marker while leaving STAGE.** The old tab loads an empty v1 revision, a new client writes STAGE, then the old tab's **actual platform `resetData`** completes under Web Locks. The v18.44 reset journal removes KEY/PAYLOAD/RESET but does not know STAGE. The research-only `recoverStaged` then authenticates STAGE and reactivates it, **resurrecting data after an explicit reset**. This is a hypothetical cross-version migration failure, not evidence that current v18.44 resurrects data: current v18.44 never creates STAGE.
3. **Existing protection:** if the legacy-key fence has already been written, a stale old tab's actual platform `save` and `resetData` reject the changed revision, and a newly opened old tab cannot load the invalid legacy key. This protection starts **after** the fence, not in the unsafe stage-before-fence interval. Direct-module reset remains a separate unverified bypass scenario.

**Decision:** DO NOT ship staging/fence/v2 automatic activation. A safe protocol must prevent an old tab's intentional reset from being undone even when the old reset leaves no durable tombstone that the new client understands. It must also prevent old saves between staging and fencing, and handle a crash before the fence without losing the pending ledger. The present old-tab format has no awareness of STAGE/V2; a future reader cannot infer reset intent from an absent old marker. A compatibility-first rollout cannot assume cached v18.44 tabs disappear on deployment. Prefer retaining v1 with explicit, non-destructive error/recovery UX while evaluating a genuinely compatible protocol.

**Next acceptance:** verify these same transitions with two real browser tabs and actual Web Locks, including reset, reload, stale service-worker/cached code, denied storage, and interruptions; evaluate durable reset-intent/epoch semantics and safe rollback. A passing `KNOWN UNSAFE` characterization is evidence of a **blocker**, not a passing security guarantee. Product version stays 18.44; no change to financial formulas, #14 modes, real data, backup format, backend, telemetry or iOS.


## Conservative quarantine proof for ambiguous stage-only recovery — 2026-10-25 (candidate)

**Scope:** research-only extension to `tests/vault-v2-first-write-prototype.cjs`; no WEB product/storage change. The existing `recoverStaged` deliberately demonstrates the **unsafe** alternative. The new `recoverFencedStage` is a *counterexample prevention policy*, not a deployable migration.

### Indistinguishability and trade-off

Two histories produce **identical storage bytes** for a cached v18.44 tab:

- **A — interrupted first save:** the new client writes an authenticated encrypted `STAGE`, then crashes before placing the legacy-key fence. A pending transaction is recoverable from the stage.
- **B — intentional reset:** after the same `STAGE` write, the cached v18.44 client runs its actual `platform.resetData()` under Web Locks. It deletes its v1 key, payload and committed reset marker, but it never touches `STAGE`. The result is byte-identical to A.

Any recovery algorithm that reads only those surviving keys **cannot distinguish A from B**. Automatically activating `STAGE` restores pending data in A but **resurrects intentionally deleted data in B**. Automatically discarding `STAGE` respects B but loses the only recoverable encrypted copy in A. A new-only epoch/tombstone cannot fix B if the old client never writes or preserves it. Web Locks do not solve ambiguity after a crash releases the lock.

**Conservative rule:** treat stage-only (no fence) as **QUARANTINED**, preserve the encrypted bytes, refuse automatic v2 activation and refuse silent deletion. Treat a valid authenticated `STAGE` plus intact legacy fence, no v1 payload, no reset marker and no conflicting v2 as *potentially recoverable* under the hypothetical protocol. A failed v2 write retains stage/fence for a retry. Any corrupt record, denied read, missing fence or competing authority fails closed with zero recovery writes. This rule prevents automatic resurrection in the demonstrated case; it **does not solve availability** for an interrupted stage-only first save.

### What must happen before any shipping implementation

1. Keep the current v1 protocol in production. A safe automatic cross-version migration cannot be asserted while cached v18.44 clients can reset without leaving a durable marker understood by new clients.
2. If v2 is ever pursued, design a **compatibility-first release** that all active clients can honor, a reset-intent barrier that survives relevant interruptions, and a lifecycle for retiring old clients; prove the actual reset/write order and platform Web Locks with two browser tabs. Do not assume a release deploy invalidates already open tabs.
3. For ambiguous stage-only records, specify **explicit user-facing recovery** (e.g. explain that the app cannot tell an interrupted save from an earlier reset; offer safe backup/export and a user-controlled decision) rather than silently restoring or erasing data. Do not expose decrypted financial data to logs, telemetry or external services.
4. Evaluate the simpler product alternative: retain v1 and improve error/recovery UX for orphan key/payload states, without migrating vault storage at all. No automatic orphan deletion.
5. Validate denied reads/writes/removes, reset during a crash, repeated reload, stale revisions, old clients without Web Locks, and actual browser/iPhone behavior before any release. Browser/OS power-loss durability remains unproven.

**Tests added in candidate:** eight synthetic quarantine/ambiguity/old-platform reset, fenced activation/retry, tamper/conflict and denied-read scenarios, using actual bundled AES-GCM and v18.44 platform modules. CI outcome and exact total must be recorded only after the candidate run. **WEB v18.44 remains unchanged; issue #14 is still DISCOVERY / NOT APPROVED.**
