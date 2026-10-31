## IndexedDB read-success / transaction-abort boundary (31 October 2026)

[PR #363](https://github.com/nikopol000/financial-autonomy-preview/pull/363) (merged `ea341e37f02f48811371c0043bc09095a00ef7ca`) strengthens the **isolated Chromium research preflight**, not the production WEB vault. A successful `IDBRequest.get().onsuccess` event can precede an abort of its enclosing read-only transaction; accepting the request event as durable authority is incorrect. The fixture now waits for `IDBTransaction.oncomplete` and rejects `onabort` / `onerror`. Real Chromium fault injection calls `transaction.abort()` from the request's success listener. Result: `IDB_UNAVAILABLE` rather than `READ_ONLY_EVIDENCE`; an independent clean retry verifies the original synthetic sentinel. Encrypted v1 KEY/PAYLOAD/RESET remain identical; the inspector makes zero vault writes. [PR Chromium #41217618103](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41217618103) SUCCESS with explicit PASS; [Release #41217618039](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41217618039) SUCCESS.

**Security boundary:** completion of a *read-only* transaction is evidence only for that transaction's snapshot, not an atomic guarantee about a future mutation. A cached noncooperating legacy v1 writer may still modify localStorage after inspection. No destructive reset, restore, migration, authorization or production integration follows. Next: actual IDB denial between preflight and a hypothetical operation, legacy-writer fencing, crash/reload, blocked-open timeout, Safari/VoiceOver. No formula, backup format or iOS changes.

## Actual Chromium IndexedDB missing-store, deleted-database and denied-enumeration preflight (31 October 2026)

[PR #361](https://github.com/nikopol000/financial-autonomy-preview/pull/361), merged `7d9f6885382f653266a9437933010a202b20ee58`, extends the disposable actual-browser [authenticated-backup fixture](../tests/browser-authenticated-consent-legacy-writer-research.cjs). Following **genuine WEB 18.66 PBKDF2/AES-GCM backup authentication**, an **independent, read-only research preflight** inspects a synthetic IndexedDB authority. It confirms: (1) expected store readable; (2) a real version upgrade removes the expected object store → `IDB_STORE_MISSING`; (3) deleting only the disposable database → `IDB_MISSING`, with no implicit recreation; (4) injected `SecurityError` from `indexedDB.databases()` → `IDB_UNAVAILABLE`. All scenarios preserve exact existing encrypted v1 localStorage KEY/PAYLOAD/RESET and perform **zero research-gate writes**. [PR Chromium #41213119627](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41213119627) SUCCESS with four named PASS lines; [PR Release #41213119637](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41213119637) SUCCESS.

**Limits:** the IndexedDB fixture is synthetic and separate from the actual production vault; the database deletion is a deliberate test-only action, not evidence of a real browser eviction incident. Permission denial is fault injection, not an observed real-world denial. A read-only preflight is not atomic with a future commit, cannot fence archived noncooperating v1 writers and cannot prove full-origin rollback freshness. No destructive API or product code is enabled. Next: operation-specific crash-safe authority, postcheck fault interleavings, actual Safari/VoiceOver and explicit user approval before reset/restore semantics. WEB 18.66 unchanged.

## Actual Chromium final locked-read denial (31 October 2026)

[PR #359](https://github.com/nikopol000/financial-autonomy-preview/pull/359) merged as `fdc53287142f98b0d1d9ac1a91682cd4a33a8f3d`. The disposable same-origin Chromium harness authenticates a real WEB 18.66 PBKDF2/AES-GCM synthetic backup, waits inside a **real exclusive Web Lock** immediately before the final storage reinspection, injects a synthetic `SecurityError` on the encrypted PAYLOAD read, and resumes. The read-only gate returns `STORAGE_UNAVAILABLE`; the KEY/PAYLOAD/RESET evidence is byte-for-byte unchanged, gate write count is zero, and no destructive `commit` exists. [PR Release #41208476423](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41208476423) and [PR Chromium #41208476456](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41208476456) SUCCESS, with named browser PASS in the job log. This is a synthetic injected permission fault, **not** a production Safari/Chromium incident or a deployed recovery fix.

The previously demonstrated **post-final-reinspection cached-v1 writer remains unfenced** and therefore KNOWN UNSAFE. Do not infer destructive authorization from a green negative test. Next acceptance requires an independently reviewed operation-specific storage authority/fence, interruption and IDB faults, accessible Safari UX, and explicit approval before any reset/restore/migration. WEB product stays 18.66; no financial data/formula, bundle, backup format or iOS change.

## Actual Chromium orphan-pair and denied-read boundary (31 October 2026)

[PR #357](https://github.com/nikopol000/financial-autonomy-preview/pull/357) extends the actual-browser [authenticated backup/archived-writer fixture](../tests/browser-authenticated-consent-legacy-writer-research.cjs), without importing it into the product. A read-only research preview now explicitly refuses **KEY-only** and **PAYLOAD-only** localStorage footprints, and returns `STORAGE_UNAVAILABLE` on a synthetic `SecurityError` during a storage read. Both orphan footprints may have multiple provenances (interrupted first save, partial reset, eviction, external deletion); they must not be treated as empty or automatically cleaned. The test restores the exact synthetic storage pair after each fault and confirms **zero gate writes**. It still authenticates a genuine WEB 18.66 PBKDF2/AES-GCM backup and retains the archived 18.33 late-writer **KNOWN UNSAFE** case.

[Release CI #41204177525](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41204177525) and [Chromium #41204177494](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41204177494) completed SUCCESS; browser job logs include the named PASS lines. These are disposable browser fault simulations, **not** evidence that production recovery is safe, nor a report of a real user's failure. No destructive operation, financial formula, backup format or product bundle changed.

**Unresolved design:** read-only authentication cannot fence a cached v1 writer after final reinspection; full-origin rollback remains locally undetectable. Before product reset/restore, define and explicitly approve an operation-specific transactional authority, crash/reload and legacy-client handling, plus accessible Safari/VoiceOver UX. Until then, no auto-delete, replay, rekey, resurrect, unlock or destructive commit.

# WEB reset/restore consent: read-only evidence binding (2026-10-31)

**Status: RESEARCH ONLY — NOT A PRODUCT FIX OR APPROVED DESTRUCTIVE CONTRACT.**
Scope: issues [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35). This is an isolated Node 22 model, not imported by the WEB 18.66 bundle, and not a password-checking, reset, migration, backup or restore implementation. It uses synthetic evidence only; no real financial data, iOS, encrypted backup format or accounting formulas are touched.

## Why this gate is needed

The active v1 reset flow writes a localStorage marker and then removes encrypted payload/key separately. A crash, quota/security fault, cached old writer or a second tab can leave ambiguous evidence. A **typed confirmation alone is not proof** that the data still match the screen the user saw. A delayed password verification, storage inspection or another tab can make that confirmation stale before the destructive action begins. Existing research confirms that a complete same-origin rollback can preserve internally consistent, authentic but old data; a local digest cannot establish global freshness.

The new [eleven-case executable model](../tests/vault-v2-reset-consent-boundary-research.cjs) checks a **non-destructive preview gate**, not deletion authorization. The only positive result is `READY_FOR_DESIGN_REVIEW`, deliberately **not** `ALLOW_RESET`; there is no `commit` function and an injected `onWrite` callback is rejected. `audit.writes` stays zero. The typed phrase `ȘTERGE DATELE LOCALE` is illustrative test data, **not approved UI wording**.

## Read-only consent proposal (not approved)

1. Enter a dedicated blocked state with a factual status. Do not claim that absent/evicted/denied IndexedDB means an empty ledger; preserve all surviving ciphertext, keys, markers and evidence.
2. Show the consequence of a *proposed* reset or restore and distinguish it from non-destructive retry/export. Require an independently verified, user-selected recoverable source where appropriate. Merely checking a `backupVerified` checkbox is **not** actual cryptographic verification; the test mocks this precondition.
3. Collect an explicit operation-specific phrase and separate proof of control (future authenticated source/password validation). The Node test's `authenticate()` returns synthetic booleans and does **not** validate PBKDF2/AES-GCM backups or hold real passwords.
4. Take a read-only evidence snapshot. After asynchronous proof, acquire a cooperating origin-wide exclusive lock and **reinspect**. Cancel/supersede requests by monotonic epoch. If evidence, status, storage access or operation context changes, return `BLOCKED` and require a fresh user decision. A hash of evidence is an equality check, not an authentication or anti-rollback primitive.
5. Even if these checks pass, **do not delete, merge, replay, rekey, resurrect, select a ledger, unlock editing or auto-restore**. A separate reviewed transaction protocol and explicit user approval are prerequisites. No implementation of a destructive callback is provided by this model.

## Eleven executable cases

| Scenario | Required research result |
| --- | --- |
| Stable synthetic conflict, explicit phrase, mocked verified source and proof | Read-only design review only, zero writes |
| No Web Locks, missing exact phrase, unverified backup or wrong source | Block before inspecting |
| Authentication failure or storage SecurityError | Block, preserve evidence |
| Archived writer changes ciphertext between preflight and locked reinspection | `EVIDENCE_CHANGED`, zero writes |
| User cancels while asynchronous proof is pending | `STALE_REQUEST`, late proof ignored |
| Second inspection supersedes first | Only latest result eligible for review |
| Missing/evicted/unknown evidence | `UNVERIFIABLE`, no initialization |
| Attempt to supply destructive callback | Rejected by constructor |
| User cancels while waiting for a cooperating lock | `STALE_REQUEST`; second inspection is not performed, zero writes |
| Noncooperating archived v1 writer changes bytes **after** the final locked reinspection | **Negative boundary:** read-only review may still return; never authorize a destructive commit |
| Fully rolled-back but internally consistent origin | **Negative boundary:** local review can pass; still no mutation or freshness claim |

## Additional negative race boundary (research, 2026-10-31)

The added deterministic case intentionally models a cached legacy v1 tab that **does not acquire the v2 Web Lock** and writes after the final read-only inspection. The model can return `READY_FOR_DESIGN_REVIEW` while the current ciphertext already differs from the reviewed fingerprint. This is a **passing negative test**: it proves the read-only gate cannot establish a durable authorization or fence noncooperating code. The model has no destructive operation; no financial data is touched. Merely moving the final inspection inside a Web Lock is not sufficient.

A separate case holds the cooperating lock queue while the user cancels. After the queue resumes, the gate returns `STALE_REQUEST`, skips the second inspection and performs zero writes. The fixture's `withLock` is mocked, so this is **not** proof of real-browser Web Locks scheduling or Safari behavior.

**Design implication:** any future destructive protocol must explicitly handle archived clients that can still write to v1 storage, including the interval after the final recheck; otherwise no commit safety guarantee is defensible. Possible research paths are (A) an independently enforced storage-generation fence understood by every supported writer, (B) a transactional new-origin/store cutover with explicit legacy quarantine and recovery semantics, or (C) keeping destructive recovery disabled while the legacy writer risk remains. None is approved or implemented. An ordinary localStorage marker or a cooperating lock alone cannot prevent a cached v1 writer that ignores them. A full-origin rollback also remains undetectable without an independent anchor.

## Alternatives and decision

- **A. Typed phrase then delete:** reject. The displayed snapshot can become stale; confirmation is not concurrency control.
- **B. Snapshot + proof + locked reinspection + explicit operation-specific consent:** recommended **necessary precondition for further design**, not sufficient to ship. A noncooperating cached v1 tab ignores the new lock, and independent localStorage/IndexedDB writes are not atomic.
- **C. Automatically complete/reset on ambiguous marker:** reject for future v2 recovery. Do not interpret a marker as fresh user consent for a new operation; investigate the existing v1 committed-reset behavior separately before changing it.
- **D. Ask the user to choose a verified encrypted backup:** potentially useful recovery path; selection must never silently overwrite origin data. Backup authentication and a safe transactional commit/acknowledgment protocol require separate tests.

## Before any WEB release

Prove actual v1/v2 cross-tab and cached-writer behavior, real AES-GCM source validation, password failure, backup import, tab close/reload, IDB denied/evicted/corrupt, no-Web-Locks, aborted and postcommit writes, stale asynchronous completions, browser crash, and accessible iPhone Safari/VoiceOver states. Resolve authority/provenance and full-origin rollback limits honestly. Define expected outcomes and user-visible consequences for reset vs restore; obtain explicit approval of any new destructive semantics. Only then implement an immutable versioned bundle and follow RELEASE_PROCESS.md (syntax, release, CI, Vercel exact SHA, served browser). The currently blocked Vercel build quota is **not** bypassed.

## Evidence and references

- [Existing conflict UX research](WEB_V2_CONFLICT_RECOVERY_UX_CONTRACT_20261029.md).
- [Full-origin rollback limitation](WEB_FULL_ORIGIN_ROLLBACK_LIMIT_20261031.md).
- [Unsupported IDB and late inspection results](WEB_READONLY_UNSUPPORTED_IDB_LATE_RESULT_GATE_20261031.md).
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) — coordinating participating tabs does not fence archived noncooperating code.
- [MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction) — atomicity applies to a transaction, not arbitrary localStorage/IDB combinations.

**Next step:** replace mocked preconditions with a *read-only* real-browser inspection and authenticated backup-verification fixture; reproduce a cached-v1 late writer between proof and commit boundary. Keep all destructive actions disabled until the operation contract and regression suite are approved.


## Actual Chromium authenticated-source / archived-writer validation (31 October 2026)

[PR #355](https://github.com/nikopol000/financial-autonomy-preview/pull/355) added [a separate browser test](../tests/browser-authenticated-consent-legacy-writer-research.cjs), executed by the Chromium workflow. Unlike the eleven-case Node gate above, this fixture uses the **active immutable WEB 18.66 Metro module 311** to create and authenticate a genuine password-protected PBKDF2 (600,000 iterations) / AES-GCM backup of a complete **synthetic v4** ledger. It also loads the **real archived WEB 18.33 modules 309/310/311** into a separate, disposable same-origin Chromium tab with explicit test-only real-mode opt-in. The archived tab does not cooperate with the experimental Web Lock.

Expected and observed boundaries on [PR head `10975b49`](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41199677886) (Chromium SUCCESS):

- Wrong password, modified ciphertext and absent Web Locks fail closed with **zero writes by the read-only gate**. A successful backup authentication is evidence of control of *that file*, not authority to erase local data or proof of latest ledger freshness.
- A genuine archived writer changes v1 ciphertext **while the new tab holds a real exclusive Web Lock**, before the final reinspection. The gate detects the change and returns `EVIDENCE_CHANGED`.
- The archived writer changes v1 ciphertext **after** the final locked reinspection. The gate can return `READ_ONLY_REVIEW_ONLY` based on the now-stale fingerprint. This is an intentionally **passing negative security finding**, not a successful reset/restore. The test asserts the returned fingerprint differs from current origin evidence and that the gate has no `commit` function or writes.
- Test data live only in disposable localhost Chromium contexts. No production bundle, backup format, storage schema, financial formula or user ledger changed.

**Design options remain:** (A) ship a typed-confirmation + Web Lock reset — **reject**, as the archived client ignores the lock; (B) add a cooperating generation/epoch marker — useful for updated clients but **insufficient** for cached v1 writers; (C) use a separate transactional authority with explicit legacy quarantine and independently reviewed migration/commit protocol — **research candidate**, not yet proven against all crash and legacy races; (D) keep destructive recovery disabled while source provenance and write fencing cannot be guaranteed — **safe current position**. Full-origin rollback cannot be detected reliably using only origin-local evidence.

**Next unfinished work:** a reviewed operation-specific reset/restore contract with explicit consequences and source selection; actual Safari iPhone/VoiceOver; tab-close/crash, no-Web-Locks and IDB-denial acceptance; and a proven way to prevent noncooperating cached clients from silently becoming authoritative. No destructive action is authorized by this research. The first CI attempt used an incomplete synthetic v4 fixture; a later attempt omitted the archived tab's explicit `fa_real=1` test opt-in. Both were corrected before the successful exact PR-head Chromium run. Do not misreport those red attempts as product regressions.
