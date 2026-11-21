# Native Work Handoff

Status: IN_PROGRESS
Owner: native parity automation
Updated UTC: 2026-11-21T22:09:00Z
Lease expires UTC: 2026-11-22T00:35:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 1fe8494e8f8b23588bf89ab4c43d04372d2cf53d
Latest implementation commit: 1fe8494e8f8b23588bf89ab4c43d04372d2cf53d
Latest app branch commit: 1fe8494e8f8b23588bf89ab4c43d04372d2cf53d
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff commit: 7d7836e3be0eb13f39163639de8cb3237a564a65

## Completed this run

- Implemented mutable WEB v4 debt definitions in WebV18_20StateMapper. Loan fields project from LoanBook; card/overdraft fields project from debt pseudo-accounts.
- WEB opening amount for cards/overdrafts comes only from webOpeningMinor, never live balanceMinor. Loan amount comes from openingPrincipalMinor, never derived current principal.
- Preserved debt order, UUID spelling, opaque extensions and nil-vs-empty loan schedule. Added mappedFingerprint normalization without changing persisted sourceSnapshotFingerprint semantics.
- App commits: mapper 5665dd749ece73cd6655b9c3b047b8c0e5dcd9da; tests/HEAD 1fe8494e8f8b23588bf89ab4c43d04372d2cf53d.
- Three XCTest source cases added; not run in the iOS target. Isolated Swift 6.2.1 model-stub harness compiled and passed projection, opening-vs-live balance, serialization, optional schedule, order and closedFromDay checks.
- Static schema comparison used archived v18.20 module 205 and active WEB 18.74 bundle module 205; active index is WEB 18.74.1. No JavaScript validator execution or visual comparison.
- Exact HEAD 1fe8494 combined status contexts=0; connected PR workflow lookup returned no runs. Parent HEAD 7e9474 CI run 44946554197 failed before runner (zero steps, null logs URL, 404 BlobNotFound, zero artifacts). No retry.
- Swift 6.2.1 is available; xcodebuild/xcodegen are unavailable. No Apple build, app XCTest, Simulator, Files or visual parity is claimed.
- PROJECT_STATE and IMPLEMENTATION_QUEUE checkpoints committed on preview main: 991930e4587a5a12d092b470dabc12a3490e998f and 7d7836e3be0eb13f39163639de8cb3237a564a65.

## Exact next action

Implement mutable WEB v4 recurring/history projection. Reconcile WebImportedRecurring with LedgerSnapshot.recurringCommitments and the recurring subset of ScheduleBook.items. Preserve IDs/order, name/amount/frequency/kind/coveredByBudget, nextPaymentDay, active/cancelled status, endDay, history and reminder. Keep fixed-expense catalog rows separate, preserve optional/null/empty semantics and opaque extensions, and fail closed for native-only lifecycle fields without an exact WEB v18.20 representation. Then map schedule paidMonths and continue monthPlans/budgets.

## Invariants

- App code only on financial-autonomy-app:feat/sync-preview-v18-20-ios; never modify or merge app/main.
- Keep local-only data, no backend, mandatory account, bank sync or telemetry.
- Available credit is not owned money.
- No wholesale Models.swift or LedgerStore.swift rewrite.
- Keep exporterImplemented false and WEB JSON export disabled until full populated two-way round-trip, archived validator, Apple build/test and visual gates pass.
