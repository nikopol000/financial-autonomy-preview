# WEB 18.64 — atomic IndexedDB restore-operation witness research (2026-10-30)

**Status: RESEARCH / TEST ONLY.** This is not a shipped recovery fix. Issue #4, #29 and #35 remain P1 open. Starting main HEAD: `a8a9f495f8b10faa8dbcba007b4204b0c2804825`. Candidate [PR #298](https://github.com/nikopol000/financial-autonomy-preview/pull/298). Only the disposable Chromium research test and its CI workflow are changed; the WEB 18.64 product bundle, index, diagnostics, financial formulas, actual ledger, encrypted backup format and iOS are untouched.

## Problem

Current v1 first-save and confirmed restore write the key and ciphertext as separate localStorage operations. A denied second write can leave KEY-only storage; an error after successful ciphertext write can be reported as failure even when the chosen older backup is present. A read-only classifier can authenticate the target but cannot prove that the *specific* restore attempt committed.

## Experiment

`tests/browser-v2-restore-operation-witness-research.cjs` opens a disposable localhost Chromium origin. It uses **synthetic state only**, random local AES-GCM key material, and a test-only IndexedDB database with `vault` and `operations` stores. The test binds the operation ID and revision inside the AES-GCM plaintext, stores key + IV + ciphertext + revision as one vault record, and stores a digest/revision operation witness in **the same readwrite transaction**. No WebCrypto awaits occur while the IDB transaction is live. The caller compares the full preflight record inside the transaction and rejects stale writes or reused operation IDs.

The read-only acknowledgment checks a single consistent IDB readonly transaction, the unique operation witness, the exact vault-record digest and authenticated AES-GCM state. It distinguishes `verified_committed_operation`, `verified_unchanged` and `unknown` **within the observed local origin**. It performs no retry, deletion, repair, import or merge.

### Intended Chromium acceptance

1. Initial KEY/PAYLOAD/authority and operation witness commit together; a second tab authenticates the exact operation.
2. Explicit abort before and after queued writes leaves the previous record byte-identical and no partial witness.
3. A deliberate exception **after** IDB `complete` can be acknowledged by operation ID after reload, without repeating the restore.
4. Reusing the same operation ID is rejected with no ledger change.
5. A stale second tab is rejected; its attempted operation remains `unknown`, never silently replayed.
6. Deleting the operation witness in the synthetic origin forces `unknown`, not repair or success.

**Verification:** inspect the exact candidate GitHub Actions Chromium and release checks and named PASS lines before claiming any case passed. A local Node syntax check passed; the local browser execution could not run because the environment blocked localhost navigation. This is not evidence of a Chromium test pass.

## Alternatives and limits

- **Two independent localStorage writes:** cannot provide atomic key/payload/operation acknowledgment.
- **One IDB vault record without operation witness:** atomic key/payload, but cannot attribute a matching post-error state to the exact operation.
- **Two IDB stores in one transaction (this experiment):** provides a candidate atomic operation witness within a live origin; requires rigorous migration and crash/eviction/legacy compatibility.
- **External trusted freshness service:** incompatible with the agreed local-only/no-backend product.

[MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction) documents transaction abort and event-loop constraints. [MDN transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction) documents `durability: "strict"` as a **hint**, not an unconditional guarantee against power loss. `complete` and an authenticated witness do not establish that a backup is the newest ledger or protect against a full-origin rollback. Same-origin malicious code, browser storage eviction, Safari iPhone, actual OS crash, quota failures and cached v1 localStorage writers remain unresolved. The prototype intentionally stores key material in the same test-only record; a production key-provenance and export design is still needed.

## Decision / first unfinished work

Do **not** wire this research adapter into the shipped bundle. First inspect CI, then test a real portable encrypted backup roundtrip, failed migration and KEY-only inspection without deletion, partial reset, cached 18.27/18.33/18.34 writer after v2 cutover, read denial/eviction, full-origin rollback and Safari durability. Design explicit nondestructive conflict/recovery UI and authenticated operation-ID generation before a production v1→v2 transition. No automatic restore replay or silent choice of the newest ledger. #14 perspectives, #25 card overpayment and #2 historical-check formulas remain discovery-only pending explicit numeric contract.
