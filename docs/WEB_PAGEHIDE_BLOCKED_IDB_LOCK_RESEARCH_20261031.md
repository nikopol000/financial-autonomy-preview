# Pagehide/reload with blocked IndexedDB and queued Web Lock — 2026-10-31

**Status: research-only Chromium fixture, not production recovery.** Related open issues #4, #29, #35; WEB 18.66 unchanged.

## Reproduction and assertions

`tests/browser-consent-pagehide-reload-research.cjs` starts a disposable localhost secure-context Chromium origin, two tabs and synthetic localStorage KEY/PAYLOAD/RESET strings. It does **not** use the user's vault, a real backup, a production destructive action or an approved recovery protocol. The separate `browser-authenticated-consent-legacy-writer-research.cjs` already tests real WEB PBKDF2/AES-GCM and an archived 18.33 writer.

1. Old tab opens a real IndexedDB v1 connection and commits a synthetic sentinel. Second tab requests v2; the browser emits `blocked`. Second tab reloads while the old connection is still open, with a `pagehide` marker. After the old connection closes, a fresh read must observe v1 and the original sentinel. A delayed v2 upgrade callback is programmed to abort; no schema promotion is authorized.
2. Old tab holds an actual exclusive Web Lock; second tab queues a request with `AbortController`. After confirming the queue via `navigator.locks.query()`, second tab reloads. Its `pagehide` listener aborts the request. Once the old tab releases, the queued callback must never write even a test-only marker.
3. Before and after each case, exact synthetic KEY/PAYLOAD/RESET values must match. Only the fixture seeds those values; the inspected recovery code has **no** destructive path. The test explicitly logs the existing **KNOWN UNSAFE** noncooperating legacy writer boundary.

## Interpretation and alternatives

- **Reject:** treat a pagehide, aborted queued lock or timed-out IDB open as proof that the vault is safe to replace.
- **Reject:** assume Web Locks fence archived v1 tabs. Existing real Chromium negative proof shows old writers can bypass modern locks after final reinspection.
- **Research recommendation:** fail closed on navigation/cancel/timeout; make pending operations visibly retryable without overwriting encrypted evidence. Any future operation-specific commit must have an independently justified crash-safe authority, stale-writer fence and user-approved consequences.

This test cannot prove Safari/iPhone page lifecycle, browser-process crashes, persistent storage durability, cross-device rollback freshness or any safe destructive reset/restore. It also cannot distinguish a legitimately missing vault from an evicted/deleted encrypted payload. No auto-repair, replay, merge, rekey, deletion or migration is authorized.

## Verification

CI is the source of truth. Record exact PR/merged-main Chromium and release workflow results after they reach terminal state; do not interpret an unrun test as passing. The next unverified P1 is renderer/browser crash during queued/blocked operations, followed by real Safari/VoiceOver and an accessible blocked/cancel/retry interaction review.

## Primary references and verified outcome

- [MDN — Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB): an open connection in another tab blocks a version upgrade; the application must account for `blocked` and `versionchange`.
- [MDN — Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API): same-origin lock coordination, `AbortSignal` for queued requests, and `navigator.locks.query()` diagnostics.
- [W3C — Indexed Database API 3.0](https://www.w3.org/TR/IndexedDB/): upgrade requires other clients to close their database connections.

[PR #369](https://github.com/nikopol000/financial-autonomy-preview/pull/369) merged as `0d60a5ba8b8a51f55bd8b30c3c0ec15c2fdc279e`. [PR Chromium #41232091077](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41232091077), [PR Release #41232091176](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41232091176), [merged Chromium #41232294387](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41232294387), [merged Release #41232294349](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41232294349) and [merged Pages #41232294347](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41232294347) all **SUCCESS**. Both named Chromium lifecycle assertions passed. This is evidence for these specific Chromium cases, not Safari, user-data durability or destructive recovery safety.
