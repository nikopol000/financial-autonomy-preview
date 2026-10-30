# IndexedDB denial and eviction quarantine gate — 2026-10-30

**P1 / research-only, synthetic Chromium. NOT a product release.** Scope: issues #4, #29, #35; no changes to WEB 18.64 bundle, index, diagnostic, encrypted backup, financial formulas, user data, or iOS.

## Threat model and evidence sought

An atomic IndexedDB commit binds an AES-GCM authority and operation witness **within the database**, but does not prevent the browser from denying access, deleting site data, or restoring an earlier entire origin. The legacy v1 localStorage KEY/PAYLOAD pair is not an authenticated recency oracle.

The browser research test `tests/browser-v2-restore-operation-witness-research.cjs` adds two independent disposable-origin cases:

1. **Synthetic IndexedDB SecurityError:** override only the test page's IndexedDB open API to throw. Verify the v1 migration preflight fails, restore acknowledgment is `unknown`, the v1/v2 conflict inspection is `unknown`, and exact legacy ciphertext/key bytes survive. After restoring the API, confirm no IDB authority was written. This is deterministic fault injection, **not** proof of real browser permission behavior.
2. **Synthetic eviction after an authenticated migration:** commit an operation+witness, verify `verified_committed_operation`, explicitly delete only the disposable IndexedDB database, reload and reinstall the test-only helper. Both acknowledgment and v1/v2 classifier must return `unknown`; authority and witness are absent while legacy encrypted bytes are unchanged. Explicit `deleteDatabase` is an eviction *proxy*, **not** browser quota or automatic eviction reproduction.

The test-only `ack` helper previously returned `verified_unchanged` when both the caller's `before` snapshot and the now-missing IDB authority were null. That can misrepresent a **previously committed but evicted** operation as one that never happened. The helper now requires an existing non-null matching authority for `verified_unchanged`; missing authority is `unknown`. This is a correction to **research-only semantics**, not shipped recovery.

## Alternatives and trade-offs

- **Automatically fall back to v1:** reject. A cached old tab may have written later, or the v1 snapshot may have been rolled back. No reliable ordering.
- **Automatically recreate IDB from v1:** reject. It would silently grant authority to possibly stale ciphertext and could conceal loss.
- **Retain encrypted v1 and show read-only storage-unavailable/unknown state:** preferred candidate. Permit non-destructive retry/inspection only, with explicit user-directed backup recovery after a separately reviewed contract.
- **Browser persistent storage request:** may reduce some eviction risk but does not guarantee protection from manual deletion, browser policy, or OS loss; never treat as an anti-rollback guarantee.
- **External encrypted file backup:** useful user-controlled recovery evidence, but cannot independently prove it is the newest ledger; never import automatically.

## Remaining release blockers

Actual browser denial/eviction under Chromium and Safari, full-origin rollback, reset journal compatibility, old-tab writes after IDB failure, quota errors at every transaction boundary, accessible no-write conflict UI, iPhone Safari/VoiceOver and keyboard focus, authenticated operation provenance and a complete safe migration contract. A missing IDB witness or authority must never trigger auto-merge, auto-delete, auto-replay or silent fallback.

Issue #14 budget perspectives remains **DISCOVERY ONLY** pending an explicitly approved numeric contract. No new perspective or financial formula is authorized.

## Reference material

- [MDN — IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction)
- [MDN — Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Prior archived writer and rollback experiment](WEB_ARCHIVED_V1_IDB_QUARANTINE_GATE_20261030.md)

## Verification status

[PR #310](https://github.com/nikopol000/financial-autonomy-preview/pull/310) merged as `eaf99abf0ea64874dd8d0251d128b3c57319171f`. Exact tested PR head `7810789f20af9ae648020dc7f2f8710f6827c9a0`: [Release CI #41052523486](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41052523486) SUCCESS and [Chromium #41052523477](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41052523477) SUCCESS; Chromium job `124051833886` includes both named PASS lines. Merged-main and final checkpoint checks are separate; no public browser acceptance claimed.
