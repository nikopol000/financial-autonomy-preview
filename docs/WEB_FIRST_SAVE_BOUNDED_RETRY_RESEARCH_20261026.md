# WEB #35 — bounded same-session first-save retry (isolated research)

**26 October 2026 · WEB 18.50 · NOT SHIPPED · NO automatic orphan-key recovery.**

## Why this experiment exists

Actual active WEB 18.50 module 310 writes KEY, then PAYLOAD on a virgin first save. Module 309 serializes cooperating real-vault writes using the origin-wide Web Lock and rejects stale revisions. If PAYLOAD `setItem` fails after KEY succeeds, a KEY-only footprint remains and both a fresh load and an ordinary same-tab retry fail closed. This is intentional preservation, but the user cannot finish the save even if the quota/permission problem disappears. A KEY-only footprint **after reload** cannot establish whether the missing ciphertext was never written or was removed from an existing ledger.

The existing WEB 18.50 `idle-v2:<generation>` marker records a completed authorized reset. It is distinct from a virgin browser with no marker. The bounded experiment asks whether **only the still-live tab that initiated a post-reset first write** could safely retry the *same encrypted payload* while retaining the same durable reset epoch. It is deliberately **not** a proposed general solution for virgin first saves.

## Candidate proof boundary — only inside the test harness

- Precondition: authenticated origin-local test context, exclusive cooperating-tab Web Lock, validated `idle-v2` marker, no KEY/PAYLOAD. A reset-in-progress, unknown marker or virgin profile is not eligible for this experiment.
- Generate one AES-GCM ciphertext and KEY in memory. Attempt KEY then PAYLOAD; if an API write fails, retain an opaque **same-session** retry handle containing the exact bytes. Do not store the handle, stage, or any new persistent authority.
- Retry only while that handle still exists and only under the same Web Lock. Re-read RESET, KEY and PAYLOAD. Require **exact original reset epoch** and **exact generated KEY**. If PAYLOAD is absent, retry writing the *same ciphertext*; if it already equals the pending ciphertext (nonconforming write-then-throw shim), authenticate and accept it without another write. Any different key, payload, marker or denied read aborts without further mutation.
- After a confirmed authenticated commit, discard the handle. After tab reload, the handle is gone and KEY-only remains quarantined. **No auto-cleanup, no new key, no silent reset, no backup changes.**

## Synthetic contract evidence and limitations

`tests/vault-first-save-bounded-retry-prototype.cjs` has eight named Node test groups covering post-reset quota recovery, KEY-write denial, nonconforming PAYLOAD write-then-throw, external KEY/PAYLOAD change, reset-epoch rotation/pending reset, denied read, reload/no in-memory proof, and virgin/unknown-marker refusal. It uses **synthetic Node AES-GCM**, a simulated origin-wide lock and a disposable in-memory storage. It is **not imported by WEB**, is not a test of the active bundled AES module, and is not browser/Safari evidence. Its CI result must be checked independently.

**Remaining blockers before any product integration:** actual Metro 309/310 integration and error presentation; interleavings with cached pre-v18.49 clients; page termination during first save; storage quota and readback exceptions; Web Locks support; cross-tab/old-tab reset semantics; real browser/physical durability; user-visible distinction between "saved" and "not saved". An epoch does not protect against arbitrary storage tampering or a noncooperating legacy client. This experiment does not make a two-key write atomic and does not repair pre-existing orphan keys.

## Decision

**RESEARCH ONLY.** Keep #35 OPEN. Retain WEB 18.50 fail-closed behavior until an implementation can demonstrate zero data loss, no reset resurrection, and no dual authority with actual cached tabs. The safer interim path for an existing orphan is preserve original storage, retry access when possible, and use a previously valid encrypted backup in a separate clean browser profile with explicit user action; never promise that a KEY alone reconstructs lost ciphertext.

## Next executable step

Add an actual-bundle, synthetic **same-session retry candidate** without activating it; test every read/write failure and a cached WEB 18.49 tab under the real platform lock. If any conflict cannot be fenced, reject the retry candidate. Revisit virgin first-save format separately; a single-record v2 is not approved and its cached-v1 split-brain/reset hazards remain release blockers. No financial formulas, #14 budget perspectives, iOS, telemetry, backend, bank connections, or real data were changed.
