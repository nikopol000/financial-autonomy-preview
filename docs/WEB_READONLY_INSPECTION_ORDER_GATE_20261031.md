# Read-only inspection ordering under a cached legacy writer — 2026-10-31

**Scope:** isolated Chromium research UI only, related to #4, #29, #35 and #85. Starting main `dd72c70a4ab939800c4041bcf9aef6cb5bb71a32`, active product WEB 18.64. This change does **not** ship a recovery mechanism.

## Race and evidence

The existing synthetic blocked-vault screen allowed overlapping asynchronous `render()` calls. Each `inspect()` captures a v1 key/payload pair **before** awaiting IndexedDB. A delayed older read can therefore legitimately classify `UNAPPROVED_AUTHORITY` using its earlier v1 snapshot, even after another same-origin tab modifies v1 and a newer inspection correctly classifies `LEGACY_DIVERGED`. Without ordering, the older response can overwrite the newer blocked UI, hiding the currently observed conflict. Both classifications block writes, but displaying stale evidence is misleading.

The test `tests/browser-v2-conflict-readonly-ui-research.cjs` now pauses the first `indexedDB.databases()` response, makes a separate real Chromium tab change a synthetic v1 payload, completes a second inspection, then releases the first. The isolated screen uses a monotonically increasing **in-memory render epoch**: only the most recently initiated render can update the DOM. The old caller may receive its old result, but may not render it. The test asserts the visible `LEGACY_DIVERGED` heading, no editable inputs, exact synthetic v1/IDB bytes unchanged after both inspections, and the same blocked result after reload.

## Alternatives considered

1. **Allow completion order to control the UI:** rejected; an old observation can replace a newer conflict.
2. **Queue all inspections:** simple but a hung IndexedDB read could block an explicit retry indefinitely.
3. **Abort older requests:** not reliably available for IndexedDB read-only transactions and could add browser-specific complexity.
4. **Latest-started inspection wins in the isolated UI:** chosen for test characterization. It prevents stale DOM replacement, but **does not prove current storage freshness**, prevent cached legacy writes, or make inspection atomic.

## Remaining production contract

Before any actual WEB vault integration, specify an explicit consented reset authority and safe fencing or permanent read-only handling for old tabs; do not trust a single authenticated marker to prove global deletion or latest state. Require a second consistency check or equivalent atomic protocol before enabling writes, including Web Locks unsupported/denied, IndexedDB unavailable, browser storage eviction and full-origin rollback. No automatic ledger selection, deletion, rekey, merge, replay, resurrection or silent unlock.

The UI must keep neutral nonjudgmental copy, keyboard focus, usable reinspection and screen-reader announcements. Chromium 320/390 light/dark CSS zoom tests are **not** Safari iPhone/Dynamic Type/VoiceOver evidence. No user financial data or backups are accessed.

## Verification plan

Check exact PR-head Release CI and Chromium, inspect named `PASS isolated read-only quarantine: overlapping inspections` line, then merge only after green. Verify independent merged-main gates and update continuity files/issues with real SHAs. No version bump for research-only tests/docs; no changes to index, immutable product bundle, diagnostic, financial formulas, backup format, iOS or architecture.
