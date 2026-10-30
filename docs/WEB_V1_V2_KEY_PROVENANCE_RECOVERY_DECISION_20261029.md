## 2026-10-30 — actual existing-vault confirmed restore fault matrix and acknowledgment ambiguity

[PR #286](https://github.com/nikopol000/financial-autonomy-preview/pull/286) extends the real WEB 18.64 Chromium backup-picker and confirm regression with a **nonempty authenticated two-transaction** synthetic vault and an explicitly selected **older one-transaction** encrypted backup. Candidate `f941193cb2b4c97cf046e89d014c2f3e0df913b1`: [Release #40983513921](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40983513921) and [Chromium #40983513953](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40983513953) SUCCESS, named PASS in job `123828973261`. The initial candidate's [failed Chromium #40983311974](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40983311974) revealed an invalid test assumption: **existing-vault saves reuse the original AES-GCM key; they do not write a new key**. The test was corrected, not the product.

| Existing-vault confirmed restore fault | Observed in disposable real Chromium | Meaning |
| --- | --- | --- |
| Atomic PAYLOAD `setItem` denial | Original KEY, PAYLOAD and RESET byte-identical; later live transaction survives reload | This specific native-compatible failure does not damage an existing authenticated v1 pair. |
| Deliberately nonconforming PAYLOAD write-then-throw | KEY unchanged; older backup ciphertext committed; UI reports failure; reload authenticates the older one-transaction state | **Ambiguous acknowledgment:** an error alone does not establish whether the explicit restore committed. This is a test-shim adversary, not a claim about native Storage partial writes. |
| Empty-target PAYLOAD denial (PR #284) | New KEY exists without PAYLOAD; reload blocks | **KNOWN UNSAFE** first-restore footprint remains separate from the existing-vault case. |

**Design recommendation:** do not rotate the existing v1 AES key merely to restore a portable backup; do not infer success/failure solely from a thrown write. Under an exclusive lock, verify the authenticated persisted state and exact expected ciphertext/commit identity before reporting success, and preserve all original encrypted evidence when verification is unavailable. A first-save KEY-only origin cannot be automatically distinguished from lost pre-existing ciphertext; never auto-delete its key or fabricate a new ledger. A safe staged single-record/IDB migration needs its own crash matrix, legacy-tab fencing and explicit approval of storage semantics. No production fix, no guarantee of recency, no Safari/VoiceOver validation.

## 2026-10-30 — actual browser validation/cancellation of authenticated older backup

[PR #282](https://github.com/nikopol000/financial-autonomy-preview/pull/282) adds a real WEB 18.64 Chromium UI test, unlike the earlier Node VM-only older-backup case. A password-authenticated **older** one-transaction backup is selected against a separately encrypted **newer** two-transaction live vault in an isolated disposable browser context. Actual file-picker validation and explicit cancellation perform zero writes to KEY/PAYLOAD/RESET, leave the live ciphertext byte-identical, revoke the confirm action and preserve the later transaction after reload. Exact candidate [Chromium #40970780791](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40970780791) and [Release #40970780812](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40970780812) SUCCESS; named PASS inspected in browser job `123786675220`.

**Limit:** this is not a restore-fault test, not a freshness oracle, and not evidence that replacing an existing newer ledger is safe. Continue with fault-injected confirmed restore in an isolated empty destination, partial storage denial and IDB interruption; preserve original ambiguous vault bytes. No product release, formulas, iOS or backup-format changes.

## 2026-10-30 — authenticated but older backup / isolated destination regression

[PR #280](https://github.com/nikopol000/financial-autonomy-preview/pull/280) adds a Node VM test against actual WEB 18.64 bundled modules 310/311: a valid encrypted portable backup of synthetic ledger S decrypts correctly while the original local AES-GCM vault contains S plus a later transaction T. The test verifies **zero writes** and byte-identical preservation of the original live key/ciphertext during backup validation; after an explicit *test-only* choice, S is saved to a separate empty storage adapter and the original still decrypts to S+T. This demonstrates the need to distinguish *authenticated* from *newest*, and to avoid automatic overwrite. It does not detect full-origin rollback, resolve v1/IDB key provenance, create a browser-profile restore UX or prove Safari/VoiceOver behavior.

Exact candidate [Release CI #40963364596](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40963364596) **SUCCESS** with named test PASS and **66/66 bundled** cases in job `123761533234`; merged-main/checkpoint CI are separate. No production storage change or new product version. Next acceptance: actual browser-level restore validation/cancel, separate disposable origin, storage denial and interrupted writes; preserve ambiguous evidence without claiming a freshness oracle.

# WEB #4/#29/#35 — key provenance and recovery-source selection (research, 2026-10-29)

**Status: analysis / acceptance contract, not a production migration or a claim of freshness.** Active WEB 18.64 remains unchanged. No real financial data, iOS, formulas, backup format, backend, bank connection or telemetry were touched.

## Verified code facts versus assumptions

Read the actual immutable `index-v01864-backup-async-epoch-20261029.js`, Metro modules 309–311, and the repository's existing AES-GCM/Chromium regression evidence.

- The **v1 live vault** uses two independent `localStorage` values: `financial-autonomy.preview.key.v1` (64 hexadecimal characters, 32-byte raw AES key) and `financial-autonomy.preview.payload.v1` (AES-GCM encrypted envelope). A matching pair that decrypts authenticates the plaintext *under that key*; it does **not** prove which browser tab wrote it, whether it is the latest ledger, or whether an origin-wide snapshot was rolled back.
- The reset protocol uses `financial-autonomy.preview.reset.v1` and a committed marker. A partial reset is not automatically equivalent to a new, empty ledger. Web Locks serialize **participating** tabs, but cannot make multiple `localStorage` operations atomic and cannot compel an already-open legacy tab to cooperate.
- The **portable encrypted backup** is a *different* envelope: `format: FinancialAutonomy`, `version: 1`, `kdf: PBKDF2-SHA256`, 600,000 iterations, 16-byte salt, 12-byte nonce, password-derived key, AES-GCM ciphertext. Module 311 validates the decrypted financial state. A portable backup's successful authentication establishes integrity under the supplied password, **not** recency or automatic authority over an existing origin.
- The **experimental v2 IndexedDB authority** and v1-pair SHA-256 fingerprint are research fixtures only. A cached v1 writer can change `localStorage` after a final check. Restoring both IDB and v1 together to a valid older snapshot can pass all local checks (three archived-version `PASS KNOWN UNSAFE` tests in PR #276). No origin-local timestamp, revision, key, fingerprint or reset marker is a non-rollbackable witness.

## Provenance / recovery decision matrix

| Observed footprint | What can be established | Default action | Explicit user path, if any |
| --- | --- | --- | --- |
| Authenticated current v1 key + payload, no conflicting v2 witness | This pair decrypts to a valid financial state | Existing read-only inspection; writes only under current lock/revision contract | Password-protected portable backup of this *explicitly selected* authenticated state |
| Key only (#35 or #29) | A key exists; missing ciphertext could mean interrupted creation **or** later loss | Block, preserve exact key and reset marker; no key regeneration | Existing bounded same-tab retry only if a live, exact prepared ciphertext token is valid; otherwise no automatic reconstruction |
| Payload only | Ciphertext exists but its matching key is unavailable | Block, preserve ciphertext | Separately supplied valid portable backup may be examined **in an isolated destination**, not imported into the ambiguous origin |
| Both present, authentication fails | Stored pair cannot be authenticated as supplied | Block, preserve both | Inspect a separately supplied backup; no blind replacement |
| v1 and authenticated IDB disagree | At least two incompatible representations exist | Quarantine both, no automatic winner, no reset or merge | Present source descriptions without claiming recency; validate a user-selected portable backup separately |
| IDB missing/denied after prior cutover | Current v2 authority cannot be verified | Block, do not initialize a new ledger | Retry non-mutating read; inspect backup in a separate empty origin |
| Complete older v1 + IDB snapshots replayed together | They can be mutually authentic but stale | **Cannot reliably detect origin-wide rollback** | State limitation honestly; user compares independent dated backups if available |
| Portable backup passes password, schema and state validation | This file contains an authenticated financial state | No mutation of original storage | User explicitly chooses an isolated restore target after reviewing the consequences; valid file is not automatically newest |
| Portable backup wrong password, malformed, tampered, unsupported or oversized | Parser rejects or authentication fails | No restore, no storage write | Choose a different file/password; do not erase ambiguous local evidence |

**Key distinction:** a raw live AES key is *not* a portable backup or a trusted freshness anchor. A separately saved encrypted backup is an independently held candidate for recovery, but its filename/date can be changed and must not be treated as a cryptographic clock.

## Implementation alternatives and recommendation

**A — automatic selection by revision, modification time or digest:** reject. Local counters and timestamps roll back with their stores; equality cannot establish which of two valid ledgers is newer.

**B — copy or auto-merge transactions from v1 into v2:** reject as a default. Duplicate IDs, voids, checks, resets and simultaneous stale writes can silently corrupt financial meaning.

**C — explicit read-only conflict quarantine + separately validated, user-chosen portable backup:** **recommended next incremental direction**. Keep both encrypted witnesses untouched. Make the blocked state explain what is known and unknown, show no unverified balance, permit only non-mutating recheck and technical details, and require explicit confirmation before restoring into a **separate empty/disposable origin**. A later migration to IDB authority requires its own reviewed cutover and cached-tab safety contract; this note does not authorize shipping v2.

**D — server-backed monotonic counter:** could address some freshness questions but violates the product's local-only invariant; not an acceptable workaround.

## Tests and remaining acceptance gates

The existing `tests/vault-real-crypto-regression.cjs` already validates a real bundled PBKDF2/AES-GCM backup roundtrip into independent synthetic storage while keeping an orphan-key origin unchanged. This follow-up adds **one** test with six invalid inputs (truncated JSON, unsupported format/version/KDF, malformed salt, oversized file) and asserts no mutation of either an orphan-key origin or an authenticated synthetic vault. It tests the actual module-311 parser in Node VM; **it does not simulate user-driven restoration in Safari**. Verify CI on the exact PR head before claiming PASS.

Before any production recovery flow: browser-level actual module-311 validation, wrong password and tamper; interruption at each v1 key/payload/reset-marker write; legacy-tab late write; full-origin replay; IDB denial/eviction; a separate restore destination; cancellation with zero writes; 320/390 light/dark, keyboard and Safari iPhone VoiceOver. A successful Chromium or Node test is not Safari durability evidence.

Related: [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35), [conflict UX proposal](WEB_V2_CONFLICT_RECOVERY_UX_CONTRACT_20261029.md), [full-pair rollback characterization](WEB_V2_IDB_PRIMARY_TRANSACTION_RESEARCH_20261029.md).

**Financial contracts #14, #25 and #2 remain DISCOVERY ONLY.** No new budget perspectives or formulas are authorized by this research.

## 2026-10-30 — confirmed portable restore, actual WEB 18.64 Chromium storage faults

[Test-only PR #284](https://github.com/nikopol000/financial-autonomy-preview/pull/284), squash `f3b423b794fc17933c36895292ee57656ce31578`, added `tests/browser-confirmed-backup-restore-faults.cjs` to the real Chromium workflow. Exact PR head `22d628ca16bb7c5e2efe6640c039eea3e6666e23`: [Release CI #40977342239](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40977342239) and [Chromium #40977342264](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40977342264) **SUCCESS**. Chromium job `123808543112` log explicitly contains three named PASS results. Tests use the actual WEB 18.64 UI and PBKDF2/AES-GCM backup parser with one synthetic account and expense, disposable isolated localhost Chromium contexts and injected `Storage.prototype.setItem` exceptions. No real data or product code changed.

- **KEY write denied before commit:** no key, payload or reset marker; after removing the fault, explicit revalidation/confirmation in the same isolated profile restores a valid encrypted ledger, which survives reload.
- **PAYLOAD write denied before commit — KNOWN UNSAFE:** a new key persists without its matching ciphertext; the next page load blocks the vault and preserves the orphan key. This is an **actual UI failure characterization**, not a safe restore implementation or evidence of lost real data. Do not silently clear or replace the key, and do not report that restoration is atomic.
- **PAYLOAD persisted then threw:** the UI reports failure even though the authenticated pair survives and loads after reload. A thrown exception alone cannot prove whether a write committed. Do not automatically repeat a restore on that assumption.

**Decision boundary:** the current v1 restore flow lacks an atomic key+payload commit. Before any production change, specify an explicit nondestructive recovery UX for KEY-only state, a durable commit/ack protocol and fault tests for both write orders, plus a cached-tab and IndexedDB interruption matrix. Keep v1 evidence untouched until a separately approved migration protocol. Safari iPhone, VoiceOver, real user storage durability and full-origin rollback are still unverified. #4/#29/#35 remain OPEN.
