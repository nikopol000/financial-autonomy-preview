# WEB IDB completion fault after archived v1 retirement — 2026-10-30

**Scope:** test/research only for [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29) and [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35). No production migration/reset, user data, WEB bundle/index/diagnostic, version bump, financial formula, backup format or iOS change.

## Boundary under test

The previous [tab-reopen matrix](WEB_RESET_RELOAD_GAP_GATE_20261030.md) closed/reopened after actual archived WEB 18.27/18.33/18.34 `resetData()`, with a synthetic authenticated v2 **pending** reset intent. The next failure window is *after* v1 KEY/PAYLOAD retirement but *before, during or immediately after* the separate v2 IDB completion transaction.

`tests/browser-v2-restore-operation-witness-research.cjs` adds `testIdbCompletionFaultAfterLegacyRetirement`: **3 actual archived v1 modules × 4 isolated fault cases = 12 named Chromium characterizations**, all on disposable synthetic records. For each case, it creates a valid v1 AES-GCM vault using the archived module, migrates to a test-only IDB v2 witness, commits a synthetic `pending` reset marker, calls the archived `resetData()`, then injects one completion failure. Both tabs are closed and a fresh tab reopens the same isolated origin.

| Fault at v2 completion | Expected v2 state after reopen | v1 after reopen | Interpretation |
| --- | --- | --- | --- |
| `before-put` transaction abort | Authenticated **pending**, no completion witness | Both v1 keys absent | Completion not proven; **unknown** global reset |
| `after-put` transaction abort | Authenticated **pending**, no completion witness | Both v1 keys absent | No torn IDB completion, but cross-store gap persists |
| `SecurityError` on IDB open | Authenticated **pending**, no completion witness | Both v1 keys absent | No silent fallback or inferred completion |
| `throw-after-complete` | Authenticated v2 **committed** marker + witness | Both v1 keys absent | **Only** the IDB operation is authenticated; not proof of global reset |

Read-only conflict inspection must return `unknown` for the missing v1 pair, preserve the exact v2 authority/witness and never resurrect, replay, delete, rekey, merge, promote or silently initialize a ledger. A passing test is a **characterization**, not evidence that a production reset is safe.

**Limits:** this closes/reopens tabs, not a browser-process crash, power loss, actual quota exhaustion, real browser storage eviction or Safari iPhone. The synthetic `resetIntent` does not demonstrate user confirmation. A cached old v1 writer can still recreate v1 after a successful v2 completion marker. Full-origin rollback can restore an older authenticated state. No local-only witness proves global newest state.

## Alternatives and recommendation

1. **Fail closed on ambiguous reset boundaries (recommended pending contract review):** preserve evidence, stop financial writes, and offer an explicit *read-only* explanation and manual export of non-sensitive diagnostic status. No automatic recovery.
2. **Cooperative v2 revision/epoch fencing:** protects only upgraded tabs, not archived v1 code still running in an open tab.
3. **Best-effort retry of completion:** unsafe by default after an unknown commit outcome; must first authenticate the operation-specific witness and avoid reusing the operation ID blindly.
4. **LocalStorage reset journal or BroadcastChannel coordination:** cannot make localStorage and IDB atomic and cannot force non-cooperating cached tabs to stop.
5. **External monotonic freshness anchor:** outside the user-approved local-only/no-backend architecture; not proposed.

## Candidate no-write mobile UX (not implemented)

Title: **„Nu putem confirma resetarea”**. Body: **„Datele salvate sunt într-o stare neclară. Nu am făcut nicio modificare automată. Închide celelalte file ale aplicației înainte de o nouă verificare.”** Status labels must distinguish **„În așteptare”**, **„Confirmare imposibilă”** and **„Conflict între versiuni”** without suggesting that an authenticated v2 `committed` witness alone means global success.

Acceptance for a later UI: the status must be visible without color alone, readable with enlarged text at 320/390 CSS px in light/dark, have a 44×44 minimum touch target for any disclosure, and be announced as an alert/status by assistive technology. Do not hide safety text behind a collapsed control; never present „Continuă” as safe when writes are blocked. This is a proposal, **not** an actual iPhone/Safari/VoiceOver verification. See [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85).

## Verification and next step

The exact test commit and Chromium/Release CI PASS lines must be inspected before reporting verified results or updating checkpoints. If a case fails, fix only the test or research model, never weaken the expected safety classification to manufacture green CI. Then update `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md` and the three critical issues with exact run links.

**First unfinished P1 after this gate:** test the same boundary with an archived cached v1 writer *after* a v2 completion witness and across reload; characterize a real browser-process kill / actual storage-denial scenario where feasible. Specify a reviewable no-write recovery contract before any product release. #14 budget perspectives remain DISCOVERY ONLY, without formulas or modes.
