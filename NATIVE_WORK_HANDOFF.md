# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: ChatGPT native iOS automation
Updated UTC: 2026-11-23T14:05Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c
Latest implementation commit: 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c
Latest app branch commit: 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c
App feature ahead/behind stable main: 695/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: 28147626cccef859b6669aa24b5e66c277734c44

## Latest audit checkpoint — MoneyHome financial contract refinement

- No active lease and no app source changes in this run.
- Re-read archived WEB v18.20 module 305 and native import mapping. Refined the approval-gated MoneyHome contract in PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md: latest balance-check row only (a latest zero suppresses older differences), savings overlaps available money when available, and card/overdraft debt IDs are mirrored between WEB metadata and native credit accounts.
- Native iOS CI for exact app HEAD 1c42a0c4676ae3be9fa4167fbebdd1e14ebef52c: check-run 137685586856 / workflow run 45172582256 FAILURE; zero steps, no artifacts, job logs 404 BlobNotFound, combined status has no contexts. Do not retry the repeated pre-runner failure pattern.
- Local environment does not have XcodeGen or xcodebuild; no Apple-target build, XCTest, UI test, Simulator, .xcresult or screenshot comparison was executed.

## FIRST NEXT

1. Await explicit user approval of the refined MoneyHome calculation contract before changing owned-money inclusion, debt aggregation, credit or reconciliation formulas.
2. After approval, reconcile current refs and file blob SHAs, implement the five expandable MoneyHome groups on the feature branch, and add tests for available/nil/unavailable accounts, savings overlap, debt UUID one-time mapping, latest-zero balance checks, signed differences and Int64 overflow.
3. Keep stable app main untouched. Continue Apple-target build/test and populated Light/Dark screenshot validation on the first functioning macOS runner; do not retry run 45172582256 or the same pre-runner failure pattern.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; no merge or push to stable app main without explicit approval.
- No wholesale Models.swift/LedgerStore.swift rewrite and no unapproved financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup. WEB JSON export and year-zero import remain disabled.
- Never report 100% parity without data-preservation, financial, build/test, Files-provider and visual/accessibility evidence.
