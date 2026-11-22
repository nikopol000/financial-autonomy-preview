# Native Work Handoff

Status: IN_PROGRESS
Owner: native parity automation
Updated UTC: 2026-11-22T14:08:16Z
Lease expires UTC: 2026-11-22T14:55:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: f83cd0ab4e0db5c84626ee1f1c8e88f96843a63d
Latest implementation commit: 93e7f56a3eab91712ee9026a9c7d7366143a1534
Latest app branch commit: f83cd0ab4e0db5c84626ee1f1c8e88f96843a63d
Verified app stable main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main HEAD before this handoff commit: fc6f8117590fab0b2ae20e97947cb0f9941e0b48

## Active work claimed — explicit WEB v18.20 date contract

- Current app feature HEAD verified at lease claim: f83cd0ab4e0db5c84626ee1f1c8e88f96843a63d. Stable app main: a9b30be147abecea45a63bf7dd8d0a3eb3370366 (unchanged). Preview main at lease claim: fc6f8117590fab0b2ae20e97947cb0f9941e0b48.
- First unfinished action from PROJECT_STATE/IMPLEMENTATION_QUEUE: add `LedgerDateContract` (native default; WEB v18.20 only when `WebImportMetadata.sourceVersion == 4`) with strict day/month validation, era-aware UTC conversion, reverse formatting, ordinal/month arithmetic and WEB recurrence APIs.
- Keep year-zero acceptance disabled in importer until SnapshotValidator and every downstream consumer are wired. Do not change global `RecurrenceCalendar`, Models or LedgerStore wholesale. Do not change financial formulas or enable WEB JSON export.
- Next: commit the adapter and focused tests on the iOS feature branch; execute exact harness and XCTest source parser; then update PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md with verified results and release this handoff.
