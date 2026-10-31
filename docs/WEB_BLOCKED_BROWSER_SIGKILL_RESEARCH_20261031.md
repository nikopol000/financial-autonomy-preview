# Whole-browser crash while IndexedDB or Web Locks are blocked — 2026-10-31

**Status: research-only, not a production recovery fix.** WEB 18.66 remains unchanged. Issues #4, #29 and #35 remain OPEN.

## Threat model and experiment

The previous [pagehide/reload research](WEB_PAGEHIDE_BLOCKED_IDB_LOCK_RESEARCH_20261031.md) covered ordinary navigation, not process death. This follow-up uses `tests/browser-consent-blocked-browser-sigkill-research.cjs`, a unique temporary Chromium persistent profile, a disposable localhost origin, and only **synthetic** localStorage KEY/PAYLOAD/RESET strings. It does not open the user's origin or decrypt a real backup.

Before each experiment, a v1 IndexedDB database with a `synthetic/sentinel=original` record and three synthetic storage values is seeded, inspected, and **gracefully closed** to establish a flushed baseline. The browser is then relaunched with that same test profile.

1. **Blocked upgrade:** an old tab keeps IndexedDB v1 open while a second tab requests v2. Wait for the actual `onblocked` event, then SIGKILL only the uniquely identified Chromium browser process for the temporary profile. Relaunch and assert v1 schema, sentinel, and exact synthetic storage values. The upgrade callback is programmed to abort if unexpectedly reached; it never has destructive authority.
2. **Queued Web Lock:** an old tab holds an exclusive Web Lock; a second tab queues an exclusive request whose callback would write a test-only marker. Verify `navigator.locks.query().pending`, SIGKILL the test-profile browser, relaunch, and assert no held/pending lock, no callback marker, and unchanged synthetic storage and IndexedDB sentinel.
3. Reload and repeat the read-only inspection. No reset/restore, replay, repair, migration, deletion, or user-data writes are present.

## Interpretation and limits

- This is an **actual whole-browser process kill**, unlike a pagehide/reload or a renderer-only crash. The test uses Linux `/proc` and requires exactly one process with the unique `--user-data-dir` before issuing SIGKILL; it refuses an ambiguous PID.
- A successful test proves only the **specific synthetic, pre-flushed Chromium baseline** and absence of a delayed callback in this fixture. It does **not** prove persistence of unflushed writes, power-loss durability, Safari/iPhone behavior, crash-safe user-data recovery, or protection against an archived writer.
- **Critical unresolved failure:** the archived noncooperating v1 client can still write after a modern locked reinspection. Neither IndexedDB transaction semantics nor Web Locks retroactively fence that client. No destructive operation may be authorized based on these tests.
- Recovery requires a separately approved operation-specific authority, proof that noncooperating legacy writers cannot overwrite committed data, and a contract for partial failures, unknown states, cancellation, evidence preservation, and accessible blocked/retry UX. Origin-wide rollback freshness is not provable solely from origin-local state.

## Sources

- [MDN — IndexedDB using the API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) — version changes and blocked connections.
- [MDN — Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) — cooperative locking and pending requests.
- [W3C Indexed Database API](https://www.w3.org/TR/IndexedDB/) — transaction and version-change semantics.

## Verification checkpoint

**Verified on PR code commit `58eb9a4dd8c3524b5d38c461eb0f415ca27f257f`:** [Chromium #41236704811](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236704811) **SUCCESS**, with both named `PASS whole-browser SIGKILL while blocked-idb` and `PASS whole-browser SIGKILL while queued-lock` in job logs (2026-10-31 20:00 UTC). [Release #41236704805](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236704805) **SUCCESS**. These workflows ran on the code/workflow commit before the documentation-only follow-up. **Merged main** [Chromium #41236957629](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236957629), [Release #41236957638](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236957638), [Pages #41236957666](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236957666) and [Pages build #41236957097](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41236957097) all **SUCCESS** for squash merge `2c114451f187d040fc6163710a15f5fdfd356170`. This confirms test execution, not a production fix. The next unfinished P1 after that is real iPhone Safari/VoiceOver blocked/cancel/retry validation and an independently reviewed, noncooperating-writer-safe authority design. No financial formulas, product bundles, encrypted backup formats, iOS, backend, telemetry or bank connections change.
