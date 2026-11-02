# P1 #4/#29/#35 — present-but-denied Web Locks request (2026-11-02)

**TEST-ONLY / CI PENDING.** Base main `29536090dff6167a5399c836cd7268d5f79bad26`, WEB **18.72**. No application bundle, index, financial formulas, storage format, backup, real ledger, iOS, backend or telemetry change. This test uses a disposable loopback Chromium origin and synthetic state.

## New boundary compared with the verified missing-Web-Locks gate

The previous browser gate `tests/browser-p1-active-no-web-locks-research.cjs` covered `navigator.locks` **absent**. A browser can expose a `LockManager.request` method but **reject a request** (e.g., permission/security error). The current WEB 18.72 module 309 synchronous `canWriteReal()` only checks whether `request` is a function. Consequently, the UI may advertise that real writes are available even if a subsequent lock request fails. This is a **potential UX false-positive**, not evidence that the lock was acquired or that any data was lost.

## Synthetic Chromium characterization added

The test temporarily overrides the page's `navigator.locks.request` with a function that throws a synthetic `SecurityError` synchronously for fresh first save and empty reset, and returns a rejected Promise for update and destructive reset of an existing authenticated vault. In all four cases it requires:

- a rejected save/reset with the injected reason and exactly one attempted lock request;
- **zero** protected KEY/PAYLOAD/RESET set/remove/clear operations;
- byte-identical protected storage footprint (SHA-256 digest, no secrets logged);
- original authenticated synthetic transaction surviving reload, with rejected update absent;
- native Web Locks restored after the injected failure.

The test also records that `canWriteReal()` remains **true** while the fake request method exists. This is a diagnostic for error presentation, **not** an authorization to change real-mode policy or make an unverified synchronous availability claim. The app's normal async error path must be assessed separately in the real UI.

## Interpretation and next step

If CI passes, this confirms **fail-closed data writes** for the two tested request-denial forms; it does **not** establish that all browsers use those errors, that the current UI explains the denial well, or that Safari behaves the same. If CI fails, investigate without weakening the no-write assertions. Then review accessible UI error copy and whether an explicit async capability check is warranted; any product fix requires an immutable release and exact deployment/browser verification.

The **five archived cached WEB 18.27/18.33/18.34 writer scenarios remain KNOWN UNSAFE**. A modern lock rejection cannot fence an old noncooperating tab. The distinct-origin/manual encrypted-file handoff remains approval-gated per `docs/WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md`; no cutover, reset, automatic restore, replay, rekey or merge. #14 budget perspectives remain DISCOVERY only.
