# Synthetic reset finalization boundary — 2026-10-30

**RESEARCH / TEST ONLY** for #4, #29 and #35. No production reset protocol, UI, financial data, backup, formula, iOS or WEB release change.

## Test and scope

`tests/browser-v2-restore-operation-witness-research.cjs` now runs nine new Chromium scenarios (actual archived WEB 18.27/18.33/18.34 AES-GCM modules × three fault/order cases). Every run uses an isolated disposable browser context and synthetic ledger. It first migrates a v1 ciphertext into the experimental IDB v2 authority, then commits synthetic `confirmed` and `pending` authenticated reset markers. **The `confirmed` marker is fixture data, not evidence of a user pressing a confirmation button.**

| Scenario | Expected result (characterization, not mitigation) |
| --- | --- |
| Archived legacy reset deletes PAYLOAD but KEY deletion throws `SecurityError` | Orphan KEY remains, IDB pending witness still authenticates, read-only v1/v2 classification is **unknown**. No completion witness or automatic repair. |
| Archived legacy reset deletes both keys, then IDB `committed` write aborts after staging | v1 absent, IDB still **pending** after reload; completed acknowledgment is **unknown**. No automatic v2 resurrection or replay. |
| IDB `committed` witness is written before legacy retirement, then archived tab saves a transaction | Archived v1 save succeeds, authenticated v1 diverges from IDB, despite valid v2 committed witness. **KNOWN UNSAFE**: IDB marker is not proof of completed global deletion. |

Assertions check exact IDB witness before/after reload, legacy footprint immutability during read-only classification, no false `committed` acknowledgment after abort, and actual legacy AES-GCM save/decrypt. Tests are intentionally written to **pass when unsafe behavior is correctly detected**.

## Decision and alternatives

- **Read-only quarantine (current safe research choice):** preserve both stores and any orphan evidence; report `unknown` for ambiguous partial reset. No automatic replay, deletion, merge, rekey, restore or winner selection.
- **Single atomic IDB authority for cooperative clients:** reduces split-write risk but does not prevent cached v1 JavaScript from writing localStorage. Needs a version cutover policy, recovery UX and old-tab evidence preservation.
- **Two-phase reset with durable intent and explicit legacy retirement:** still has a non-atomic cross-store gap. Cannot mark deletion complete based solely on an IDB witness; verify old-client boundary and every fault before any production integration.
- **Advisory tab refresh/close broadcast:** useful UX but cannot guarantee offline/background old tabs comply.

AES-GCM proves authenticity of stored bytes, not newest state. Whole-origin rollback remains undetectable without an independent trusted monotonic anchor. Local-only requirements prohibit quietly introducing a backend.

## UX gate

If any storage state is ambiguous, the future UI should disable financial writes and say neutrally: **„Nu putem confirma că resetarea s-a încheiat. Datele disponibile nu au fost modificate. Poți păstra o copie criptată pentru verificare.”** This is proposed microcopy only; it is **not** deployed or user-tested. It must not promise recoverability if the payload is missing.

## Verification and next action

Candidate CI, exact commit and merge/deploy outcomes must be added **only after checking actual GitHub Actions**. No new WEB version is warranted for tests/docs only. Next: test crash/reload between deletion and completion, IDB denial before and after transaction commit, concurrent late v1 save after partial reset, and browser/Safari accessibility. #14 remains DISCOVERY ONLY; no budget formula or modes until an explicitly approved numeric contract.
