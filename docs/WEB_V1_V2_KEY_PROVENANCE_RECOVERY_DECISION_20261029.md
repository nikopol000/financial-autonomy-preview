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
