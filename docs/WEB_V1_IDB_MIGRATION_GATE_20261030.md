# WEB 18.64 — v1 encrypted vault → atomic IDB migration gate (2026-10-30)

**Status: RESEARCH ONLY / NOT SHIPPED.** PR #304. P1 issues #4, #29, #35 remain open. This document is not approval to change the local financial ledger, encrypted portable backup, financial formulas or iOS.

## Exact test surface

`tests/browser-v2-restore-operation-witness-research.cjs` now includes disposable Chromium contexts using the actual v1 localStorage KEY/PAYLOAD names and the v1 AES-GCM envelope structure `{v:1,nonce,data}`, with a 64-hex-character key. The envelope's format and authentication behavior are independently characterized against immutable WEB 18.64 in `tests/vault-real-crypto-regression.cjs`. This browser experiment creates the fixture with WebCrypto; it does **not** invoke the production migration code, which does not exist.

The test-only adapter decrypts and checks v1 state, checks that both source bytes are still unchanged, then commits a newly encrypted v2 authority and unique operation witness in one IndexedDB transaction. It **never deletes or rewrites** the original v1 pair. It is not wired into the application.

## Acceptance matrix / observed versus required

- Valid v1 envelope: migrate into IDB, authenticate operation after reload; preserve original v1 bytes for recovery.
- KEY-only, PAYLOAD-only, corrupted authentication tag and denied v1 reads: fail closed with no IDB authority or v1 mutation.
- Abort before/after queued IDB writes: no authority or witness committed; original v1 remains.
- Exception after IDB commit: read-only witness check after reload may confirm the specific operation without replay.
- Source mutation detected during preflight: reject; do not infer that a snapshot is current.
- **KNOWN UNSAFE:** a cached legacy tab can still write the old localStorage pair after v2 cutover. A v2-only reader will not see that later edit. The experiment explicitly reproduces this divergence; the test's PASS means the risk was characterized, **not mitigated**.

CI and exact PR-head verification must be recorded separately. Until then the above is a test plan, not a claimed successful run.

## Architectural alternatives

1. **Auto-delete v1 immediately after migration:** rejected. A crash, blocked IDB, browser eviction or rollback could remove the only recoverable ciphertext.
2. **Keep v1 as a permanently writable fallback:** rejected. Two authoritative ledgers can diverge, especially with cached old bundles.
3. **One-time v1 import with read-only retained source and explicit conflict quarantine:** candidate, but cannot force a cached old bundle to honor a new lock. Requires a controlled version cutover, origin-level compatibility policy and a clear UX for conflicting v1/v2 footprints.
4. **External freshness authority:** incompatible with local-only architecture.

## Relevant benchmark / external evidence

[Actual Budget restore documentation](https://actualbudget.org/docs/backup-restore/restore/) describes importing a backup as a separate budget and verifying it before deleting the original. The transferable principle is **preserve the original until the restored copy has been checked**, not copying Actual's server/account architecture.

[Actual's browser-only installation warning](https://actualbudget.org/docs/actual-server-repo-move/) explicitly warns that browser-local storage can be lost and recommends file backups. Financial Autonomy must not represent IndexedDB as durable archival backup.

[MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) recommends one transaction for related changes, while [MDN transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction) explains that strict durability is a browser option, not proof against every power-loss, eviction or full-origin rollback.

## First unfinished steps before any product migration

1. Verify exact PR-head Release and Chromium CI; inspect named PASS/FAIL logs and correct only the test if needed.
2. Reproduce cached WEB 18.27/18.33/18.34 actual bundle late-write behavior, not just the synthetic v1 writer.
3. Specify user-visible fail-closed v1/v2 conflict and backup recovery flow without deleting either copy.
4. Test IDB denied/evicted storage, full-origin rollback, legacy reset journal, and Safari iPhone/VoiceOver. A local-only origin cannot prove global freshness.
5. Only then propose production cutover, with versioned immutable bundle, release checks and independent served-browser verification.

No #14 budget modes or formulas are authorized by this research.
