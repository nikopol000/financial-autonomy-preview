# Financial Autonomy — Web Premium Release History

## v18.29 — 2026-10-23 — active WEB editor, automated checks PASS; interactive browser OPEN
- Immutable active bundle: `_expo/static/js/web/index-v01829-multi-row-reconciliation-guarded-20261023.js`; HTML meta 18.29 / build 18.29.1 / diagnostic 18.29. Activation commit `8290d68c6caee1c304ce49e6849e05c9d6214c2d`.
- New user-visible screen from the existing Dashboard “Explică diferența” action **for cash/current/savings checks only**: add, edit, remove multiple income/expense rows with the check date, signed difference/explained/remainder, Cancel, and Save enabled only at zero remainder. Debt/credit checks retain their previous single-operation path. No financial formulas changed; the same `src/reconciliation-batch.cjs` and `src/reconciliation-draft.cjs` contracts are embedded in the immutable bundle.
- Save: re-read encrypted vault, reject stale ledger, stage the complete snapshot once, call existing encrypted application `onSave` once. If persistence throws after staging, freeze the draft, display the error, and require reopening rather than risking duplicate submission. Local-only; no real user data was accessed or changed by the development workflow. This is a best-effort single-tab guarded save, **not** a proven cross-tab atomic compare-and-swap.
- Automated verification for exact activation SHA: GitHub Actions `39950690986` SUCCESS; Python release/diagnostic consistency PASS, Node bundle syntax PASS, 12/12 reconciliation regressions, 11/11 encrypted-vault regressions, 28/28 batch/controller tests, **6/6 new simulated React editor tests** PASS. GitHub Pages build `39950689715` SUCCESS and active Pages deployment `39950690949` SUCCESS.
- Vercel production `dpl_AanfPkafjKtuQ8N7xutDdJftsDoC` READY on exact activation SHA; primary alias `financial-autonomy-preview.vercel.app` associated.
- Post-activation real-engine compatibility test: UI-shaped `financialRole:unbudgeted` expense and `financialRole:income` income rows reconcile correctly in actual v18.29 engine; commit `bcfb865a`, GitHub Actions `39950948282` SUCCESS (**29/29** batch/controller, 6/6 simulated UI). Vercel `dpl_769kwcGPiXsc6pueDnjUMRFPUzNi` READY for that test commit.
- NOT VERIFIED: actual served HTML/header, interaction in a real browser or iPhone viewport. Public fetch unavailable; Vercel authenticated fetch 403 and deployment file tree 404. CI simulation is not end-to-end browser proof. No isolated automatic demo yet.
- Rollback: revert only `index.html` to the prior immutable v18.28 bundle reference; do not clear local storage. Keep the v18.29 bundle for audit.
- NEXT FIRST: independent served HTML/header and interactive reconciliation test with fresh synthetic vault; verify reload/history/void behavior in browser, including failure handling, then audit isolated demo eligibility/legacy keys. If browser access stays blocked, continue isolated test/audit work; do not claim full UI verification. Do not touch iOS.

## v18.21 — 2026-10-22 — candidate, verification pending
- Baseline: v18.20 archive, source HEAD `ecc84e551208848399b71c77e821fc4b821db797`.
- Accessibility shell: Romanian document language, metadata, keyboard focus, high-contrast and reduced-motion support, localized noscript.
- Application logic: unchanged; diagnostic version/name only in new archived bundle.
- Verification: V8 syntax parse passed locally; CI, Vercel deployment, browser/Work review pending.
- Rollback: retain prior v18.20 bundle and index pointer; restore prior index.html from baseline commit if required. Do not reset local data.
- Next: verify exact deployment, capture results, then take up confirmed Work review findings.
