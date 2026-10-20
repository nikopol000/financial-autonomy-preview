# Financial Autonomy — Implementation Queue

## Native iOS checkpoint — 2026-10-20 build31 exact Budget today / Safe today
- Feature HEAD `e6513252f690b761494f4afbe9da36f3a3ce6870` on `feat/sync-preview-v18-20-ios` only; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` unchanged.
- Completed the exact v18.20 daily pace/contribution slice: restored-today budget allowance, strict included/outside spend roles, next-income Coverage with fixed/debt/recurring obligations, owned available cash only, net transfers-to-savings contribution remaining, and sequential allocation of a payment across recurring/scheduled dues.
- Budget and Dashboard show Budget today and Safe today spent/limit bars. The full Budget presentation also shows plan contribution, completed savings transfers and remaining contribution.
- Four XCTest source methods added; expected inventory 230. Bundle modules 205/210/220/221 and Node numerical fixtures were executed. Swift/Xcode are unavailable locally; native build/tests/UI/screenshots are NOT RUN.
- Exact CI `39340449123`, job `118360369560`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and validate exact HEAD. Independently remove legacy approximate duplicate pace UI for imported plans, then match the v18.20 status/detail copy and visual treatment before screenshot comparison. Preserve local-only storage and owned-money/available-credit separation. No 1:1 claim.

## Native iOS checkpoint — 2026-10-20 build30 current budget-window presentation
- Feature HEAD `679e529cfad3624da77fbb50ecf14bb4d5690727` on `feat/sync-preview-v18-20-ios` only; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` unchanged.
- Completed the current-plan presentation slice: exact build29 snapshots are shown in Budget and Dashboard with Primary, additional windows, spent/limit progress, remaining/daily values, incomplete reasons, canonical pin order and collapsed pinned-window control.
- One XCTest source method added; expected inventory 226. Source/bundle contract and Node visibility-order fixture executed. Swift/Xcode/xcodegen unavailable locally; native build/tests/UI/screenshots are NOT RUN.
- Exact CI `39332817183`, job `118334911754`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and validate exact HEAD. Independently implement contribution-aware current-plan summaries and exact Budget today/Safe today inputs, retaining the rule that available credit is not owned money. No 1:1 claim.


## Native iOS checkpoint — 2026-10-20 build29 exact budget-window engine
- Feature HEAD `a1de1d206619749fabb7b55fe6b7851b6804b6eb` on `feat/sync-preview-v18-20-ios` only; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` unchanged.
- Completed the pure calculation/presentation contract for Primary and additional Auto/Custom windows using retained historical plans and income anchors. Calendar cadence, start-date clamp, carry-forward plan, strict budgeted-role spend, expected/remaining/daily/pace values and unavailable reasons follow active v18.20 module 219.
- Four XCTest source methods added; expected inventory 225. Swift/Xcode/xcodegen unavailable locally, so native compilation/tests/UI are NOT RUN. Executed Node parity fixtures for biweekly, paycheck and cross-plan Auto matched the active bundle.
- Exact CI `39325651651`, job `118310680540`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and test exact HEAD. Independently wire current-plan Primary/additional snapshots into Budget/Dashboard presentation, then contribution-aware financial summaries. Preserve owned-money/available-credit separation. No 1:1 claim.


## Native iOS checkpoint — 2026-10-19 build28 budget-plan contract
- Feature HEAD `8351011600e880c12061e346bd75e06bc0a49243` on `feat/sync-preview-v18-20-ios` only; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` unchanged.
- Preserves historical budget definitions, all Primary/additional window configuration and nonzero contribution losslessly. Optional fields retain absent-versus-present semantics.
- Imports web `categoryId` as explicit native budget attribution and validates it against the carry-forward plan active on the transaction date. Budgeted/fixed roles are mapped explicitly; fixed-template double allocation remains rejected.
- Advanced Auto/Custom window calculations, budget Dashboard/Hub UI and contribution effects are still pending; no approximation was introduced.
- Two XCTest source methods added; expected inventory 221, NOT RUN. No Swift/Xcode/xcodegen is available locally.
- Exact CI `39317190579`, job `118281603405`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and test exact HEAD. Independently port the exact web Primary/additional Auto/Custom engine and current-plan presentation, then contribution-aware summaries. No 1:1 claim.

## Native iOS checkpoint — 2026-10-19 build27 historical month plans
- Feature HEAD `3784f68dfe4c5692e8fa1b925ea794da1e32179f` on `feat/sync-preview-v18-20-ios` only; app stable main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` unchanged.
- Imported unique historical month plans losslessly for fixed-expense rows and known-debt payments. Native fixed-expense plan history carries forward by month; preserved web due-day projection keeps true month-end semantics across short months.
- Latest plan must match current expense templates/debt payments. Budget rows and contribution remain fail-closed, as do unknown debt references and malformed/duplicate rows.
- Two XCTest source methods added; expected inventory 219, NOT RUN. No Swift/Xcode/xcodegen is available locally.
- Exact CI `39309053783`, job `118253605955`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and test exact HEAD. Independently derive and import historical budget-window/contribution fields without lossy approximation; keep unsupported fields fail-closed until exact mapping. No 1:1 claim.

## Native iOS checkpoint — 2026-10-19 build26 template catalogs
- Feature HEAD `21d34c1d3b46c3e085f5a5849e1560efb2a82ff3` on `feat/sync-preview-v18-20-ios` only; app stable main unchanged.
- Income/fixed-expense catalogs retain exact IDs, values, due-day/day-known metadata. Eligible transaction/audit `templateId` links are preserved as `webTemplateID` with exact kind/reference validation; no schedule anchor is invented.
- Default start-month expenses must match the fixed-expense catalog exactly. Two XCTest source methods added; expected inventory 217, NOT RUN.
- Exact CI `39300272690`, job `118223339473`, failed before runner allocation with no steps/logs and was not rerun.
- NEXT: restore macOS execution and test exact HEAD. Independently, import historical month plans losslessly, starting with fixed expenses/debt payments and keeping budget-window fields fail-closed until exact mapping. No 1:1 claim.


## Native iOS checkpoint — 2026-10-19 build25 recurring import
- Feature HEAD `13c2a1f32ed822eabcc27655cb8f02bb953691df` on `feat/sync-preview-v18-20-ios` only; app stable main unchanged.
- Recurring commitments now retain exact lifecycle/history/reminder fields in web metadata and map UUID/amount/frequency/next-payment/cancellation semantics into native schedules. Unknown/unmappable fields reject before replacement. Two new XCTest source methods; expected inventory 215, NOT RUN.
- Build24 run `39283427502` failed before runner allocation with no steps/logs and was not rerun. Exact build25 run `39291591631`, job `118193329258`, failed before runner allocation with no steps/logs.
- NEXT: verify exact-head CI. If runner remains unavailable, import income/fixed-expense template catalogs and exact eligible transaction `templateId` links without guessed dates/history, then historical month plans. No 1:1 claim.



## CURRENT first unfinished item — build24

1. **Execution gate:** observe Native iOS CI run `39283427502` / job `118162634574` for exact product `cfed8f91127a4b970310e2be0f9aaff0c22de6de`; it was queued with no runner and no steps at checkpoint time. If execution becomes available, compile and run expected 213 unit methods plus UI tests, then fix actual failures. Do not report native success and do not repeat an unchanged pre-runner infrastructure failure.
2. **Independent next batch while blocked:** add a bounded lossless importer for v18.20 recurring/templates, preserving exact IDs, cadence, dates, roles and local-only behavior; reject unknown or unmappable fields atomically.
3. **Then:** historical budget/debt/contribution month plans and goals; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction and visual comparison.
4. **Build24 completed source stage:** feature/product HEAD `cfed8f91127a4b970310e2be0f9aaff0c22de6de`, version 18.20 build24. Transaction-audit corrections can coexist with active checks while preserving interval expected, observed and the exact cumulative audit-adjusted web difference. One new XCTest method brings the expected native total to 213, NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.



## CURRENT first unfinished item — build23

1. **Execution gate:** obtain a native macOS run for exact product `b198c0a52fa7a6c04ef6547d3669830c0944a2f9`; compile and run expected 212 unit methods plus UI tests, then fix actual failures. Exact CI `39251968721` / job `118057713576` failed before runner execution with an empty step list and no logs. Do not report native success and do not repeat the unchanged infrastructure failure.
2. **Independent next batch while blocked:** resolve the v18.20 transaction-audit correction combined with active balance checks without losing the web distinction among observed, expected and audit-adjusted difference. Preserve exact IDs/history or keep that combination fail-closed with fixture evidence; do not invent replacement IDs.
3. **Then:** recurring/templates and historical budget/debt/contribution plans; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction and visual comparison.
4. **Build23 completed source stage:** feature/product HEAD `b198c0a52fa7a6c04ef6547d3669830c0944a2f9`, version 18.20 build23. Eligible card/overdraft transaction legs, principal-only debt reduction, loan-to-loan refinance and unified account/revolving/loan checks follow active Metro207 signs and one-time reconciliation absorption. Three new XCTest methods bring the expected native total to 212, NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.



## CURRENT first unfinished item — build22

1. **Execution gate:** obtain a native macOS run for exact product `58fdc4cb177274e27fabc1f325fca15271e3a339`; compile and run expected 209 unit methods plus UI tests, then fix actual failures. Exact CI `39243412981` / job `118029409873` failed before execution with no steps or logs. Do not report native success and do not repeat the unchanged infrastructure failure.
2. **Independent next batch while blocked:** extend the importer from lossless debt definitions to eligible debt activity and unified checks: `creditId`, `destinationCreditId`, `debtId`, principal, installment and refinancing legs, preserving Metro207 positive web debt versus negative native revolving-credit signs and never counting available credit as owned money.
3. **Then:** represent the web transaction-audit correction that overlaps active checks; recurring/templates and historical budget/debt/contribution plans; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction and visual comparison.
4. **Build22 completed source stage:** feature/product HEAD `58fdc4cb177274e27fabc1f325fca15271e3a339`, version 18.20 build22. Card/overdraft/loan definitions and exact default-plan payment rows are imported and cross-validated; original web fields remain in metadata, revolving credit remains non-owned, and debt activity/checks remain fail-closed. Two new XCTest methods bring the expected native total to 209, NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.


## CURRENT first unfinished item — build21

1. **Execution gate:** obtain a native macOS run for exact product `453fe9da1a3955d3f19bdeb9d821c4713ccdc65d`; compile and run expected 207 unit methods plus UI tests, then fix actual failures. Exact CI `39236554027` / job `118006909006` failed before execution with no steps or logs. Do not report native success and do not repeat the unchanged infrastructure failure.
2. **Independent next batch while blocked:** add a bounded lossless importer for debt/card/overdraft/loan entities, their eligible transactions and unified checks. Keep available credit separate from owned money; reject every unmappable field and do not invent IDs, links or history.
3. **Then:** represent the web transaction-audit correction that overlaps active balance checks without changing displayed expected/difference truth; recurring/templates and historical budget/debt/contribution plans; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction and visual comparison.
4. **Build21 completed source stage:** feature/product HEAD `453fe9da1a3955d3f19bdeb9d821c4713ccdc65d`, version 18.20 build21. Account-only balance checks, void retention, check audit, direct/cross-account reconciliation absorption, strict global event-point validation and native backup validation were added against active Metro207. States combining active checks with transaction audit remain fail-closed because the native observation shape cannot retain both web expected and audit-adjusted difference. Five new XCTest methods exist; repository inventory 207, NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.



## CURRENT first unfinished item — build20

1. **Execution gate:** obtain a native macOS run for exact product `ca17df0218b2d13f7489170e1315a208d71d478e`; compile and run expected202 unit methods plus UI tests, then fix actual failures. Exact connector checks returned no commit workflow run/status; last observable job `39193821212` / `117872136608` failed before runner allocation. Do not report native success and do not repeat an unchanged failed run.
2. **Independent next batch while blocked:** import the account-only subset of v18.20 `balanceChecks` and `checkAudit`, including exact day/order/observed values and eligible `reconciliationCheckId` links. Reject debt/loan checks and every field that lacks an exact native representation.
3. **Then:** debt/card/overdraft/loan import; recurring/templates and historical budget/debt/contribution plans; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction/visual comparison.
4. **Build20 completed source stage:** feature/product HEAD `ca17df0218b2d13f7489170e1315a208d71d478e`, version18.20 build20. Simple account income/expense/transfer import preserves UUID/day/order/void/name catalog/role/details; live balances replay exactly from retained opening values. Web in-place audit is retained separately without inventing native replacement IDs. Four new XCTest methods bring the expected native total to202, NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.

## CURRENT first unfinished item — build19

1. **Execution gate:** obtain a native macOS run for exact product `a3250f8d1a95e63d4e5f42dadca8f4c58897a5ce`; compile and run expected 198 unit methods plus UI tests, then fix actual failures. Exact connector checks returned no commit workflow run/status; last observable job `39193821212` / `117872136608` failed before runner allocation. Do not report native success and do not repeat an unchanged failed run.
2. **Independent next batch while blocked:** extend the fail-closed v18.20 web importer from exact simple accounts to transactions and audit only when every UUID, day/order, account leg, category, budget role and reconciliation link can be preserved. Reject the whole import for every unmapped field; never infer links.
3. **Then:** unified checks; debts/loans/refinance; recurring/templates and historical budget/debt/contribution plans; remaining Autonomie/Spațiu/Buget/safe-pace formulas; populated full-frame light/dark interaction/visual comparison.
4. **Build19 completed source stage:** feature/product HEAD `a3250f8d1a95e63d4e5f42dadca8f4c58897a5ce`, version 18.20 build19. Exact v18.20 encrypted-envelope reader and deterministic fixture; account-only state mapping preserves signed minor-unit opening balance, opening day, availability and source-day metadata. Unknown keys, non-UUID IDs and every nonempty unsupported financial collection reject atomically. Five new XCTest methods exist but were NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.

## CURRENT first unfinished item — build18

1. **Execution gate:** obtain a native macOS run for exact product `d1e81cdd06a461cb6579cf4d62446b3d780df69e`; compile and run expected 193 unit methods plus UI tests, then fix actual failures. Exact connector checks returned no commit workflow run/status; last observable job 39193821212 / 117872136608 failed before runner allocation. Do not report native success and do not repeat an unchanged failed run.
2. **Independent next batch while blocked:** implement the first lossless web-state import slice using explicit v18.20 schema fixtures. Preserve unknown/legacy fields or reject with a precise error; never guess account, loan, check or transaction links.
3. **Then:** historical budget/debt/contribution plans, remaining Autonomie/Spațiu/Buget/safe-pace formulas, and populated full-frame light/dark interaction/visual comparison.
4. **Build18 completed source stage:** feature HEAD `7116f0750d92a121ddc8d17f65568328d4815676`, product `d1e81cdd06a461cb6579cf4d62446b3d780df69e`, version 18.20 build18. Unified account/loan `reconciliationCheckId` behavior, same-day pre-check ordering, one-time principal absorption, following-account-check cash absorption, atomic correction/void/rollback, legacy-nil preservation and SwiftUI prelinked payment/refinance flow. Six new XCTest methods exist but were NOT RUN. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.



## CURRENT first unfinished item — build17

1. **Execution gate:** restore Native iOS hosted runner startup for exact product `61ca047860e9640bd49a583ef2438f3a8b9aa691`. Run Xcode build, expected 187 unit methods and UI tests; fix actual compiler/test failures. Evidence now: run `39193821212`, job `117872136608`, failed before allocation with `runner_id=0` and no steps. Do not rerun the unchanged infrastructure failure.
2. **Independent next batch while blocked:** unify loan confirmations/explanations and eligible linked debt/refinance operations with the preview's `balanceChecks` / `reconciliationCheckId` event semantics, preserving cash isolation and existing local data. Do not guess migrations.
3. **Then:** lossless web-state/backup import, historical budget/debt/contribution plans, remaining Autonomie/Spațiu/Buget formulas and populated full-frame light/dark interaction/visual comparison.
4. **Build17 completed source stage:** version 18.20 build17; feature HEAD `8187ff81100ddcd54bfa6c2f28b794e711e1ff26`, product `61ca047860e9640bd49a583ef2438f3a8b9aa691`; audited opening principal/date correction, no transaction/cash movement, first-dependent observation recalculation, later anchors preserved, atomic rollback, audit UI. Eight new XCTest methods exist but were NOT RUN. Stable app main `a9b30be147abecea45a63bf7dd8d0a3eb3370366` is untouched.


## ACTIVE native build16 — reconciliationCheckId transaction semantics — IN PROGRESS / CI STARTUP BLOCKED

- DONE on feature branch only: product HEAD `ae49ec2790d31a2c6a0bbaaa9ed812e5bd76e754`, version 18.20 build16. Stable app main remains `a9b30be147abecea45a63bf7dd8d0a3eb3370366`.
- DONE source: backward-compatible `reconciliationCheckId` persistence; same-day/affected-account validation; target-check and cross-account next-check absorption; no double balance effect; audited correction/void recomputation; unique before-check ordering; SwiftUI linked-operation entry and correction preservation.
- DONE reference comparison: active v18.20 bundle blob `be453db2699273a194543de4532db6ea4b2e1cf2`, Metro206 interval/link functions and validation inspected directly.
- TEST SOURCE: nine new XCTest methods; expected total 179. NOT EXECUTED.
- BLOCKED: exact CI `39188836759`, job `117856928815`, failed before runner (`runner_id=0`, no steps). Do not rerun unchanged and do not claim compilation/test success.
- EXACT FIRST UNFINISHED ACTION: restore runner startup; build exact `ae49ec2790d31a2c6a0bbaaa9ed812e5bd76e754`, run expected 179 unit tests plus UI tests, fix actual failures.
- NEXT INDEPENDENT: initial-principal audit/edit and loan linked-check convergence; then lossless web-state import, historical plans and populated visual comparison. Full 1:1 remains unproven.

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
