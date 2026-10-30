# Synthetic IndexedDB quota and cooperative reset/write race gate — 2026-10-30

**RESEARCH / TEST ONLY — #4, #29, #35.** Active product WEB 18.64 is unchanged. No actual reset, migration, backup change, user data, formula change or iOS modification. This gate extends the disposable Chromium AES-GCM v2 authority/witness harness, not the production vault.

## Problem and test design

A pending reset intent is only an authenticated state transition. It is **not** proof of user consent, deletion, finality or freshness. The existing v1 localStorage pair and cached WEB 18.27/18.33/18.34 writers remain outside the IndexedDB transaction.

1. **Quota during authority put.** Monkeypatch the browser's IDBObjectStore.put on the experimental `vault` store to throw a synthetic `QuotaExceededError`. The adapter must abort, preserve the previous authority and witness, and leave legacy ciphertext byte-identical after reload.
2. **Quota during operation-witness put.** Throw the same synthetic exception on `operations` **after** the authority put was staged. The entire transaction must abort, with no torn authority/witness and no legacy deletion.
3. **Two cooperative tabs: reset intent versus ledger writer.** Both begin at authenticated revision 1 with an explicitly observed empty reset epoch. Their IDB compare-and-swap transactions race. Exactly one operation may commit; the other must have no authenticated operation witness. If the writer wins, a *new*, independently identified reset operation can commit after reinspection; this is **not automatic replay**.
4. **Writer with a fresh revision after pending reset.** The test-only API accepts `expectedEpoch`. A cooperating writer that explicitly expects no pending reset must fail closed with `reset-epoch-changed` even if it reads the newest revision. The epoch check occurs before the atomic CAS; the CAS protects against a change between the check and transaction. An old v1 writer that ignores this protocol **is not fenced**.

The `QuotaExceededError` cases are **injected browser API exceptions**, not a real quota exhaustion, device crash, Safari test or browser storage eviction. The race uses two actual Chromium pages in a disposable context, but not a full application UI. These checks must be confirmed in exact-commit Chromium logs before claiming PASS.

## Proposed contract and remaining decisions

**State machine proposal (not approved/shipped):** `idle` → `user-confirmed` → `pending` → `committed-reset` or `unknown`. The authenticated operation ID and reset epoch would be stored with the authority in a single IDB transaction. A reset is not complete merely because a pending marker exists. A failed write or ambiguous acknowledgment must never trigger automatic deletion, replay, rekey or recovery. Legacy ciphertext must not be deleted until there is a separately reviewed, crash-safe and explicit user-intent protocol.

**Non-destructive UX:** `Nu putem confirma starea datelor`, read-only `Verifică din nou`, optional explicitly consented export of evidence, and `Închide`. Block financial writes while the state is ambiguous; avoid presenting an older authenticated snapshot as the latest. Provide VoiceOver status and accessible action names, with no color-only semantics.

**Unresolved blockers:** archived cached v1 tabs can still recreate data after an intentional reset; same-origin storage cannot prove freshness after whole-origin rollback; actual user-confirmation provenance, no-write recovery UI, Safari iPhone/VoiceOver, real quota/eviction, crash/restart and encrypted portable-backup compatibility remain unverified. A v2-only epoch fence cannot solve these. No production promotion until the reset contract is reviewed and all critical acceptance gates are met.

## Alternatives

- **Silently recover v2 when v1 is absent:** rejected; risks undoing intentional deletion.
- **Silently erase v2 when v1 reset is detected:** rejected; risks losing the only surviving authenticated copy.
- **Revision-only CAS:** prevents simultaneous cooperating writers, but does not by itself block a freshly loaded writer after pending reset.
- **Authenticated reset epoch + cooperative writer fencing + no-write quarantine:** preferred research direction, with explicit legacy-client and rollback limitations.
- **Server authority:** outside the required local-only architecture.

## Evidence and next steps

Run `node tests/browser-v2-restore-operation-witness-research.cjs` in disposable Chromium. Inspect named quota-vault, quota-operations and two-tab reset/writer PASS lines in the exact candidate's workflow job logs; check Release CI separately. If green, document the observed outcomes in #4/#29/#35 and checkpoint files. Then characterize a **non-cooperating cached v1 writer** during pending reset, distinguish intentional reset from ambiguous partial reset, and test no-write UI and real browser storage failures. Do not interpret a green characterization test as a production fix.

References: [IndexedDB transaction semantics](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [previous reset-intent gate](WEB_RESET_INTENT_IDB_FAULT_GATE_20261030.md), [archived cached writer characterization](WEB_ARCHIVED_POST_RESET_CACHED_WRITER_20261030.md).
