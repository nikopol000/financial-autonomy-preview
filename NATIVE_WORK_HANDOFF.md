# Native Work Handoff

Status: IN_PROGRESS
Owner: native parity automation
Updated UTC: 2026-11-21T20:33:00Z
Lease expires UTC: 2026-11-21T21:00:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 7e9474bb0a3a200dcc08bdb5173615c886c6f161
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this lease commit: 420e7e2c82134482f7db4e699479974defaf75ce

Exact in-progress action: implement mutable WEB v4 debt-definition projection in WebV18_20StateMapper. Map loan definitions from LoanBook and card/overdraft definitions from their debt pseudo-accounts while preserving WEB-only fields from WebImportedDebt metadata. Never serialize live liability balance as the WEB opening amount. Preserve debt row order, UUID spelling, opaque extensions and nil-vs-empty schedule semantics; fail closed for closedFromDay, audit/observation/explanation fields or other state without a proven WEB v18.20 representation. Keep WEB JSON export disabled.

## Previous completed slice

- Account and transaction source projection committed at 9185c31515365a7c37ff4c7db3f117799a34bade; current feature HEAD before this lease is 7e9474bb0a3a200dcc08bdb5173615c886c6f161.
- Four XCTest source methods cover account/transaction/credit/debt legs, opaque extensions, new operations and order rejection. They have not run in the iOS target.
- Static validator inspection compared archived v18.20 module 205 and active v18.74 module 205. Refinancing debtPayment remains fail-closed due to the empty-accountId mismatch.
- Exact Native iOS CI for 7e9474: run 44946554197/job 136975052188 failed before runner allocation (steps=null, logs_url=null, log fetch 404 BlobNotFound, artifacts=0, combined status contexts=0). Do not manually retry.
- Swift 6.2.1 is available; xcodebuild/xcodegen are unavailable. No app build, XCTest, Simulator, Files or visual parity result is claimed.

## Invariants

- App code only on financial-autonomy-app:feat/sync-preview-v18-20-ios; never modify or merge app/main.
- Keep local-only data, no backend, mandatory account, bank sync or telemetry.
- Available credit is not owned money.
- No wholesale Models.swift or LedgerStore.swift rewrite.
- Keep exporterImplemented false and WEB JSON export disabled until full two-way snapshot round-trip and Apple build/test gates pass.
