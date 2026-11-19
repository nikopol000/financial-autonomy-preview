# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-19T00:32:00Z
Lease expires UTC: 2026-11-19T00:40:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: ed848636d606fff35b941ae5758019bfb711fb33
Verified app main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD: f93478bf0649f349ad90a7a7910845e4aabd4a4e
Checkpoint build: 18.20 build58
CI history: 44428442384 for 4d30572 failed on a visibleOrder argument-label mismatch; corrected in d44fed5 and b98184a. 44428600963 for b98184a failed because the DashboardView prefix rewrite omitted DashboardBudgetDetailEngine; restored in 2023e53. 44428742297 for 2023e53 failed because PreviewBudgetCardPalette was omitted; restored in 7772b1a. 44428983518 for 7772b1 failed because PreviewBudgetAppearance was omitted; restored in 8e78a0a, then moved to shared DashboardLayout.swift in 5e4c563 after the exact compiler diagnostic still could not resolve it in the same source file. 44429428242 for 5e4c563 then exposed the omitted PreviewBudgetCardTokens; restored in 68a697d. Run 44429607764 for 68a697d passed app build but test target compilation failed on one missing imported: label in DashboardOrderTests; corrected in ed848636d606fff35b941ae5758019bfb711fb33.
Exact current CI: 44429745130 targets ed848636d606fff35b941ae5758019bfb711fb33, IN_PROGRESS at last check, simulator build underway. Expected suite inventory 302 unit + 4 UI. No current build/test pass claim.
Implementation: v18.20 header, date, arrange/Gata; full visible module order with drag/drop and accessible move up/down; reset; hidden web-only module ID slot preservation; separate spending/next-income modules with two-column default row; optional encrypted snapshot dashboardLayout field; imported metadata mirror; layout validation; current-month pinned-window reset without amount changes; stable owned/credit value accessibility IDs. Build58.
No financial formulas changed. Credit remains separate from owned money. No backend/bank sync/telemetry. No wholesale Models/LedgerStore rewrite. app/main untouched. Full visual screenshots/VoiceOver remain pending.
Next exact action: inspect 44429745130. If it passes simulator build and all 302 unit + 4 UI tests, inspect the artifact and populated Light/Dark Dashboard screenshots. If it fails, fix only the actual diagnostic. Then continue VoiceOver and archived v18.20 screen-by-screen comparison. Do not claim 1:1.
