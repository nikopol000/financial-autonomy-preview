# Native Work Handoff

Status: READY_FOR_NEXT_RUN
Owner: none
Updated UTC: 2026-11-23T00:04:43Z
Lease expires UTC: none
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: cd90be3340ef85ce3d83f9096949a0aa908e7150
Latest implementation commit: 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec
Latest app branch commit: cd90be3340ef85ce3d83f9096949a0aa908e7150
App feature ahead/behind stable main: 631/0
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before this checkpoint commit: e39e09bb627c4e434a88d5db82cd1b641176781b

## Completed this run

- Re-read all five required preview continuity files. Handoff was READY with no active lease.
- Reconciled live repository refs and latest commits. App feature HEAD is cd90be3340ef85ce3d83f9096949a0aa908e7150; last code HEAD is 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec; app stable main remains a9b30be147abecea45a63bf7dd8d0a3eb3370366. Preview main before this documentation checkpoint is e39e09bb627c4e434a88d5db82cd1b641176781b.
- Inspected exact Native iOS CI for code HEAD 21aaf63c60c7a4ff1b59eec566fd2f24eb38f8ec: run 45082267897 / job 137392845295 failed before runner allocation (runner_id=0, steps=null/empty, no artifacts, log 404 BlobNotFound, no combined status contexts). No retry. No workflow run or combined status contexts were reported for the later documentation-only app HEAD.
- Added app-branch design document NativeiOS/WEB_V2_V3_CANONICAL_TEMPLATE_DESIGN.md in commits 50c798a93fe376c4d71bd65b47a75cbbc6cb7824 and cd90be3340ef85ce3d83f9096949a0aa908e7150. It records the exact archived WEB v18.20 migration sequence, defaults/null semantics, per-day order, name catalog/role/audit transformations, parser projections and a separate canonical-v4 template proposal. The latter commit corrects the legacy JavaScript-truthiness edge case.
- The source-level audit is complete, but canonical v4 import/re-import fingerprint equivalence is NOT proven. No production code, persisted metadata, mapper behavior or exporter changed.
- No Swift build, app-target XCTest, Simulator, .xcresult, Files-provider or visual comparison was executed. No financial formulas, Models.swift, LedgerStore.swift, app stable main or preview product bundle changed.
- Local-only/no backend/no mandatory account/no bank sync/no telemetry; available credit is not owned money. Native .fabackup remains the only writable backup; WEB JSON export and year-zero import remain disabled.

## FIRST NEXT

1. Add a test-only canonicalizer seam using the existing v18.20 v2/v3 normalizer and a fixed migration day. Decode both original legacy JSON and generated canonical v4 JSON through the production importer; compare the complete mapper mappedFingerprint. Keep sourceStateJSON nil on the original legacy snapshot. Cover names/IDs, transaction order, operation-audit before-images, optional/null/falsey legacy, deterministic bytes and tamper rejection. Do not add production metadata or enable mapping/export until the proof passes on the actual iOS test target.
2. At the first functioning macOS runner, run XcodeGen, full Simulator build, all unit/UI tests and inspect exact .xcresult/screenshots. Do not retry run 45082267897: it failed before runner allocation with empty steps/BlobNotFound.
3. After proof, implement provenance-aware mapper integration and native .fabackup persistence/reload tests; then verify Files-provider restore/export on device.
4. Complete archived v18.20 financial calculation and Light/Dark/VoiceOver screen-by-screen parity. Keep year-zero import disabled until all date consumers and Apple validation gates pass.

## Invariants

- Work only on financial-autonomy-app:feat/sync-preview-v18-20-ios; do not merge or push to stable app main without explicit user approval.
- No wholesale Models.swift/LedgerStore.swift rewrite, no global recurrence/date behavior change, no unapproved financial formula changes.
- Local-only; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money.
- Native .fabackup remains the only writable backup; WEB JSON export and year-zero import remain disabled.
