# WEB 18.64 — IndexedDB restore-operation witness concurrency gate (2026-10-30)

**Scope:** research-only, disposable Chromium origin and synthetic financial state. No production storage migration, UI, bundle, version, formulas, user data, backup format or iOS changes. Extends the six-case [atomic operation-witness prototype](WEB_ATOMIC_RESTORE_OPERATION_WITNESS_RESEARCH_20261030.md) and addresses P1 issues #4, #29 and #35.

## Question

The earlier experiment proved stale sequential writes and duplicate operation IDs were rejected. It did **not** prove what happens when two tabs attempt to commit at the same revision concurrently. An async WebCrypto preflight alone is not an atomic compare-and-swap.

## New browser scenarios

1. Two tabs concurrently prepare **different operation IDs**, both expecting revision 3. The IndexedDB readwrite transaction must serialize the final authority comparison and witness insertion. Exactly one commit succeeds; its authenticated witness matches the final vault and revision 4. The losing operation is **unknown**, not implicitly retried.
2. Two tabs concurrently reuse **one operation ID**, both expecting revision 4 but supplying different synthetic states. Exactly one commit succeeds, the final revision is 5, the winner's state authenticates and the loser's state does not. The witness must not attest two different states.
3. Delete the winner's witness **in the disposable test origin only** and verify read-only acknowledgment returns **unknown** without repair or deletion. This remains an intentionally corrupted test state.

These are race-characterization tests of the **test-only adapter**. They do not prove the shipped WEB 18.64 localStorage vault is safe, nor guarantee fairness, physical durability, Safari behavior, or resistance to full-origin rollback.

## Design alternatives

- **Async preflight + localStorage compare/write:** unsafe under concurrent tabs without an atomic cross-tab mechanism.
- **IDB transaction with revision-only check:** vulnerable to same-revision authenticated substitution (ABA); compare the full observed authority bytes.
- **IDB transaction with full authority check and witness in the same transaction (tested):** candidate for a safe same-origin atomic commit, but cannot coordinate with cached v1 tabs writing localStorage or attest freshness after whole-origin rollback.
- **Server-backed anti-rollback:** not compatible with local-only architecture.

## Release gate and next step

Run the existing pinned Chromium workflow and release validation on the exact PR head. Inspect named PASS lines; do not claim success from a workflow trigger alone. If green, checkpoint the tested commit and open issues. Next P1 work is the **actual v1→IDB migration/portable-backup compatibility gate**: authenticate existing v1 KEY/PAYLOAD, preserve original bytes during failed/aborted cutover, distinguish KEY-only/corrupt/denied reads, simulate cached v1 late writes, and require explicit user action for ambiguous restore. No production wiring until the migration and rollback contract is tested. Issue #14 budget perspectives and #25/#2 numerical semantics remain discovery-only pending explicit approval.
