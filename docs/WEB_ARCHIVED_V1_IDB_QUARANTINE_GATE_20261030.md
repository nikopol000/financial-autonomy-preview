# Actual archived v1 writers against read-only v2 quarantine — 2026-10-30

**P1 RESEARCH / TEST ONLY. NOT SHIPPED.** WEB 18.64 and the encrypted backup format remain unchanged. This experiment runs only with synthetic data in isolated localhost Chromium contexts; it does not open or mutate real financial data. Issues #4, #29 and #35 remain open.

## Concrete experiment

The repository retains the immutable archived WEB 18.27, 18.33 and 18.34 JavaScript bundles. `tests/browser-v2-restore-operation-witness-research.cjs` now extracts each archived **real Metro vault/platform/crypto module 309/310/311** (stubbing only financial model modules 204/205 for synthetic fixtures). A separate tab runs the existing **test-only** v2 IndexedDB authority + operation witness and read-only legacy classifier.

For each archived version, the browser test:
1. Creates a valid v1 AES-GCM KEY/PAYLOAD using the actual archived vault code, and records the exact encrypted baseline.
2. Migrates that v1 state into experimental IndexedDB without changing/deleting the v1 pair; verifies the operation witness and a baseline match.
3. Uses the still-open archived tab to save an additional synthetic transaction **after** v2 cutover; waits for cross-tab localStorage visibility.
4. Requires `authenticated_legacy_divergence`, byte-for-byte preservation of the new v1 ciphertext, and unchanged v2 authority + witness. The v2 operation can remain authenticated **while the two ledgers disagree**.
5. Deliberately restores the old v1 pair **in this disposable test origin only** and requires `legacy_matches_snapshot`, demonstrating that the classifier cannot prove recency or detect a reverted edit.

**Interpretation:** PASS on an archived late write or rollback is evidence of a *known unsafe legacy-client boundary*, not a production fix. A v2 transaction cannot fence a previously cached client that does not cooperate with v2. A match is only a comparison to an old fingerprint; it is not a proof that no intermediate edits occurred.

## Alternatives / decision gate

- Automatically pick the IDB copy: **reject**; an authenticated late v1 edit may contain legitimate user transactions.
- Automatically pick the v1 copy: **reject**; v1 could be older or intentionally reset and may not reflect v2 changes.
- Delete legacy KEY/PAYLOAD on migration: **reject**; IDB can be denied, evicted or rolled back, and deletion would destroy recovery evidence.
- Quarantine both encrypted copies and present a neutral conflict explanation: **candidate**, but only after tested read-only inspection, authenticated export/recovery, and accessible UI. Do not label either copy the newest.
- Automatically merge transactions: **reject** until a separate explicit accounting/duplicate/reconciliation contract is approved.

## Acceptance remaining before product wiring

- CI Chromium evidence for each actual archived version; independently verify the exact tested SHA and named PASS lines.
- Denied/evicted IndexedDB and unavailable storage, partial reset journal, complete-origin rollback, Safari iPhone/VoiceOver and enlarged text; no silent fallback to v1.
- Bind the baseline to authenticated v2 authority rather than accepting a caller-provided snapshot. Consider interrupted tab lifecycle and cross-tab races.
- Never auto-retry an ambiguous restore, erase KEY-only evidence, or claim local-only anti-rollback guarantees.

## Scope

No production bundle, `index.html`, release version, diagnostic, financial formula, real ledger, encrypted backup, iOS repository, backend, login, telemetry or bank connectivity changes. Issue #14 budget perspectives remain **DISCOVERY ONLY**, pending an explicitly approved numeric contract.

## Sources and prior evidence

- [Prior v1/v2 classifier and rollback blind spot](WEB_V1_V2_CONFLICT_QUARANTINE_RESEARCH_20261030.md)
- [Archived writer interleavings](WEB_REAL_ARCHIVED_V1_V2_INTERLEAVINGS_20261029.md)
- [MDN IndexedDB transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction)
- [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

Test outcome and CI run links will be recorded after execution, not assumed from this document.
