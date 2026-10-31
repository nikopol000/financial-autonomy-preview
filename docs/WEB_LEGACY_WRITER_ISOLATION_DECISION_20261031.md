# WEB 18.66 — legacy-writer isolation decision memo (31 October 2026)

**Status: DISCOVERY ONLY. No production reset/restore, no migration, no new origin, no financial or backup-format change.** Applies to #4, #29, #35. The existing archived 18.33 browser test proves that a cached noncooperating v1 tab can write its legacy localStorage ciphertext **after** a modern Web Lock-protected final inspection. A green test of that counterexample is evidence of risk, not authorization.

## Threat and guarantee boundary

The older JavaScript has already loaded and cannot be retroactively made to request the modern lock or honor a new marker. `localStorage` is shared by same-origin documents; Web Locks coordinate only code that voluntarily requests the same lock. A new read-only check, a localStorage epoch/tombstone, BroadcastChannel message, or service-worker update cannot be assumed to revoke an already-running legacy script's ability to write to the same origin. The current research does not prove an atomic same-origin fence against that writer.

A browser origin is scheme + hostname + port, **not URL path**. A different path, GitHub Pages folder, or versioned JS filename on the same origin is *not* an isolation boundary. An independent HTTPS hostname/origin separates localStorage and IndexedDB from the legacy origin; an old tab cannot directly mutate the new origin's storage through those APIs. This isolates the new ledger but does **not** prevent the user from continuing to enter transactions in the old tab, nor prove the latest state was exported.

## Alternatives and consequences

| Candidate | Can cached v1 still mutate its legacy localStorage? | Can it mutate the proposed new authority directly? | Major limitation |
| --- | --- | --- | --- |
| A. Same-origin Web Lock + final recheck | **Yes** | **Yes** | Already disproved by real archived-writer test; reject as destructive authority. |
| B. Same-origin IndexedDB v2 primary, legacy v1 ignored | **Yes** | Not through the unimplemented v2 API | Two divergent histories can coexist silently; user may lose later v1 edits when switching tabs. Requires explicit cutover and visible conflict policy. |
| C. New independent HTTPS origin + user-controlled encrypted-file handoff | **Yes, old origin remains independent** | **No, through origin-partitioned Web Storage/IDB APIs** | Stronger isolation boundary, but manual export/import, origin-specific retention, backup compatibility, and old-tab late edits require a clear cutover warning. No automatic cross-origin read/merge. |
| D. Update/close-tab prompt, BroadcastChannel, Service Worker, tombstone | **Yes** | **Yes** if still same-origin v1 storage | Helpful for cooperating clients and UX, **not** a security fence against cached noncooperating code. |

**Recommendation for design review, not authorization:** treat a distinct-origin, user-mediated encrypted backup handoff (C) as the most defensible isolation candidate if the product must guarantee that an archived v1 tab cannot mutate the *new* primary ledger. Do not silently redirect or migrate users. Evaluate B only with an explicit stale-tab conflict/cutover contract and no claim of complete old-writer fencing. Do not implement A or D as proof of safety.

## Required consent and UX contract before any implementation

1. Show the old origin and new origin as separate local data locations. Explain that balances do not automatically sync and that continuing to edit an old tab after export will not update the new ledger. Avoid moralizing copy.
2. Ask for explicit user approval of the cutover plan, chosen origin, encrypted backup compatibility and what happens to old data. **Do not delete the old origin** automatically. Never copy plaintext across origins, introduce a backend or transmit the encrypted backup to a server.
3. Treat a missing/partial KEY/PAYLOAD, storage denial, failed import, wrong password, canceled dialog, unknown backup version, and user-reported newer old-tab edits as **blocked / unresolved**, not empty vault or permission to overwrite.
4. Require an authenticated user-selected backup file, show a read-only preview and provenance/freshness warning, then use a separately reviewed atomic primary commit protocol with explicit operation-specific consent. Do not assume a verified file is necessarily the latest state.
5. Define the exact behavior when a user has independently edited both origins; do not silently merge, replay, discard, or resurrect transactions. Offer non-destructive export/compare pathways for future approval.
6. Document offline/installed-PWA behavior, browser profile separation, data eviction, browser restart, and backup restoration before claiming durable safety.

## Synthetic acceptance matrix (future, not performed here)

- Actual archived v1 tab keeps running and writes before/during/after new-origin import; verify new-origin ledger bytes remain unchanged and old-origin data remain accessible.
- Two tabs of new version: concurrent writes, stale revisions, lock unavailable, IDB blocked/aborted/denied/evicted, quota exceeded, crash before/during/after atomic commit; no lost acknowledged transactions.
- Encrypted-file export/import: wrong password, tamper, unsupported schema, user cancellation, duplicate import, import after newer old-origin edit, multiple browser profiles; never report false freshness.
- Keyboard, 320/390 light/dark, 200% text/native zoom, Safari iPhone/VoiceOver: accessible blocked, cancel, retry and explicit origin disclosure. Do not infer Safari results from Chromium.
- Verify release invariants and actual served origin, including that a path-only deployment **does not** satisfy isolation.

## Evidence and standards

- [Actual archived v1 post-reinspection negative test](../tests/browser-authenticated-consent-legacy-writer-research.cjs), [research gate](WEB_RESET_CONSENT_READONLY_GATE_20261031.md).
- [MDN Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy): origin tuple and cross-origin storage isolation.
- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API): localStorage partitioned by origin, shared among same-origin documents.
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API): voluntary lock coordination across same-origin tabs/workers.
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria): local data may be best-effort/evicted; origin isolation does not guarantee persistence.

**Decision gate:** no destructive reset, restore, migration, rekey, merge, deletion or automatic origin cutover without a separate approved storage/consent contract and passing failure matrix. #14 budget perspectives and #25/#2 financial semantics remain DISCOVERY ONLY.
