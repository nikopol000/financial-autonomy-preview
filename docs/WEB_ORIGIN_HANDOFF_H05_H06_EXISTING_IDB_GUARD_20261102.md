# P1 #4/#29/#35 — existing IndexedDB connection guard during selected-file inspection (2026-11-02)

**TEST-ONLY, PR-head and merged-main CI VERIFIED.** Base main `8d13a8a2bc02817a738276000d93810eb4312633`; product WEB 18.72 unchanged. This is a disposable Chromium characterization, not an importer or origin migration.

## Why this test matters

The H05/H06 selected-file test previously intercepted `indexedDB.open` and `indexedDB.deleteDatabase`, but an **already-open** `IDBDatabase` connection could create a `readwrite` transaction without calling either method. The previous complete-footprint assertion listed database names and versions, not record contents. Consequently, “zero IDB writes” was narrower than the wording suggested.

## Additional synthetic guard and acceptance

- Before file authentication, create a dedicated test-only IndexedDB database, write a `sentinel = unchanged` record and keep the connection open.
- During each H05/H06 selected-file operation, block `readwrite` transactions on **existing** connections, object-store `add/put/delete/clear`, cursor `update/delete`, and schema creation/deletion, as well as the prior Web Storage and IDB open/delete guards.
- Run a **deliberately blocked** positive-control write-transaction attempt on that pre-existing connection. This attempt is recorded separately, then the file-authentication attempt counter starts at zero. Do not misrepresent the positive control as a user-file write.
- Assert zero write attempts **during selected-file authentication**, no change to the original Web Storage/IDB names+versions footprint, and the unchanged sentinel **record value** after each accepted or rejected file.
- Preserve H05's “authenticated but older” conclusion and H06's six rejection cases; never claim that an authenticated file is the latest history.

## Limitations / safety contract

These guards exist **only inside the test page**. They do not prevent a different tab, worker, older cached app or already-queued transaction from writing concurrently, and they do not provide atomicity between preflight and a future commit. They do not inspect arbitrary pre-existing object-store records. No production storage is accessed; no financial model, backup format, local-only policy, iOS or product bundle changes are authorized. Five archived legacy-writer scenarios remain KNOWN UNSAFE, while partial reset #29 and KEY-only provenance #35 remain unresolved.

## Verified evidence and next gate

[PR #454](https://github.com/nikopol000/financial-autonomy-preview/pull/454) merged as `580dcac6155f4dcee8cc3789b02962688352f4db`. PR head `fa10f324ce3d1442e4e2bd444a24e7f9cb8afcda`: [Release #41397406601](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397406601) SUCCESS, [Chromium #41397406600](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397406600) SUCCESS with seven named H05/H06 PASS lines. Merged main: [Release #41397831457](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397831457), [Chromium #41397831383](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397831383), [Pages #41397831561](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397831561) and [Pages build #41397830966](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41397830966) all SUCCESS on the exact squash. [Issue #4](https://github.com/nikopol000/financial-autonomy-preview/issues/4) updated.

**Next P1:** characterize already-queued **other-tab** IDB writes after read-only preflight and the no-write conflict UX without implementing import. Same-page prototype hooks do not protect other contexts or provide an atomic commit. #85 320px/Safari and #14/#25/#2 financial-contract DISCOVERY remain open. Vercel production/Safari proof is separate and unverified.
