# Native Work Handoff

## Current run — mutable WEB v4 account + transaction projection

Status: IN_PROGRESS
Owner: native parity automation
Updated UTC: 2026-11-21T20:09:09Z
Lease expires UTC: 2026-11-21T20:55:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD before work: c51086648d68c93b68eff147690b638660e3b6b8
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this lease commit: ede5962295adb16a257e39439f744139adc5e32e
Exact in-progress action: implement the first mutable WEB v4 projection slice in NativeiOS/WebV18_20StateMapper.swift for canonical native accounts and transactions. Preserve original WEB account/transaction UUID spelling and source array order; map account opening/date/kind/liquidity and transaction income/expense/transfer/debtPayment fields, IDs, details, financial role, template/category/reconciliation links, and voided state. Keep unmappable or ambiguous native-only state fail-closed. Validate source SHA and import-time fingerprint before mapping; reattach opaque extensions by stable identity; add populated mapper round-trip tests. Keep WEB JSON export disabled and do not modify app/main.

## Previous completed foundation

- App feature HEAD at start: c51086648d68c93b68eff147690b638660e3b6b8.
- Exact WEB v4 source bytes, SHA-256 and import-time LedgerSnapshot fingerprint are retained in encrypted native metadata.
- Opaque extension archive v2 uses stable identities for array ancestors and rejects ambiguous/missing/colliding targets.
- Previous isolated Swift 6.2.1 helper checks passed, but app-target XCTest, Apple build, Simulator, Files and visual parity remain unverified.
- Exact CI for c510866 (run 44929097185) failed before runner steps: empty steps, null logs URL, 404 BlobNotFound, zero artifacts and zero combined status contexts. Do not repeat the same pre-runner failure.

## Required invariants

- Only modify financial-autonomy-app:feat/sync-preview-v18-20-ios for app code.
- Never modify or merge financial-autonomy-app/main.
- Keep local-only data; no backend, mandatory account, bank sync or telemetry.
- Available credit is not owned money.
- Do not rewrite Models.swift or LedgerStore.swift wholesale.
- Keep WEB JSON export disabled until full native→WEB→native round-trip and Apple build/test gates pass.

## At completion

Update PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with exact app commits, executed checks, blockers and the next action. Set this file to READY_FOR_NEXT_RUN with the exact app HEAD and no active lease.
