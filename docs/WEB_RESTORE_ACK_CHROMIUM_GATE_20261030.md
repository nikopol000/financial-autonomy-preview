# WEB 18.64 — actual Chromium restore acknowledgment integration (2026-10-30)

**Status: TEST-ONLY / P1 OPEN.** This is evidence for #4, #29 and #35, **not a shipped recovery mechanism**. No application bundle, index, diagnostic, version, financial formula, portable backup format, real financial data, iOS, backend or telemetry was changed.

## Exact checkpoint and verification

- Starting `main` SHA: `d3f018f89a1760f9b6ea035b481dc371323aa048`.
- [PR #296](https://github.com/nikopol000/financial-autonomy-preview/pull/296), exact final tested head `18ce99c7b3f4ee4a0a39870931cb8c6a82580962`; squash merged as `ab3dac7063cecf806bada18a64fbe2a97fdd75a2`.
- [Release CI #41012448709](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41012448709) **SUCCESS**; [Chromium #41012448734](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41012448734) **SUCCESS**. Four named PASS lines inspected in Chromium job `123921135036`. Independently verify CI/Pages on merged main and on this documentation checkpoint before declaring them successful.
- Initial Chromium attempt [#41012014400](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41012014400) failed because the test compared the restored vault against a raw backup fixture. Second attempt also failed: the UI's actual module 205 migration/normalization changes the authenticated state shape/values. This was a **test expectation error**, not evidence of a new production corruption. Final passing test independently decrypts the synthetic backup using real module 311 and applies real model migration (module 205) to define the expected state. This correction is essential; do not hide or repeat the false assumption.

## Four actual UI observations

The test `tests/browser-confirmed-backup-restore-faults.cjs` runs the **actual WEB 18.64** backup picker and explicit confirmation, not a mock restore UI. Each Chromium context uses synthetic isolated data. It evaluates the exact existing test-only `tests/support/restore-acknowledgment.cjs` source in-browser with a JSON-only deep-equality adapter; its read-only storage adapter rejects any attempted set/remove.

1. **Empty target + denied PAYLOAD write:** KEY remains but PAYLOAD is missing. The classifier returns `unknown`, zero probe writes. Existing blocked-vault UI preserves KEY evidence on reload; **recovery remains unimplemented**.
2. **Existing newer vault + denied PAYLOAD write:** encrypted bytes remain identical to the trusted pre-attempt footprint. Classifier returns `verified_unchanged`, zero probe writes; the newer transaction remains.
3. **Existing newer vault + PAYLOAD write-then-throw:** UI reports failure although older authenticated backup is present. Classifier returns `verified_target_present`, zero probe writes; **NOT proof of this attempt's commit or freshness**.
4. **Existing newer vault + post-write KEY read denial:** UI reports failure after PAYLOAD was saved. Once read permission is restored, classifier returns `verified_target_present`, zero probe writes. Do not automatically retry.

A valid AES-GCM payload proves authenticity relative to its key, **not recency**. The read-only classifier provides bounded evidence only; it is not durable transaction acknowledgment and is not imported into the shipped bundle. It must run under the same exclusive Web Lock as cooperating writers. Cached legacy tabs, full-origin rollback and a non-cooperating writer between observations remain unsafe.

## Architecture research and next step

[MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction) documents transaction abort behavior, including quota/I/O failure; [MDN IDBDatabase.transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction) describes the optional `durability: "strict"` hint. An atomic IndexedDB record for KEY, PAYLOAD, authority and a unique authenticated restore-operation witness is a **candidate for research**, not an approved implementation or guarantee against full-origin rollback. Never assume `complete` alone proves the latest ledger or an external recovery witness exists.

**Exact first unfinished P1:** prototype a backward-compatible atomic authority transaction in disposable Chromium, with a uniquely bound restore-operation ID and safe read-only KEY-only inspection. Test denied/partial writes, crashes and reopen, concurrent cooperating tabs, cached v1 late writes, and whole-origin rollback. Keep #4/#29/#35 OPEN. Do not auto-delete KEY-only evidence, auto-retry ambiguous restores, select a purported newest ledger or merge conflicting histories. Verify Safari/VoiceOver and authorized served browser separately.

**Nonurgent research:** #85 zoom/reflow acceptance updated with W3C WCAG 2.2 distinctions (200% text resize vs 320 CSS-px reflow). #14 budget perspectives remain DISCOVERY ONLY until explicit numerical contract and approval; no formula or mode changes.
