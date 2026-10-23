# Financial Autonomy — Web Premium Release History

## 2026-10-23 — v18.33 unchanged; synthetic AES-256-GCM verification only (no release)

- Added eight regression cases using the **actual bundled** AES-GCM and vault code, cross-checked against Node/OpenSSL; synthetic save/reload/edit, tamper and write-failure preservation, and explicit real-mode reload PASS. No application code, version, diagnostic or iOS change.
- Test/CI commits `7aef117d`, `ccd5ddee`, `c61a32bb`; GitHub Actions `40008454004 SUCCESS`; Pages deploy `40008454151 SUCCESS`, Pages build `40008455526 SUCCESS`; Vercel production `dpl_2psQskBEmAoWz6qXMS424m6zcxEH READY` for `c61a32bb` and primary alias.
- Interactive browser, actual browser crypto execution, mobile visual review and cross-tab atomicity remain **unverified**. Keep v18.33 active until a substantive, independently testable change warrants a new immutable release.


## v18.33 — 2026-10-23 — fail-closed preload save before demo startup; CI/Vercel PASS, browser OPEN

- Reproduced on real v18.32 platform module: an early direct `save` on empty localStorage reached the real vault writer once before `load` could initialize demo. Immutable v18.33 adds a conservative guard that rejects this path; explicit `fa_real=1`, confirmed exit, existing-vault saves and demo memory edits remain allowed. Independent V8 probe on v18.33 confirmed **zero** real-vault writes for the same case. This is API-level safety hardening; normal UI exploitability is not established.
- Candidate `_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js` at `ed015a21`; activated HTML `f5dca7e1`. Added six regression scenarios and corrected test VM isolation (`76b706f6`). Candidate CI **40000283633 SUCCESS**; active CI **40000400577 SUCCESS**. Updated active demo integration regression to follow the HTML version rather than stale v18.32. HTML/bundle/build/diagnostic JSON and diagnostic filename all **18.33**.
- Vercel production **dpl_E3UXJimCmHEo3RZ4UzMmn3pvTC6K READY**, exact activation commit and primary alias confirmed. Pages build/deploy not yet terminal at last check. Browser-served HTML/header, real AES-GCM E2E and iPhone viewport remain unverified (protected fetch unavailable). No financial formula, real user data or iOS change.
- Rollback: point `index.html` to immutable v18.32, but doing so reopens the confirmed preload-write bypass; prefer forward correction. NEXT: finish Pages verification, interactive synthetic browser demo/real transition and crypto E2E, then priority premium UX.


## v18.32 — 2026-10-23 — isolated memory-only DEMO activated; CI/Pages/Vercel PASS, browser OPEN

- Continued from v18.31 tested demo contract; immutable candidate `_expo/static/js/web/index-v01832-isolated-demo-20261023.js` (corrected candidate `d038e203`), activated by `index.html` commit `12253a14802357219b0f566f5371a2c57fb7a308`. Auto demo only on completely empty inspectable same-origin storage; 2 synthetic accounts and 3 synthetic transactions, cloned in-memory updates through real financial engine. DEMO badge and explicit confirmed real-mode transition; concurrent storage invalidates demo.
- Demo guards: platform denies backup, import and reset; Tools blocks direct diagnostic export and disables backup/restore/diagnostic buttons. Diagnostic filename fixed from stale v18.26 to **v18.32**; JSON version, HTML metadata, immutable JS filename and build query all **18.32**. No accounting formula or iOS changes; no real data accessed.
- Test evidence: new `tests/demo-web-integration-regression.cjs` 10/10 PASS on candidate; GitHub Actions candidate **39992200298 SUCCESS**, active **39992571960 SUCCESS** (release/syntax and existing suites). GitHub Pages build **39992571276 SUCCESS**, active deploy **39992571968 SUCCESS**. Vercel production **dpl_993zu7erx2EJFZsxAFfq7vx8RRGN READY** for activation SHA, primary alias associated.
- NOT VERIFIED: real served HTML/header, interactive browser/mobile visual behavior, actual AES-GCM browser persistence; protected fetch **403**. Cross-tab atomicity not established; financial issue #2 still contract-gated. Rollback: restore index pointer to immutable v18.31 without clearing storage, but fresh-browser automatic demo would disappear. NEXT: browser smoke tests with synthetic vault, explicit real-mode transition, and export blocking; then address concrete UX issues and AES-GCM E2E.

## Non-release verification checkpoint — 2026-10-23 — isolated in-memory demo contract

- No new preview version: **v18.31** remains active. Added `src/demo-session.cjs` (synthetic seed generated with real financial engine, memory-only edits, fail-closed storage checks, no backup/diagnostic export, explicit exit and real-mode confirmation), `tests/demo-session-regression.cjs` (10 synthetic scenarios), and a permanent CI step. Commits `6668f262`, `4555505d`, `028d9c66`.
- GitHub Actions **39983762929 SUCCESS** with new step PASS; Pages build **39983762241 SUCCESS** and deploy **39983763160 SUCCESS**; Vercel production `dpl_BFiUbZddVPFbvfMsT3phJywF4SUv READY` on exact CI commit. No actual demo UI activation, no data writes or iOS/formula changes.
- OPEN: interactive browser/real AES-GCM E2E; integration must guard every save/export/backup/restore/reset entry point. Separate diagnostic filename mismatch (download still v18.26; JSON version 18.31) to correct during next meaningful release.
- NEXT: integrate isolated demo into React startup and mode controls, test fail-closed storage/backup and UI behavior, release immutable synchronized v18.32 only after checks.



## v18.31 — 2026-10-23 — existing corrupted ciphertext preserved; CI/VERCEL PASS; browser OPEN

- Fixed issue #3: in v18.30 a direct `saveWebVault` could overwrite nonempty ciphertext that `loadWebVault` rejected. New immutable bundle `_expo/static/js/web/index-v01831-vault-corrupt-guard-20261023.js` candidate `cd39f698`, activated by `index.html` commit `af2187c1`. Before updating an existing vault, the save path decrypts/authenticates, parses, migrates and validates the old state, failing closed without writes on any error. Key bytes are zeroized on guard failure. No accounting formula, actual user data or iOS modifications.
- Added 13 synthetic regressions `tests/vault-corrupt-save-regression.cjs` at `12d15a61`; candidate CI `39974839264 SUCCESS`, active CI `39974952214 SUCCESS` after `246a2e3a`, including Python release consistency, Node syntax, existing vault/reconciliation/history/demo suites. HTML version 18.31, build 18.31.1, diagnostic 18.31. Vercel production `dpl_D7L9FkvSEhsGRSdr55sQQtnF7WWm READY` on `246a2e3a` with primary alias.
- NOT VERIFIED: interactive browser/served header and actual AES-GCM E2E; public fetch disabled. Pages runs `39974951505` / `39974951946` were still in progress at checkpoint. Decrypt-on-save performance for large ledgers and cross-tab atomicity remain open.
- Rollback: restore `index.html` pointer to v18.30 immutable bundle without clearing local storage, **but v18.30 reintroduces the confirmed corrupt ciphertext overwrite path**. Prefer a forward fix if needed.
- NEXT: Pages/browser evidence, real crypto regression, then memory-only isolated demo with explicit exit/start-real and backup/export exclusion; financial issue #2 remains contract-gated.


## v18.30 — 2026-10-23 — vault key/payload presence safety, automated checks PASS; browser OPEN

- Data preservation fix: v18.29 interpreted a present empty ciphertext value as absent; when no key existed, load returned a new empty ledger and direct save wrote a replacement key/payload. Independently reproduced on actual v18.29 vault module (2 writes). On exact v18.30 module, the same case throws on load/save and writes **zero** values. Blank keys and blank ciphertext with a valid key are also blocked. No accounting engine, user data or iOS changes.
- Immutable bundle `_expo/static/js/web/index-v01830-vault-presence-guard-20261023.js` candidate `f52a35c1`; HTML activation `44f9e292`; active CI workflow `7aa41f2e`. HTML meta 18.30 / build 18.30.1 / diagnostic 18.30.
- Added `tests/vault-presence-regression.cjs` (10 cases); candidate GitHub Actions **39966268587 SUCCESS**, post-activation **39966349253 SUCCESS** (Python release consistency, Node syntax and existing financial, UI, persistence, vault and demo eligibility tests). Vercel production **dpl_6q6mManSXg6DonZScYUmpMqUbNUa READY** for `7aa41f2e` with primary alias.
- NOT VERIFIED: interactive browser/header, real AES-GCM persistence, GitHub Pages terminal outcome at checkpoint (runs `39966349496`, `39966349319`), and corrupted NONEMPTY ciphertext direct-save guard. Vercel authenticated HTML fetch denied 403 and deployment files endpoint returned 404. Do not equate READY with browser proof.
- Rollback: restore only `index.html` pointer to immutable v18.29 if necessary, without touching local storage. However v18.29 reintroduces the confirmed empty-ciphertext overwrite vulnerability; prefer correcting v18.30 forward.
- NEXT: close deployment/browser verification, test malformed ciphertext save guard, then isolated demo implementation with explicit real-data boundary; issue #2 financial semantics remains pending.


## Non-release verification checkpoint — 2026-10-23 (v18.29 remains active)

- Added `tests/reconciliation-history-persistence-regression.cjs` (6 synthetic integration tests) against the active real financial model and real vault load/save adapter, with a **mocked cryptographic envelope**; verified history, reload, correction/void audit, failed persistence and later check behavior. Added read-only `src/demo-eligibility.cjs` and `tests/demo-eligibility-regression.cjs` (10 tests), fail-closed for saved/empty/orphan/corrupt/unknown legacy keys or storage failures. This gate is **not bundled or user-visible**.
- Exact GitHub Actions `39958505784` **SUCCESS** for test commit `204db77a`: new suites 6/6 and 10/10 PASS alongside prior regression and release checks. Pages build `39958505399` and deploy `39958505816` SUCCESS. Vercel `dpl_FhL36KWJcqr1S9uwQ3ZZJrs3MMad` READY on `204db77a` with primary alias. No new version: active `index.html` / bundle / diagnostic stay **18.29**.
- Financial semantics discovery: voiding a historical linked income shifts a later check's computed checkedBalance despite unchanged stored observed value. Current behavior characterized, no formula changes; see issue **#2**. Protected Vercel browser fetch still 403; no browser proof or actual AES-GCM E2E. No real financial data or iOS changes.
- NEXT: contract review for issue #2; safe in-memory demo implementation, real browser and mobile verification before any future release.


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
