# WEB read-only quarantine: missing IndexedDB object store (2026-10-31)

## Purpose and threat

This is an isolated Chromium research test using **synthetic** AES-GCM data, not a production vault, repair, reset, migration or new user-facing release. The active product is WEB 18.64. A browser storage fault, incompatible schema, or interrupted migration can leave an IndexedDB database name present but its expected `vault` object store absent. Existence of the database is not proof that the ledger is readable or empty.

The test in `tests/browser-v2-conflict-readonly-ui-research.cjs` creates the synthetic authority and v1 legacy pair, then **deliberately deletes the test object's store via a version-2 upgrade**. That destructive fixture setup happens **before** instrumenting the read-only inspector. The inspector must not create a replacement store, initialize a ledger, erase/rekey the legacy pair, or enable editing.

## Deterministic acceptance

1. Seed a valid synthetic AES-GCM v1 pair and v2 IndexedDB authority.
2. Capture the exact legacy key/payload bytes.
3. Simulate schema loss with a controlled `indexedDB.open(DB, 2)` upgrade deleting `vault`, then close the upgrade connection.
4. Instrument `Storage.prototype.setItem/removeItem` and IndexedDB `readwrite` transactions **after fixture damage**.
5. Render and retry read-only inspection. Expect `STORAGE_UNREADABLE`, an explanatory blocked screen, no editable inputs and **zero** audited writes.
6. Independently open the existing DB with an abort-on-upgrade guard. Assert schema stays at version 2 with zero stores; v1 bytes stay identical.
7. Reload, reinstall only the isolated inspector, and confirm the same blocked verdict and unchanged v1 bytes.

A test PASS is evidence only for this synthetic Chromium path. The inspector's read-only `db.transaction('vault','readonly')` throws on a missing store, which is caught and mapped to an unreadable/blocked state. It is **not** proof that a deleted store can be reconstructed or that the synthetic v1 pair is the latest authentic ledger.

## Alternatives and decision

| Option | Consequence | Decision |
| --- | --- | --- |
| Fail closed, retain surviving encrypted bytes, offer explicit reinspection | No data fabrication; affected users need a reviewed recovery path | Research baseline |
| Detect known schema versions and migrate transactionally | May be viable only with explicit authenticated migration/reset/backup contract, crash and legacy-writer tests | Not approved |
| Automatically recreate missing store or start fresh | Can hide lost data and allow stale tabs to overwrite state | Rejected |
| Treat the v1 pair as authoritative after v2 schema loss | Cannot prove freshness after reset, origin rollback or old-tab write | Rejected |

## Remaining production gates

- Test **actual archived v1 writers**, partial reset and first-save faults, permission/eviction failures, blocked upgrades, full-origin rollback, stale tabs and browsers lacking Web Locks or `indexedDB.databases()`.
- Specify an authenticated reset/restore-consent and non-destructive recovery contract; retain the last recoverable encrypted copy until an explicitly approved transition.
- Prove a real WEB production guard in Chromium **and Safari/iPhone** with keyboard, enlarged text, VoiceOver and neutral messages before any immutable versioned release.
- Do not alter financial formulas, issue #14 budget perspectives, card semantics #25, backup encryption, real user data, iOS or local-only architecture.

## Platform references

- MDN `IDBDatabase.transaction()`: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction
- MDN `IDBDatabase.objectStoreNames`: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/objectStoreNames
- MDN `IDBOpenDBRequest.upgradeneeded`: https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/upgradeneeded
- Prior repository research: `docs/WEB_READONLY_UNSUPPORTED_IDB_LATE_RESULT_GATE_20261031.md`.

**Verification status:** pending CI at initial commit; do not claim PASS until the exact branch Chromium test is observed.
