# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-21T20:31:00Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 7e9474bb0a3a200dcc08bdb5173615c886c6f161
Latest implementation commit: 9185c31515365a7c37ff4c7db3f117799a34bade
Latest app branch commit: 7e9474bb0a3a200dcc08bdb5173615c886c6f161
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Preview main HEAD before this checkpoint: 34585ec4193400bd41b46e8a11fbd22979c5225b

## Completed this run

- Implemented mutable standard-account and transaction projection in WebV18_20StateMapper.swift.
- Added four XCTest source cases; test target import is present. No app-target tests were executed.
- Reattached opaque extension archive v2 by stable identity and enforced source SHA, import-time fingerprint and full post-import fingerprint.
- Compared transaction validation rules statically against archived WEB v18.20 module 205 and active WEB v18.74 module 205.
- Added fail-closed gates for the archived WEB refinancing/accountId mismatch, unbudgeted expense with templateId, and transfer with templateId.
- WEB JSON export remains disabled.

## Exact next action

Continue mutable WEB v4 debt-definition projection:
1. Map LoanBook loans into WEB debt rows, including schedule/opening principal/payment/due day/installments/APR and preserve schedule semantics.
2. Map card/overdraft pseudo-account name/opening/limit/opened-day, keeping current liability balance distinct from original opening.
3. Preserve debt order/UUID/opaque extensions and fail closed for WEB-only or native-only fields that cannot be represented.
4. Keep account/transaction tests pending until a real macOS runner exists; execute the full app build and XCTest/UI suite when runner allocation works.
5. Continue recurring/history, monthPlans/budgets/paidMonths, goals/plans and remaining audit/reconciliation/appearance/dashboard projections. Do not enable JSON export until module-205 validation and full two-way round-trip pass.

## Blockers and invariants

- Exact Native iOS CI for branch HEAD 7e9474bb0a3a200dcc08bdb5173615c886c6f161: run 44946554197, job 136975052188, failed before runner; steps=null, logs_url=null, log fetch 404 BlobNotFound, artifacts=0, combined contexts=0. Previous run 44946311418 had same pre-runner failure. Do not manually retry this failure.
- Swift 6.2.1 exists locally; xcodebuild/xcodegen unavailable. No app build, XCTest, Simulator, Files or visual parity result is claimed.
- Modify app code only on feat/sync-preview-v18-20-ios. Never change/merge app/main.
- Local-only data; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money. Do not rewrite Models.swift or LedgerStore.swift wholesale.
- .fabackup remains the only writable export. Keep WEB JSON exporter disabled.
