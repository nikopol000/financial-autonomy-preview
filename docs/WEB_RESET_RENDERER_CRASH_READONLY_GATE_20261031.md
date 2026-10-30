# WEB reset: Chromium renderer-crash / read-only evidence gate (2026-10-31)

Status: **research only**, synthetic origin, no product migration or recovery implementation. Issues #4, #29, #35. Starting main HEAD: `ba41b4c66673b7a4768a8b3fa89d6837e0ce9fdf` (WEB 18.64).

## Why this test

Previous archived WEB 18.27/18.33/18.34 tests characterized stale cached writers, IndexedDB completion failures, and close/reopen. Closing a tab is not a renderer crash. The new test sends Chromium CDP `Page.crash` to terminate the page renderer after a synthetic reset boundary, opens a new page on the **same disposable browser context**, and performs only read-only inspections. This is **not** a whole-browser kill, browser storage eviction, operating-system crash, durable disk flush or Safari result.

## Scenarios / assertions

| Crash boundary | Legacy v1 state | Synthetic authenticated IDB state | Safe classification |
|---|---|---|---|
| v1 PAYLOAD removed, KEY remains | orphan KEY | pending | unknown / no write |
| v1 PAYLOAD and KEY removed | absent | pending | unknown / no write |
| v2 completion witness exists, archived writer changes v1 PAYLOAD | divergent legacy pair | committed | unknown / no write |

The test uses WebCrypto AES-GCM with a fixed **test-only** key and a digest witness stored transactionally in IndexedDB; it does **not** execute a production v2 migration or establish real user consent. The v1 pair is synthetic text in this specific crash test, **not real archived v1 ciphertext**; actual archived modules are separately covered by the previous six/three-case Chromium tests. Before/after renderer crash and after another reload, the test asserts byte-for-byte equality of v1 and IDB snapshots and `unknown` classification. A green characterization is not a safety fix.

## Alternatives and trade-offs

1. **Automatic recovery / merge**: rejected for now. Missing v1 payload could be an interrupted reset, eviction or deliberate deletion; valid v2 authority may be older than another valid legacy write. Auto-recovery could resurrect intentionally deleted financial data.
2. **Assume completed on IDB witness alone**: rejected. The witness does not fence cached v1 writers, and whole-origin rollback can restore an older authenticated pair.
3. **Read-only quarantine**: preferred *proposal*, pending UX and protocol review. On ambiguous evidence, block financial mutations, preserve both stores, provide a clear neutral status and a safe retry of inspection. Do not label either snapshot “latest”.

Suggested non-judgmental copy for a future separately reviewed interface: **„Nu putem confirma starea datelor.”** Supporting explanation: **„Datele existente nu au fost modificate. Verificarea poate fi reluată, dar nu vom combina sau șterge automat înregistrări.”** This is proposed copy, not implemented. A diagnostic export should exclude financial values by default and require explicit informed action for sensitive content.

## Acceptance still missing

- Run the exact PR Chromium workflow and inspect all three named PASS lines; verify Release CI independently.
- Kill the **whole browser process** in a controlled persistent profile and reopen, rather than treating `Page.crash` as equivalent.
- Characterize actual browser quota/eviction, private browsing, power loss, and Safari iPhone/VoiceOver with real devices when available.
- Specify authenticated reset intent, per-client epoch fencing, no-write conflict UX, and manual user decision semantics before production integration.
- Whole-origin rollback cannot be reliably detected by data and witnesses stored in the same origin; do not promise global freshness without a separate trust anchor.

No financial formulas, user data, backup format, local-only architecture, iOS, or immutable WEB 18.64 product files changed.
