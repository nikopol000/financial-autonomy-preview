# Archived cached writer AFTER legacy reset with experimental IDB — 2026-10-30

**P1 test-only characterization — issues #4, #29 and #35.** The active product remains WEB 18.64. This work uses the actual immutable archived WEB 18.27/18.33/18.34 Metro vault/reset modules with synthetic transactions in disposable Chromium contexts. It does not implement a production migration, recovery, reset or formula change.

## Threat model and matrix

An archived tab saves an AES-GCM v1 KEY/PAYLOAD ledger. A second tab migrates an authenticated copy into a **test-only** atomic IndexedDB authority plus operation witness, retaining the v1 original. The archived tab invokes its **real** reset function, then attempts to save its **cached pre-reset ledger** again.

| Archived bundle | Reset path | Late action | Safety evidence required |
| --- | --- | --- | --- |
| 18.27, 18.33, 18.34 | complete removal of v1 KEY and PAYLOAD | real archived `save(cached + synthetic expense)` | classify the resulting v1 footprint as unknown or authenticated divergence; never silently promote v2 |
| 18.27, 18.33, 18.34 | PAYLOAD removed, KEY removal fails with synthetic SecurityError | same cached save | preserve v1 evidence; do not delete orphan key or treat IDB witness as reset authorization |

The six cases must record whether the **actual archived save** succeeded or failed; a PASS can document a **KNOWN UNSAFE** resurrection. If a save succeeds, decrypting the v1 result must show the new synthetic transaction and the v1/v2 read-only classifier must flag authenticated divergence. If it fails, the classifier must still quarantine the incomplete/absent footprint. The IDB authority and witness must remain byte-for-byte unchanged; the classifier must perform no writes. A valid IDB operation witness proves only that an IDB operation committed, **not** that reopening the IDB ledger respects a later user reset.

## Alternatives

1. **Auto-resume IDB after any v1 reset:** reject; may resurrect intentionally erased financial data.
2. **Auto-delete IDB whenever v1 disappears:** reject; a partial reset can destroy the only v1 ciphertext while IDB remains the sole authenticated copy.
3. **Automatically merge/replay the cached v1 write into IDB:** reject; archived clients have no authenticated reset epoch and there is no defensible cross-store order.
4. **Quarantine both footprints with explicit, accessible read-only recovery choices:** preferred research direction, pending an authenticated reset/authority protocol, a reviewed user-facing contract, and Safari testing.

## Evidence gate and next work

- Execute `node tests/browser-v2-restore-operation-witness-research.cjs` in pinned Chromium CI; inspect six named `PASS CHARACTERIZATION actual archived ... post-reset cached writer ...` lines and the Release validation workflow. An assertion that runs is **not** evidence until the actual workflow succeeds.
- Verify the merged-main SHA independently. Do not infer Vercel READY or browser acceptance from CI.
- Next: inject IDB `SecurityError`/transaction abort at a proposed authenticated reset boundary, design reset-epoch provenance and no-write recovery UX, test actual Safari iPhone/VoiceOver. Same-origin full rollback cannot be ruled out by a local-only witness; never claim global freshness.
- Keep #14/#25/#2 in financial DISCOVERY pending explicit numeric approval.

References: [previous archived reset matrix](WEB_ARCHIVED_RESET_AFTER_IDB_GATE_20261030.md), [MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [MDN storage eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
