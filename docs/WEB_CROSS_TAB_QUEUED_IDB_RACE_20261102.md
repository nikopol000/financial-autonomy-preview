# P1 #4/#29/#35 — queued other-tab IndexedDB writer after read-only preflight (2026-11-02)

**Status: TEST-ONLY RESEARCH / PR-head and merged-main CI VERIFIED.** Start main `943bf08ca8e61fd8c7e05bcd95cbec9e518f111e`; WEB 18.72 product unchanged. No import, cutover, financial data, real vault or backup was accessed.

## Question and synthetic method

The previous H05/H06 Chromium file-authentication test [guards an already-open IDB connection](WEB_ORIGIN_HANDOFF_H05_H06_EXISTING_IDB_GUARD_20261102.md) against **same-page** writes. Does that make a read-only destination inspection atomic against an **other-tab transaction already queued**?

`tests/browser-origin-handoff-cross-tab-idb-race-research.cjs` creates two pages in one disposable HTTPS `.example.test` origin. Both open the same synthetic IndexedDB. The inspector seeds a sentinel, then keeps a real `readwrite` transaction active using chained IDB requests. The other tab queues a `readwrite` sentinel update; the test asserts the update is **not yet committed**. The inspector installs page-local no-write hooks, verifies a deliberate write-transaction positive control is blocked, and reads localStorage key names and `indexedDB.databases()` without writes. It then releases the held transaction. The already-queued other-tab write commits, changing the sentinel while database names/versions and localStorage keys remain identical. The inspector's write-attempt counter remains zero.

## Expected interpretation and acceptance

- **PASS means a residual race is reproduced, not that data is protected.** Another tab can write through its own JS realm despite inspector-local guards. The inspector's zero-write counter covers only inspector operations.
- The database-name/version footprint is insufficient to prove IDB **record contents** have not changed. An immutable name/version pair can hide a newer record.
- A second snapshot can detect a change that happened **before** that snapshot, but cannot atomically fence writes queued immediately after it.
- This test intentionally uses synthetic record values, not a production import, account model, encryption migration, storage format change, Web Locks guarantee or Safari validation.
- A safe future contract must choose a real cross-context serialization/authority boundary and define conflict handling and explicit cutover consent. A cached legacy writer that ignores a new lock cannot be assumed cooperative; independent-origin isolation still requires approved handoff and divergence handling.

## Evidence and next step

[PR #456](https://github.com/nikopol000/financial-autonomy-preview/pull/456) merged as `dc28ddb0001f3b955b50b40d36b89b8b3630b599` (PR head `2fc37c392feb2dffdd83439efd718083f224bda4`). PR-head [Chromium #41403721728](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41403721728) SUCCESS, with **three named PASS lines** and an explicit LIMIT; [Release #41403721714](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41403721714) SUCCESS. Exact merged-main [Chromium #41404048740](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41404048740), [Release #41404048628](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41404048628), [Pages #41404048596](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41404048596), [Pages build #41404047983](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41404047983) all SUCCESS. Compare from `943bf08c` changes only research test, workflow and this document. Vercel production READY deployment `dpl_Ca1Q5skLgq3ccUhnvP7c4tLYAZoT` is tied to exact merged commit, but independent public browser/Safari behavior is **not** verified. If timing is flaky, make synchronization deterministic; never weaken assertions to make an unsafe result look safe. Keep #4/#29/#35 open. Follow with #85 structural mobile navigation research and nonurgent financial DISCOVERY only; #14 formulas/modes remain approval-gated. Do not publish a new product version for test/documentation changes.
