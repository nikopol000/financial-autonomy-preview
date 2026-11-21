# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-21T05:08:00Z
Lease expires UTC: 2026-11-21T05:38:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: d02b699ffe293b1309dc9fac3edb4dc223262acf
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before lease: 65724efbd42a0ad1bd05e320dd34524b9a3f996b
Feature comparison: 444 ahead / 0 behind; app/main remains unchanged.

## Active stage — WEB transaction template-reference integrity

- The previous completed checkpoint is app HEAD d02b699ffe293b1309dc9fac3edb4dc223262acf. A fresh compare against the live feature branch reports identical (0 ahead / 0 behind); stable app main is a9b30be147abecea45a63bf7dd8d0a3eb3370366.
- Native iOS CI run 44865773341 for that exact HEAD completed FAILURE before runner/step allocation: job 136728970344, steps empty, logs_url null, log download 404 BlobNotFound, artifacts 0 and combined status contexts 0. Do not retry the same pre-runner failure.
- The first independent audit found that WebBackupExportPreflight validates a native scheduledItemID only when present, but does not validate a retained WEB webTemplateID by itself or enforce the archived WEB v18.20 rule that income transactions reference income templates and expense transactions reference expense templates/recurring entries. The archived importer does enforce that rule in parseOperation.
- Planned bounded change: make preflight validate both native schedule links and retained WEB template links for live operations and immutable operation-audit before-images, with exact catalog cardinality and operation-kind compatibility. Keep export disabled.

## Exact next action

1. Implement the read-only template-reference validator and path-specific regression tests on the feature branch only.
2. Run Swift parser and an isolated Linux harness with explicit stubs; report it as isolated, not app-target XCTest.
3. Recheck exact feature HEAD and Native iOS CI; do not repeat the prior pre-runner failure.
4. Update PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with the exact commit, actual checks and remaining limitations, then release this handoff to READY_FOR_NEXT_RUN.

Privacy and financial invariants: local-only storage, no backend, mandatory account, bank sync or telemetry; available credit is not owned money. Do not change financial formulas, Models.swift, LedgerStore.swift or app/main. No 100% parity claim.
