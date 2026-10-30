# WEB reset tab-close/reopen boundary — 2026-10-30

**Scope:** research/test only for [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35). No product integration, release bump, data deletion, financial formula, iOS or backup-format change.

## Reproducible synthetic experiment

`tests/browser-v2-restore-operation-witness-research.cjs` includes `testArchivedResetReloadGap`: actual immutable WEB 18.27, 18.33 and 18.34 Metro v1 AES-GCM modules run in isolated Chromium contexts with fictitious transactions. Each version is exercised against:

1. **Complete legacy deletion, before v2 completion:** v1 KEY and PAYLOAD are absent; v2 retains an authenticated **pending**, not committed, reset-intent witness. Close both tabs and open a new tab on the same disposable origin.
2. **Interrupted legacy deletion, followed by cached legacy save:** inject `SecurityError` on v1 KEY removal after PAYLOAD deletion; keep cached archived tab alive for a late save, then close both tabs and reopen. The historical versions have different post-reset save guards; tests characterize, not fix, their behavior.

The reopened tab checks: v2 pending authority and witness unchanged; no authenticated completed operation; no false `legacy_matches_snapshot` for deleted/replaced v1; exact v1 bytes unchanged during read-only inspection; no automatic rekey, merge, replay, deletion, restore or authority promotion. **Passing a characterization test means unsafe behavior was reproduced/contained in the test assertions, not that the product is safe.**

**Important limitation:** closing and reopening tabs is *not* killing a browser process, real OS power loss, storage eviction or a Safari test. The synthetic `resetIntent` is *not* proof of an actual user confirmation. The v2 witness authenticates its own record, not the global deletion state. A full-origin rollback can restore an older self-consistent state.

## Candidate no-write UX state contract (not implemented)

| Evidence after reopening | Proposed display state | Permitted automatic action |
| --- | --- | --- |
| v2 pending authenticated; v1 absent | “Resetarea nu poate fi confirmată” | Read-only inspection only |
| v2 pending authenticated; v1 KEY only | “Date incomplete; cheia este păstrată” | Read-only inspection only |
| v2 pending authenticated; v1 ciphertext diverges | “Au fost găsite versiuni diferite ale datelor” | Read-only inspection only |
| v2 committed authenticated but archived v1 writes exist | “Există un conflict după resetare” | Read-only inspection only |
| IDB denied/missing/evicted or operation witness missing | “Starea salvării nu poate fi verificată” | Read-only inspection only |

The interface must not say “resetare finalizată”, “date recuperate”, “ultima versiune” or “poți continua în siguranță” on the above evidence alone. Do not infer that a missing PAYLOAD can be reconstructed from an orphan KEY. Do not silently initialize an empty ledger.

**Microcopy proposal, subject to mobile accessibility review:** “Nu putem confirma starea datelor după întrerupere. Nu am modificat nimic. Închide celelalte file ale aplicației înainte de o verificare nouă.” Do not promise that closing tabs repairs an already divergent ledger.

## Alternatives and decision

- **Current recommendation:** preserve all available evidence and block financial writes in ambiguous states. Offer a *future* explicit read-only explanation, not a destructive recovery shortcut.
- **Cooperative IDB authority with revision/epoch fencing:** useful for newer tabs; cached v1 JavaScript still writes localStorage independently.
- **BroadcastChannel / storage event close-tab hint:** improves communication but cannot enforce cooperation by old/background/offline clients.
- **Two-phase reset across localStorage and IDB:** cannot make cross-store retirement atomic. A v2 “committed” marker by itself is not a global deletion proof.
- **External monotonic anchor:** could detect whole-origin rollback, but contradicts current local-only/no-backend requirement; not proposed.

## Verification gate

The new test is part of the existing Chromium workflow. Record the exact commit, run IDs and individual PASS lines only after checking CI. Then update `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md` and the critical issues. Next P1: simulate denial at the IDB completion boundary *after* v1 retirement, distinguish pre-commit abort from post-commit exception, and inspect the reopened state without writes. Browser-process crash, Safari iPhone/VoiceOver, real storage eviction and public-preview interactive validation remain unverified. Issue #14 remains DISCOVERY ONLY.
