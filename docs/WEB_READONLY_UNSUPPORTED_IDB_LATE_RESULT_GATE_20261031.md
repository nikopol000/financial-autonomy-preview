# WEB read-only quarantine: unsupported IndexedDB enumeration and late results (2026-10-31)

## Scope and evidence
This is an **isolated synthetic Chromium research harness**, `tests/browser-v2-conflict-readonly-ui-research.cjs`, not a production vault, reset, restore, migration, backup, or user-facing release. The active WEB bundle remains 18.64. The fixture uses a test-only AES-GCM key and disposable browser contexts. No real financial data are opened or modified.

The current inspector uses `indexedDB.databases()` to check for an existing authority DB, then `indexedDB.open()` with `onupgradeneeded` aborted. This avoids silently creating a ghost DB when a previously enumerated database disappears before opening it. Some browsers may not support `databases()`, or the API may be denied. Missing Web Locks is also relevant to the **writer** contract: a localStorage compare-then-write sequence cannot atomically serialize noncooperating tabs.

## Two bounded tests

1. **No IDB enumeration and no Web Locks:** seed a synthetic authenticated authority; remove `indexedDB.databases` and `navigator.locks` from the test context; run read-only inspection. Required: `STORAGE_UNREADABLE`, no editable inputs, zero localStorage set/remove and zero IDB readwrite transactions. Restore APIs, reload, and verify exact localStorage/IDB bytes. A blocked result is not proof that the vault is empty.
2. **Late result after inspection timeout:** delay `indexedDB.databases()` until the first inspection reaches its test-only 800 ms timeout. Run a second inspection successfully and keep it blocked as `UNAPPROVED_AUTHORITY`; then resolve the old request. Required: the stale result cannot replace the newer screen, cannot unlock, and cannot modify synthetic bytes. A timeout does **not** cancel the underlying browser operation.

## Production decision matrix (NOT approved for shipping)

| Observed condition | Safe read-only action | Forbidden inference/action |
| --- | --- | --- |
| `indexedDB.databases` absent | Show unsupported/unverifiable storage; block mutations | Do not call unguarded `open()` to guess existence; do not initialize empty DB |
| Enumeration denied or stalled | Show neutral storage-unreadable status and retry affordance | Do not assume missing data or automatically reset |
| Enumeration/open race | Abort `upgradeneeded`, close any read handle | Do not create an empty authority database |
| Web Locks absent | Keep real-vault mutation path blocked pending a reviewed concurrency contract | Do not rely on compare-then-write as atomic |
| Old inspection completes after newer | Ignore its UI result using a monotonically increasing inspection epoch | Do not replace a newer warning with stale evidence |
| Old cached tab writes after reset intent | Preserve evidence and block until explicit reviewed resolution | Do not silently select, merge, replay, rekey, resurrect or delete |
| Full-origin storage rollback/eviction | Unknown authority; preserve remaining evidence | Do not treat a locally valid snapshot as proof of freshness |

### Options considered
- **A. Fail closed on unsupported enumeration (research baseline).** Preserves evidence, but leaves affected browsers without a recovery route; accessibility and support copy are important.
- **B. Add a non-creating, browser-supported inspection path.** Requires verified platform capability and cross-browser test evidence; `indexedDB.open()` alone is unsafe because it may create a database.
- **C. Auto-initialize/recover when enumeration is unavailable.** Rejected: missing capability is not evidence of absent ledger or consent.
- **D. Move to a transactional authority envelope.** Potential long-term path, but legacy v1 writers, backup compatibility, migration rollback and intentional reset semantics require a separate authenticated contract.

## Acceptance gates before any production integration
Test real archived v1 writers, browsers without Web Locks, IndexedDB permission/eviction faults, full-origin rollback, cross-tab revisions, late Promise completion, reset consent, backup interoperability, and exact-byte preservation. Verify Chrome and actual Safari/iPhone with VoiceOver/Dynamic Type; Chromium CSS zoom is not Safari evidence. Define an explicit authenticated reset/restore consent protocol and a way to preserve the last recoverable encrypted copy. Only then consider immutable WEB version bump with synchronized index/bundle/diagnostic, CI, Vercel and served-browser checks.

**Not an accounting contract:** issue #14 budget perspectives and #25 overpayment remain analysis-only. No formulas or financial semantics changed.

## Platform references (consulted 2026-10-31)
- MDN [`IDBFactory.databases()`](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases): enumeration returns a snapshot, with newer baseline support; do not assume availability on every older browser.
- MDN [`IDBFactory.open()`](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open): opening may trigger `upgradeneeded`; it is not a side-effect-free existence test.
- MDN [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API): origin-scoped coordination for participating contexts, not a transactional guarantee across independent storage APIs or noncooperating archived code.
