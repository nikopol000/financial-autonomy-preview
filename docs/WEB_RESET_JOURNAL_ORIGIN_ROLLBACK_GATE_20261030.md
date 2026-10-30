# Reset journal and full-origin rollback gate — 2026-10-30

**P1 RESEARCH ONLY — issues #4, #29, #35.** No production migration, financial calculation, real user data, iOS, backup format, telemetry, bank sync, or release-bundle changes. WEB 18.64 remains the active product. The new tests use synthetic ledgers and a disposable Chromium origin.

## Scope / exact threat model

The legacy WEB v1 vault uses three independently persisted localStorage keys: `financial-autonomy.preview.key.v1`, `financial-autonomy.preview.payload.v1` and `financial-autonomy.preview.reset.v1`. The proposed v2 research authority and operation witness share one IndexedDB transaction, **but the v1 reset journal is not inside that transaction**. An old cached v1 tab may still reset or write the v1 pair.

The research-only `inspectLegacyConflictForTest` now accepts an explicit `resetBaseline` (default `null`) and returns `unknown` if the reset marker differs. This is a conservative, read-only detection of a known conflict, **not a production recovery fix**. The baseline remains caller-supplied and unauthenticated: do not ship this classifier as an authority gate.

## New Chromium scenarios

1. **Reset-marker-only drift and partial v1 deletion.** Seed a real-format synthetic AES-GCM v1 vault; migrate without deleting the v1 evidence; confirm an IDB operation witness. Write a synthetic `idle-v2:<32 hex>` reset marker while leaving v1 ciphertext unchanged. The v1/v2 classifier must change from snapshot match to `unknown`; the IDB witness alone still authenticates its *own* state, not global reset consistency. Delete only v1 PAYLOAD while retaining KEY and reset marker, reload, and confirm read-only quarantine with byte-for-byte preservation of remaining evidence.
2. **Whole-origin rollback — KNOWN UNSAFE.** After migration, commit a newer authenticated v2 operation and change v1 ciphertext/reset marker. Deliberately restore the old v1 pair, old reset marker and old IndexedDB authority/witness together. On reload, the old operation authenticates, the newer operation is missing and the old v1 snapshot matches. **No local-only proof of recency exists.** A PASS here documents the blind spot; it is not a protection against rollback.

The tests never use the user's browser profile or financial data. The IDB rewind helper is test-only fault injection and must never be wired to production.

## Alternatives / decision

- **Ignore reset journal:** reject; a reset marker may change independently of the v1 ciphertext.
- **Treat IDB authentication as globally newest:** reject; it authenticates content but cannot prove recency after a full-origin rollback.
- **Automatically import v1 after partial reset / missing IDB:** reject; could resurrect a deleted ledger or erase a newer one.
- **Conservative read-only conflict state with explicit backup choice after a reviewed contract:** preferred. Retain all available ciphertext and journal evidence; allow inspection and non-destructive retry, never auto-replay, erase, rekey, select or merge.
- **External trusted monotonic checkpoint:** could offer rollback detection but conflicts with strict local-only/no-server architecture unless an explicitly user-controlled independent medium is agreed; not authorized.

## Release blockers / next actions

Run exact-head Release and Chromium CI, inspect the named test results, then checkpoint and comment issues. Next: actual archived v1 reset interaction after v2 migration; quota/IDB failure during reset; independently verify reset semantics of current WEB 18.64, Safari iPhone/VoiceOver and accessible no-write recovery UX. Before production integration, define authenticated provenance of the v1 snapshot **and reset epoch**, stale-tab behavior, missing/evicted authority and user-confirmed backup recovery. No implicit financial-contract changes; issue #14 remains DISCOVERY only.

## References

- [MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction)
- [MDN Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Prior IDB denial/eviction research](WEB_IDB_DENIAL_EVICTION_QUARANTINE_20261030.md)
- [Actual Budget: backups](https://actualbudget.org/docs/backup-restore/)
