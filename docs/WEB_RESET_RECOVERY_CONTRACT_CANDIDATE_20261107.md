# WEB 18.74 — reset recovery state contract candidate (2026-11-07, research only)

Status: **DESIGN / NOT APPROVED / NOT IMPLEMENTED**. Issue #29. Source: immutable active `_expo/static/js/web/index-v01874-dashboard-arrange-target-20261103.js`, blob `60c8e9ba93127514299be6be14b1edd932150b54`. HEAD before analysis: `44808199b1ed96643ee83b1acfa3aa5316366c54`.

## Verified source facts (static)
- `faBeginCommittedReset` writes and reads back `pending-v2:<epoch>`, then invokes `faFinishCommittedReset`.
- `faFinishCommittedReset` removes PAYLOAD **before** KEY, then writes `idle-v2:<same epoch>`. Each operation is separate localStorage I/O; the marker is an intent record, **not an atomic multi-key commit**.
- The `committed-v1` legacy path upgrades to pending before deletion. `faAssertCurrentVault` blocks writes for non-idle markers. A pending marker alone does not prove the key/payload pair is recoverable.
- Earlier isolated V8 fault injections characterized four boundaries, not browser reload or a safety proof. See issue #29 history and `tests/research-v1874-reset-{three-faults,idle-marker-fault}.cjs`.

## Recovery matrix: distinguish state, not just marker
| Marker | PAYLOAD | KEY | Interpretation | Safe default on load |
| --- | --- | --- | --- | --- |
| absent | present | present | pre-reset or existing vault | normal authenticated vault load only |
| absent | present | absent | inconsistent vault | read-only, no auto-delete |
| absent | absent | present | orphan key | read-only, no auto-delete |
| pending | present | present | reset intent, deletion not completed | **read-only, no automatic retry** pending contract decision |
| pending | absent | present | partial destructive reset; ciphertext already missing | **read-only, no automatic retry**; do not promise restoration |
| pending | present | absent | unexpected ordering / external mutation | read-only, no automatic retry |
| pending | absent | absent | both removed, final marker write interrupted | read-only pending explicit finalize decision |
| idle | absent | absent | reset completed according to marker | empty vault; preserve epoch for stale-tab protection |
| idle | any present | any | inconsistent / potentially stale writes | read-only conflict; never silently resurrect |
| malformed / legacy | any | any | unknown migration state | read-only until explicit migration path validated |

“Read-only” means disable writes, reset retries, and initialization of a new real vault on the ambiguous origin; show factual status and preserve remaining bytes. It does **not** mean the original encrypted ledger is recoverable. No automatic marker cleanup on reload.

## Alternatives and tradeoffs
1. **Freeze on ambiguity + explicit user action** (minimal safety intervention): prevents *additional* automatic deletion after an error but cannot restore PAYLOAD already removed. Requires clear distinction between “reset requested”, “reset completed”, and “cannot verify”; user may need a prior encrypted backup.
2. **Single-record encrypted vault envelope** (stronger long-term design): atomic individual key replacement/deletion, but requires a staged, versioned migration from two-key storage, authenticated data, rollback and legacy-tab fences. A single localStorage operation is not a general durability guarantee.
3. **Durable recovery journal containing encrypted envelope**: stage encrypted recoverable bytes before deletion, verify writes and enforce explicit commit/finalize semantics. Extra local encrypted copies increase retention/privacy complexity; do not resurrect after confirmed erase.
4. **Current auto-finish after reload**: simplest operationally, but may delete the remaining KEY after PAYLOAD loss without an explicit new decision. Not acceptable as evidence of failure-safe recovery.

**Recommended sequence (proposal only):** first establish an explicit reset lifecycle contract and conservative ambiguity UI, then prototype a single-record envelope with safe migration in synthetic storage. Do not deploy a partial change that merely swaps deletion order or catches exceptions; neither makes two-key deletion atomic.

## Acceptance fixtures before any release
- Inject read/set/remove failures at every step, including nonthrowing failed write (read-back mismatch), malformed marker and key/payload corruption.
- Reload from each row above; assert no destructive I/O occurs automatically for ambiguous states.
- Two tabs: stale tab from before reset cannot save, start a new vault or replay stale payload after reset; test legacy tab and Web Locks unavailable.
- Repeated reset, concurrent reset, crash between each operation, legacy `committed-v1`, new vault after verified completion, and backup restore behavior.
- Use disposable origin, synthetic values, isolated browser profiles. Verify exact source checks, CI, immutable bundle, metadata/diagnostic sync, deployment and browser before any PASS.
- Distinguish **characterization PASS** from **recovery safety PASS** in reports.

## Open contract decisions (not user-approved)
- Should an interrupted user-confirmed reset automatically finish on next launch, or require an explicit second confirmation when ambiguity exists?
- What should UI say when payload has already been deleted and no recoverable encrypted copy exists? Do not imply undo.
- What constitutes durable completion and when may a fresh real vault be created?
- Is retaining an encrypted recovery journal during reset compatible with the expected deletion/privacy promise, and when must it be purged?

No product, iOS, financial formula, real vault, or encrypted backup changes in this document.
