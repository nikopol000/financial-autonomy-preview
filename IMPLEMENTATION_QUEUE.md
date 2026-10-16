# Financial Autonomy — Implementation Queue

## CURRENT native checkpoint — 2026-10-16 22:xx Bucharest — build10, IN PROGRESS / CI STARTUP BLOCKED

Supersedes prior current entries. Native feature HEAD `fe390667506300c63efd60850881c1ba8b45c39d` (docs); product `d220e89aeb9e3de26f027df31c238a583393c50a`; v18.20 build10 on feat/sync-preview-v18-20-ios ONLY. Stable main remains a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- Startup actual HEAD was a8c063da9e880c120f51ea6ae7d369f042563ffb, beyond the stale build9 checkpoint: it added LoanPrincipalReconciliation.swift alone referencing absent book properties/balance signature. Source inspection exposed incomplete integration; no compiler logs were available. This batch supplies missing optional fields and balance integration; native compilation still NOT EXECUTED.
- LoanBook optional principalObservations/principalExplanations; immutable EOD expected/observed principal + timestamps. Checked differences carry into subsequent loan balance, dues/calendar/current balance and closure exactly once, never cash. Explanations reduce signed unexplained differences only, do not double-adjust balances. Duplicate/backdated/future confirmations rejected; observed-period add/correct/void locked; atomic writes/restore validation.
- Finanțe → Împrumuturi → Actualizează soldul real: confirmation form, expected/actual/history/unexplained and descriptive explanation sheet. Diagnostic summary adds observation/explanation counts, full data remains opt-in. Existing native backup absence decodes without rewrite.
- EXECUTED: seven local Node reference generators all exit0. Six NEW balance outputs from actual active preview Metro207 checkedBalance/checkRows: before opening/check, first confirmation, later payment, second confirmation, carry-forward. Cumulative web reference outputs67. Checked row expected9300/8500 and observed9000/8400. These are reference executions, NOT native execution.
- Eight new XCTest source methods cover balance fixtures, explanation-only effect/overshoot/duplicate, invalid observation dates/amounts, observed-period mutation guards, persistence rollback, native backup/legacy/reload/diagnostic, invalid expected/ref/overflow, zero closure. Expected native unit total143, NOT RUN. UI/full build also NOT RUN.
- Exact product CI `38957306596`, job `117163289842`: completed failure, runner_id0, steps[]. Startup a8c063da run38814237693 likewise runner0/no steps. Direct check annotation endpoint attempted and rejected as unsupported by GitHub fetch (HTTP400 INVALID_ARGUMENT); details inaccessible, no reason invented. No local swift/swiftc/xcodebuild. Last ACTUAL native green e82e6c7 / 38792158205: Xcode16.4 Simulator build +62 unit +one UI. No unchanged failed-run reruns.
- LOAN_OBSERVATION_PARITY.md records material remaining differences: native EOD immutable checks/incremental per-observation discrepancies versus web intraday ordering, multiple checks/day, edit/void and cumulative row differences/linked reconciliation transactions. Descriptive refinance explanation is NOT an actual linked refinancing transaction. No reconciliation 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore hosted execution / inspect startup annotations for 38957306596; build/test exact feature HEAD, repair errors, verify143 unit+UI, inspect full portrait populated light/dark screenshots. Current source since green baseline remains unverified natively.
- Independent next implementation: event ordering and cumulative/check-edit reconciliation parity, actual linked explanatory transfer/refinance flows; initial principal audit/edit, revolving card/line debt adapters/closure, historical debt/budget plans, full Autonomie/Spațiu/Buget/safe pace, recurring status history, web-state/backup migration, theme/settings/reorder and full screen comparison. Native backup still NOT web-compatible. Live reference still Vercel-login blocked; JS/index reference unchanged. Do not report100% or product percentage.


## CURRENT native checkpoint — 2026-10-16 Bucharest — build 9, IN PROGRESS / CI STARTUP BLOCKED

Supersedes prior current entries.
- Native feature HEAD `99a7eddec9d43dfd1c8a5d273badb7f2e8971f76` (docs); product `1ebe70529410cdccf2a6b22229160ff3d00e8b14`, v18.20 build 9 on feat/sync-preview-v18-20-ios ONLY. Prior stage8 product 9bbdff109b2c6861b1f4c38610471c58e955c38c, docs 7a6e064d146a58a22031c2e8e0004fd9cdbe59bc. Stable main untouched, verified a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- Optional LoanBook/LoanAgreement, dated opening principal and optional APR/installment count; Operation adds optional loanID/principal/installment/refinancingLoanID with absent-field decode. Old generic debt payments remain unassigned cash-only. Principal engine subtracts active linked principal through requested date, with checked arithmetic.
- Payments debit cash by total and debt by principal. Direct refinancing requires a separately configured different loan, no cash debit, no invented proceeds or automatic new-loan creation. Zero-balance closure retains history; closed loans reject new payments/correction/void that could reopen debt. Principal/date/reference validation is fail-closed; future loan postings/corrections rejected against supplied/current clock.
- Store config/declarations/payments/corrections/void/closure use atomic persist-before-publish. Snapshot validation/encrypted native backup integrate loan book/links. Diagnostic summary adds loan count, full financial data only opt-in. Correction form preserves loan/refinance/installment fields and permits principal edits.
- Finanțe → Împrumuturi: creation, monthly dues, principal balances/APR, total/principal payment split, direct-refinance selector, paid declaration, zero-only closure/closed list. Dashboard calendar includes LoanLedgerEngine-derived dues using the stage8 debt rules. New native UI has NOT been executed/visually compared.
- Added eleven native XCTest source methods: cash/principal and date balance, legacy unassigned, direct refinance, correction/void audit, write rollback, closure guards, declarations/failed closure, invalid fields, encrypted backup/reload/diagnostic, calendar, future-date guard. Stage8 added eight other methods. Expected total 135 native unit methods, NOT RUN.
- EXECUTED this session: 18 web debt-schedule reference cases against actual deployed Metro210 with documented limited ledger dependencies/exact dated balances. Cumulative web reference outputs 61. This does NOT execute Swift or validate new loan UI/ledger. No new native test success claim.
- Exact build9 CI `38809758646`, job `116679716168`: completed FAILURE, runner_id 0, steps []. Stage8 38809015613 likewise startup failure. Check output has two annotations but no summary/text; exposed connector cannot retrieve annotation detail. No local Swift/swiftc/xcodebuild. Last ACTUAL native green remains e82e6c7 / 38792158205: Xcode16.4 Simulator build + 62 unit + one UI. No unchanged reruns.
- LOAN_LEDGER_PARITY.md/DEBT_SCHEDULE_PARITY.md/README/PARITY_CHECKLIST record exact scope. Native backup still NOT web-compatible. No 1:1 or percentage claim.
- EXACT FIRST UNFINISHED ACTION: inspect/resolve hosted runner startup for 38809758646 and run exact feature HEAD. Repair compilation/test failures, verify expected 135 unit + UI, inspect full portrait populated light/dark captures including Loans/payment/refinance/correction. No screenshots or Files roundtrip validated for current code.
- Independent next implementation: add audited real-principal observations and reconciliation for loans (do not guess observed balances from cash), initial-principal correction/editing, card/line debt adapters and complete refinance explanation/proceeds flows. Then historical debt/budget plans, full Autonomie/Spațiu/Buget/safe pace, recurring status history, web-state/backup migration, complete themes/settings/reorder and screen-by-screen comparison.
- Explicit loan limits: initial setup/settlement separate actions, no generated interest accrual/amortization or explicit-schedule editor, no removed/reopened loan UI, no real loan balance observation yet. Available credit remains excluded from owned money. Preview JS/index unchanged and live visual access remains Vercel-login blocked.


## CURRENT native checkpoint — 2026-10-16 Bucharest — build 8, IN PROGRESS / CI STARTUP BLOCKED

- Native feature HEAD 7a6e064d146a58a22031c2e8e0004fd9cdbe59bc; product 9bbdff109b2c6861b1f4c38610471c58e955c38c; v18.20 build 8. Stable main unchanged at a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- Added pure DebtScheduleEngine, normalized definition/payment/exact-balance facts. Monthly/explicit schedules, FIFO whole-amount allocation, paid declarations, selected plan override, installment cutoff/projection anchor, closed/settled/nonpositive/full-refinance suppression match inspected preview Metro210. Missing exact balances fail rather than guessing.
- EXECUTED 18 reference cases via actual Metro210 plus limited ledger stubs with explicit dated balances; scripts/JSON committed. Cumulative web outputs 61; not Swift execution.
- Eight new XCTest source methods, expected total 124 NOT RUN. No native loan feature/UI integration yet: debt models are normalized primitive inputs only. No persisted data/schema or cash mutation in this batch.
- CI 38809015613, job 116677203870: failure, runner_id 0, steps []. Last actual green remains e82e6c7 / 38792158205, 62 unit + one UI. No local Swift/Xcode. No 1:1 claim.
- NEXT: canonical loan ledger with dated opening principal and linked payment principal/interest facts; persist/validate atomically, then supply real balances to debt schedule and connect UI/calendar. Existing generic native debtPayment remains unlinked legacy cash outflow; never guess its target or principal. Full card/line migration/refinance/closure and observations remain.
- Execution gate: restore hosted runner for exact HEAD, repair compile/tests, inspect populated full-portrait light/dark screens. Remaining complete budget/Autonomie/Spațiu formulas, web backup/state migration, historical budget/debt plans and visual parity documented in earlier checkpoints.


## CURRENT native checkpoint — 2026-10-15 UTC / 16 October Bucharest — build 7, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older HEAD and next-step notes below.
- Native feature HEAD `6bc462a8e8d941a8c178818706f3c072db4be276` (documentation); product `328095b894930834d6b07ec1337f5c931ce4fcd2`, version 18.20 build 7, branch feat/sync-preview-v18-20-ios ONLY. Stable main reverified unchanged at a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- Added optional ScheduleBook.fixedExpensePlans and FixedExpenseMonthPlans engine matching preview planAt floor selection and carry-forward. Fixed-expense edits replace the current month's complete plan, retaining earlier names/amounts/days; same-month edits do not duplicate plans. Schedule/Dashboard outgoing rows use selected historical fixed plans.
- First edit of a legacy native book freezes its known configuration at earliest first-due month, no later than edit month. This preserves previous native display, NOT an invented reconstruction of earlier edits. Nil field decodes as prior legacy behavior. No current data rewrite on read.
- LedgerStore commits catalog and monthly snapshots atomically; historical identity-kind changes and writes before latest plan are rejected. Native encrypted backup/restore includes/validates plans. Diagnostic adds plan count only; schedule UI lists monthly plan counts and explains current-month editing. No balances or actual operations changed by configuration.
- EXECUTED six reference outputs using exact active-preview Metro205 planAt body plus actual Metro210 obligationsFor (limited ledger dependencies, no debts/recurring): before first, first, gap, replacement, future carry-forward, empty replacement. Scripts/JSON committed. Cumulative reference outputs 43; none execute Swift.
- Eight new XCTest source methods for floor/history/empty replacement/legacy decode/native backup/invalid plans/atomic failed write/reload/backdated edits. Expected total 116 native unit tests, NOT EXECUTED. No new UI execution or screenshot parity.
- Exact product CI `38808312777`, job `116674821611`: completed FAILURE with runner_id 0 and steps []. Prior calendar run 38807679624 still had no logs (BlobNotFound). No compile/test diagnostics or local swift/swiftc/xcodebuild. Last ACTUAL green remains e82e6c7 / 38792158205: Xcode16.4 Simulator build + 62 unit + one UI.
- Source FIXED_MONTH_PLAN_PARITY.md/README/PARITY_CHECKLIST/SCHEDULES_PARITY document scope. Remaining historical plan scope includes budgets, debt payments/contribution, recurring status/name history; no historical edit/delete or removed-template UI. Native fixed first-due/cancellation fields remain model extensions. Native portable backup is NOT web compatible.
- EXACT NEXT ACTION: inspect startup annotations/restore hosted runner execution for run 38808312777; run exact feature HEAD, repair compile/tests and inspect full portrait PNGs. Verify expected 116 unit + UI before reporting green. Independent next product task: port debt schedule selection/suppression from actual obligationsFor, including settled/refinanced/closed debt and installment counts, with synthetic fixtures before linking financial UI. Then complete historical budget plans, Autonomie/Spațiu/safe pace, web migration and populated light/dark screen comparison.
- No 1:1 completion or product percentage asserted. Preview JS/index unchanged; live visual comparison remains blocked by Vercel login. No unchanged failed-run rerun was requested.


## CURRENT native checkpoint — 2026-10-15 — build 6, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older HEAD and next-step notes below.
- Native feature HEAD `3cae34fa1ec40b18d50945961b04ccd8278c8790` (documentation).
- Native product commit `49aef2d23d7499dc1e913005fb5805257f960882`, feature branch feat/sync-preview-v18-20-ios, version 18.20 build 6. Stable source main verified unchanged at a9b30be147abecea45a63bf7dd8d0a3eb3370366. Preview reference HEAD at startup 35993d6aedca0407e70097b9c9b9a3db332c977b.
- Implemented FinancialCalendarEngine and Dashboard calendar: current-month remaining scheduled outgoing obligations, planned incomes dated today or later (actual receipts do not consume estimates), stable merge by date, overdue/today/planned labels, signed amounts, day/month badges, initial three events and expand/collapse. No cash mutation or persistence schema change.
- Inspected actual deployed bundle Dashboard Metro module 217. EXECUTED four Node reference cases using its exact F/U expressions: mixed overdue/today/future and income filtering, leap clamp/ties/zero income, unknown-date outgoing last, empty. Generator + JSON committed. Cumulative web reference outputs 37; these do NOT execute native code.
- Five new XCTest source methods added (dates/status, receipt independence, partial payment/declaration, leap clamp/stable incomes, native start/cancel/invalid date). Expected current native unit count 108, NOT EXECUTED.
- Exact product CI `38807679624`, job `116672657788`: completed FAILURE before runner assignment (runner_id 0, steps []). Check output has two annotations but summary/text null; annotation retrieval is unavailable through exposed connector. No compiler/test result. No local Swift/swiftc/Xcode. Last ACTUAL green remains e82e6c7 / run 38792158205: Simulator build + 62 unit + one UI. Did not rerun unchanged startup failures.
- FINANCIAL_CALENDAR_PARITY.md records missing unknown-date native model, loan/debt/installment/refinancing/closed-account events, historical month plans, same-date outgoing input ordering and exact theme/populated-screen comparison. Native start/cancel rules extend web income model. Current calendar colors use system adaptation; no visual parity claim.
- EXACT NEXT ACTION: restore hosted runner execution / inspect startup annotations for 38807679624; build/test exact feature HEAD, repair failures, verify expected 108 unit + UI, inspect full portrait captures after prior launch-screen fix. Then implement historical month-plan and debt schedule models against obligationsFor, including settled/refinanced/closed suppression, before Autonomie/Spațiu/full budget-safe formulas.
- Remaining: all earlier migration/backup web compatibility, loans/refinancing, complete budget windows and formulas, recurring status history, themes/settings/reorder and screen-by-screen interaction parity. Live reference URL still has Vercel login wall. No 100% or global percentage claim.


## CURRENT native checkpoint — 2026-10-15 — build 5, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older HEAD and next-step notes below.
- Native feature HEAD `2ed86c4c90dccb64cac75a4a98aaff65949225d2` (documentation); product HEAD `b6388beae7ec3e69e0a48cde7997478a7e5f2b7c`. Version 18.20 build 5. Stable source main verified unchanged at a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- `6ff611fe` + `bda6d48e`: persisted ScheduleBook and operation.scheduledItemID; fixed/recurring/subscription/donation/income templates; current-month already-paid declarations and configuration without cash movement; linked actual receipts/payments; inclusive cancellation, current-month FIFO allocation, covered-role effective-date rules; new Finanțe → Obligații și venituri/editor. Linked expenses are fixed or explicitly budgeted; unbudgeted cannot settle a template. Correction preserves link; backup/restore/diagnostic integrate new optional legacy-compatible data.
- `b6388bea`: Cheltuit/Următorul venit cards with independent expansion, source palette/border/card layout parameters and expense/income quick actions. Spending includes current-month active expenses only, split budgeted versus others; legacy unassigned amounts retained separately. Next income is a planned monthly date, inclusive today/month-end clamp, not actual received money; no future amount added to balances. Native start/cancellation fields are respected and documented as model extensions.
- EXECUTED in this batch: nine outgoing obligation cases from actual preview Metro module 210, plus two spending/seven next-income component cases from module 304, using minimal documented dependency/render stubs in Node. Scripts and JSON committed under scripts/native-ios. Together with prior 15 recurrence cases: 33 web reference outputs. These do not execute Swift or establish visual parity.
- Added 19 schedule/ledger XCTest source methods + seven Dashboard methods. Expected current native unit total 103, NOT EXECUTED. Expanded existing UI smoke for schedules, independent card heights/expansion and income quick entry; no new successful UI run.
- Exact product CI run `38800636992`, job `116648426374`: FAILED before runner allocation (runner_id 0, empty steps). Earlier schedule runs 38799545761/38799746744 also failed at startup. No compiler/test logs and no local Swift/Xcode. Last ACTUAL native green remains e82e6c7 / 38792158205: 62 unit + one UI and Simulator build. Do not report current code as compiled or tested.
- Source README/PARITY_CHECKLIST/SCHEDULES_PARITY/DASHBOARD_SNAPSHOT_PARITY updated. No complete 1:1 or global percentage claim.
- EXACT NEXT ACTION: inspect startup annotations/hosted-runner availability for Actions run 38800636992. Once execution is possible, run current feature HEAD, repair compilation/tests, verify expected 103 unit + UI and inspect full portrait PNGs after prior launch-screen fix. Include schedule/correction screens, expanded Dashboard and quick actions. Do not keep rerunning unchanged startup failures without new evidence.
- Remaining independent product work: financial calendar, historical month-plan and debt/loan/installment/refinancing/closed-account models, full Autonomie/Spațiu/Buget/safe pace, complete theme/settings/reorder, lossless preview data/backup adapter and populated screen-by-screen verification. Native backup still NOT web-compatible. Planned/considering recurring status history and full income-reference parity remain incomplete. Live web comparison still requires resolving Vercel login access.


## Native build 4 — schedules integration IN PROGRESS (2026-10-15)
- Source feature HEAD `bda6d48e606d1ad41b1429dc5f5761164456a049`; preceding integration `6ff611fe`. Stable main untouched.
- Added optional ScheduleBook and operation.scheduledItemID, persisted template config and current-month paid declarations without cash movement; linked actual operations post through atomic ledger. Covered-role/cancellation/FIFO allocation rules ported for fixed/recurring expenses. Linked expenses are fixed or explicitly budgeted; unbudgeted cannot settle a template.
- Added Finanțe → Obligații și venituri list/month summary/editor, effective cancellation confirmation and prefilled actual payment/receipt form; correction preserves link. Restore/diagnostic integrated. Nineteen new XCTest source methods, expected total 96, NOT EXECUTED.
- EXECUTED: nine outgoing reference cases from actual preview module 210 obligationsFor via Node, source-equivalent limited dependencies, no debts. Reproducible generator/JSON in scripts/native-ios. Native Swift comparison NOT RUN.
- CI `38799545761` for 6ff611fe failed; inspect exact latest HEAD startup. Prior CI unavailable before runner allocation; latest verified baseline remains e82e6c7, 62 unit + one UI.
- Remaining scope explicitly includes historical month-plan snapshots, planned/considering status history, loan/debt/refinance schedules, web migration and Dashboard. Income remainder semantics not yet compared to preview examples.
- Next: inspect current CI, fix compilation/tests when runner works; next independent step inspect actual preview Dashboard snapshots/calendar before porting. Source SCHEDULES_PARITY.md records exact limits.


## CURRENT resume checkpoint — 2026-10-15 — native build 3, IN PROGRESS

Supersedes prior HEAD/next-action entries below.
- Feature branch HEAD `1cbd0c73b7aff7200645dbc1fedf1e281802a99c` (documentation); latest product `3d1384ea200b32c9c0b10724b617083257ba0aa1`. Source stable main verified unchanged at `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.
- Product commit `b371a60fbf8f02c80462e7611ac1f3528c0f677d`: optional legacy-compatible operationAudit journal (exact before, action, replacement ID, recordedAt), atomic correction/void persistence, Corecturi tab with pagination and expandable details, diagnostic count, restore validation rejecting invalid/duplicate/cyclic lineage. Legacy voids are not assigned invented correction dates/links. Eight new XCTest + expanded UI smoke source. NOT EXECUTED.
- Product commit `3d1384ea`: pure RecurrenceCalendar, preserving original weekly/monthly/quarterly/yearly anchor. Strict civil ISO validation; monthly clamp does not drift (Jan31→Feb28→Mar31). Three XCTest compare to 13 recurrence + two due-date reference cases.
- EXECUTED: Node generator using actual preview v18.20 Metro cashflow module 210 with same ledger monthEnd dependency. All 15 web reference outputs generated successfully; script and JSON committed under scripts/native-ios. This is NOT execution of Swift tests or proof of native date parity.
- Latest verified native remains `e82e6c7`, run `38792158205`: build + 62 unit + 1 UI passed. Expected current unit total 77 (62 + 4 earlier account safety + 8 audit + 3 recurrence), NOT RUN.
- Rerun prior b55030e CI still failed before runner allocation. New CI `38797256985` (b371a60f) and `38797722843` (3d1384ea) failed at startup; inspected jobs show runner_id 0 and empty steps. No logs/compiler diagnostics; reason remains unknown. Do not repeatedly rerun or label this a compilation defect. No local Swift/Xcode toolchain found.
- UI portrait/launch-screen fix remains unverified. Live reference remains blocked by Vercel login. Native backups still do not import web data. No financial formulas or stable branch changed in this resume batch.
- EXACT NEXT ACTION: inspect GitHub Actions startup annotations/runner availability for run `38797722843`; after execution works, run current feature HEAD, fix compilation/tests and inspect full-frame PNGs, including Corecturi. Verify expected 77 unit + UI result before calling these batches tested.
- Independent next product work: integrate recurring obligations/income/loan models and payment allocation using preview obligationsFor (month plans, paid declarations, cancellation dates, covered-by-budget semantics, refinanced/closed debt suppression). RecurrenceCalendar alone does not implement these. Then Dashboard financial/visual parity and lossless preview-state/backup migration.
- Full native parity remains incomplete; no global percentage asserted. Source README/PARITY_CHECKLIST/RECURRENCE_PARITY document evidence and remaining work.


## Resume batch — 2026-10-15 correction lineage (IN PROGRESS)
- Source candidate v18.20 build 3, feature HEAD `b371a60fbf8f02c80462e7611ac1f3528c0f677d`. Stable main untouched.
- Implemented optional backward-compatible OperationAuditEntry journal: exact pre-change operation, correction/void action, replacement link, record timestamp. Audit entries persist atomically with original void/replacement; older voids remain unlinked, not guessed.
- Added paginated Corecturi tab with expandable before/after details. Diagnostic reports audit count. Restore validator checks references, duplicate revisions/replacements and correction cycles; native backup carries journal.
- Added 8 XCTest (chain/reload, void/replay, failed write rollback, legacy decode, invalid links/cycle, encrypted backup roundtrip) and extended UI smoke captures to Corrections. NOT EXECUTED. Expected unit total 74 includes 4 prior unrun account safety tests.
- Rerun of prior CI 38795014412 again failed before runner assignment (job 116635139421, no steps). Exact new HEAD CI must be inspected; latest verified baseline remains e82e6c7, 62 unit + 1 UI.
- Next feasible task READY FOR IMPLEMENTATION: port preview recurringDates/dueDate as pure native calendar engine with fixture parity (original monthly anchor, leap years, weekly and quarterly/yearly dates), without claiming obligation financial-model parity. Verify full iOS build/tests when runner becomes available.


## CURRENT native checkpoint — 2026-10-15 — IN PROGRESS / CI STARTUP BLOCKED

- Native branch ONLY: `feat/sync-preview-v18-20-ios`. Current HEAD `b55030e063115f1b1023d7ece76c6fb0644c24b4`; native candidate v18.20 build 2. Source stable `main` remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`; no stable promotion.
- **Latest verified revision:** `e82e6c7eb706ff0e7c3431f91d2b372c7f265a14`, Native iOS CI `38792158205`, job `116619185012`: Xcode 16.4 Simulator BUILD SUCCEEDED; **62 unit tests + 1 UI smoke test passed**. Baseline was 49 unit tests at startup `6dcf4610`. New verified coverage: correction atomicity/audit/observation guard, native encrypted backup/authentication/tampering/restore, diagnostic privacy, history date/filter/pagination.
- Implemented and compiled at verified revision: native portable AES-256-GCM/PBKDF2 backup, snapshot validation, atomic restore, Files backup screen, More/settings, manual/system light/dark, diagnostic export with optional full financial data, month/category history filters, checked Dashboard totals. Native backup is NOT web-compatible. Files-provider end-to-end/device roundtrip remains unverified.
- UI test visited five tabs and backup in both themes; 12 PNGs exported in artifact `11999684650` and downloaded. Inspected Dashboard/backup images are 960×1440 and visibly clipped. They **do not establish visual parity**. Proposed launch-screen fix `88e1ced8` and screenshot aspect guard `92bbfe9b` are NOT VERIFIED.
- Additional unverified product batch `d7665f54`: credit-limit entry/persistence, failed-form save guards, checked reconciliation UI, duplicate explanation-ID rejection; four regression tests added (**expected 66 unit tests, not run**).
- Latest CI `38795014412` for exact HEAD failed at startup. Earlier `38794479635`, `38794483436` (also rerun) and `38794789262` failed with runner_id 0, empty steps, no job logs. Cause not established. Do not call this a compiler/test failure or claim exact HEAD green. Local environment has no Swift/Xcode. CI resource settings now use relevant paths, cancel obsolete same-branch runs, 20-minute cap and 14-day artifacts; YAML parsed locally, hosted execution not verified.
- Live web visual comparison attempted: public Vercel URL redirects this browser to Vercel login. No authentication changes attempted. Reference bundle v18.20 inspected from repository (backup format and budget UI); no live parity claim.
- **Exact next action:** inspect startup annotations/runner availability for run `38795014412`; once hosted execution works, run exact branch HEAD, fix compiler/tests, export PNGs and verify full-frame iPhone rendering after launch-screen change. If rendering assertion fails, inspect simulator screenshot geometry/launch config before proceeding.
- Then continue: lossless preview-state import and backup adapter; recurring obligations/income/loan/refinance models; Dashboard Autonomie/Spațiu/Buget/Cheltuit/next-income/calendar formulas; correction-history tab/lineage; full budget windows/allocations; visual comparison with synthetic populated data. Account closing and sunset theme remain missing.
- Full parity is **not achieved**. No defensible global percentage from current coarse checklist. Source `NativeiOS/PARITY_CHECKLIST.md` now contains an 8-area evidence/gap matrix. Nothing certified 1:1 merely from compilation or test counts.



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


## Native iOS verification checkpoint — 2026-10-15 10:04 EEST
- Source app feature branch HEAD `086dbb0053053b1e6c695ab70d868a6f2c8fee3b` verified by Native iOS CI run `38691358232`, job `116277752137`: Xcode 16.4, iOS Simulator BUILD SUCCEEDED, TEST SUCCEEDED, **21/21 XCTest**, zero failures. Source stable `main` unchanged.
- Attempted atomic/fail-closed `NativeiOS/LedgerStore.swift` update, checked-totals Dashboard UI, and safe-totals XCTest creation; all rejected by GitHub tool safety checks. No source commit made in this run.
- Local-only candidate v8: `financial_autonomy_ios_candidate_20261015_v8.zip`; adds three failure-injection XCTest cases (failed void, balance observation, explanation). Swift syntax parse passed; Linux pure-core SwiftPM **21/21** passed. v8 has NOT been compiled by Xcode or pushed.
- Critical next step: integrate atomic LedgerStore when writes permitted, add XCTest and run exact-HEAD CI; then guarded forms, persistent BudgetSettings, checked UI arithmetic, backup/import, and full preview v18.20 functional/financial/visual parity. Do not declare completed.


## Native iOS atomic ledger checkpoint — 2026-10-15
- Source feature branch `feat/sync-preview-v18-20-ios` only; source stable main not modified.
- New source commits `f0ebd47` injectable persistence/readability flag, `a9af79a` fail-closed unreadable encrypted store, `c8419dc` atomic commit primitive, `38a5232` routes account creation, operations, voids, observed balances and explanations through persist-before-publish mutation.
- The intermediate commit `c8419dc` temporarily lacked the old save method; `38a5232` completes the migration. CI for exact `38a5232` is NOT YET VERIFIED. Earlier `086dbb0` passed Xcode simulator and 21/21 XCTest (run 38691358232).
- Next: inspect exact HEAD CI; add failure-injection XCTest for each mutation and confirm rollback on failed write, then BudgetSettings persistence and screen-by-screen preview v18.20 parity. Existing UI may dismiss forms on failed save; fix after tests.
- Do not claim parity or stable promotion.

## Native persistence regression tests — 2026-10-15
- Source feature commit `77e1894` added injectable write-failure XCTest cases for account creation, expense and balance observation.
- Source feature commit `0c79800` added write-failure cases for void and reconciliation explanation; total five new cases.
- Earlier run 38691358232 passed 21/21 tests on older source commit `086dbb0`. Exact latest HEAD Xcode build/tests are NOT VERIFIED; tests just added have not been executed.
- Stable source main unchanged. Next: inspect CI for current feature HEAD, fix any test/compiler errors, then persist BudgetSettings and complete preview 1:1 parity.

## Native persisted budget configuration — 2026-10-15
- Source feature commits `57bacd3` BudgetSettings optional backward-compatible snapshot field; `66b7d58` atomic encrypted budget settings update; `dcdc62a` BudgetView loads and saves period, amount and optional next payday.
- Budget screen now persists its configuration, but per-category budgets, spending allocations and preview formulas remain incomplete. A regression-test commit attempt was blocked, so no new budget persistence test was committed.
- Xcode CI for these exact commits is NOT VERIFIED; stable main untouched. Next: run CI, test backward decode and budget rollback, implement preview budget/category parity.

## Native spending-linked safe pace — 2026-10-15
- Source feature commits `9b6c630` derives today's recorded non-void expense total in BudgetView and deducts it from safe daily pace; `9be6651` updates labels and calculation disclosure to reflect spending deduction.
- Current formula remains provisional: future obligations and budgeted/unbudgeted expense allocation not yet included. No Xcode CI verification for these commits; source stable main untouched.
- Next: compare preview v18.20 formulas, implement budget categorization, validate simulator build and tests.

## Native expense budget allocation — 2026-10-15
- Source feature commits `03f77d3` optional expense category and budgeted fields; `6eb5f0f` expense entry controls; `ee2c7ad` daily budgeted spending display; `7fdffee` overflow-safe aggregation.
- IMPORTANT: newly added non-optional Codable field `budgeted` currently requires custom decoding/default for backward compatibility; old encrypted snapshots may fail to decode. Address this before claiming safe migration.
- Xcode build/tests of exact HEAD unverified; full preview parity incomplete; stable main unchanged.
- Next: add backward-compatible Operation decoding and tests, verify CI, then implement true budget allocation formulas.


## Native iOS checkpoint 2026-10-15 18:05 EEST
- Feature branch only: `nikopol000/financial-autonomy-app:feat/sync-preview-v18-20-ios`; stable source main untouched.
- Commits: `5754fd6` fixes ambiguous `Operation` XCTest; `bd6e1aa` adds backward-compatible Operation Codable decode (legacy absent budgeted/category); `fe33d58` adds two decoding XCTest. Exact-head CI for `fe33d58` NOT VERIFIED YET; earlier `7fdffee` failed XCTest compilation.
- Local candidate v16 remains unintegrated; 82/82 Linux tests reported, NOT Xcode verified. Do not overwrite current remote Models wholesale.
- Next: inspect CI for `fe33d58`, fix failures, then integrate explicit financialRole/budgetID and BudgetAllocationEngine from v16 in small commits; persistence failure injection, history UI, encrypted backup, and visual 1:1 audit remain.


## Native iOS checkpoint 2026-10-15 18:xx EEST
- Verified successful Native iOS CI for `5754fd6`, run `38757077279` (fixes ambiguous Operation XCTest).
- Exact-head CI `fe33d58`, run `38757118898`, failed XCTest compilation in `LedgerStoreTests.swift` lines 53/75: missing `destinationAccountID` due to new Operation initializer without optional default arguments. App build passed.
- Commit `80a3b8ea4877cdf613ed426664aec24d7bd5b862` restores default `nil` for `sourceAccountID` and `destinationAccountID` in initializer. CI run `38760070064` was QUEUED at observation, not yet verified.
- Next: verify exact-head CI for `80a3b8e`; fix any failures, then integrate v16 budget ID/role adapter incrementally. Source main untouched. Full native preview parity not achieved.


## Native iOS checkpoint 2026-10-15 ~18:xx EEST
- Verified Native iOS CI SUCCESS for `80a3b8e`, run `38760070064`.
- Source feature branch commits: `86f6125` adds `budgetID` and `financialRole` to Operation with backward-compatible Codable; `25495ac` adds `BudgetAllocationEngine` (checked arithmetic, independent windows, daily pace); `14f3706` adds `BudgetOperationAdapter` (legacy budgeted expenses require explicit assignment; no category-based guessing). Source `main` untouched.
- At observation CI `25495ac` run `38760518305` was QUEUED and `86f6125` run `38760491443` in progress; exact-head `14f3706` CI NOT YET VERIFIED. No Xcode success claim for new HEAD.
- NEXT: check exact-head CI and fix any failures; add budget adapter/engine XCTest, wire to UI with explicit budget selection, then history/audit, encrypted backup, obligations/refinancing, diagnostic, screen-by-screen visual parity.


## Native iOS checkpoint 2026-10-15 latest
- Exact-head CI for `14f37069` SUCCESS run `38760534547`, native iOS Simulator build and XCTest; budget engine `25495ac2` SUCCESS run `38760518305`.
- New feature-branch commit `fe9d42d1645fb5519bec96f59e11161a9f57e1ed` adds six XCTest for BudgetAllocationEngine and BudgetOperationAdapter (allocation, daily pace, overflow, legacy assignment, explicit category/budget separation, duplicate IDs). CI for `fe9d42d` NOT YET VERIFIED; do not claim green until completed.
- Next: verify exact-head CI, fix regressions, wire explicit budget selection and real budget allocations into SwiftUI BudgetView/expense entry, then complete remaining history/backup/obligations/refinancing/diagnostics and screen-by-screen parity. Source main untouched.


## Native iOS checkpoint 2026-10-15 history integration
- Exact-head CI SUCCESS for `fe9d42d1645fb5519bec96f59e11161a9f57e1ed`, run `38760774499`, covering six new budget engine/adapter XCTest.
- Source feature branch commit `3759788295ba442b38ad0b6f4469292cf7f7b59c` wires `HistoryQueryEngine` into SwiftUI HistoryView: diacritic-insensitive search, account/kind filters, 10/20/50 pagination, audited void retained. Run `38761001083` QUEUED when checked; not yet verified.
- NEXT: verify exact-head CI, fix any SwiftUI compile issues, integrate correction history/audited editing, then explicit budget selection in expense UI and allocation results in BudgetView. Complete backup, obligations/refinancing, diagnostics, and screen-by-screen parity. Source main untouched; 1:1 not established.


## Native iOS checkpoint 2026-10-15 budget UI wiring
- Verified CI SUCCESS for `3759788295ba442b38ad0b6f4469292cf7f7b59c` run `38761001083` (SwiftUI HistoryView filters/pagination).
- Feature branch commits: `25f032e0c7ee74ada5f4f765855552cb732ab44f` requires explicit budget ID when entering budgeted expense and preserves form on store error; `c072e2b885e1cf6e10193c27fcf7454ce56e9303` renders explicit allocation summary in BudgetView and warns when legacy/unmappable operations exist. CI for exact HEAD `c072e2b` NOT VERIFIED at checkpoint.
- Remaining: confirm exact HEAD CI; test budget UI and persist explicit budget ID settings, replace free-text budget ID with safe selector; audited history edit, portable encrypted backup, obligations/refinancing, diagnostics, visual screen-by-screen parity. No claim 1:1. Source main untouched.


## Native iOS checkpoint 2026-10-15 budget persistence
- Verified native iOS CI SUCCESS `c072e2b` run `38761261868`.
- New feature-branch commits: `e6c5c4c3` adds backward-compatible persisted BudgetSettings.budgetID; `ea75ee6e` restores/saves budgetID in BudgetView; `3de894eb` replaces expense free-text budget entry with picker restricted to configured budget; `df171046` adds 3 XCTest for legacy budget settings, round trip and malformed amounts. Exact-head CI `df171046` NOT YET VERIFIED. Prior runs for e6c5/ea75/3de894 in progress when checked.
- NEXT: verify exact-head CI and repair any failures. Then audited history editing, portable encrypted backup, obligations/refinancing, diagnostics, and screen-by-screen parity with preview v18.20. Current model supports one configured budget; multiple concurrent budget windows still missing. Source main untouched; do not claim 1:1.


## Native iOS checkpoint 2026-10-15 multi-budget catalog
- Exact-head CI SUCCESS for `df171046` run `38761640401` (budget settings migration XCTest).
- New feature-branch commits: `0fcd9ad7` BudgetCatalog validates distinct IDs and protects referenced budgets; `2139578e` adds five catalog XCTest; `349285c4` optional `LedgerSnapshot.budgets` for legacy compatibility; `84835a5f` LedgerStore upsert/remove; `ad0bb3d0` expense picker lists configured budgets; `25bcf9ca` BudgetView supports creating/editing catalog budgets; `67fecb5e9649d372b8c3e8ffcfd41e831dbd0e09` fixes parser-compatible amount formatting when switching budgets. Exact-head CI for `67fecb5` NOT YET VERIFIED; earlier runs were in progress.
- Remaining: check latest CI and fix compile/test failures; review safe budget editing/renaming and legacy migration, add UI tests; audited history editing, portable encrypted backup, obligations/refinancing, diagnostics, and visual parity. Source main untouched; do not claim 1:1.


## Native iOS checkpoint 2026-10-15 audited corrections
- Verified CI SUCCESS exact HEAD `67fecb5e9649d372b8c3e8ffcfd41e831dbd0e09` run `38762041992` for multi-budget catalog and UI integration.
- New source feature commits: `d020e1bad558c6daca19f109276634989c4b36e7` adds LedgerStore.correctOperation with atomic reversal/reapply, original voided audit history, prevents retroactive changes across observed balances; `c205ad9d2405e5749bf92e7e00cccdc721aa007f` adds HistoryView correction sheet for description/amount/date/category while retaining account/kind/budget. Exact-head CI for `c205ad9d` NOT VERIFIED at checkpoint; d020 run queued.
- NEXT: check CI for c205 and fix compilation/regressions; add correction tests (atomic failure, observed balance guard, audit preservation); then backup, obligations/refinancing, diagnostics, visual parity. Source main untouched, not 1:1.


## Native iOS checkpoint 2026-10-15 correction tests
- Previous multi-budget exact-head `67fecb5` CI SUCCESS run `38762041992`.
- Audited correction commits `d020e1ba` LedgerStore and `c205ad9d` HistoryView sheet; their CI still in progress at checkpoint.
- New XCTest added to `NativeiOS/Tests/LedgerStoreTests.swift` covering correction audit, persistence failure atomicity, and observed-balance guard: commit `4463b877`, immediately followed by fix `28f26dd3ab847157ca0ce64e7397e284a67900af` to keep tests inside XCTest class. Exact HEAD `28f26dd3` CI NOT YET VERIFIED. Verify this HEAD, fix failures before next changes.
- Next: encrypted portable backup, obligations/refinancing, diagnostics, UI parity. Source main untouched; 1:1 not achieved.


## Native iOS checkpoint — 2026-10-15 portable backup IN PROGRESS
- Startup inspected real feature HEAD `6dcf4610`; exact-HEAD Native iOS CI SUCCESS run `38790654186`, job `116614014409`, Xcode simulator build and 49/49 XCTest.
- Correction tests described in prior checkpoint were absent from actual HEAD; new standalone OperationCorrectionTests added at `f1975c5` (3 cases). CI pending.
- Native backup codec `f4b2598`, empty-password guard `456545d`, atomic restore/export integration `78430ab`. AES-256-GCM with authenticated version header, random salt and PBKDF2-HMAC-SHA256 600000 rounds. Snapshot reference/schema/arithmetic validation before replacement.
- IN PROGRESS, not verified yet: add backup/restore tests and Files UI, inspect exact-HEAD CI, fix errors. Native format is not web backup-compatible; web migration remains missing. Source main untouched.
- Remaining full parity: obligations/recurring income/loans/refinancing models, dashboard financial/visual parity, correction history view, preview import, diagnostic/settings, interactive screen comparison.


## Native iOS checkpoint — 2026-10-15 backup and settings
- Native candidate v18.20 build 1, feature branch ONLY; stable source main untouched.
- Verified CI SUCCESS `444539ae`, run `38791422537`: 57/57 XCTest, including correction audit/rollback/observed-balance protection and portable backup roundtrip, authentication/tamper/validation, restore disk-failure atomicity. Backup/settings UI compiled and tests passed at `c6026364`, run `38791547205`; checked dashboard totals `dc62e435` CI SUCCESS run `38791646401`.
- Added local Files backup UI with show-password/confirmation and reviewed replacement; native format v1, not web-compatible. Added persistent system/light/dark theme. Added diagnostic export with default summary and explicit full financial data option; `5e5b0968` adds diagnostic tests, exact-HEAD CI pending.
- UI screenshot smoke test + Xcode target `e79f86f3`; retained xcresult workflow `c0d7d8f2`. Pending: inspect exact HEAD CI/UI tests and screenshots, fix failures, verify Files interactions. Empty-state captures alone do not establish visual parity.
- Next: inspect latest Native iOS CI for `5e5b0968`, repair failures; audit actual screenshots and document differences. Then correction history/date filtering, recurring obligations/income/loans/refinancing, preview migration and dashboard financial/visual parity. Sunset automation not implemented (system theme + manual only). No claim 1:1.
