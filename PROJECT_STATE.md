# Financial Autonomy — Project State

## CURRENT native checkpoint — 2026-10-20 Bucharest — build31, EXACT DAILY/SAFE PACE AND CONTRIBUTION / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `da9aed054563fdd9a3b14c89effb85b043a64659`; version 18.20 build31 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added a pure v18.20 daily-pace engine. Budget today restores today's matching Budgeted Expense before applying each included Primary window's rounded one-day cap, then reports included spend, outside-pace spend and unbudgeted spend exactly from explicit financial roles.
- Safe today now uses available owned-account balances only, finds the next known income day, subtracts fixed/debt/recurring obligations through the preceding day, and floors the remainder across the inclusive horizon. Future income and all available credit are excluded.
- Current-plan contribution is the configured plan amount less net current-month transfers from non-savings accounts into savings; reverse transfers reduce completed contribution. Budget UI and Dashboard now show the exact Budget today/Safe today bars, included budget names, unavailable reason, and (in the full Budget view) contribution remaining.
- Three focused XCTest source methods cover restored-today allowance, contribution transfers and Coverage cash/obligation horizon. Expected native unit inventory: 229 methods.
- EXECUTED verification: active v18.20 bundle blob `be453db2699273a194543de4532db6ea4b2e1cf2` modules 205/210/220/221 were inspected; Node fixtures reproduced allowance 1000, safe daily 700 and remaining contribution 3000. Targeted source/contract checks passed. Swift and Xcode are absent locally, so compilation, all 229 XCTest methods, UI tests, screenshots and interactive visual comparison are NOT RUN.
- Exact Native iOS CI: run `39340449123`, job `118360369560`, completed `failure` before runner allocation; `steps=null`, logs unavailable. It was not rerun.
- NEXT: restore/observe hosted macOS execution, compile exact HEAD `da9aed054563fdd9a3b14c89effb85b043a64659`, run all 229 unit methods plus UI tests and inspect screenshots. Independent next slice: remove the imported-plan path's remaining legacy approximate pace duplication and match v18.20 daily status/detail copy and visual treatment. Visual and functional 1:1 is not yet claimed.

## CURRENT native checkpoint — 2026-10-20 Bucharest — build30, CURRENT BUDGET-WINDOW PRESENTATION / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `679e529cfad3624da77fbb50ecf14bb4d5690727`; version 18.20 build30 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Budget and Dashboard now present the carry-forward v18.20 current plan from build29 snapshots. Each budget shows its Primary window, exact spent/limit progress and pace color; the Budget page shows all additional windows plus remaining/daily values and explicit incomplete reasons.
- Dashboard matches active bundle module 218 visibility/order: Primary is always visible, pinned additional windows are collapsed initially and expand in paycheck, weekly, biweekly, monthly, quarterly, annual, custom order. Unpinned additional windows stay out of Dashboard but remain visible in Budget.
- The presentation reads only retained plan metadata and explicit `Budgeted Expense` attribution. No credit value is an engine input; owned money and available credit remain separate.
- One focused XCTest source method covers collapsed/expanded pin visibility, hidden-window exclusion and canonical ordering. Expected native unit inventory: 226 methods.
- EXECUTED verification: inspected active v18.20 bundle `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`, modules 218/219; a Node fixture reproduced collapsed `[primary]` and expanded `[primary, weekly, annual]` ordering. Targeted contract and delimiter checks passed. Swift/Xcode/xcodegen are unavailable locally, so compilation, all 226 XCTest methods, UI tests, screenshots and interactive visual comparison are NOT RUN.
- Exact Native iOS CI: run `39332817183`, job `118334911754`, completed `failure` before runner allocation; `steps=null`, logs unavailable. It was not rerun.
- NEXT: restore/observe hosted macOS execution, compile exact HEAD `679e529cfad3624da77fbb50ecf14bb4d5690727`, run all 226 unit methods plus UI tests and inspect screenshots. Independent next slice: port contribution-aware current-plan summaries and exact daily/safe pace inputs while preserving owned-money/available-credit separation. Visual and functional 1:1 is not yet claimed.


## CURRENT native checkpoint — 2026-10-20 Bucharest — build29, V18.20 BUDGET-WINDOW ENGINE / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `a1de1d206619749fabb7b55fe6b7851b6804b6eb`; version 18.20 build29 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added a pure native v18.20 budget-window engine over the lossless build28 metadata: carry-forward `planAt`, monthly/quarterly/annual/Monday-week/1970-01-05 biweekly/paycheck/custom periods, started-day clamping, Primary proration, Auto aggregation across historical Primary plans, positive Custom limits, elapsed expected spend, 5% pace bands, supported daily allowance, Dashboard pin metadata and explicit unavailable reasons.
- Spending is counted only for active `Budgeted Expense` operations attributed to the exact budget and within the tracked window through as-of. Fixed, debt, savings, transfer and unbudgeted spending never consume a budget. The engine has no account/credit input, so available credit cannot become owned money.
- Four focused XCTest source methods cover tracked-month proration and strict role filtering, historical Auto aggregation without intermediate rounding, paycheck month-end clamping/missing-income failure, and biweekly epoch/custom-range behavior. Expected native unit inventory: 225 methods.
- EXECUTED source verification: compared the implementation against active bundle `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`, module 219; Node fixtures reproduced exact biweekly `2026-10-12...2026-10-25`, paycheck `2026-02-28...2026-03-30` and Auto `230012` results. Targeted structural checks passed. Swift/Xcode/xcodegen are unavailable locally, therefore compilation and all 225 XCTest/UI methods are NOT RUN.
- Exact Native iOS CI: run `39325651651`, job `118310680540`, completed `failure` before runner allocation; `steps=null`, logs unavailable. It was not rerun.
- NEXT: restore/observe hosted macOS execution, compile exact HEAD `a1de1d206619749fabb7b55fe6b7851b6804b6eb`, run all 225 unit methods plus UI tests and fix actual failures. Independent next parity slice: present current-plan Primary/additional window snapshots in native Budget/Dashboard UI, then port contribution-aware summaries while keeping owned money separate from available credit. No 1:1 claim.


## CURRENT native checkpoint — 2026-10-19 Bucharest — build28, LOSSLESS BUDGET-PLAN CONTRACT / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `8351011600e880c12061e346bd75e06bc0a49243`; version 18.20 build28 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Historical month-plan budgets are now accepted and retained losslessly in backward-compatible web metadata: exact ID/name/amount, Primary kind, anchor/income/range, optional daily-pace flag, additional-window order, Auto/Custom mode, custom amount, anchor/income/range and optional Dashboard pin. Monthly contribution is retained in minor units, including nonzero values.
- Web budgeted transactions now accept the exact `categoryId` field and `financialRole=budgeted`, map to native `Operation.budgetID` / `.budgetedExpense`, and are validated against the carry-forward `planAt` budget for the transaction month. Fixed-template expenses cannot also consume a variable budget. `financialRole=fixed` is mapped only with a valid fixed-expense template.
- Advanced budget-window calculations and contribution effects are deliberately not claimed as native-functional yet. This stage preserves and validates the source truth and transaction attribution without inventing native Auto/Custom cadence semantics or UI.
- Two XCTest source methods were added for exact advanced-window/contribution/link retention and fail-closed invalid Custom/inactive-budget references. Expected native unit inventory: 221 methods. Tests, compilation and UI execution were NOT RUN because this environment has no Swift/Xcode/xcodegen.
- EXECUTED source verification: inspected the active v18.20 bundle `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`, for month-plan validation, `planAt`, `categoryId`, fixed-expense double-allocation rejection, Primary/Auto/Custom fields and contribution behavior. Structural delimiter and targeted contract-presence checks passed for the changed Swift sources. This is source inspection, not native execution.
- Exact Native iOS CI: run `39317190579`, job `118281603405`, completed `failure` before runner allocation; `steps=null`, logs unavailable. It was not rerun.
- NEXT: restore/observe hosted macOS execution, compile exact HEAD `8351011600e880c12061e346bd75e06bc0a49243`, run all 221 unit methods plus UI tests, and fix actual failures. Independent next parity slice: port the exact Primary/additional Auto/Custom window calculation and current-plan presentation from the active bundle, then wire contribution into the matching financial summaries without changing owned-money truth. No 1:1 claim.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build27, HISTORICAL MONTH PLANS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `3784f68dfe4c5692e8fa1b925ea794da1e32179f`; version 18.20 build27 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- The v18.20 importer now accepts unique historical `monthPlans` at or after the backup start month, preserving fixed-expense UUID/name/minor-unit amount/day/dayKnown rows and known-debt payment amounts in backward-compatible web metadata.
- Historical fixed-expense rows become native `FixedExpenseMonthPlan` history with carry-forward semantics. Optional `ScheduledItem.webDueDay` retains the web day-of-month and projection resolves it per target month, so a day-31 import yields 31 March after February rather than drifting to day 28.
- The latest imported plan must exactly equal the current fixed-expense template catalog and current debt payments. Unknown debt references, duplicate month/item IDs, malformed values, nonempty budgets, or nonzero contribution fail the entire import. Budget-window/contribution fields remain intentionally unsupported in this bounded stage.
- Two XCTest source methods were added for multi-month carry-forward/month-end behavior and fail-closed budget/unknown-debt cases. Expected native unit inventory: 219 methods. Tests, compilation and UI execution were NOT RUN because this environment has no Swift/Xcode/xcodegen.
- Source-level verification actually executed: exact active bundle `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js` (blob `be453db2699273a194543de4532db6ea4b2e1cf2`) was inspected for `monthPlans` validation/latest-plan behavior; changed Swift delimiters were checked structurally; branch update used expected SHA `21d34c1d3b46c3e085f5a5849e1560efb2a82ff3`.
- Exact Native iOS CI: run `39309053783`, job `118253605955`, completed `failure` before runner allocation; `steps=null`, logs unavailable. It was not rerun.
- NEXT: restore/observe hosted macOS execution, compile exact HEAD `3784f68dfe4c5692e8fa1b925ea794da1e32179f`, run all 219 unit methods plus UI tests, and fix actual failures. Independent next parity slice: map historical month-plan budget windows and contribution only after deriving exact lossless native semantics; until then remain fail-closed. No 1:1 claim.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build26, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `21d34c1d3b46c3e085f5a5849e1560efb2a82ff3`; version 18.20 build26 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added lossless v18.20 income and fixed-expense template catalogs. Exact UUID, name, minor-unit amount, due day and optional day-known flag are retained in backward-compatible web metadata; duplicate/non-UUID IDs, unknown keys, invalid values and default-plan drift reject the entire import.
- Transaction `templateId` is accepted only when the referenced imported catalog item exists and its kind matches: income templates require income operations; fixed-expense or recurring commitments require expense operations. The exact link is retained in optional `Operation.webTemplateID`, including audit-before operations.
- No native schedule anchor is invented for day-of-month-only templates. They remain lossless metadata until historical month plans can establish safe semantics. Recurring commitments with exact next-payment dates continue to populate the native schedule book.
- The default start-month plan must contain exactly the imported fixed-expense catalog values and all debt payments. Budgets/contribution and historical/nondefault plans remain fail-closed for the next stage.
- Added two XCTest source methods for exact catalog/link retention and kind/default-plan rejection. Expected repository inventory is **217** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Inspected Metro205 global ID, template catalog, default-plan expense and transaction `templateId` validation. Structural delimiter checks passed for all four changed files. This is source inspection, not native execution or UI validation.
- Exact CI run `39300272690`, job `118223339473`, completed failure before runner allocation with `steps=null` and no logs. Local environment has no Swift/Xcode/xcodegen. Build, 217 XCTest methods and UI tests were NOT executed; no rerun was requested.
- Remaining: compile/test build26; historical month plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `21d34c1d3b46c3e085f5a5849e1560efb2a82ff3`, run expected 217 unit methods plus UI tests, and fix actual failures.
- Next independent implementation if runner remains unavailable: import historical month plans in a bounded lossless stage, beginning with fixed expenses/debt payments and rejecting budget-window fields until every field maps exactly.


## CURRENT native checkpoint — 2026-10-19 Bucharest — build25, IN PROGRESS / NATIVE EXECUTION QUEUED

Supersedes older current entries.
- Native feature/product HEAD `13c2a1f32ed822eabcc27655cb8f02bb953691df`; version 18.20 build25 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added the bounded lossless v18.20 recurring-commitment import. Exact UUID, name, minor-unit amount, weekly/monthly/quarterly/yearly frequency, subscription/donation/expense kind, active/considering/planned/cancelled status, covered-by-budget flag, next-payment civil day, complete lifecycle history, optional effective end day and optional ISO reminder are retained in backward-compatible web metadata.
- Imported commitments also populate native `ScheduleBook` with the same UUID, amount, frequency, next-payment anchor and cancellation boundary. Status/history/reminder remain separately preserved because the native due engine has no equivalent lifecycle fields. Unknown keys, invalid dates/enums, duplicate/non-UUID IDs and cancelled entries without an end day reject the entire import before replacement.
- Income/fixed-expense template catalogs and transaction `templateId` links remain deliberately fail-closed; no first-due dates or historical links were invented. Historical month plans are still pending.
- Added two XCTest source methods for exact recurring lifecycle retention/native mapping and fail-closed unknown/non-UUID input. Expected repository inventory is **215** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Inspected its recurring validation, lifecycle transition, next-date and monthly conversion contracts. Structural delimiter checks passed for the four changed files. This is source inspection, not native execution or UI validation.
- Build24 CI run `39283427502`, job `118162634574`, completed failure before runner allocation with empty steps and no logs; it was not rerun. Exact build25 CI run `39291591631`, job `118193329258`, completed failure before runner allocation with `steps=null` and no logs. Local environment has no Swift/Xcode/xcodegen.
- Remaining: compile/test build25; import income/fixed-expense templates and exact transaction template links, then historical month plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: observe Native iOS CI run `39291591631`; if runner execution becomes available, compile exact HEAD `13c2a1f32ed822eabcc27655cb8f02bb953691df`, run expected 215 unit methods plus UI tests, and fix actual failures.
- Next independent implementation if runner remains unavailable: add lossless income/fixed-expense template catalogs and eligible `templateId` transaction links without inventing schedule anchors, then continue historical month plans.



## CURRENT native checkpoint — 2026-10-19 Bucharest — build24, IN PROGRESS / NATIVE EXECUTION QUEUED

Supersedes older current entries.
- Native feature/product HEAD `cfed8f91127a4b970310e2be0f9aaff0c22de6de`; version 18.20 build24 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Removed the former fail-closed boundary for v18.20 transaction audit combined with active balance checks. Imported account observations now retain an optional exact cumulative `webDifferenceMinor` while preserving interval `expectedMinor`, observed value, UUID and order. Legacy/native data decode with the optional field absent and keep the prior interval behavior.
- Ported Metro207's exact audit rule: only a transaction whose current kind is income can contribute a historical correction; the pre-check audit version is selected by recorded day and original event point; check difference is `observed + auditEffect - (opening + effects from opening + linked effects)`. Live checked balance is `last observed + auditEffect(last) + later effects`.
- Sequential checks preserve the web cumulative displayed difference even when the native interval expected value differs. Revolving-credit observations invert the imported difference together with observed/expected signs. Correcting an imported native observation and linked-operation expected adjustments update the retained difference atomically. Available credit remains excluded from owned money.
- Added one XCTest source method for an income corrected from 100 to 200 after a 1,100 observed check: expected 1,200, audit-adjusted difference 0 and live balance 1,200. Existing sequential-check coverage now asserts cumulative web differences. Repository inventory is **213** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Directly inspected Metro207 `checkRows`, audit predicate/effect and `checkedBalance`; an executable JavaScript fixture returned auditEffect 100, expected 1,200, difference 0 and live 1,200. Structural delimiter checks passed for all eight changed source files. This is source/fixture validation, not native execution or UI validation.
- Exact CI run `39283427502`, job `118162634574`, was still queued without runner allocation or steps at checkpoint time. Local environment has no Swift/Xcode/xcodegen. Build, 213 XCTest methods and UI tests were NOT executed; no rerun was requested.
- Remaining: compile/test build24; recurring/templates and historical plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: observe Native iOS CI run `39283427502`; if runner execution becomes available, compile exact HEAD `cfed8f91127a4b970310e2be0f9aaff0c22de6de`, run expected 213 unit methods plus UI tests, and fix actual failures.
- Next independent implementation if runner remains unavailable: begin the bounded lossless recurring/templates import against active v18.20 fields, then historical month plans, rejecting every unmappable field without inventing IDs or history.



## CURRENT native checkpoint — 2026-10-19 Bucharest — build23, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `b198c0a52fa7a6c04ef6547d3669830c0944a2f9`; version 18.20 build23 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Extended the lossless v18.20 importer with eligible debt activity: credit-sourced expenses, transfers from/to card or overdraft, debt payments with separate cash amount and principal, installment flag, and loan-to-loan refinance linked to an active same-day principal check. Original `creditId`, `destinationCreditId`, `debtId`, `principal` and `installment` are retained in backward-compatible optional operation fields.
- Web Metro207 debt values stay positive inside import reconciliation. Native card/overdraft balances stay inverse-signed: credit spending increases debt, transfer/payment to revolving credit reduces it, and only principal reduces debt while the complete payment leaves cash. Owned-money totals still exclude revolving credit; available credit remains separate.
- Unified web balance checks now map current/savings/cash entities to native account observations, cards/overdrafts to inverse-signed native observations, and loans to principal observations. Expected values use one global day/order namespace, prior observed anchors and one-time `reconciliationCheckId` absorption. Live balances continue from the final observed anchor.
- Native backup validation cross-checks active web checks against both native observation collections while allowing later native-only observations; it validates retained web debt legs and no longer mistakes a post-transaction live credit balance for the imported opening balance. Unknown or structurally unmappable combinations still reject the whole import before replacement.
- Added three XCTest source methods for revolving-credit legs/signs and owned-money isolation, card payment principal plus positive-web/negative-native check conversion, and loan refinance/principal check ordering. Repository inventory is **212** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Inspected Metro207 account/debt effects, linked-check absorption and positive debt check convention. This was exact source inspection, not native execution or UI validation.
- Exact CI run `39251968721`, job `118057713576`, completed failure before runner execution with an empty step list and no logs. Local environment has no Swift/Xcode/xcodegen. Build, 212 XCTest methods and UI tests were NOT executed; no unchanged rerun.
- Remaining: compile/test build23; web transaction-audit behavior combined with active checks; recurring/templates and historical plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `b198c0a52fa7a6c04ef6547d3669830c0944a2f9`, run expected 212 unit methods plus UI tests, and fix actual compiler/test failures.
- Next independent implementation if runner remains unavailable: represent the web transaction-audit correction that overlaps active checks without changing displayed expected/difference truth, or keep the combination fail-closed with exact fixture evidence before moving to recurring/templates.



## CURRENT native checkpoint — 2026-10-19 Bucharest — build22, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `58fdc4cb177274e27fabc1f325fca15271e3a339`; version 18.20 build22 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added the first bounded debt-import slice for all three active v18.20 entity kinds: `card`, `overdraft` and `loan`. UUID, name, signed principal, monthly payment, limit, opening day, due day, optional day-known flag, installment count, APR and the absent-versus-empty custom schedule distinction are retained in optional web import metadata.
- Card and overdraft entities map to native credit-card/credit-line accounts with the inverse signed balance and the exact credit limit. They are explicitly unavailable as spending cash; `LedgerEngine.ownedMoneyMinor` still excludes them and `availableCreditMinor` reports credit separately.
- Loan entities map to `LoanBook` / `LoanAgreement` with exact opening principal, payment, due day, optional installments, APR and dated schedule rows. The default web month plan is accepted only when its debt-payment rows exactly match all imported entity IDs and configured payments.
- Native backup validation cross-checks imported web debt metadata against the mapped credit accounts and loans. Unknown debt keys, duplicate IDs/dates, invalid ranges and mismatched plan rows reject the whole import. Debt-linked transactions and debt/loan balance checks remain deliberately fail-closed until the next bounded stage; no IDs, signs or histories are inferred.
- Added two XCTest source methods covering all three mappings, signed overdraft, separate owned-money/available-credit totals, schedule/APR retention, native backup validation, unknown-field rejection and the debt-activity fail-closed boundary. Repository inventory is **209** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Inspected Metro205 debt validation/editor fields and Metro207 positive-debt effect/check contract. This was exact source inspection, not native execution or UI validation.
- Exact CI run `39243412981`, job `118029409873`, completed failure before runner execution with `steps=null` and no logs. Local environment has no Swift/Xcode/xcodegen. Build, 209 XCTest methods and UI tests were NOT executed; no unchanged rerun.
- Remaining: compile/test build22; debt/card/overdraft/loan transactions and unified checks; transaction-audit/check combination; recurring/templates and historical plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `58fdc4cb177274e27fabc1f325fca15271e3a339`, run expected 209 unit methods plus UI tests, and fix actual compiler/test failures.
- Next independent implementation if runner remains unavailable: import eligible `creditId`, `destinationCreditId`, `debtId`, `principal`, `installment` and `refinancingDebtId` transaction legs plus card/overdraft/loan checks with Metro207 signs and one-time reconciliation absorption.


## CURRENT native checkpoint — 2026-10-19 Bucharest — build21, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `453fe9da1a3955d3f19bdeb9d821c4713ccdc65d`; version 18.20 build21 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Extended the fail-closed v18.20 importer to the account-only subset of `balanceChecks`, `checkAudit` and `reconciliationCheckId`. Current and savings/cash account checks retain UUID, account UUID, civil day, positive intraday order, signed observed minor-unit amount and void state.
- Active nonvoided web checks map to native observations with the same ID/account/day/order/observed value. Voided checks and the complete web check audit remain losslessly in optional import metadata; native audit IDs are not invented.
- Expected values and live balances follow active bundle Metro207: legacy transaction order is day-local index × 1,000; active transaction/check points are globally unique; intervals anchor on the preceding observed value; linked effects are excluded from ordinary intervals and absorbed once by the target check or the other transfer leg's first following check.
- Transaction reconciliation links are accepted only for an active same-day check on an affected account. Debt/loan checks, unknown check fields, invalid links, duplicate points and arithmetic overflow reject the entire import.
- Web transaction audit can add a historical income correction to a check difference while displaying a different expected value. The current native observation cannot preserve both values simultaneously; therefore a state combining active balance checks with nonempty transaction audit is rejected explicitly rather than changed silently. Check audit alone is supported.
- Native backup validation now checks imported check metadata against active native observations. Backup UI describes the expanded scope. Build number is 21.
- Added five XCTest source methods: sequential/voided checks, direct linked expense, cross-account transfer absorption, separate check-audit retention and invalid point/audit rejection. Repository inventory is **207** unit methods. They were NOT RUN.
- EXECUTED reference comparison: active bundle `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`, Metro207 `validateChecks`, `checkRows`, `checkedBalance`, interval and linked-effect functions. Native source implements the bounded account-only rules above; this is source inspection, not native execution or UI validation.
- Exact CI run `39236554027`, job `118006909006`, completed failure before runner execution with `steps=null` and no logs. Local environment has no Swift/Xcode/xcodegen. Build, 207 XCTest methods and UI tests were NOT executed; no unchanged rerun.
- Remaining: compile/test build21; debt/card/overdraft/loan import; transaction-audit/check combination; recurring/templates and historical plans/budgets/goals; remaining formulas and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `453fe9da1a3955d3f19bdeb9d821c4713ccdc65d`, run expected 207 unit methods plus UI tests, and fix actual compiler/test failures.
- Next independent implementation if runner remains unavailable: add lossless debt/card/overdraft/loan entity and transaction/check import in a bounded stage, preserving available credit as credit rather than owned money and rejecting unmappable fields.



## CURRENT native checkpoint — 2026-10-19 Bucharest — build20, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `ca17df0218b2d13f7489170e1315a208d71d478e`; version18.20 build20 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Extended the fail-closed v18.20 web-backup importer from account-only state to simple account transactions: income, unbudgeted expense and account-to-account transfer/savings. Debt/card/check/template/category/budget fields are still rejected before replacement.
- Mapping preserves UUIDs, civil day, positive minor-unit amount, explicit intraday order or legacy missing order, void flag, optional v4 financial role, web name-catalog ID and expense detail rows. The importer validates name-catalog normalization/references, account opening dates, transfer endpoints, detail totals and role/kind compatibility.
- Imported account live balances are recomputed with checked arithmetic from the separately retained web opening value and active imported operations. Income adds only to its destination; expense subtracts only from its source; transfer subtracts/adds exactly once. Available credit is not introduced as owned money.
- Web in-place operation audit cannot be inserted into native replacement-chain audit without inventing successor IDs. It is therefore preserved structurally and losslessly in optional web import metadata (recorded day, action and complete pre-change operation), while native `operationAudit` remains empty. Native backup roundtrip includes this metadata; unknown/unmappable transaction or audit fields reject the entire import.
- Backup UI describes the expanded safe scope; build number is20. Added four XCTest source methods for multi-operation balance effects/name/details/roles, explicit-versus-legacy order, separate web audit retention and unsupported budget-field rejection. Existing nonempty unsupported test now uses debts. Expected native unit total **202**, NOT RUN.
- EXECUTED active-reference inspection: `index.html` still selects `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Inspected v4 transaction validation, `roleOf`, name validation and account effect code; native import scope/mappings above follow those exact contracts. This was source inspection, not native execution or UI comparison.
- Exact product CI lookup for `ca17df0218b2d13f7489170e1315a208d71d478e` returned `workflow_runs=[]`; combined statuses returned `[]`. Local environment remains Linux without Swift/Xcode/xcodegen, so build, 202 XCTest methods and UI tests were NOT executed. Last directly visible job remains run `39193821212`, job `117872136608`, failed before runner allocation with no steps; no unchanged rerun.
- Remaining: import unified account/loan balance checks and reconciliation links; debt/card/overdraft/loan state; templates/recurring and historical plans/budgets/goals; complete formulas and populated visual interaction comparison. Preserved web audit is not yet presented as native correction history. No1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `ca17df0218b2d13f7489170e1315a208d71d478e`, run expected202 unit methods plus UI tests and fix actual compiler/test failures.
- Next independent implementation if runner remains unavailable: import the account-only subset of v18.20 `balanceChecks` / `checkAudit` with exact day/order/observed values and transaction reconciliation links, rejecting loan/debt checks until their entities are losslessly mapped.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build19, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature/product HEAD `a3250f8d1a95e63d4e5f42dadca8f4c58897a5ce`; version 18.20 build19 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, unchanged.
- Added the first fail-closed web-backup import slice. It reads the exact active v18.20 envelope: `FinancialAutonomy` format1, PBKDF2-SHA256 600000, 16-byte salt, 12-byte AES-GCM nonce and authenticated data `FinancialAutonomy/backup/1`. Password normalization follows NFKC.
- The slice accepts only web state version4/RON with a single empty default month plan and no unsupported financial collections. It maps UUID-backed `current` / `savings` / `cash` accounts exactly, preserving signed minor-unit opening balance, opening day and optional availability. Source start/role-effective days are retained in optional backward-compatible metadata.
- Loss prevention is explicit: envelope/state/account keys are checked; non-UUID legacy IDs, unknown account fields, nonempty transactions, debts, checks, templates, goals, audits, reviews or plan contents reject the complete import before a snapshot exists. LedgerStore replacement remains validate-then-persist; a failed import/write leaves current data intact. No guessed IDs, dates, categories or balances.
- Backup SwiftUI now accepts JSON and native files, tries native v1 first, then the v18.20 reader, shows the concrete rejection reason, and still asks for destructive confirmation only after a full valid snapshot. Build number is19.
- Added five XCTest source methods with a deterministic encrypted fixture generated from the active bundle contract: successful exact account mapping, wrong password/envelope drift, unknown account field, nonempty transaction collection and non-UUID rejection. Expected native unit total **198**, NOT RUN.
- EXECUTED reference inspection: active `index.html` still selects `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Bundle code confirms export envelope/AAD/KDF parameters, web state version4 keys and account validation. The synthetic fixture encryption was generated with Node crypto from that exact contract; this is not Swift execution.
- Exact product CI lookup for `a3250f8d1a95e63d4e5f42dadca8f4c58897a5ce` returned `workflow_runs=[]`; combined statuses returned `[]`. Local environment is Linux with no Swift, xcodebuild or xcodegen, so build/XCTest/UI were NOT executed. Last directly visible job remains run `39193821212`, job `117872136608`, failed before runner allocation with no steps. No unchanged rerun was requested.
- Remaining: lossless mappings for transactions/audit, unified checks, debts/loans/refinance, recurring/templates, historical plans/budgets/goals, plus full calculations and populated visual interaction comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe hosted macOS execution; compile exact HEAD `a3250f8d1a95e63d4e5f42dadca8f4c58897a5ce`, run expected198 unit methods plus UI tests and repair actual compiler/test failures.
- Next independent implementation if runner remains unavailable: add the transaction/audit import slice only where IDs, dates, order, account legs, categories, budget roles and reconciliation links can all be represented exactly; reject all other cases, then continue checks/debts/plans.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build18, IN PROGRESS / NATIVE EXECUTION UNAVAILABLE

Supersedes older current entries.
- Native feature HEAD `7116f0750d92a121ddc8d17f65568328d4815676` (documentation); exact product HEAD `d1e81cdd06a461cb6579cf4d62446b3d780df69e`. Core commits: `a60a62a0ce2b3b3a28af9b1b855d566dd38d7028` unified check namespace, `f14c804a2c2bd54724378d1124161b0234d171bf` loan-side absorption, `bb429a5a5cfc9a248c48a866a40c68b9b1044d1e` atomic store integration, `c4ded50424ce0d4dee9c4b7e313c539d30775549` later-anchor preservation, `460a541720477fe7c30d8aa5c2775548e2f664a3` regression tests, `5a1fca480e8041c876c5e44a19edef34f819e013` SwiftUI/build18, `3635764ed93f71ddd175a969be9532d0350977b3` test compile correction, `d1e81cdd06a461cb6579cf4d62446b3d780df69e` legacy-nil preservation. Version 18.20 build18 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- `Operation.reconciliationCheckID` now targets either account/card/line or loan-principal confirmations. A linked debt payment/refinance must affect the checked loan, use the same civil day and is ordered immediately before the selected confirmation.
- Its principal changes only that confirmation's expected amount. The real observed amount remains the anchor, so later confirmations stay unchanged and debt is not reduced twice after the target.
- The cash leg applies normally unless a following account balance confirmation absorbs it; then the existing build16 rule adjusts that account check instead of changing live cash twice. Correction and void reverse/reapply both sides atomically. Failed persistence changes neither balances, checks nor audit.
- SwiftUI offers “Înregistrează plata lipsă pentru confirmare”, opening the normal payment/refinance flow with confirmation and date preselected. Optional legacy loan observations remain nil for unrelated account links rather than being rewritten to an empty array.
- Added six XCTest source methods: debt/check/cash isolation, later-anchor preservation, following-account-check absorption, wrong-loan rejection, correction+void and failed-write rollback. Expected native unit total **193**, NOT RUN.
- EXECUTED active-reference inspection: `index.html` still points to `index-v01820-history-back-navigation-20261014.js?build=18.20.1`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`. Its validation accepts a same-date `debtPayment` when the check entity equals `debtId`, and its interval engine uses the same `reconciliationCheckId` field for accounts and debts. Native build18 now matches this behavioral link contract.
- CI verification for exact product `d1e81cdd06a461cb6579cf4d62446b3d780df69e`: connected commit-run lookup returned `workflow_runs=[]`; combined statuses returned `[]`. The workflow is push-triggered for NativeiOS paths, but this connector exposes only PR-associated commit runs. No native result can be claimed. Local environment is Linux with neither Swift nor Xcode. Last directly observable Native iOS job remains build17 run `39193821212`, job `117872136608`, failed before runner allocation with no steps. No unchanged rerun was requested.
- Remaining: lossless import/mapping of web unified `balanceChecks`, historical budget/debt/contribution plans, remaining Autonomie/Spațiu/Buget formulas, and populated full-frame light/dark interaction/visual comparison. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore/observe the hosted macOS runner; compile exact product `d1e81cdd06a461cb6579cf4d62446b3d780df69e`, run expected 193 unit methods plus UI tests, and fix actual compiler/test failures.
- Next independent implementation if runner remains unavailable: begin the lossless web-state import adapter with explicit schema fixtures and no guessed mappings; then historical plans/formulas and populated visual validation.



## CURRENT native checkpoint — 2026-10-19 Bucharest — build17, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature HEAD `8187ff81100ddcd54bfa6c2f28b794e711e1ff26` (documentation); exact product HEAD `61ca047860e9640bd49a583ef2438f3a8b9aa691`. Core commits: `a896529822d26fa2f335fb8a807ac8dcb94bd5cd` amount audit, `8793df0dddb0919c8a6b5e260d846053d547dcb5` observation-safe mutation, `f8e0250947a87487217ceeb8b92fefe91c7499db` opening-date correction, `61ca047860e9640bd49a583ef2438f3a8b9aa691` audit UI. Version 18.20 build17 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Added optional backward-compatible `LoanBook.loanAudit`. Existing snapshots with no field decode without rewrite.
- Opening loan principal and opening date can now be corrected with an explanation. The correction creates no operation and no cash movement, changes debt only, adjusts the earliest dependent observation's expected principal by the delta, preserves later observation anchors, and records complete before/after audit state.
- Invalid explanations, closed loans, dates after an existing observation and persistence failures reject atomically. SwiftUI exposes amount/date correction and the audit history.
- Added eight XCTest source methods: legacy decoding, debt-only/cash isolation, first-observation recalculation with later-anchor preservation, invalid explanation, failed-write rollback, closed-loan protection, date correction and date-after-observation rejection. Expected native unit total **187**, NOT RUN.
- EXECUTED active-bundle inspection: `index-v01820-history-back-navigation-20261014.js`, blob `be453db2699273a194543de4532db6ea4b2e1cf2`, says “Corectează soldul inițial” edits opening amount/date and is not a transaction or unexplained money. Native build17 now matches this rule; its audit and first-dependent-row recalculation are safety additions.
- Exact build17 product CI `39193821212`, job `117872136608`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result; no unchanged rerun. The docs-only feature HEAD has no workflow run/status. Last actual native green remains `e82e6c7` / `38792158205` (62 unit + one UI).
- Remaining material differences: preview loan checks share the unified `balanceChecks` / `reconciliationCheckId` engine; native principal checks remain separate. Lossless web-state import, historical plans and populated light/dark interaction/visual comparison remain incomplete. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: restore hosted runner startup; compile exact product `61ca047860e9640bd49a583ef2438f3a8b9aa691` and run expected 187 unit + UI tests, then repair any compiler/test failures.
- Next independent implementation if runner remains unavailable: converge loan linked-transaction/check semantics with the preview without changing cash; then web-state import, historical plans and populated visual comparison.


## CURRENT native checkpoint — 2026-10-19 Bucharest — build16, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature/product HEAD `ae49ec2790d31a2c6a0bbaaa9ed812e5bd76e754`; core semantics `3cb363f0b38cd0e4d38582f282ed2be8548b2e49`; preview JSON-key fix `1ccf8070b4042f1049b6165db26428f756395c9a`; cross-account recomputation `e7ce391e9aa8037fe7f88ec92b08465f7dfc8efc` + test fix `fa8a41fae389433f36631261c823aa719476d21b`; SwiftUI flow `2bc5bb5626f8ab35b4086344de24b4b671af302c`. Version 18.20 build16 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Added optional backward-compatible `Operation.reconciliationCheckID`, encoded with the active preview key `reconciliationCheckId`. Legacy native operations decode with no link and are not rewritten.
- A linked transaction must affect the checked account and use the same civil day as its active balance check. Same-day ordering allocates a unique point before the target check. Invalid/missing/unaffected links and arithmetic overflow fail atomically.
- Linked effects are absorbed exactly once: the target account's live confirmed balance is not changed again, while its check expected value is recomputed. For the other leg of a transfer, native mirrors Metro206: if that account has a check on or after the transaction day, its first such check absorbs the effect; otherwise its current balance changes normally. Correction and void reverse/reapply both expected-row and live-balance effects while retaining operation audit.
- SwiftUI reconciliation detail can open a prelinked operation form; the form pins the check day initially, explains no-double-application, and operation correction preserves the link.
- Added nine XCTest source methods covering legacy decoding, linked expense, transfer isolation, void, correction, invalid account, prior check with later activity, cross-account next-check absorption and mismatched-day rejection. Expected native unit total 179, NOT RUN.
- EXECUTED reference inspection of active `index-v01820-history-back-navigation-20261014.js` blob `be453db2699273a194543de4532db6ea4b2e1cf2`: Metro validation requires `reconciliationCheckId`, same check date and affected entity; its interval engine excludes linked effects and assigns the other leg to the first following check. The implemented native rules above now match that contract for account/card/credit-line observations.
- Exact build16 CI `39188836759`, job `117856928815`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result; no unchanged rerun. Local environment has no Swift/Xcode. Last actual native green remains `e82e6c7` / `38792158205` (62 unit + one UI).
- Remaining reconciliation difference: preview represents loan checks in the same transaction/check engine; native loan-principal observations remain a separate audited engine. Web-state import and populated screen comparison also remain incomplete. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: resolve hosted startup for `39188836759`; compile exact product HEAD `ae49ec2790d31a2c6a0bbaaa9ed812e5bd76e754` and run expected 179 unit + UI tests, then repair any compiler/test failures.
- Next independent implementation if runner remains unavailable: initial-principal audit/edit and unify loan linked-transaction/check semantics without changing cash; then web-state import, historical plans and populated light/dark visual comparison.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build15, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature/product HEAD `9ce0dd7510202b2dc7af418a2ef1157e3bafdde6`; core audit `3191d432b1c88c22a655eb4bc2e7edee1ebc8570`; reconciliation UI `4aa3a1c22f5b008feab68f74d88ddbf238412bfa` + fix `2636015aa05eae47f5b3e549094254b6c4f0c490`; version bump `f33727e0bf38c94c9ae9c040ebe0de03bc1b5167`. Version 18.20 build15 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Added optional backward-compatible observation/explanation audit journals. The latest account/card/credit-line confirmation can be corrected in place while preserving ID/date/order/expected amount; current real balance moves only by the correction delta. It can be voided only after its explanations, restoring the pre-confirmation expected delta while preserving later operations.
- Earlier/ambiguous confirmations with a later or equal anchor are locked. Correction, void and audit writes are persist-before-publish; a failed write changes neither balance nor journal. Explanations support audited correction/void.
- Added optional `ReconciliationExplanation.linkedOperationID`. New transfer/refinancing explanations require an explicit eligible active operation, reject duplicate reuse, validate date/order/type/sign/amount and never apply the operation a second time. Legacy explanations without links still decode.
- SwiftUI reconciliation detail now shows expected/confirmed/remaining/order, existing explanations, explicit operation picker, explanation correction/void, balance-check correction/void confirmations and audit history.
- Added seven XCTest source methods: latest-check delta/audit, earlier-anchor lock, void rollback, explanation correction/void audit, unique linked transfer/cash isolation, persistence rollback and legacy optional-field decoding. Expected native unit total 170, NOT RUN.
- Exact build15 CI `39183977208`, job `117842412535`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result; no unchanged rerun. Last actual native green remains `e82e6c7` / `38792158205` (62 unit + one UI).
- Compared against active preview `index-v01820-history-back-navigation-20261014.js`, Metro206/207: web `saveBalanceCheck` keeps check audit, global date/order and recomputes interval rows; linked transactions carry `reconciliationCheckId` and participate exactly once in `checkRows`/checked balance. Native now matches explicit audit, same-day order and no-double-application safety, but still locks earlier anchors and treats links descriptively; it does NOT yet dynamically recompute expected rows or transaction effects like web. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: resolve hosted startup for `39183977208`; compile exact product HEAD and run expected 170 unit + UI tests, then repair any compiler/test failures.
- Next independent implementation if runner remains unavailable: native `reconciliationCheckId` transaction semantics and safe dynamic earlier-check recomputation, including account/card/line fixtures; then initial-principal audit/edit, web-state import, historical plans and populated visual comparison.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build14, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature/product HEAD `691056f0ebf188089ea7f90fb39674976f3b4710`; core implementation `16614108aae316c6eb747aaf747c1411e8507cea`; version 18.20 build14 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Added optional backward-compatible `BalanceObservation.eventOrder` and a shared same-day allocator across cash/debt operations, loan confirmations and account/card/line confirmations. New checks receive an explicit point; legacy missing order remains conservative end-of-day. Operation correction/void now compares exact date+order anchors instead of a coarse timestamp-only barrier.
- Added optional `MoneyAccount.closedAt`. Checking/savings/cash/card/credit-line accounts can close only at real balance zero, remain archived for history, and reject later operations, corrections, voids and balance confirmations. Failed persistence leaves the account open. Credit limits remain separate and never become owned money.
- Snapshot validation rejects duplicate explicit event points, invalid closure timestamps, nonzero closed balances and activity after closure. SwiftUI separates active accounts from Archive, hides balance mutation on closed accounts and requires destructive confirmation.
- Added seven XCTest source methods: zero close/mutation lock, nonzero revolving-credit rejection, failed-write rollback, legacy EOD order, shared next order, same-day post-check void and pre-check lock. Expected native unit total 163, NOT RUN.
- Exact build14 CI `39180167142`, job `117831029908`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result. The immediately preceding core commit run `39180055471` failed identically. No unchanged rerun. Last actual native green remains `e82e6c7` / `38792158205` (62 unit + one UI).
- EXECUTED source comparison against active preview `index-v01820-history-back-navigation-20261014.js`: Metro207 allocates `max(day event order)+1000` jointly for transactions/checks and computes interval-anchored check rows; native now matches the ordering/anchor safety direction. Remaining material difference: preview can correct/void balance checks and link reconciliation transactions, while native account checks are still append-only; preview also models account availability separately and cards/lines as debt records. Native archive/closure is therefore not claimed 1:1.
- EXACT FIRST UNFINISHED ACTION: resolve hosted startup for `39180167142`; compile exact product HEAD and run expected 163 unit + UI tests, then repair any compiler/test failures.
- Next independent implementation if runner remains unavailable: audited correct/void for account/card/line balance confirmations plus linked reconciliation operations; then initial-principal audit/edit, web-state import, historical plans and populated visual comparison. No 1:1 claim.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build13, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature HEAD `1ea352eec87dc487f9bf1f0534668e5804dfe119` (docs); exact product `bd277ef4fa7775ccf606ff9d79b628843601d258`; build13 on `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Added optional backward-compatible audit arrays for principal observations and explanations. The latest confirmation can be corrected without changing ID/date/order or cash. Earlier anchors with a later confirmation are protected. A confirmation can be voided only after its explanations and while the loan is open.
- Explanation correction/void revalidates sign, remaining discrepancy and linked transfer/refinance operation. All four mutations persist before publish; failed writes leave live data and audit unchanged.
- SwiftUI adds correction sheets, destructive confirmations and visible reconciliation audit. Legacy LoanBook decoding asserts absent audit arrays remain nil.
- Added five XCTest source methods: latest correction/cash isolation, later-anchor protection, explanation-before-observation void order, explanation correction/void, persistence rollback. Expected native unit total156, NOT RUN.
- Exact product CI `39175635131`, job `117817597542`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result. No unchanged rerun. Last actual native green remains `e82e6c7` / `38792158205`.
- Updated `LOAN_OBSERVATION_PARITY.md`, `PARITY_CHECKLIST.md`, `README.md`. Preview supports broader dynamic earlier-check recomputation; native blocks it until a verified migration policy exists. No 1:1 claim.
- EXACT FIRST UNFINISHED ACTION: resolve hosted startup for `39175635131`; compile exact feature HEAD and run expected156 unit + UI tests, then repair any failures.
- Next independent implementation if runner remains unavailable: ordered reconciliation and closure adapters for account, credit card and credit line; then initial-principal audit/edit, web-state import, historical plans and populated visual comparison.

## CURRENT native checkpoint — 2026-10-19 Bucharest — build12, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature HEAD `39d7d08185caccae39f7ddf7643617489cb2dc85` (docs); build-version product `38a0ae7f111f7f190b64860f0539c2d76246a960`; feature branch `feat/sync-preview-v18-20-ios` ONLY. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`, untouched.
- Implemented cumulative loan-check discrepancy and cumulative unexplained amount with overflow guards. The existing actual preview v18.20 Metro207 fixture is now asserted natively as cumulative `-300` then `-400`, while immutable observations retain their incremental differences.
- Added optional backward-compatible `linkedOperationID` to loan explanations. New transfer/refinancing explanations in SwiftUI select an eligible active operation no later than the confirmation. Validation enforces kind/loan/amount, one explanation per linked operation and no second financial effect.
- Added three XCTest source methods for cumulative retention, unique transfer linking and matching refinance linking; extended the existing Metro207 fixture assertion. Expected native unit total151, NOT RUN.
- Exact build12 CI `39171340843`, job `117804866151`: completed failure, `runner_id=0`, `steps=[]`. No compiler, XCTest or UI result. No unchanged rerun. Last actual native green remains `e82e6c7` / run `38792158205`.
- Updated `LOAN_OBSERVATION_PARITY.md`, `PARITY_CHECKLIST.md`, `README.md`. No 1:1 claim; observation/explanation edit/void, account/card-line ordered adapters, web-state import and populated visual comparison remain.
- EXACT FIRST UNFINISHED ACTION: inspect/resolve hosted startup for `39171340843`; compile exact feature HEAD and run expected151 unit + UI tests, then repair any failures.
- Next independent implementation if runner remains unavailable: audited edit/void for loan observations and explanations, preserving later anchors or rejecting unsafe history changes; then account/revolving-credit ordered reconciliation and initial-principal audit/edit.

## CURRENT native checkpoint — 2026-10-16 Bucharest — build11, IN PROGRESS / CI STARTUP BLOCKED

Supersedes older current entries.
- Native feature HEAD `f079ff8641cfda16e257dd83c68697ff89ff3e43` (docs); product `6036a9d7001e7ff308c8abfc4374aca354716363` (legacy cash compatibility fix), preceding product `a65181f7f7d05d94a66a11a9d8e49eec03884192` (ordering). Version18.20 build11, feat/sync-preview-v18-20-ios ONLY. Stable main startup a9b30be147abecea45a63bf7dd8d0a3eb3370366, no promotion.
- Added optional Operation.eventOrder and LoanPrincipalObservation.eventOrder. New loan timeline allocates explicit order by civil day; same-day payment/check/payment/check works; balance uses latest eligible confirmation as anchor and principal after it. Same-day corrections preserve original point; write failures consume no sequence. Duplicate explicit points rejected during loan/snapshot validation.
- Existing nil operation orders derive stable array-position×1000 within date; nil loan checks retain legacy EOD meaning without data rewrite. New same-day loan additions after a legacy EOD check remain conservatively blocked. Unrelated cash operations ignore legacy loan EOD barriers to preserve existing cash behavior. Account cash balance observations were not migrated to ordered points.
- Fixed source omission found at startup: voidOperation lacked the confirmed-loan observation guard, although add/correct paths had it. Pre-check void/correction now locked by date+order, later same-day unconfirmed loan payment can be voided. UI shows confirmation date/order and new policy.
- EXECUTED: all eight local Node reference generators exit0. Five NEW actual preview Metro207 same-day balance outputs: at orders1000/2000/3000/4000/EOD principal9300/9000/8500/8400/8400. Source generator/JSON committed. Cumulative web reference outputs72. These do NOT execute Swift or verify UI.
- Five new XCTest source methods: ordered balance fixtures, pre-check void protection/post-check void, failed save/retry/correction point, legacy decode/duplicate points, unrelated cash after legacy loan check. Two old EOD-policy method bodies adjusted to ordered behavior. Expected native unit total148, NOT RUN; build/UI also NOT RUN.
- Exact final product CI `38963809019`, job `117185184091`: completed failure, runner_id0, steps[]. Previous ordering CI38963676331 same startup failure. No unchanged reruns. No local Swift/swiftc/xcodebuild. Annotation endpoint unavailable through connector per prior attempt. Last ACTUAL native green remains e82e6c7 / 38792158205, Simulator build +62 unit +one UI. All newer native functionality remains unverified by execution.
- Source LOAN_EVENT_ORDER_PARITY.md/README/PARITY_CHECKLIST updated. No global1:1 or percentage claim; native backup still NOT web-compatible; live preview still Vercel-login blocked.
- EXACT FIRST UNFINISHED ACTION: inspect/resolve hosted startup for 38963809019; run exact feature HEAD and repair compilation/tests. Verify expected148 unit+UI and populated full-portrait light/dark screenshots, including repeated same-day confirmations, payment correction and legacy cash flow.
- Next independent implementation: cumulative per-check discrepancy and linked explanatory transfer/refinance transactions; observation edit/void audit; account and revolving credit event adapters/closure; initial-principal audit/edit; historical budget/debt plans, complete Autonomie/Spațiu/Buget/safe pace, web backup/state import and all screen/interactions. Legacy EOD migration remains explicit, not guessed. Preview JS/index unchanged.


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

## Native budget UI batch — 2026-10-14
- Source feature branch `9db1f8c` adds Buget navigation tab; `6ba9579` creates SwiftUI BudgetView for weekly/biweekly/monthly/quarterly/annual/paycheck periods and daily pace; `89db91c` adds provisional credit-excluding safe pace with explicit limitations.
- Screen inputs are not yet persisted and not validated 1:1 against preview. Native Xcode compilation/tests remain unverified. Source main unchanged.
- Next: verify Actions build and XCTest, persist budget configuration, connect categorized spending and obligations, implement dashboard parity.

## Native budget formula disclosure — 2026-10-14
- Source feature commit `e49dbba` adds an expandable calculation explanation to BudgetView, explicitly excluding credit from safe pace.
- Budget persistence model and detailed period UI attempts were blocked and not committed. Xcode build/tests and preview parity remain unverified. Stable main unchanged.
- Next: implement persisted budget settings, reconcile preview formulas and verify actual Actions build.


## Native iOS checkpoint — 2026-10-15 09:14 EEST
- Source branch ONLY: `nikopol000/financial-autonomy-app:feat/sync-preview-v18-20-ios`; stable source main untouched.
- Latest commits: `3c808c0` adds LedgerReplayGuard; `b567ecf` connects UUID replay rejection in LedgerStore.addOperation; `086dbb0` adds 3 XCTest replay tests.
- Previous HEAD `5853d91` had Native iOS CI success run `38690845850`, 18/18 XCTest. New HEAD `086dbb0` build and tests are NOT YET VERIFIED.
- Remaining critical: LedgerStore atomic encrypted persistence/fail-closed, UI save guards, persistent BudgetSettings, safe display arithmetic, full visual/functional parity audit against preview v18.20.
- Exact next step: inspect Native iOS CI for `086dbb0`; repair failures, then integrate atomic LedgerStore with persistence tests. Do not claim parity.


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
