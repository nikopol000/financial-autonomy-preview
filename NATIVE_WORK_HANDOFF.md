# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-19T00:10:00Z
Lease expires UTC: 2026-11-19T00:40:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: c288c2a5799081dbed387c6e7b447a74b4f99064
Verified app main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD: a9571c17d3539cf96426e884154b120eee43554a
Checkpoint build: 18.20 build57
Exact CI: run 44418905578 for c288c2a5799081dbed387c6e7b447a74b4f99064 completed FAILURE. XcodeGen, project generation and iOS Simulator app build PASS; 297 unit tests PASS (0 failures); 4 UI tests executed with 1 failure in NativeScreenSmokeTests.testPopulatedAutonomyRoundTripInLightAndDark at line 134. The failed exact-string query for "20.000,00 RON" does not match the visible screenshot text even though the screenshot visibly renders 20.000,00 RON and 2.000,00 RON. Artifact 14480059489 inspected; populated dashboard screenshot/video confirms both values are visible. Treat this as an accessibility-query/test contract issue; add stable accessibility identifiers to the two value Texts and assert their labels, preserving owned-vs-credit separation.
Next implementation after this test-only/accessibility fix: archived WEB v18.20 HomeHeader (SITUAȚIA MEA / Azi. / localized date) and full-module Dashboard arrangement/reorder parity (drag, accessible move-up/down, reset), retaining unknown/hidden web module IDs in stored imported order. Do not touch Models.swift or rewrite LedgerStore wholesale. Continue VoiceOver and screen-by-screen comparison.
No app/main changes; no 1:1 claim.