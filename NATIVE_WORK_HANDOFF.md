# Native Work Handoff

Status: IN_PROGRESS
Owner: ChatGPT native iOS automation
Updated UTC: 2026-11-22T20:10:33Z
Lease expires UTC: 2026-11-22T20:35:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
Latest implementation commit: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
Latest app branch commit: ce6b9e8ec035a430898a1ffaba2470a1e5a2330a
App feature ahead/behind stable main: 622/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this lease commit: cfcbe60b76face63d7ddbace4c752576372d977a

## Active work

Complete the remaining WEB v4 opaque-extension identity matrix on the iOS feature branch, then harden v1/v2 archive validation for malformed/oversized archives and path/segment consistency. Do not duplicate another session's work. Keep year-zero import and WEB JSON export disabled.

## Completed baseline

- App commit ce6b9e8ec035a430898a1ffaba2470a1e5a2330a adds nested stable-identity reorder tests, duplicate/ambiguous/missing identity fail-closed tests and parent-plan-scoped step-pruning coverage.
- The exact-commit Native iOS CI run 45060097734 failed before runner steps (empty steps, no artifacts, log retrieval 404 BlobNotFound, no combined status contexts). No retry.
- Linux Swift 6.2.1 is available; XcodeGen, xcodebuild and a macOS runner are unavailable.

## Required next actions

1. Add identity/reorder tests for debt.schedule, names/nameChanges, balanceChecks, checkAudit/audit before-images, appearance and income/expense template opaque fields.
2. Add malformed/oversized v1/v2 archive tests and path/segment consistency checks; preserve v1 object-only restore and reject v1 array-index paths.
3. Implement only evidence-backed archive validation fixes and add fail-closed tests for missing parents and known-field collisions.
4. Run available parser/harness checks; do not claim app-target XCTest or iOS build without execution.
5. Update PROJECT_STATE.md, IMPLEMENTATION_QUEUE.md and this handoff with exact commits, checks, CI evidence and the next action. Release this finite lease as READY_FOR_NEXT_RUN.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; stable app main remains untouched.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.
