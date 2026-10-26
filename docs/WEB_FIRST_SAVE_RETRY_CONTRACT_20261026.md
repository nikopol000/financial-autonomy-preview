# WEB 18.51 — Bounded first encrypted save retry: implemented contract and evidence
Date: 2026-10-26 · scope: preview WEB only · issue: #35 · status: PARTIAL MITIGATION

## Verified release
- Product merge: `57c2f7a3c6f242012a17944731e300e79c86e709` (PR #115).
- Active `index.html`: metadata `18.51`, immutable bundle `_expo/static/js/web/index-v01851-bounded-first-save-retry-r2-20261026.js?build=18.51.2`.
- Diagnostic version and export filename: 18.51.
- Candidate [release](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40347780562) and [Chromium](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40347780554): SUCCESS.
- Exact merged-main [release](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40348156975), [Chromium](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40348156896), [Pages](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40348156983), [Pages build](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40348154861): SUCCESS.
- Vercel deployment list returned 403 and hostname lookup 404; production READY and served header are **not** confirmed. Safari iPhone and end-to-end touch UX not confirmed.

## Financial data and security invariants
- WEB local-only; no account, backend, analytics, bank connection or plaintext staging.
- Only a first real save after a successfully loaded empty vault is eligible for a retry handle. Existing ciphertext is never overwritten by this path.
- Module 310 prepares an AES-GCM envelope before writing; module 309 may retain its exact key hex + encrypted envelope **only in volatile tab memory** when a write reports an error and the post-error KEY/PAYLOAD/reset values exactly match the captured first-write authority.
- The user receives an explicit, accessible retry button; retry is **not automatic**. Retry runs under the existing origin-wide exclusive Web Lock and rechecks KEY/PAYLOAD/reset. It writes only a missing PAYLOAD. An exact already-present PAYLOAD is authenticated without another write. Success refreshes the writable revision and consumes the handle.
- Handle eligibility ends after 120 seconds, pagehide, hidden visibility or relevant cross-tab storage event. It is also checked **inside** the Web Lock after any queue delay.
- Changed epoch, key, ciphertext, unavailable storage, lost handle or invalid authentication blocks the operation without speculative cleanup or reset. The app does not change encrypted backup format or real financial formulas.

## Tests and limits
- `tests/vault-first-save-retry-production.cjs`: 7 synthetic Node/VM tests against real active modules and real AES-GCM; covers first PAYLOAD failure/retry, write-then-throw/no second write, changed epoch/key/payload, pagehide, queued lock, and denied reads.
- `tests/browser-vault-recovery-smoke.cjs`: real Chromium first-save failure, bounded retry and authenticated reload, plus exact already-committed ciphertext validation; existing orphan KEY-only after reload remains blocked. Named Chromium PASS logged.
- Existing 46-case AES-GCM regression, reset-epoch and cached-legacy compatibility, demo isolation and budget tests remain in release CI.
- **Not solved:** after reload, KEY-only could be a failed first write **or** externally missing ciphertext. The product cannot safely infer provenance and will not delete the key or create a new ledger. There is no post-reload automated recovery.
- **Not proved:** Safari/iPhone, production Vercel served artifact, touch button ergonomics, real user storage failures. Faults were deliberately injected into synthetic test storage; they are not claims of actual browser failures.

## Alternatives considered
1. Volatile, bounded same-tab retry (**chosen**) — no new persistent authority; useful when the original tab is still open, but cannot repair reload cases.
2. Persistent staged ciphertext journal — may survive reload, but introduces dual authority, migration, reset-resurrection and legacy-tab risks; **not approved**.
3. New atomic single-record vault format — can reduce two-key write exposure but requires schema migration, rollback and legacy compatibility proofs; **not approved**.
4. Automatic deletion/recreation of orphan KEY — **rejected**, because the missing ciphertext may belong to real data.
5. Manual encrypted backup restore in a separate clean environment — potential recovery route only after explicit user action; do not silently mutate blocked origin.

## Follow-up
1. Independently verify served WEB 18.51 HTML/header and Vercel READY when access permits; do not bypass deployment protection.
2. Real iPhone Safari light/dark, VoiceOver and zoom tests for the retry message/button, plus explicit expired/hidden-tab UX.
3. Continue issue #35 for safe KEY-only post-reload provenance contract; no automatic repair without proof.
4. Review nonurgent #17/#85 UX and #14 financial contract separately. Issue #14 remains DISCOVERY, with no budget mode/formula implementation until explicit user approval.

## WEB 18.52 addendum — non-bubbling document visibility lifecycle (2026-10-26)

The WEB 18.51 implementation attached its `visibilitychange` handler to `window`. Browser visibility changes are dispatched on `document` and do not bubble; therefore hiding a tab did not reliably revoke the volatile first-save retry handle. [PR #117](https://github.com/nikopol000/financial-autonomy-preview/pull/117) corrects the listener target in immutable WEB 18.52. The AES-GCM envelope, reset/epoch checks, 120-second limit, exclusive Web Lock, pagehide and cross-tab storage fences remain unchanged.

Regression evidence: 8/8 production-module Node/VM tests, including a document-only non-bubbling event, and disposable real Chromium event dispatch with a synthetic first-PAYLOAD failure, denied retry and **no KEY/PAYLOAD/RESET writes**. Exact merged-main [Release 40350567552](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40350567552), [Chromium 40350567499](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40350567499) and [Pages 40350567441](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40350567441) passed. The Chromium event is deliberately dispatched for deterministic coverage; **actual Safari/iPhone background behavior remains unverified**. Vercel status on the product SHA is `build-rate-limit` FAILURE; do not claim public production deployment. Post-reload orphan KEY-only provenance remains unresolved and issue #35 stays OPEN.
