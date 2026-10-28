## Actual archived WEB v1 JavaScript in two Chromium tabs — 2026-10-29 (MERGED, research only)

[PR #237](https://github.com/nikopol000/financial-autonomy-preview/pull/237) adds `tests/browser-archived-v1-compatibility-research.cjs` and the Chromium CI step. Unlike earlier simulated legacy localStorage edits, this extracts and runs the **real immutable** Metro 309 platform, 310 vault, 311 cryptographic adapter and transitive crypto modules from WEB 18.27, 18.33, 18.34 and 18.62, inside two separate Chromium pages on one disposable localhost origin. Only the financial model 204/205 is stubbed for valid synthetic transactions. Browser localStorage, Web Locks and encryption are real. This is not the archived full UI or a Safari test.

The verified [Chromium run #40785361055](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40785361055) has six named PASS lines: (1) 18.27 cached stale save overwrites newer 18.62 ledger; (2) 18.33 does the same; (3) 18.34 rejects sequential stale save with unchanged ciphertext; (4) 18.33 stale save recreates v1 after 18.62 reset; (5) 18.34 **still-stale** pre-reset save is rejected; (6) after actual **page reload** the 18.34 old code sees an empty v1 vault and can first-save new v1 ciphertext, which 18.62 reads despite its reset marker. The initial candidate run #40785069892 failed because the test incorrectly expected the still-stale 18.34 save to succeed. The corrected test preserves both partial protection and the separate reload-based vulnerability.

**Interpretation:** the live v1 compatibility risk is confirmed under synthetic real-browser execution of actual archived vault modules, but the result is not a real-user incident, not a v2 fix, and not evidence that the full archived UI is compatible with a future v2 cutover. A successful v2 authority must remain independent of v1 writes after cutover and surface any observable divergence without silently discarding either side. No complete detection of ABA/full-origin rollback can be claimed. Next browser gate: use these actual archived writers *during* v2 staging and after v2 tombstone; verify no automatic v1 promotion, no destructive cleanup, and an explicit recovery contract.

# WEB P1 #4 — v2 authority and cached v1 tabs: research gate (2026-10-28)

## Browser research — retained authority replay and mutable epoch (2026-10-28; candidate)

Two **RESEARCH ONLY** Chromium assertions were added to `tests/browser-v2-restore-research.cjs`, running two actual browser tabs with Web Locks, WebCrypto AES-GCM and synthetic records. These are **known limitations**, not protection tests or evidence of a production incident:

1. **Valid old authority replay:** after a v2 stage contains synthetic transactions A/B/C, a deliberate localStorage replacement of the authority pointer with an earlier *valid* A/B pointer makes `read()` display A/B. The old stage and digest still match. Restoring the later pointer makes A/B/C visible again. An integrity digest over the selected stage does not establish freshness.
2. **Mutable epoch:** changing only the `epoch` string in the plain authority JSON still allows `read()` to accept the stage and display A/B/C. The stage digest does not authenticate the pointer's metadata.

**Security boundary:** this is explicit same-origin storage tampering in a disposable research origin, not ordinary cached-v1 code behavior, and not evidence of a remote attack. A MAC whose secret is stored alongside data in the same origin cannot defend against malicious same-origin code that can read the secret; a fully rolled-back local-only storage snapshot also cannot be distinguished from the original solely from the restored bytes. Therefore do **not** claim that adding a MAC or random epoch alone provides anti-rollback or complete legacy-write detection.

**Design alternatives for review:** (A) single authenticated envelope binding payload, status, revision and epoch (simpler consistency but not full-snapshot anti-rollback); (B) staged immutable encrypted envelopes with a validated authority pointer, explicit revision comparison and non-destructive retained history (recoverable but needs garbage-collection and conflict UX); (C) browser-native transactional storage such as IndexedDB for cooperating new tabs (still cannot fence old v1 localStorage writers or defeat full-origin rollback). Before production cutover, define the honest recovery message, backup export and conflict workflow, test interruptions and actual cached JS, and ensure no silent downgrade or automatic deletion. No formula, v1/v2 product storage, backup, real data, iOS or app release change is authorized by these research tests.

**Verification:** local JavaScript parsing succeeded for the candidate source; GitHub Chromium/Release CI and merge status must be checked separately. A green characterization test documents a weakness, not its remediation.


**Status: PROTOTYPE / NOT A PRODUCT MIGRATION.** Product WEB 18.62, its active bundle, vault, backup and financial formulas remain unchanged. Do not ship this storage protocol from this document alone.

## Observed evidence

- `tests/vault-cached-legacy-cross-version.cjs` runs immutable WEB 18.33, 18.49 and current 18.62 Metro modules against real AES-GCM and synthetic localStorage. The pre-existing three tests reproduce **KNOWN UNSAFE** 18.33 stale overwrite and post-reset resurrection; 18.49 fails closed on an unknown modern reset marker. Green tests do not make v1 safe.
- Two **research-only** additional scenarios redirect the current WEB 18.62 vault interface to separate synthetic v2 keys, without changing the production module. A cached real WEB 18.33 writer can still modify the v1 ciphertext, but cannot change v2 ciphertext. After v2 reset, cached 18.33 save/reset cannot recreate v2 data or remove the v2 reset epoch.
- This proves only **namespace isolation in a deterministic Node VM**. The adapter does **not** migrate a ledger, preserve the original key, resolve concurrent v1 edits, authenticate a v1→v2 handoff, handle quota errors or certify browser/Safari behavior. A v1-only edit can become invisible to the v2 user unless surfaced as a conflict.

## Candidate authority contract — requires separate design review

1. **Authority is explicit and monotonic.** Once a durable, validated v2 commit record exists, normal current-version loads must use v2 exclusively; they must never infer that later v1 writes are newer or silently re-import v1. v1 remains quarantined for recovery/inspection, not a fallback live ledger.
2. **Best-effort detection of post-cutover v1 divergence, not a no-loss guarantee.** Record an authenticated or otherwise integrity-checked baseline fingerprint of the v1 KEY/PAYLOAD/RESET tuple at cutover. On future current-version loads, compare the tuple to the baseline and surface a non-destructive *legacy divergence* warning when it differs. **A cached v1 writer can write and then restore the same bytes, or another cached tab can overwrite its edits (ABA); a later fingerprint comparison cannot prove that no v1 edits occurred.** Fingerprint changes also do not prove user intent. A persistent disclosure/recovery policy is needed for the interval where old tabs may still be open. Never silently merge, overwrite v2, or delete v1.
3. **Reset is durable in the authoritative namespace.** A v2 reset must commit a durable tombstone/epoch that blocks reimport from v1 even if old JS recreates v1 ciphertext. Any backup restore after reset is a separate explicit user operation, never an automatic resurrection.
4. **No split-brain authority.** A half-written v2 staging record cannot be mistaken for a committed v2 ledger. Unknown/malformed authority records, missing keys, unverified ciphertext, or ambiguous provenance must fail closed, preserving all bytes and offering a non-destructive recovery path.
5. **Crash-safe staging before cutover.** Design a staged, authenticated v2 envelope and a single atomic authority pointer/commit write, then verify round-trip and fingerprints before activation. `localStorage.setItem` is atomic for an individual key but a multi-key sequence is not transactional. If any step fails, never delete v1 or claim migration complete. This is a *proposed state machine*, not proof of atomic migration across old tabs.
6. **Cross-version race remains at cutover.** An 18.33 tab ignores new locks/markers and can change v1 after the last fingerprint check. The v2 authority must not follow those writes. Detect and expose persistent subsequent v1 drift where observable, but **do not claim that this catches all legacy edits**. An edit in the final cutover interval or a transient ABA write may be undetectable to the new tab; explicit user-facing limitation and recovery rules are required, not automatic v2 promotion.
7. **Recovery/backup compatibility is a release blocker.** Define explicit restore behavior for pre-v2 encrypted backups, key-only and payload-only remnants, failed staging, v1 divergence and post-reset tombstones. Never regenerate keys or erase ciphertext automatically. Backups remain encrypted and local-only.

## Proposed state machine (NOT IMPLEMENTED)

| State | Authoritative reads | Allowed writes | Failure behavior |
| --- | --- | --- | --- |
| V1_ONLY | verified v1 | current v1 only under existing lock | preserve v1, fail closed on ambiguous KEY/PAYLOAD |
| V2_STAGING | verified v1 | v2 staging bytes, no v1 deletion | discard/ignore incomplete staging only after proven safe; preserve v1 |
| V2_COMMITTED | verified v2 only | v2 under exclusive lock and revision check | preserve v2; quarantine and signal any v1 divergence |
| V2_RESET | empty v2 with durable tombstone | explicit new v2 save only | never promote reappearing v1 |
| CONFLICT/UNKNOWN | no automatic ledger selection | no financial mutations | show diagnostic and explicit non-destructive recovery options |

**Open design questions:** which authority pointer format is authenticated; whether a single authenticated v2 envelope can carry both ledger and reset epoch; how a current tab detects v1 drift without exposing decrypted data; how to safely compare legacy revisions while old writers ignore locks; what explicit conflict UI and export semantics users can understand; how to avoid a stale v2 tab overwriting a newer v2 revision.

## Required acceptance before any product release

- Actual immutable 18.27, 18.33, 18.34, 18.49 and current bundles: load/save/reset interleavings, including old-tab writes *during* staging, after commit and after reset.
- Real AES-GCM, synthetic ledgers with distinguishable transactions; fail-inject **every** persistent write/read/remove and write-then-throw, quota/security denial, reload, tab close, missing KEY/PAYLOAD, unknown marker, altered ciphertext and stale snapshot.
- Assert zero writes on rejected conflicts, durable v2 reset, no automatic v1 reimport, and detection of **observable** divergent v1 (including v1 deletion) without destructive cleanup. Add an ABA/transient-v1-write test proving that fingerprint-only detection is insufficient; never claim complete detection of noncooperating legacy writes. Include backup round-trip and recovery UI tests.
- Two real HTTPS browser tabs (Chromium and Safari iPhone where available), cache-pinned old JS, reload and storage events; actual rendered warning/accessibility and privacy review.
- Only after protocol review: new immutable bundle, synchronized HTML/version/diagnostic, release checks, full CI, Vercel production READY **plus served browser verification**. No backend, account, telemetry, bank sync, unencrypted data, real ledger mutation or iOS work.

## Separate financial discovery

Issue #14 (planned vs owned money vs remaining days), #25 (card overpayment) and #2 (historical reconciliation) remain DISCOVERY. None of these authorize changing formulas or budget modes. The storage isolation prototype makes no financial semantics decision.

Related: [legacy cached-tab evidence](WEB_LEGACY_CACHED_TAB_COMPATIBILITY_20261028.md), issues #4/#29/#35 and `tests/vault-cached-legacy-cross-version.cjs`.

## Research-only regression extension — 2026-10-28 (#4)

The cross-version synthetic suite now includes two additional **characterization tests** using the actual cached WEB 18.33 module, active WEB 18.62 module, real AES-GCM, and a **test-only** v2 namespace adapter. These are not a migration implementation or browser acceptance:

- **Observable legacy deletion:** after independent v1/v2 synthetic saves, the real 18.33 reset removes the legacy v1 tuple. Comparing the full v1 KEY/PAYLOAD/RESET tuple before and after detects a difference, while isolated v2 remains intact. This supports a *best-effort warning*, not automatic recovery or a proof that all edits are visible.
- **ABA counterexample:** a real 18.33 save changes the v1 tuple; then the test deliberately restores the original v1 KEY/PAYLOAD/RESET bytes, simulating raw-byte snapshot restoration. A SHA-256 fingerprint of the **entire tuple** returns to its original value, despite the intervening write. Normal AES-GCM saves generate fresh ciphertext; the raw restoration is an adversarial storage rollback illustration, **not** evidence that a normal 18.33 save automatically reproduces identical ciphertext. It proves a fingerprint-only detector cannot guarantee a complete history of legacy writes.

**Acceptance consequence:** the planned v2 conflict notice must say it detects only *observable* v1 divergence. It must never promise complete detection, silently merge a v1 delta into v2, or infer that an unchanged fingerprint proves no legacy edit. A crash-safe authority commit, encrypted-backup compatibility, actual multi-tab browser tests and explicit recovery UX remain prerequisites to any production storage migration. The existing two **KNOWN UNSAFE** v1 tests remain intentionally green because they reproduce vulnerabilities, not because the vulnerabilities are fixed.


## Research-only staged authority crash matrix — 2026-10-28 (PR #226)

The new `tests/vault-v2-authority-crash-matrix-prototype.cjs` models **a possible** v1→v2 cutover, not a production implementation. It uses synthetic ledgers and real Node WebCrypto AES-GCM. A complete v2 stage envelope is stored under a research-only key; its ciphertext is decrypted and verified before a **single localStorage authority-pointer write**. The original v1 KEY/PAYLOAD/RESET bytes are never deleted or overwritten. Reload consults the authority pointer first, never chooses v1 when an invalid v2 pointer exists, and treats a committed v2 reset tombstone as authoritative despite later v1 writes.

The test enumerates the actual storage operations in the prototype and injects failures **before each operation** and **after each setItem has persisted**. A failure before authority-pointer persistence leaves v1 authoritative with possible orphan v2 staging; an exception after the pointer was persisted is recognized as committed on reload. Malformed pointers, missing/tampered staging and ciphertext authentication errors must fail closed, not silently fall back to v1. After cutover, v1 tuple drift is reported as *observable divergence* only; the unchanged-fingerprint ABA blind spot remains.

**Limitations and release gates:** this is a simulated storage contract, not real browser atomicity, not a migration of the existing vault or encrypted backup format, and not proof against noncooperating cached JS. The proposed authority record uses a SHA-256 digest to detect accidental stage mismatch but is **not cryptographically authenticated** against malicious same-origin code. A production design needs authenticated authority/epoch provenance, staged key handling, precise recovery UX, v1/v2 backup round-trip, quota/security/read faults, actual cached 18.27/18.34 and two-tab Safari/Chromium acceptance. Existing cached 18.33 lost-update and resurrection remain **KNOWN UNSAFE** until a separate product migration is designed, approved and verified.

## Archived 18.27 / 18.34 cross-version evidence — 2026-10-28 (PR #228)

The actual immutable 18.27 and 18.34 Metro modules were added to the existing real-AES-GCM, synthetic-ledger test harness. Candidate [Release CI #40741030617](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40741030617) **SUCCESS**; the log explicitly confirms **10/10** total cross-version scenarios, including these three new assertions:

1. **KNOWN UNSAFE — 18.27:** an already-loaded stale tab overwrites a newer 18.62 transaction. The 18.27 platform has no revision/Web Locks guard.
2. **PARTIAL GUARD — 18.34:** a sequential stale save after a newer 18.62 save is rejected with **zero writes**; the current ciphertext remains intact. This is not a cross-version reset guarantee.
3. **KNOWN UNSAFE — 18.34:** after a modern 18.62 reset, a freshly loaded 18.34 tab sees the v1 KEY/PAYLOAD pair as empty, ignores the `idle-v2` marker, and can save a new v1 ledger that 18.62 subsequently loads. The reset marker remains present, but does not fence that older writer.

These are deterministic Node VM characterizations, not observed user-data incidents or browser acceptance. Green CI **reproduces two unsafe behaviors**, not a fix. The v2 authority design must handle not only 18.33 but also 18.27 and 18.34. Before shipping, validate the real [encrypted backup v1 and v2 recovery contract](WEB_V2_BACKUP_RESTORE_CONTRACT_20261028.md), including the existing PBKDF2/AES-GCM portable format and explicit replacement confirmation. No production migration or financial formula change is authorized by these tests.
