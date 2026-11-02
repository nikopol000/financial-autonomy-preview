# WEB 18.73 — P1 mobile reset-error acceptance gate (2026-11-03)

## Source and checkpoint
- Product release: [PR #489](https://github.com/nikopol000/financial-autonomy-preview/pull/489), merged product SHA `db6bace92c1bcc533d74b88f192212e12c482a5d`; docs checkpoint `8a2e157efa2a9baf058121d5365b09a3e145e72e`.
- **Merged-main CI independently checked this run:** [Release #41545480722](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41545480722) job `125619904435` SUCCESS; [Chromium #41545482112](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41545482112) job `125619908968` SUCCESS; [Pages #41545480752](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41545480752) SUCCESS; [Pages Build #41545479971](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41545479971) SUCCESS. Release log reports 73/73 bundled AES-GCM/cross-tab synthetic tests, including explicitly KNOWN UNSAFE legacy characterizations. A passing characterization is **not** evidence the legacy risk is fixed.
- Vercel deployment `dpl_5y86V2Lgf1LHcE5FLDFhrfvNF8As` independently inspected: production READY, Git SHA `db6bace92...`, primary alias assigned. This proves deployment metadata, **not** that public HTML/header was fetched or that a user-facing interaction was tested. Served URL unavailable to the current browser; deployment file-tree endpoint returned 404 for this Git deployment.
- Current `index.html` metadata: WEB 18.73 and immutable `index-v01873-reset-error-visibility-20261103.js` bundle. No new product version in this test PR.

## New research — PR #491
The existing Chromium test proves one actual Settings reset LockManager denial in WEB 18.73, modal dismissal, assertive alert, keyboard focus, zero protected writes and AES-GCM authenticated reload. It does **not** prove that the focused warning is discoverable at 422px height, 320px width, in both color schemes.

New `tests/browser-p1-reset-alert-mobile-research.cjs` runs eight independent disposable browser contexts: widths 320/390, heights 422/844, light/dark system preference. Each creates an encrypted synthetic RON fixture, reloads, closes the recap through real pointer controls, opens Settings reset, denies the exclusive Web Lock, and checks:
1. confirmation closes; alert has `role=alert`, `aria-live=assertive`, and receives keyboard focus;
2. message truthfully says reset not confirmed / data state uncertain, never claims intact data;
3. one lock request and **zero** protected KEY/PAYLOAD/RESET writes;
4. SHA-256 of protected ciphertext entries unchanged and original synthetic ledger authenticates after reload;
5. viewport rectangle, center hit-test, focus and theme preference are logged; synthetic screenshots retained.

**Acceptance distinction:** assertions 1–4 are strict safety regressions. Geometry/hit-test flags are **research observations** pending review; do not count a CI green status as full visual or Safari/VoiceOver acceptance. The test does not modify any product code, formula, real data, encrypted backup or iOS.

## Residual P1 risks and exact next step
The active 18.73 `faExclusiveVaultWrite` protects only cooperating tabs with Web Locks. Cached 18.27/18.33/18.34 writers do not necessarily honor its lock/revision/reset markers. The v1 KEY/PAYLOAD split remains nontransactional: `faFinishCommittedReset` writes pending marker, deletes PAYLOAD, deletes KEY, then commits idle marker; failure after the first deletion leaves ambiguous local state. First-save KEY-only state is also ambiguous after a reload. Do not automatically delete/rekey/replay/restore or declare newest data without a reviewed recovery and origin-handoff contract.

**Next:** inspect exact PR-head Release/Chromium CI and all eight named mobile results. If failures reveal actual layout/accessibility defects, isolate a minimal UI-only fix with regression tests; if the test harness is at fault, correct it without weakening no-write/authenticated-reload assertions. Only merge a verified test PR, then update #4/#29/#35 and continuity. Safari/VoiceOver and served-browser checks remain separate. #14/#25/#2 financial semantics remain DISCOVERY, no formula or budget mode changes.
