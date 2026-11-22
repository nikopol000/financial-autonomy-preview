# Native Work Handoff

Status: IN_PROGRESS
Owner: ChatGPT automation — native iOS parity
Updated UTC: 2026-11-22T18:14:30Z
Lease expires UTC: 2026-11-22T18:44:30Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: e1462b866d710f3586698bb709aa8efb59df7feb
Latest implementation commit: e1462b866d710f3586698bb709aa8efb59df7feb
Latest app branch commit: e1462b866d710f3586698bb709aa8efb59df7feb
App feature ahead/behind stable main: 619/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD: 38680d4f055514d1c7f21ab2a8ad8b76adb52ad9

## Current work

Continuing the first unfinished item from the previous checkpoint: prove old WEB v4 .fabackup compatibility through the real encrypted restore/reload path, mapper/fingerprint, source-only operation/balance-check audit history, and opaque JSON extensions. Before changing code, audit the remaining date-only schedule/loan/goal/plan/month-plan presentation and Date-backed consumers. Preserve native local-day semantics for records without webSourceDay; preserve exact WEB source days for marked records. Do not enable year-zero import.

## Verified CI blocker

Exact app HEAD e1462b866d710f3586698bb709aa8efb59df7feb: Native iOS CI run 45051377856, job 137297022008, completed failure before runner allocation (runner ID 0, no steps, no job logs, no artifacts; combined status has no contexts). Do not retry the same pre-runner BlobNotFound failure. Environment has Swift 6.2.1 on Linux but no Xcode/XcodeGen/macOS runner.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; never modify or merge source main.
- Recheck feature HEAD immediately before each source write; use expected-SHA ref updates and never force.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global RecurrenceCalendar change, no financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export remains disabled.