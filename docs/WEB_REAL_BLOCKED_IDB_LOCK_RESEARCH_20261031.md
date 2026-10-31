# Real browser blocked IDB and queued Web Lock — 2026-10-31

**Status: research-only test candidate; not a production recovery implementation.** Related: #4, #29, #35. Active product stays WEB 18.66. No formula, encrypted backup format, local financial data, iOS, backend or immutable product bundle changes.

## Hypothesis and experiment

The prior 14/14 Node research gate simulated an indefinitely blocked read and a queued lock, but did not exercise browser APIs. This test extends the existing disposable Chromium authenticated-backup/archived-writer fixture in `tests/browser-authenticated-consent-legacy-writer-research.cjs`:

1. An old same-origin tab holds an actual IndexedDB v1 connection. The current tab attempts a v2 upgrade and observes the browser's `blocked` event. A bounded synthetic inspector returns `INSPECTION_TIMEOUT` without accepting authority. After the old tab closes its connection, `onupgradeneeded` deliberately aborts the delayed upgrade. Assert `AbortError`, unchanged database version 1, unchanged encrypted v1 KEY/PAYLOAD/RESET and zero gate writes.
2. An old same-origin tab holds an actual exclusive Web Lock. The current tab queues an exclusive request with `AbortSignal`; separately exercise cancellation and timeout. Abort before releasing the holder, assert `AbortError`, callback never entered and ciphertext unchanged.

These are real Chromium IndexedDB/Web Locks operations, but **the 300 ms IDB deadline and 200 ms lock abort are synthetic research timings**, not approved production UX thresholds. The fixture creates/changes only disposable IndexedDB objects and never writes the actual financial ledger.

## Safety interpretation

A timeout or `AbortError` is a blocked/unknown result, not evidence that the ledger is empty, current or safe to replace. Aborting a queued Web Lock request is possible; an already-running callback needs independent epoch fencing. IndexedDB open requests have no equivalent standard AbortSignal; a delayed upgrade requires its own late-callback handling and connection cleanup. The test does not prove behavior on iPhone Safari, pagehide/crash/reload, storage eviction, browser shutdown or full-origin rollback.

**Critical existing negative finding remains:** cached archived v1 code can modify the encrypted ledger after the final modern read-only recheck, ignoring Web Locks. No destructive reset/restore/migration/rekey/merge/replay/auto-delete may be enabled on the strength of these tests.

## Alternatives and recommendation

- Treat any timeout as implicit consent: **reject** (unsafe).
- Assume a Web Lock fences cached v1 writers: **reject** (proven false).
- Bound read-only inspection, abort queued locks, abort late IDB upgrades, preserve evidence and offer accessible cancel/retry: **research recommendation**, subject to Safari and operation-specific transaction/fence design. This is not an authorization to implement a destructive path.

## Verification and next action

CI status must be recorded after the PR and merged-main Chromium/Release workflows finish; no PASS is claimed by this document before then. Next: test pagehide/reload during blocked read/queued lock, verify actual Safari/VoiceOver and document explicit operation-specific consent. Separately obtain approval for a crash-safe legacy-writer fence before destructive recovery.
