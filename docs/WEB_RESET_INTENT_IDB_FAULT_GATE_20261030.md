# Candidate authenticated reset-intent boundary — 2026-10-30

**RESEARCH / TEST ONLY — #4, #29, #35.** Active product is WEB 18.64. This note describes a **synthetic pending-intent marker**, not a shipped reset, recovery, UI, or proof of user consent. No production bundle, backup format, formulas, iOS, or user data were changed.

## Why a reset boundary is necessary

Real archived WEB 18.27, 18.33, and 18.34 tabs can recreate authenticated v1 ciphertext after a complete reset. A valid experimental v2 IndexedDB operation witness proves that its own transaction committed, **not** that a later reset permits reopening the ledger. Treating missing v1 bytes as permission to reopen v2 can resurrect intentionally deleted financial data; deleting v2 whenever v1 is missing can destroy the only remaining authenticated copy after a partial reset.

## Candidate protocol and limitations

A possible future reset protocol would require a distinct user-confirmed reset operation ID and cryptographically bound reset epoch, recording the intended transition in the same IndexedDB transaction as a new authority revision and operation witness. In the **current experiment**, the v2 state carries a synthetic `resetIntent: {schema:1, phase:'pending', epoch, sourceRevision}` object encrypted by the existing AES-GCM v2 authority and committed by the existing compare-and-swap transaction. This is **not** a user confirmation mechanism or production schema.

The test intentionally **does not delete the legacy v1 KEY/PAYLOAD**, change the v1 reset marker, or modify the encrypted portable backup. Even an authenticated pending marker cannot order old cached v1 writes or establish global recency. An actual implementation must separately specify how an explicit confirmation is recorded, what counts as a completed reset, which keys may be removed, when the UI blocks writes, and how users can safely export or choose among copies. A whole-origin rollback can restore internally valid old authority and witness together; no same-origin local-only marker can rule that out.

## Test matrix / acceptance evidence

Run `node tests/browser-v2-restore-operation-witness-research.cjs` in disposable Chromium with synthetic financial data and inspect these named PASS results:

| Scenario | Expected outcome | Explicit non-claim |
| --- | --- | --- |
| IDB abort before first put | old v2 authority/witness unchanged; v1 ciphertext untouched; after reload acknowledgment of pending intent is `verified_unchanged` | no reset occurred |
| IDB abort after staged puts | same unchanged v2/v1 evidence after reload; no stranded witness | transaction staging is not a commit |
| IndexedDB `open()` throws synthetic `SecurityError` | pending intent cannot commit; old authority and legacy ciphertext remain byte-for-byte unchanged | not real browser eviction |
| IDB transaction commits, then caller throws | after reload the exact pending operation can be authenticated by its witness; v1 is still preserved | marker does not authorize deletion or automatic recovery |
| late legacy write after pending marker | classifier flags authenticated divergence and leaves both copies intact | **KNOWN UNSAFE**: old v1 writer is not fenced by v2 |

**Gate:** inspect exact candidate CI and Chromium job logs before describing any row as verified. Passing tests here characterizes an experimental adapter, not a safe production reset. Do not silently retry, replay, merge, delete, rekey, choose a ledger, or claim freshest data.

## Proposed no-write recovery UX (design only)

For an ambiguous reset or inaccessible storage, present a neutral heading such as **„Nu putem confirma starea datelor”**, a short factual explanation that the operation may or may not have completed, and clearly separated non-destructive actions: **„Verifică din nou”** (read-only inspection), **„Salvează copii pentru verificare”** (only after specifying a safe, consented export contract), and **„Închide”**. Never label an older valid copy as „cea mai recentă”, never automatically repopulate the ledger after reset, and never make deletion the default or only path. For VoiceOver, announce the status, preserve focus after inspection, avoid color-only warnings, and expose each action with an unambiguous accessible name. This is proposed copy, not a tested screen.

## Alternatives / decision record

1. **Automatically restore v2 when v1 is missing:** reject; can undo intentional reset.
2. **Automatically delete v2 on any v1 reset:** reject; can destroy sole surviving authenticated copy after partial failure.
3. **Write a plain localStorage reset flag only:** reject as sole authority; independent write/rollback and cached v1 clients ignore it.
4. **Authenticated v2 reset-intent epoch + no-write quarantine:** preferred *research direction*; requires user-intent contract, explicit confirmation and completion semantics, version compatibility, accessibility tests, and browser fault coverage before production.
5. **Server-signed anti-rollback authority:** conflicts with strict local-only/no backend; not proposed.

## Next exact steps

1. Check candidate Release CI and Chromium, including all three named new PASS lines; independently check merged-main gates.
2. Design a complete state machine: idle → confirmed intent → pending → committed reset / uncertain, with idempotent acknowledgment and a safe handling rule for v1 cached tabs. Document what is and is not recoverable.
3. Test simultaneous reset vs writer, IndexedDB `QuotaExceededError`, browser restart, real storage denial, and explicit local site-data deletion; do not equate synthetic faults with browser eviction.
4. Verify an actual iPhone Safari/VoiceOver flow and no-write recovery UI before any product integration. Preserve immutable WEB release rules and do not change issue #14 formulas or modes without approved numeric contract.

References: [archived post-reset writer characterization](WEB_ARCHIVED_POST_RESET_CACHED_WRITER_20261030.md); [atomic witness research](WEB_ATOMIC_RESTORE_OPERATION_WITNESS_RESEARCH_20261030.md); [MDN IDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction); [MDN storage eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
