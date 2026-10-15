# Financial Autonomy — Implementation Queue

Last updated: 2026-10-14

## Current item — v18.20 History navigation and audit UI (2026-10-14)
Status: IN PROGRESS — GitHub activated, browser deployment/device verification pending.

Implemented in preview repository:
- v18.15 search and correction audit; v18.16 syntax fix; v18.17 compact account/type filters.
- v18.18 Operations/Corrections switch and paginated list (10/20/50).
- v18.19 correction rows aligned visually with operation rows.
- v18.20 explicit `‹ Înapoi la Istoric` when editing a transaction opened from History; after save, return to History.
- Active GitHub bundle: `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`.
- Index activation commit: `ee99934f2e039b4f3abb186d4a83c25b1d217889`.
- JS syntax check passed; Vercel deployment and runtime behavior not independently confirmed.

Exact next unchecked step:
1. Confirm live Vercel index/bundle and displayed version v18.20.
2. Test open operation → Back to History without saving, and open operation → Save → History.
3. Check correction list expansion and pagination on phone.
4. Repair issues and checkpoint in the same cycle.
5. Reconcile changes to source repository before any full rebuild; do not overwrite newer preview with stale source.

Previous queue entries below are historical and may be superseded by this checkpoint. Do not treat the v18.02 task as the latest active release.

## Status vocabulary
- READY FOR IMPLEMENTATION — explicitly approved and not started.
- IN PROGRESS — work has started; include exact next unchecked step.
- READY FOR USER TEST — implemented and active in preview, awaiting user confirmation.
- DONE — user-confirmed or otherwise explicitly accepted.
- BLOCKED — cannot continue without a named dependency.

## Current item — Unified v18.02 version and deployment verification (2026-10-13)
Status: IN PROGRESS — latest GitHub code aligned, live deployment and exported file not yet verified

Requirement: one version across app UI, active bundle, complete diagnostic, supplemental diagnostic and exported filenames. If app displays v18.02, all diagnostics must identify v18.02; do not advance diagnostics independently.

Completed: active index.html references v18.02 main bundle and diagnostic-v18-02-unified.js. Main complete diagnostic metadata corrected to 18.02 (commit 31eeaf2). Supplemental script aligned to 18.02 (commit dd89ecafc10f5eb5e11d8c30379e6c079a4a571d).

Exact next unchecked step: verify the live Vercel deployment contains the latest diagnostic script and that both exports report v18.02. Repair and republish if needed; do not mark DONE merely from GitHub commits. After verification, proceed to SALT refinancing reconciliation issue, preserving unrelated unexplained entries and local data.

## Current item — Compact first-screen Dashboard (2026-10-10)
Status: READY FOR USER TEST — v17.86 activated; device/deployment verification pending

Approved requirement:
- Preserve the existing visual theme and all existing lower Dashboard sections.
- First-screen order: Autonomie; Spațiu; Cheltuit nebugetat; Buget; quick actions Cheltuială and Venit.
- Autonomie and Spațiu are two separate compact, independently expandable cards, label left and prominent value right; collapsed by default.
- Cheltuit nebugetat displays actual computed unbudgeted spending, not a fabricated progress percentage.
- Keep existing Budget azi / Sigur azi / primary budget bar and expand controls; preserve all financial formulas, storage and other features.
- Fit the five blocks and actions on an iPhone initial viewport without scrolling in collapsed state; avoid covering the bottom navigation.
- Publish an actual new version to the active Vercel preview and verify it before claiming ready.

Completed:
1. Confirmed currently active preview HTML references v01783, newer than the v01767 continuity checkpoint.
2. Read repository AGENTS.md, PROJECT_STATE.md, IMPLEMENTATION_QUEUE.md, DEVELOPMENT_WORKFLOW.md.
3. Published v17.84 bundle commit 7d16c6b87792411c3a7cef11badd0a2e05af16fb and activated index.html commit 8c43fdb04e15bc78f32e3f2fbd851599c57c9039. Initial v17.84 had syntax error and was rolled back. Fixed and syntax-validated using JavaScript compilation (new Function), commit 9a4f32c765793a49d3a1ca4023194e52d1040f56; reactivated by commit 65cbfca0a6a7babc180eaf9140910ace82941916. User screen recording showed v17.84 loads but cards are too tall and displayed header still says v17.83. v17.85 further compresses Autonomie, Spațiu, Buget, quick actions, and updates header. v17.85 bundle commit 23a81705686d7224703ad36e5b932ad2f63a0a48; activation commit bb466d4d02f1d677be9fb95b823af91ae3c2ead6. JavaScript syntax compilation passed. Runtime/Vercel deployment not independently verified.

Exact next unchecked step:
1. User tests v17.86 on iPhone: Cheltuit/Următorul venit before Buget, independent expansion, Cheltuit budgeted/unbudgeted details, and card heights.
2. Confirm Vercel deployment and browser runtime, which were not independently verifiable here.
3. Reconcile preview-only changes into source before a source rebuild.

## Previous item — Dashboard design polish v017.67
Status: READY FOR USER TEST

Requirement:
- Independent expansion and card heights for Cheltuit and Următorul venit.
- Consistent surrounding borders and better theme contrast.
- Clearer Budget card separation, compact primary-first view, extra pinned windows behind a toggle.
- Preserve financial calculations and browser-local data.

Evidence:
- v017.66 already contained independent `useState` expansion and hidden-by-default supplemental budget windows.
- v017.67 surgical visual refinement bundle commit `72d958a17485051f29a24e79a6bcf25b71d215cf`.
- Activated through preview commit `0fd5b4fe7d35dc32c02e673b96aa8739d29d4bff`, Vercel check success.
- Bundle syntax verified, user interaction not yet confirmed.

Exact next step:
1. User tests v017.67 at https://financial-autonomy-preview.vercel.app/ on phone.
2. Collect specific UI defects if observed.
3. Reconcile private source repository (behind web preview) before any full rebuild; preserve active version and avoid regression.
4. After user approval, mark DONE and continue next READY item.

## Previous item — Debt / credit balance updates

### Debt / credit balance updates
Status: READY FOR USER TEST

Requirement:
All Finance entities that have a balance which can change over time must allow the user to update that balance later. This includes debt/credit products. Credit Card was the reported missing case.

Evidence in preview repository:
- c0bcd3ff745447a9cde0b1cd38b5dff6f00216a2 — preview: publish debt balance updates
- c76a9ac1b743bac877c7eb25814677dfc1b7e70a — preview: activate debt balance updates

Next step:
- User tests the active preview, especially Credit Card and the other Finance balance-bearing types.
- If a type still lacks `Actualizează soldul`, fix that type and update this queue/checkpoint in the same cycle.

## Recently completed
- Donations and Subscriptions expense types: published and activated 2026-10-05.
- Backup password confirmation/show-hide: published and activated 2026-10-05.
- Selectable budgets for daily budget/safe pace: published and activated 2026-10-04.

## Queue discipline
Do not implement an item merely because it is mentioned in historical chat. Only implement items marked READY FOR IMPLEMENTATION or continue the exact unchecked step of an IN PROGRESS item.
After publishing/activating a change, immediately update PROJECT_STATE.md and this file before declaring the iteration complete.


### 2026-10-11 — v17.86 checkpoint

- User approved size of top cards but requested Cheltuit and Următorul venit restored before Buget, separate Cheltuit nebugetat removed, and budgeted/unbudgeted amounts shown when Cheltuit expands.
- Bundle created and syntax-checked: `_expo/static/js/web/index-v01786-spending-pair-20261011.js`, commit `3b1709d6924aaca1ddf5371d9095a585e118fa8c`.
- Activated in index.html commit `1495a263b1d4b93ed8aec0bea60e70994810ecd7`.
- No browser-level verification yet; preserve existing formulas and user data.

### 2026-10-11 — Layout correction requested
Status: READY FOR IMPLEMENTATION
- Cheltuit and Următorul salariu must appear side by side in one horizontal row, each approximately half width, before Buget.
- Expansion remains independent; expanding one must not expand the other or force both card backgrounds to equal expanded height.
- Keep compact card sizes and Cheltuit budgeted/unbudgeted breakdown. Do not alter formulas or local data.
- Next unchecked step: inspect active v17.86 bundle layout, implement horizontal two-column row, syntax-check, publish/activate and verify preview; update PROJECT_STATE.md and queue after verified checkpoint.

### 2026-10-11 — v17.87 horizontal pair
Status: READY FOR USER TEST (deployment/runtime unverified)
- Published bundle commit `f9d29de8a2fd44cf71b51b0cbba938a855b0b844` and activated index commit `d7af61fdab3fd8417dd83604c1dfe0fa0cdbb118`.
- Cheltuit and nextIncome now render side by side when adjacent and not in reorder mode; independent expansion preserved.
- Next: verify live deployment and iPhone behavior, especially text fitting and unequal expanded heights; reconcile source before rebuild.

### v17.89 spacing correction — 2026-10-11
Status: READY FOR USER TEST (live deployment not independently verified)
- Published `6dd765673b24abaddfb9b8cd8a952f758dcc0b77`; activated `fe3549f10551208effbf01190d10052c6184de0a`.
- Check card spacing, right-side padding, visibility of Cheltuială/Venit, and independent expansion on phone.

### 2026-10-12 — Refinanced debt obligations v18.01
Status: READY FOR USER TEST (live deployment/runtime unverified)
- Bundle commit `19c159065211fe681c570e9aaff57e2155b1b113`, index activation `e299083ce9abb04dd4b28168a7efd7c4963b9a62`.
- Future obligations exclude fully refinanced loans with a confirmed zero balance; historical plans and financial data unchanged.
- Next unchecked step: verify active preview and test old Salt versus new Salt due dates; check whether other refinanced products have recorded principal payments and zero balances; reconcile preview bundle into source.

## v18.05 refinance diagnostic — 2026-10-13
Status: READY FOR USER TEST (deployment not yet independently confirmed)
- Corrected diagnostic plannedPayments to distinguish configuredAmount from effectiveAmount, with exclusion flag for refinanced debt with observed zero balance.
- Active preview index now points to v18.05. Existing app projection already has refinance exclusion logic; do not misinterpret raw monthPlans as actual future obligation.
- Next: confirm live deployment, export v18.05 diagnostic, inspect whether effectiveAmount for old SALT is zero and verify actual Dashboard obligation; if Dashboard remains wrong, fix its calculation separately.

## New workstream — preview v18.20 → Expo source / iOS candidate (2026-10-14)
Status: IN PROGRESS — feature branch created; code reconciliation not yet started.

- Source feature branch: `feat/sync-preview-v18-20-ios` in `nikopol000/financial-autonomy-app`.
- Preserve source `main` as user-approved stable baseline; user approved starting work, **not merging**.
- Next unchecked: inventory source and preview differences; identify all web-only features, migrate them into Expo TypeScript, validate web parity and tests, then build an iOS test candidate.
- Preview v18.20 device/deployment verification remains a separate open item.

## iOS parity migration progress — 2026-10-14
Status: IN PROGRESS, PARTIAL SOURCE CHANGES ONLY. Supersedes old 'code reconciliation not yet started' checkpoint.
- DONE in source feature branch: History return-to-history navigation (`71f3abc8`), 10/20/50 pagination (`40d240c`), text search and account/debt filters (`d4d710d`).
- TODO: Operations/Corrections tabs; full audit, UI and financial reconciliation parity; compare source to active preview screen-by-screen; compile/test and produce iOS candidate.
- Every future development batch MUST automatically read continuity files first and update status/queue afterward. Do not require user reminder. Do not merge source `main` without approval.

## Continuous migration instruction — 2026-10-14
- Proceed without per-step user approval on feature branch; request explicit approval only before promoting stable source main.
- Operations/Corrections tabs attempted but tool blocked; remain TODO, not implemented.
- Next: implement in smaller changes, test source, reconcile all preview screens and financial logic, produce iOS candidate and document validation.

## Full-source gap audit — 2026-10-14 (user correction)
Status: HIGH PRIORITY — NOT LIMITED TO HISTORY.
- The Expo source `financial-autonomy-app/main` is older than preview v18.20; do not infer parity from a few History ports. The preview has accumulated many releases with changes to Dashboard, budgets, accounts, credit, balance reconciliation, refinancing, audit, settings, local backup, appearance and navigation.
- Before declaring migration done, create a complete feature/financial-model/data-storage/design matrix from current preview against source; port every missing behavior, including native-compatible data import/export and local-only persistence. Verify all screens and financial invariants with tests and native iOS candidate.
- Existing branch commits are only partial History work. Source `main` must remain unchanged until explicit approval.

## Architecture change: NEW NATIVE SWIFTUI iPhone app — 2026-10-14
Status: PLANNED, NOT IMPLEMENTED.
- Stop treating Expo-source migration as the delivery approach. Build a fresh Swift/SwiftUI native app with current preview as the full functional, visual and financial specification.
- Expo History ports are not SwiftUI implementation. Native architecture plan: source feature branch `IOS_NATIVE_REBUILD_PLAN.md` commit `77ed138d`.
- Next: full preview inventory, backup compatibility assessment, SwiftUI project setup, deterministic ledger tests, native screens, iOS build and parity verification. Preserve local-only/no backend and stable main gate.

## Native SwiftUI progress — 2026-10-14
Status: FIRST SCAFFOLD COMMITTED; NOT RUNNABLE/TESTED AS AN XCODE PROJECT.
- Native Swift files under `financial-autonomy-app/NativeiOS/` on feature branch: entry point, models, initial ledger calculations, basic local JSON store, Accounts/History SwiftUI views and README. Commits `04f6dc1`, `a98b0e8`, `b60c4d5`, `30ce959`, `332424f`, `ec40317`.
- CRITICAL: persistence is unencrypted prototype only; no real financial data until encrypted storage and migration are implemented. No iOS build yet.
- Next: Xcode project, tests, secure persistence, complete preview feature inventory and parity implementation. Do not promote source main.

## Native iOS implementation batch — 2026-10-14
- Source feature branch: encrypted local storage code `1cb4327` and `a49701b`; XCTest source fixtures `b19bc11`; README `a99e445`.
- Pending: Xcode project, actual compilation and test execution, portable passphrase-encrypted backups, preview data import, all preview screens/formulas, parity and iPhone build. Not production ready.

## Native iOS latest work — 2026-10-14
- DONE: BUILDING.md (`93bbfe8`) and full parity checklist (`24f5b2a`) on isolated source feature branch.
- BLOCKED: XcodeGen project specification and History native update; no commits for these attempted changes. Still no Xcode build.
- NEXT: Xcode project, build/tests, secure portable backup and full native preview parity.

## iOS progress — XcodeGen project spec and native History search (2026-10-14)
- DONE: `NativeiOS/xcodegen.yml` XcodeGen app + XCTest targets (`7283577`); History search/sorting (`662b6b9`); updated BUILDING.md (`ee35348`).
- No generated Xcode project or iOS build tested; environment is Linux, no xcodebuild.
- NEXT: Mac Xcode build/tests, fix compile issues, encrypted portable backup and preview migration, all missing native features and screen-by-screen parity. Stable main untouched.

## Native budget checkpoint — 2026-10-14
- Swift BudgetEngine added at `67ba2f8`; synthetic unrun XCTest fixtures `77985a8`; native README `b8bcc07`.
- Preview parity and iOS compilation remain unverified. Next: reconcile formulas with preview, run Xcode tests, implement native budget screens and portable encrypted backup.

## Native SwiftUI functional batch — 2026-10-14
- Implemented provisional Dashboard, transaction entry, account creation, observed balance updates and explanation UI; commits `c445eed`, `aa74c82`, `193d0d0`, `b63ca1b`, `d452fb6`.
- Fixed ledger operation posting and account validation `5adfbef`, `685d3a7`; explanation model/engine/store `ff8d389`, `d0a581b`, `f27f7a9`; added synthetic tests `2984433`, `158f4c4`.
- Portable encrypted backup implementation attempt blocked; requirements-only `a5b193a`. No backup or preview migration. No iOS build/tests; no full parity. Do not use real data or promote main.
- NEXT: Mac Xcode build/test and fixes, backup implementation, native full feature inventory and screen-by-screen parity.

## Native iOS CI — 2026-10-14
- Added macOS GitHub Actions workflow `c76c7d3` and updated iPhone target settings `7448c82` on source feature branch.
- Status: CI YAML committed, build execution/result NOT VERIFIED; no simulator/device run. The available commit-run lookup only checks PR-associated runs and returned none.
- Next: inspect GitHub Actions run and logs, fix build issues, run XCTest; continue complete preview 1:1 implementation and secure portable backup/import. Stable main unchanged.

## Native CI test gate — 2026-10-14
- Added XCTest step (`374b0b0`), XcodeGen scheme (`631da20`), signed currency formatting fixes (`f68c50c`, `ea985a9`).
- No verified GitHub Actions run, compilation or tests yet. Next: inspect CI logs, repair failures; continue 1:1 native migration and portable encrypted backup. Source main untouched.

## CI robustness checkpoint — 2026-10-14
- DONE: build-before-test ordering `eb23b67`, simulator discovery `4e4238d` on source feature branch.
- UNVERIFIED: Actions run/build/tests; commit workflow lookup does not cover push runs.
- NEXT: obtain actual CI logs, correct errors, complete native preview parity and backup. Stable main unchanged.

## Native history update 2026-10-14
- Source feature commits 84a5c22 (observation-aware cancellation guard) and f3f2a79 (history swipe cancellation with confirmation and error UI).
- Xcode build and tests remain unverified. Next: inspect CI logs, implement auditable corrections and preview parity. Stable main unchanged.

## Native budget date edge case — 2026-10-14
- Source feature branch `ff4c06b` fixes biweekly window division for dates before the 2024-01-01 anchor; `446c9ba` adds regression test for 2023-12-31.
- Attempts to commit larger ledger atomicity refactor and native budget UI were blocked by tool safety checks; neither was committed. Do not treat them as implemented.
- Xcode compilation/tests and preview parity remain unverified. Stable source main unchanged.
- Next: inspect CI build results, implement budget UI and atomic ledger persistence in smaller verified commits, continue 1:1 migration.

## Native budget UI batch — 2026-10-14
- Source feature branch `9db1f8c` adds Buget navigation tab; `6ba9579` creates SwiftUI BudgetView for weekly/biweekly/monthly/quarterly/annual/paycheck periods and daily pace; `89db91c` adds provisional credit-excluding safe pace with explicit limitations.
- Screen inputs are not yet persisted and not validated 1:1 against preview. Native Xcode compilation/tests remain unverified. Source main unchanged.
- Next: verify Actions build and XCTest, persist budget configuration, connect categorized spending and obligations, implement dashboard parity.


## Native iOS checkpoint — 2026-10-15 09:14 EEST
- Source branch ONLY: `nikopol000/financial-autonomy-app:feat/sync-preview-v18-20-ios`; stable source main untouched.
- Latest commits: `3c808c0` adds LedgerReplayGuard; `b567ecf` connects UUID replay rejection in LedgerStore.addOperation; `086dbb0` adds 3 XCTest replay tests.
- Previous HEAD `5853d91` had Native iOS CI success run `38690845850`, 18/18 XCTest. New HEAD `086dbb0` build and tests are NOT YET VERIFIED.
- Remaining critical: LedgerStore atomic encrypted persistence/fail-closed, UI save guards, persistent BudgetSettings, safe display arithmetic, full visual/functional parity audit against preview v18.20.
- Exact next step: inspect Native iOS CI for `086dbb0`; repair failures, then integrate atomic LedgerStore with persistence tests. Do not claim parity.
