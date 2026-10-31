# Bounded read-only IndexedDB inspection — 2026-10-31

**Research only; not shipped in WEB 18.64.** Related to #4, #29, #35, #85. Baseline main `9767e5f05f8e66bd010ba8e847ddef3a9c4728e3`. All test ledgers and encryption material are synthetic.

## Problem and threat

The isolated read-only blocked-vault inspector awaits `indexedDB.databases()`, `indexedDB.open()` and a readonly transaction. An API that never settles leaves the inspection promise pending indefinitely. A disabled editing UI remains safe, but the user cannot obtain a final status or use the reinspection action. A blocked open, permission prompt, buggy implementation, suspended tab, or test-injected hung API may produce a similar symptom; this experiment **does not claim** any such real-world occurrence.

## Proposed bounded behavior

The **research-only** `inspect()` wraps `raw()` in an 800 ms deadline, returning `{code:'STORAGE_UNREADABLE',blocked:true}` on timeout. This is a bounded UX decision, **not** a storage transaction deadline or cancellation: the original pending IDB request may still exist. The UI must not infer that data is absent, select a newer ledger, unlock editing, initialize an empty DB, delete, replay, rekey, merge, or change a reset marker. The existing `renderEpoch` ensures that late older results cannot replace a more recent status.

The 800 ms duration is a **test fixture**, not a recommended production threshold: a mobile browser under load or assistive technology may require substantially more time. Any product timeout requires device measurements, an explicit retry strategy, and Safari/iPhone acceptance. It should not turn ordinary slowness into an assertion of corruption.

## Deterministic Chromium acceptance

`tests/browser-v2-conflict-readonly-ui-research.cjs` now seeds a disposable valid synthetic v1 pair and authenticated v2 authority. It replaces `indexedDB.databases()` with a never-settling Promise, then requires: (1) the read-only inspection returns `STORAGE_UNREADABLE` within a bounded test interval; (2) the screen remains non-editable; (3) restoring the API and explicitly pressing `Verifică din nou` displays the research-only blocked authority state; (4) all v1 and IDB bytes match the pre-fault snapshot; (5) reload remains blocked and unchanged. The existing ghost-DB, late-writer, overlap, focus, and 320/390px light/dark CSS-zoom tests must continue passing.

## Alternatives

- **Wait forever:** preserves read-only behavior but leaves a stalled UI and no usable status. Not preferred.
- **Timeout and silently initialize:** unsafe; absence, denial and delay are not evidence that the origin is empty. Rejected.
- **Timeout and retry automatically in a loop:** can overwhelm a constrained browser, obscure the cause and create competing asynchronous inspections. Not preferred.
- **Timeout to a neutral blocked state, explicit retry:** preferred **only for isolated research**, with no storage mutations, a bounded screen and a versioned render epoch.

## Unresolved production gates

Before a production change: review all actual WEB v18.64 vault entry points, differentiate first-run onboarding from an ambiguous existing vault, authenticate reset intent, handle cached v1 writers and browsers without Web Locks, ensure no IDB ghost creation, and test storage permission/eviction, browser backgrounding, full-origin rollback, Safari iPhone/VoiceOver and zoom. A read-only inspection cannot establish global freshness or durable reset completion. **#4/#29/#35 remain open.** #14 budget perspectives and #25 card overpayment remain discovery-only pending explicit numeric contract. No iOS, real ledger, backup format, financial formulas, backend, login, analytics or bank sync changes.
