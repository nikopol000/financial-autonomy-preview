# P1 #4/#29/#35 — origin cutover and encrypted handoff decision gate (2026-11-02)

**DISCOVERY / DESIGN ONLY — NOT AN APPROVED MIGRATION OR PRODUCT RELEASE.** Start main `767a8a33781b5c89218ba915478b9c1469a15974`, product WEB **18.72**. This document does not change JavaScript, HTML, formulas, backup format, storage, the real vault, or iOS. It does not claim a user incident or successful recovery.

## Why the existing release cannot safely fence a cached legacy tab

Current evidence: `docs/WEB_VAULT_P1_RELEASE_GATE_20261101.md`, `tests/browser-archived-v1-compatibility-research.cjs`, `tests/vault-cached-legacy-cross-version.cjs`, and [PR #442](https://github.com/nikopol000/financial-autonomy-preview/pull/442) with [Chromium #41364832788](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41364832788). The archived WEB 18.27/18.33/18.34 clients have **five reproducible KNOWN UNSAFE Chromium scenarios**: two stale overwrites and three post-reset ledger resurrections. These are characterization tests; their PASS output means the vulnerability is reproduced. WEB 18.72's Web Lock, revision and reset-epoch checks only constrain cooperating clients. An older cached client need not acquire the modern lock or honor the epoch. The earlier cross-tab KEY-only observation after archived reset remains intermittent and unexplained, not a fixed reset.

A path change (e.g., `/v2` on the same scheme/host/port) **does not isolate localStorage or IndexedDB**. A different localStorage key namespace is not a complete cutover contract, and a `storage` event or `BroadcastChannel` is advisory: a cached old client may ignore it. Web Locks are also origin-scoped and cooperative. Independent **HTTPS origin** means a different scheme/host/port; it isolates both storage and lock namespaces from old-origin code. This is supported by [MDN Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), and [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel). The browser evidence from #442 demonstrates bidirectional reset isolation in disposable Chromium; it does **not** establish recency, migration correctness or Safari behavior.

## Alternatives — explicit trade-offs, not silent implementation choices

| Alternative | What it addresses | What it does not address | Recommendation |
| --- | --- | --- | --- |
| A. Keep current origin, add warnings/reload/BroadcastChannel | Helps cooperative current tabs notice changes; minimal deployment | Cached 18.27/18.33 can still overwrite/recreate; ignored warnings are not a fence | **Reject as P1 solution** |
| B. Same origin, new storage keys/IDB | Reduces collisions for known legacy v1 key operations | Still shares origin, service worker/caches and potentially destructive storage code; provenance and divergence unresolved | **Research only**, not a certified cutover |
| C. Independent HTTPS origin + **user-selected encrypted file** transfer | Old-origin code cannot directly mutate new-origin storage; no backend/account/bank link; user controls file | Old origin can continue accumulating transactions; export can be stale; file can be lost; import failure/partial write possible | **Preferred design candidate**, requires explicit approval and fault tests |
| D. Cross-origin automatic `postMessage` handoff | May reduce manual steps | More complex sender/receiver trust, origin allowlist, replay, lifetime and plaintext exposure risks; cached sender may be stale | **Defer**, not needed for first safe cutover |
| E. Automatic migration, reset, rekey or merge on the old origin | Potentially smooth UX | Can destroy only recoverable copy or silently choose wrong history | **Not authorized** |

The File API lets a web app read only files the user selects; it does not automatically grant the new origin access to old-origin storage ([MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)). Any proposed encrypted export must use the **existing documented backup format and authentication rules** unless a separate approved contract explicitly changes them. Do not call a valid AES-GCM backup the latest backup.

## Proposed state machine for a future, separately approved flow

This is a **UX and verification contract proposal**, not an implementation specification or authority to alter financial records.

1. **OLD_ORIGIN_UNINSPECTED:** old ledger may be present, absent, blocked, or divergent. Never describe this as an empty ledger. No writes.
2. **OLD_ORIGIN_READABLE:** old UI may offer its existing encrypted export. A successful export only attests to a snapshot at export time, **not** to absence of subsequent old-tab writes. Display origin, export time as informational metadata only, and the caveat that other tabs may have newer changes; do not invent a global revision.
3. **FILE_SELECTED / AUTHENTICATED:** user explicitly selects the encrypted file in the new origin. Validate format, authentication, and financial schema without mutating the destination. Failed/denied/unknown validation => **BLOCKED_READ_ONLY**, no destination writes.
4. **DESTINATION_INSPECTED:** distinguish definitely empty, existing authenticated ledger, KEY-only/PAYLOAD-only, pending reset, denied read, and unknown. Only a provably empty destination is eligible for an *explicitly confirmed* first import; existing/unknown destination is **BLOCKED**, not overwritten or merged.
5. **COMMIT_ATTEMPT:** preserve the original file and old-origin bytes; require destination Web Lock and exact precondition check, bounded writes, authenticated readback, and no false success on quota/security failure. On any ambiguous partial write, remain blocked/read-only and preserve evidence.
6. **IMPORTED_AUTHENTICATED:** new-origin ledger matches the selected file's authenticated contents; say **“Import verificat pentru fișierul selectat”**, not “istoric complet” or “cel mai recent”. The old origin remains untouched and may still receive transactions. Do not automatically delete old data, mark it superseded, or reconcile divergence.
7. **DIVERGENCE_POSSIBLE:** if a legacy tab writes after export, no cross-origin event can certify that the new ledger includes that write. Provide a clear manual review path, not silent merge or “synced” state. New origin cannot inspect old origin directly.

**Illustrative UX copy (not approved):** “Fișierul a fost verificat și importat aici. Datele din vechea adresă nu au fost șterse. Tranzacțiile înregistrate acolo după export nu apar automat aici.” For unknown state: “Nu putem confirma dacă datele existente sunt complete. Nu vom înlocui nimic automat.”

## Concrete synthetic acceptance matrix before any product code

| ID | Scenario | Required observable result |
| --- | --- | --- |
| H01 | Old 18.27/18.33 saves after export | Old origin changes; new-origin KEY/PAYLOAD/IDB remain byte-identical |
| H02 | Old 18.27/18.33/18.34 resets after export | New-origin authenticated ledger remains unchanged |
| H03 | New-origin reset after import | Old-origin KEY/PAYLOAD/IDB unchanged; new-origin intentional reset semantics separately verified |
| H04 | Old and new have divergent authenticated histories | No automatic merge, latest-history claim, or destructive cleanup |
| H05 | User selects valid but older encrypted backup | Authentication succeeds; UI does not label it newest |
| H06 | Invalid password, tampered file or unsupported schema | No destination KEY/PAYLOAD/RESET/IDB writes |
| H07 | Destination already has authenticated ledger | Explicit conflict, zero writes; no overwrite even if imported file is valid |
| H08 | Destination KEY-only, PAYLOAD-only or pending reset | Blocked/read-only; no auto-delete, rekey or false empty |
| H09 | Storage read denied/changes between inspection and commit | Abort with zero **new** writes if before commit; ambiguous after commit => blocked, never false success |
| H10 | Payload write throws after key write | No “import complete”; preserve encrypted source file and ambiguous footprint for review |
| H11 | Reload, pagehide, second tab, Web Locks unavailable | No stale mutation; unsupported locks fail closed in real mode |
| H12 | Browser storage eviction or origin permission loss | Clearly report unavailable; do not treat as fresh empty ledger |
| H13 | Filename, timestamps, duplicate IDs, order differ | No inferred equivalence or automatic transaction-level reconciliation |
| H14 | New origin served from a path on old host by mistake | **FAIL** deployment preflight: origin isolation absent |
| H15 | New origin HTTPS but wrong host/redirect/canonical alias | **FAIL** origin preflight; never silently import to old origin |
| H16 | Safari iPhone/VoiceOver, light/dark, offline, file picker | Independently verify before claiming cross-platform acceptance |

**Security invariants:** local-only, no network upload or telemetry; no plaintext export; no automatic file selection; no secret/ciphertext in logs; retain old origin and user-held file; do not modify existing encrypted backup format; no financial calculation change. Browser origin separation is a containment property, not a guarantee of crash-safe writes, persistence, or chronological truth.

## Decision points requiring explicit user approval before implementation

1. Is a **new independent HTTPS origin** acceptable as the future canonical WEB address, acknowledging that browser-local data will not automatically appear there?
2. Is a **manual encrypted export/import** with the existing backup password/format acceptable, with the old origin retained indefinitely unless the user independently removes it?
3. When the destination already has data, or when old and new histories diverge, should the first release **block and require separate manual resolution** rather than overwrite/merge? This document recommends blocking.
4. What precise text and confirmation should distinguish “authenticated file” from “latest/complete history”? No claim of recency is justified by the current evidence.

**Next safe action:** implement *test-only* preflight and failure-state characterizations on disposable origins after contract review; do not modify production vault, origin, backup, formula, iOS or release version. #85 remains an independent UX DISCOVERY; #14/#25/#2 remain financial-contract DISCOVERY requiring numeric approval.