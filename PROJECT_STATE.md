# Financial Autonomy — Project State

Last updated: 2026-10-14
Source of truth: this file plus IMPLEMENTATION_QUEUE.md and the current main commit history.

## Latest checkpoint — v18.20 (2026-10-14)

- Current GitHub `index.html` references `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js` (activation commit `ee99934f2e039b4f3abb186d4a83c25b1d217889`).
- v18.15: history search, account filtering and correction audit; initial syntax error caused a white screen.
- v18.16: repaired syntax. v18.17: compact account/type filters. v18.18: Operations/Corrections tabs and 10/20/50 pagination. v18.19: corrections displayed in transaction-like list rows. v18.20: Back to History when editing from History, and return to History after save.
- v18.20 bundle syntax compiled successfully via `new Function`; **interactive browser test and successful Vercel deployment have NOT been independently verified**. User has confirmed that history UX is improved in earlier iteration, but v18.20 navigation needs user verification.
- Financial reconciliation work from v18.13–v18.14 remains subject to verification; do not assume calculations are correct. In v18.14 `difference` was changed to initial-history basis, but `expected` may use a different basis. Protect real balances and audit history.
- Exact next unchecked step: verify deployed v18.20 and test back-navigation / save-return on device; investigate any regression. Verify diagnostic-version consistency, financial reconciliation and live data behavior separately.
- Source repository `nikopol000/financial-autonomy-app` may lag preview; **do not rebuild from stale source**.
- The continuity procedure in `AGENTS.md` is mandatory. The previous v18.02 checkpoint below is historical, not current. The supplemental `Financial_Autonomy_CONTINUITATE.md` is NOT a replacement for the four mandatory documents.

## Resume protocol
At the start of a new chat/session, read in this order:
1. AGENTS.md
2. PROJECT_STATE.md
3. IMPLEMENTATION_QUEUE.md
4. DEVELOPMENT_WORKFLOW.md
5. latest commits on main

Do not infer the current task only from chat memory. Repository state wins when there is a conflict.

## Latest checkpoint — v18.02 (2026-10-13)

- Active index.html references `_expo/static/js/web/index-v01802-unified-diagnostics-20261013.js` and `diagnostic-v18-02-unified.js`.
- Diagnostic complete export version was corrected to 18.02 in the active bundle (commit 31eeaf2).
- Supplemental diagnostic was corrected back from 18.03 to 18.02 (commit dd89ecafc10f5eb5e11d8c30379e6c079a4a571d), preserving a single version for the entire application, including exported diagnostic filenames and payloads.
- User reports v18.02 visible in the application. Deployment of the latest diagnostic-script correction has NOT been independently verified.
- IMPORTANT: a GitHub commit is not proof of deployed preview. Do not claim DONE until deployed assets and exported version have been checked.
- Financial reconciliation/SALT unexplained amount is NOT fixed; no financial data should be silently changed. User wants version consistency completed first.
- Exact next unfinished step: verify live Vercel index and loaded diagnostic script; verify complete and supplemental exports report 18.02. If mismatch, repair, redeploy and recheck. Then diagnose SALT without modifying other unexplained balances.
- Version invariant: ONE app version for all changes; main UI, bundle, diagnostic export metadata, diagnostic button and filename must match. No separate diagnostic version progression.
- Workflow invariant: continue implementation -> verification -> deployment -> live check -> continuity checkpoint in same execution when tools allow. If blocked, record exact blocker, not 'done'.

## Latest checkpoint — v17.84 (2026-10-10)

- Preview bundle: `_expo/static/js/web/index-v01784-compact-dashboard-20261010.js`.
- Bundle commit: `7d16c6b87792411c3a7cef11badd0a2e05af16fb`.
- Active index reference changed by commit `8c43fdb04e15bc78f32e3f2fbd851599c57c9039`.
- Changes: compact Autonomie and Spațiu, insert monthly Cheltuit nebugetat amount after Spațiu, reorder Buget and quick actions ahead of snapshots, retain snapshots further down.
- Existing custom Dashboard order is temporarily overridden for the four primary sections to satisfy the first-screen requirement.
- No intended change to existing finance formulas or local storage; unbudgeted total is derived from existing transaction amounts/roles.
- **Verification limitation:** bundle was patched and activated via GitHub; automated syntax, deployed Vercel status and interactive iPhone browser behavior were not verified in this session. Do not claim deployment success until checked.
- Next: user tests on iPhone, inspect any issues; reconcile the bundle changes into source before rebuilding.

## Prior checkpoint — v017.67 (2026-10-10)

Active web preview: https://financial-autonomy-preview.vercel.app/
- Active preview repository main: `nikopol000/financial-autonomy-preview`.
- Activated bundle: `_expo/static/js/web/index-v01767-dashboard-polish-20261010.js`.
- Bundle commit: `72d958a17485051f29a24e79a6bcf25b71d215cf`.
- Activation commit: `0fd5b4fe7d35dc32c02e673b96aa8739d29d4bff`.
- Vercel check on activation commit: **success**.
- Verification: entire JavaScript bundle passed syntax compilation; checked key replacement counts and fetched published file. No end-to-end user test yet.
- Changes since v017.66: full-contrast borders around Spending / Next Income / Budget cards; independent top-alignment and self-alignment for expanding snapshot cards; tighter consistent 22–24px corners, padding, and gaps; theme-aware label contrast. Existing v017.66 budget collapse behavior preserved.
- **No financial formula or storage/data model changes**.

IMPORTANT provenance / next build:
- v017.67 is a small surgical polish of the known-working v017.66 WEB bundle, not an Expo rebuild from the private source repository.
- The private source repo `nikopol000/financial-autonomy-app` main is behind the current live preview. Reconcile modern preview changes back into source before starting a full source rebuild to avoid regression.
- Do not overwrite active v017.67 with stale source code.
- Next step: user tests v017.67 on Vercel on phone, particularly independent card expansion and the Budget card in light/dark mode.

## Prior checkpoint — 2026-10-06
Latest active preview change confirmed in main:
- commit c76a9ac1b743bac877c7eb25814677dfc1b7e70a — `preview: activate debt balance updates`
- preceding publish commit c0bcd3ff745447a9cde0b1cd38b5dff6f00216a2 — `preview: publish debt balance updates`

Current product state:
- Finance items that carry a mutable balance must allow that balance to be updated later.
- This applies to debt/credit products too, not only normal bank accounts.
- Credit card is the concrete case that prompted the change: it must expose `Actualizează soldul`.
- The rule should be applied consistently to every relevant Finance item with a mutable balance.

Immediately preceding completed changes:
- Donations and Subscriptions added as expense types and available when explaining unexplained money.
- Encrypted backup has password confirmation and show/hide password support.
- Daily Budget/Safe pace can use selected budgets, with visibility into which budgets contribute.
- Transfers between own accounts/credit products are supported and are not income/expense.

## Architecture/product constraints
- Local-only product: no backend/account/sync/analytics/telemetry for financial data.
- Preview data is browser-local; persistence follows browser storage behavior.
- Financial truth must not be falsified for privacy presentation.
- Credit availability is not income/owned money.
- Keep business/calculation changes separate from UI-only changes where practical.

## Continuity requirement
Every completed user-testable product change must update this checkpoint in the same development cycle. The checkpoint must name:
- what changed;
- whether it is implemented/published/activated/tested;
- active preview version or identifying commit/bundle when known;
- the next unresolved user request.

If implementation stops mid-task, record the exact first unfinished step in IMPLEMENTATION_QUEUE.md before stopping.

## v17.87 — 2026-10-11
- Published bundle `_expo/static/js/web/index-v01787-spending-row-20261011.js` commit `f9d29de8a2fd44cf71b51b0cbba938a855b0b844`; activated index commit `d7af61fdab3fd8417dd83604c1dfe0fa0cdbb118`.
- ReorderableStack renders adjacent spending and nextIncome modules in a horizontal equal-width row outside arrangement mode, with top alignment; independent component states retained. Arrangement mode unchanged.
- Deployment/runtime/device testing not yet independently verified. Next: test v17.87 on iPhone and reconcile preview changes into source.

## v17.89 — 2026-10-11
- Bundle `_expo/static/js/web/index-v01789-spacing-20261011.js`, published commit `6dd765673b24abaddfb9b8cd8a952f758dcc0b77`; index activated commit `fe3549f10551208effbf01190d10052c6184de0a`.
- Dashboard vertical stack gap 14→10; spending/income row gap 10→12; small-card padding 10→horizontal 14/vertical 12; Autonomie/Spațiu vertical padding 8→7.
- Deployment and device behavior pending verification. No formula changes.

## v18.01 — 2026-10-12
- Published `_expo/static/js/web/index-v01801-refinanced-obligations-20261012.js` in commit `19c159065211fe681c570e9aaff57e2155b1b113`; activated via `index.html` commit `e299083ce9abb04dd4b28168a7efd7c4963b9a62`.
- Obligations calculation now explicitly excludes a fully refinanced debt when its refinancing principal was applied and the debt balance reached zero as of the refinance transaction.
- No stored data migration or deletion; historical month plans remain intact. Other still-active debt obligations are not automatically suppressed.
- Runtime and Vercel deployment unverified; next: confirm live v18.01, test old Salt disappears from future due dates and new Salt remains, inspect other refinanced debts and reconcile source.

## v18.05 — 2026-10-13
- Diagnostic distinguishes configured month-plan debt payment from effective future payment for fully refinanced debts with a zero observed balance. Existing planning/scheduling code already excludes refinanced zero-balance debts; do not assume raw monthPlans indicates live obligations.
- Bundle commit 99251033e0ee9fc71aaf51a9e562e2076243efb4; index activation 840ff151fae3619375aeac12dfcc48ceaa022a5b.
- No user financial data modified. Pending live deployment and user diagnostic confirmation.

## Source/iOS synchronization checkpoint — 2026-10-14

- User approved starting reconciliation of preview v18.20 into Expo source for eventual native iPhone builds; this is **not approval to promote v18.20 to stable source main**.
- Created source branch `nikopol000/financial-autonomy-app:feat/sync-preview-v18-20-ios` from source `main`.
- No application code has been ported yet. Preview v18.20 is a web bundle and cannot directly serve as a native iOS build.
- Next: inventory source modules and preview-only features; port incrementally on source feature branch, add tests and compare web behavior; produce iOS candidate only after source reconciliation. Do not touch source main without explicit build approval.

## Source/iOS synchronization update — 2026-10-14
- Previous checkpoint saying 'no application code ported' is superseded by this update.
- Source branch `financial-autonomy-app:feat/sync-preview-v18-20-ios`: `App.tsx` History return navigation commit `71f3abc8`; `src/Reports.tsx` History 10/20/50 pagination commit `40d240c`; text search and account/debt filter commit `d4d710d`.
- Source continuity inventory document `PREVIEW_V18_20_IOS_RECONCILIATION.md` exists. These are partial code migrations, **not** feature parity, tested iOS app, or approved release. Source `main` unchanged.
- User instructed automatic review/update of all continuity files every development cycle; rule added to AGENTS.md and DEVELOPMENT_WORKFLOW.md.
- Next: migrate History Operations/Corrections tabs and audit pagination; reconcile remaining preview features, financial model and visuals; run TypeScript/test/web/iOS checks. No runtime verification yet.

## iOS migration execution checkpoint — 2026-10-14
- User requested continuation to completion without per-step confirmations. Continue autonomously during active sessions, persist checkpoint after every batch; no background execution implied.
- Attempt to add Operations/Corrections tabs to `src/Reports.tsx` was blocked by tool safety checks, so **no commit or implementation for tabs is claimed**. Last confirmed source change remains `d4d710d` (History search/account filters). Source main untouched.
- Next: retry smaller source edits; verify TypeScript and full preview parity, including financial calculations and local data migration, before native iOS build.

## Native iPhone architecture decision — 2026-10-14
- User explicitly requested a **new native iPhone application**, not modernization of stale Expo source. Decision: Swift/SwiftUI clean rebuild using current preview as complete behavior/visual/financial specification.
- Existing Expo feature-branch History changes are exploratory and do not count toward native SwiftUI implementation.
- Native plan committed to `financial-autonomy-app:feat/sync-preview-v18-20-ios/IOS_NATIVE_REBUILD_PLAN.md` at `77ed138d`. SwiftUI project/build not yet created or tested. Source main unchanged.
- Next: inventory all preview behavior and backup format; create isolated native SwiftUI project and financial model; port/test screen-by-screen. Maintain automatic continuity updates.

## Native SwiftUI first source checkpoint — 2026-10-14
- Added new `NativeiOS/` Swift files on isolated source feature branch: `Models.swift` (`04f6dc1`), `LedgerEngine.swift` (`a98b0e8`), `LedgerStore.swift` (`b60c4d5`), `FinancialAutonomyApp.swift` (`30ce959`), `RootView.swift` (`332424f`), `README.md` (`ec40317`).
- This is a basic native SwiftUI scaffold and initial accounting types, not parity with preview. Local JSON storage is NOT encrypted and must not be used with real data. No Xcode project/build, iPhone run, backup import, or parity tests yet.
- Next: create Xcode project and Swift tests; implement secure storage and preview-compatible import; inventory/port complete financial engine and all screens. Source main unchanged.

## Native iOS security and tests checkpoint — 2026-10-14
- Added `NativeiOS/EncryptedLocalStore.swift` CryptoKit AES-GCM with Keychain device-only key (`1cb4327`), switched `LedgerStore.swift` from plaintext to encrypted persistence (`a49701b`), added ledger XCTest fixtures (`b19bc11`), and updated native README (`a99e445`) on source feature branch.
- Encryption and tests are **source code only**: no Xcode project, no compile/run, no audit. Device-only key is not portable backup; export/import still TODO. Old plaintext prototype file is not migrated. No real financial data until verified.
- Next: Xcode project and actual tests; portable encrypted backup and preview import; complete parity rebuild. Source main unchanged.

## Native iOS checkpoint — 2026-10-14, latest batch
- Added `NativeiOS/BUILDING.md` commit `93bbfe8` with manual Xcode target instructions and `NativeiOS/PARITY_CHECKLIST.md` commit `24f5b2a` listing all required preview modules.
- Attempts to commit XcodeGen `project.yml` and native History UI update were blocked by tooling safety checks; these changes were **not** committed. No Xcode project or verified build yet.
- Next: unblock project generation, compile/test native Swift, implement full financial model and backup, compare to preview. Source stable main unchanged.

## Native iOS project configuration — 2026-10-14
- Successfully committed `NativeiOS/xcodegen.yml` to source feature branch: scaffold `b730da9`, full app and XCTest targets `7283577`. This supersedes previous tool-blocked project-spec attempt; **generated .xcodeproj and Xcode build are still unverified**.
- Added native History text search and descending date order in `RootView.swift` (`662b6b9`), updated build instructions (`ee35348`).
- Runtime available in this session is Linux, with Swift but no Apple Xcode/xcodebuild; cannot claim iOS compilation or simulator tests. Next: actual Mac/Xcode build, fix issues, full preview parity, backup import/export. Source main unchanged.

## Native iOS budget foundation — 2026-10-14
- Source feature branch added `NativeiOS/BudgetEngine.swift` commit `67ba2f8`: pure period windows (weekly Mon-Sun, anchored biweekly, monthly, quarterly, annual, paycheck) and daily budget/safe pace primitives.
- Added synthetic XCTest fixtures `NativeiOS/Tests/BudgetEngineTests.swift` commit `77985a8`, README caveats commit `b8bcc07`.
- These are provisional formulas and **not verified against preview**, nor compiled/run in Xcode. Important parity questions: daily spending subtraction, payday inclusion, calendar boundaries/timezones, and owned money eligibility. Source main untouched.
- Next: compare preview calculations with fixtures, run iOS tests on Mac, build native budget dashboard and implement portable encrypted backups.

## Native SwiftUI implementation batch — 2026-10-14
- On `financial-autonomy-app:feat/sync-preview-v18-20-ios` added native Dashboard and transaction input `c445eed`, wired Dashboard `aa74c82`, account entry `193d0d0`, account detail/balance observations and explanation UI `b63ca1b`/`d452fb6`.
- LedgerStore now posts transactions to balances and reverses voided entries `5adfbef`; income/expense account validation `685d3a7`. Reconciliation explanation model `ff8d389`, pure engine `d0a581b`, persistence method `f27f7a9`, synthetic 3700+6.90 tests `158f4c4`, decimal input tests `2984433`. Native README `ce260b0`.
- Attempt to commit passphrase-encrypted portable backup code was blocked; only backup-format requirements document `a5b193a` was committed. Portable backup/import not implemented.
- No Xcode compilation or simulator run; preview financial and UI parity NOT established. Remaining: native complete budgets, debt/refinancing, audit/history edit, backup, preview migration, verification and deployment. Source main unchanged.
- First unfinished step: test native build on Mac/Xcode and correct compiler issues; then implement portable backup and full preview feature parity.

## Native iOS CI checkpoint — 2026-10-14
- Committed `.github/workflows/native-ios-ci.yml` on isolated source feature branch at `c76c7d3`: macOS-15, Xcode 16.4, XcodeGen, simulator build without signing. Adjusted XcodeGen iPhone target and scene manifest `7448c82`.
- CI is configured in source but **build success not confirmed**. Connector check for commit-associated pull-request runs returned none; this does not establish whether a push-triggered run exists. Verify Actions run and logs directly; fix compiler errors, then add tests. No native build/device install or parity claim. Source main unchanged.
- Next: verify CI workflow execution and build result; then full preview parity and native backup/import.

## Native iOS CI test coverage and format fix — 2026-10-14
- On source feature branch added simulator XCTest execution to `.github/workflows/native-ios-ci.yml` commit `374b0b0`; added XcodeGen shared scheme and unit test target `631da20`.
- Replaced provisional currency formatting with Foundation NumberFormatter `f68c50c` and corrected signed negative balances `ea985a9`.
- Actual macOS Actions run/build/test results remain **unverified**; no run ID or logs obtained. No full preview parity. Source stable main unchanged.
- Next: inspect GitHub Actions run, fix actual build/test errors, continue complete native financial/UI parity and encrypted portable backup.

## iOS CI robustness — 2026-10-14
- Source feature branch: CI now compiles before running tests (`eb23b67`) and dynamically selects an available iPhone simulator (`4e4238d`) rather than assuming iPhone 16 is installed.
- Commit-associated workflow lookup returned no PR-triggered runs; it cannot verify push-triggered Actions status. Build and XCTest outcomes remain UNVERIFIED. Stable source main unchanged.
- Next: inspect actual GitHub Actions run/logs, fix compiler errors, then continue preview parity and portable backup.

## Native history checkpoint 2026-10-14
- Native feature branch commits: 84a5c22 protects observed balances against retroactive voiding; f3f2a79 adds history cancellation with confirmation and error display.
- No Xcode build or XCTest verification yet. Full 1:1 parity unfinished. Source main unchanged.
- Next: inspect macOS CI build logs; implement historical corrections, atomic persistence and remaining preview features.

## Native budget date edge case — 2026-10-14
- Source feature branch `ff4c06b` fixes biweekly window division for dates before the 2024-01-01 anchor; `446c9ba` adds regression test for 2023-12-31.
- Attempts to commit larger ledger atomicity refactor and native budget UI were blocked by tool safety checks; neither was committed. Do not treat them as implemented.
- Xcode compilation/tests and preview parity remain unverified. Stable source main unchanged.
- Next: inspect CI build results, implement budget UI and atomic ledger persistence in smaller verified commits, continue 1:1 migration.
