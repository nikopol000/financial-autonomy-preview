# Archived WEB v1 writers across an experimental pending-reset boundary — 2026-10-30

**RESEARCH / TEST ONLY — issues #4, #29 and #35.** This is not a production fix, a release, a reset UI, a browser incident or a migration approval. Active WEB 18.64 and all financial formulas, actual ledger data, backups, iOS and local-only architecture remain unchanged.

## Question and reproducible test

Does an authenticated `pending` reset-intent in a new IndexedDB authority prevent a cached, non-cooperating WEB 18.27, 18.33 or 18.34 tab from writing the original AES-GCM `localStorage` KEY/PAYLOAD pair?

Test: `tests/browser-v2-restore-operation-witness-research.cjs`, function `testArchivedWriterAtPendingResetBoundary`. Disposable Chromium browser contexts, two actual tabs, synthetic transaction fixtures, archived immutable Metro vault modules 309/310/311. Each version is tested in two deterministic orderings:

1. **Legacy write before pending commit:** v1 source migrates into test-only IDB; cached v1 tab writes an additional transaction; v2 commits pending reset-intent against its original revision. This exposes the missing cross-store preflight/atomicity boundary.
2. **Legacy write after pending commit:** v2 commits authenticated pending reset-intent; cached v1 tab then saves an additional transaction, ignoring the new reset epoch.

For both orderings the assertions require actual v1 AES-GCM decryption of the new transaction, changed ciphertext, authenticated IDB pending witness after reload, `authenticated_legacy_divergence` from read-only inspection, and **byte-identical preservation** of both v1 and v2 stores during inspection. The synthetic v2 test harness is not the production application.

## Threat model and design alternatives

- **A. Keep both stores and classify read-only (safe interim research behavior):** never assume either snapshot is newest, never auto-delete, resurrect, merge or replay; offer an explicit read-only conflict/backup path after future UX review. This preserves evidence but cannot enforce a global reset.
- **B. Atomic IDB reset epoch with cooperative writers:** prevents new-version writes only; cannot fence a tab running archived v1 JavaScript. Requires a separate policy for old tabs and a tested cutover.
- **C. Single-record encrypted authority and explicit legacy retirement:** simplifies new-version atomicity, but browser-cached old tabs can still write their old storage keys. Cross-storage migration and deletion are not atomic. A one-time marker alone does not stop non-cooperating code.
- **D. Force-close/refresh older tabs:** broadcast/storage events and service-worker coordination are advisory; offline/background tabs and old code may ignore them. Not a correctness guarantee.

**No safe silent winner selection.** AES-GCM authenticity proves a record was created with the key, not that it is the most recent. Whole-origin rollback can restore internally consistent older snapshots; without an external trusted monotonic counter, local-only storage cannot prove absolute freshness.

## Proposed reset state contract — not approved for implementation

- **No confirmation:** read-only, no deletion; preview must not imply reset is pending.
- **User explicitly confirms reset:** record a precise operation ID, source revision, scope and epoch, and display the destructive consequences; a `pending` marker is not a completed deletion.
- **Pending:** stop cooperative writes; inspect both v1/v2 footprints. Any mismatch, orphan key, missing witness, storage denial or legacy writer must block automatic continuation and enter **unknown / read-only** state.
- **Committed:** only an authenticated operation witness and completed destructive transition may justify saying the reset finished. Do not resurrect intentionally deleted data. A completed IDB marker alone is not proof that legacy v1 keys were removed.
- **Unknown:** never retry deletion, restore from backup, overwrite, rekey, import, or choose the 'newest' copy automatically. Preserve available encrypted evidence and explain next safe user action.

## Acceptance still required before any production release

Cross-version cached tabs during/after pending and committed reset; failure injection at every IDB and v1 write/remove, quota and security denial, browser crash/reload, orphan key, concurrent cooperative writes, stale tabs, full-origin rollback; real browser storage behavior; Safari iPhone, VoiceOver and 200% zoom; user-readable nonjudgmental blocked/recovery copy; explicit review of destructive semantics. Test encrypted backup round-trip and immutable version/diagnostic before any product integration.

## Evidence and follow-up

Candidate test commit `16b1a2e67c77d60b7d636aa682e2453db98c2bcf`; CI and browser job outcomes must be verified separately before claiming a pass. Next: inspect exact GitHub Actions Chromium logs, correct any test defect, and update #4/#29/#35 and checkpoint files. Nonurgent #14 remains **DISCOVERY ONLY**; no budget modes or financial formulas until the user explicitly approves a numeric contract.
