# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-21T22:15:00Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: a59c87852f8a8c78918346ab368012cdc5fd60c5
Latest implementation commit: fe9d085ceafc0abfc5660081495bf77cc2859275
Latest app branch commit: a59c87852f8a8c78918346ab368012cdc5fd60c5
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff commit: ffb26f016e50ead362dbad3d936cb31b3899ff3f

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

## Completed this run — WEB v4 recurring/history projection

- App mapper commit: `fe9d085ceafc0abfc5660081495bf77cc2859275`; regression tests and assertion fixes: `78ec4d95c93fd87d2d56d5c972ba3d5847c95d3b`, `01202e5186b14acbbf0c5fdfa4b92f4db60d5de0`, `a59c87852f8a8c78918346ab368012cdc5fd60c5`. Exact feature HEAD: `a59c87852f8a8c78918346ab368012cdc5fd60c5`.
- Implemented mutable recurring metadata projection and schedule-book reconciliation. Preserves source UUID spelling/order, name/amount/frequency/kind/status/coveredByBudget/nextPayment/history/endDate/reminder, empty history and omitted optional fields; supports append-only records and fails closed for deletion/reorder/duplicate IDs/schedule mismatches. Fixed expenses and income schedule rows remain separate. Opaque extensions use stable identity reattachment.
- Added two XCTest source cases; not executed in the iOS target. Isolated Swift 6.2.1 stub-model harness compiled and ran the projection logic: PASS for populated edits, append, history/reminder, cancellation, opaque extension, ordering and schedule mismatch.
- Exact HEAD combined status contexts=0 and connected workflow lookup=0 runs. Previous run 44946554197 for parent 7e9474 had one failed job, zero steps, zero artifacts and 404 BlobNotFound logs; no retry. No xcodebuild/xcodegen; no Apple build/XCTest/Simulator/UI or visual verification.
- Active WEB preview is 18.74.1; target remains archived v18.20. No JS module-205 execution or visual comparison. WEB JSON export remains disabled; .fabackup only.

## Exact next action

Implement mutable WEB `paidMonths` projection by reconciling `WebImportMetadata.paidMonths` with `ScheduleBook.paidMonths` and `LoanBook.paidMonths`. Preserve optional map presence, month keys, original UUID spelling/order and explicit empty arrays. Update only IDs represented by native schedule/loan books; retain source-only WEB declarations such as revolving-debt IDs. Fail closed on duplicates, unknown membership, reordering or inconsistent books. Then continue monthPlans and fixed-expense budgets/windows/contributions.

## Invariants

- App code only on financial-autonomy-app:feat/sync-preview-v18-20-ios; never modify or merge app/main.
- Keep local-only data, no backend, mandatory account, bank sync or telemetry.
- Available credit is not owned money.
- No wholesale Models.swift or LedgerStore.swift rewrite.
- Keep exporterImplemented false and WEB JSON export disabled until full populated two-way round-trip, archived validator, Apple build/test and visual gates pass.
