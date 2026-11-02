# WEB 18.72 — disposable HTTPS-origin handoff preflight H07–H15 (2026-11-02)

**RESEARCH TEST ONLY — NOT A PRODUCT RELEASE OR APPROVED MIGRATION.** Origin cutover and encrypted-file transfer remain approval-gated in [the handoff decision contract](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md). This research does not read real storage, import a backup, deploy a domain, or change any WEB/iOS product code.

## Test design

`tests/browser-origin-handoff-preflight-research.cjs` exercises a deliberately conservative **read-only oracle**, which is **not imported by the product**. Chromium navigates to synthetic `https://legacy-vault.example.test` and `https://new-vault.example.test` pages served entirely by Playwright route fulfillment; no real DNS, remote origin or financial data is accessed. Each scenario gets a fresh browser context. The oracle checks the actual final `window.location.origin` before reading storage, requires HTTPS and a distinct hostname, then inspects only localStorage presence and IndexedDB database names. It records **no secrets/ciphertext**. Storage mutations are instrumented to throw and all synthetic bytes/IDB names are compared before and after.

| Cases | Expected behavior |
| --- | --- |
| H14 same HTTPS host, different URL path | BLOCKED_ORIGIN; zero destination reads |
| H14 loopback HTTP, despite Chromium `isSecureContext=true` | BLOCKED_ORIGIN; HTTPS is a separate requirement |
| H15 simulated post-redirect landing on old host, unapproved host alias, unexpected port | BLOCKED_ORIGIN; zero destination reads |
| H07 exact new HTTPS origin, no known storage/IDB | REVIEW_ONLY; **not** import permission |
| H07 destination has both v1 KEY/PAYLOAD | BLOCKED_EXISTING, even if contents might be valid |
| H08 KEY-only, PAYLOAD-only | BLOCKED_PARTIAL; no automatic deletion/rekey |
| H08 pending or idle reset marker | BLOCKED_RESET; no false empty |
| H09 unknown localStorage or existing IndexedDB | BLOCKED_UNKNOWN; conservative false positives are acceptable in this oracle |
| H09 localStorage read denied / IDB enumeration denied | BLOCKED_UNREADABLE; no fallback to empty |

## Boundaries and decision

This is a **preflight characterization**, not an implemented import workflow. The oracle deliberately treats unrelated storage as unknown; a production classifier would need an approved schema and error-handling contract. It does not authenticate a backup, prove newest history, prevent later old-tab writes, solve KEY-only provenance, or guarantee storage durability. The post-redirect case begins at the final old-origin landing URL; it does **not** exercise HTTP 302 transport. The initial Chromium run [#41381348824](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41381348824) failed on DNS resolution of a synthetic cross-host 302 before this correction; that is a harness limitation, not a product defect. Playwright's synthetic HTTPS response does **not** validate real TLS, Vercel aliases, Safari, VoiceOver, offline behavior, or actual production origin configuration. A green test is not evidence that a migration is safe.

The first unfinished step is to inspect PR-head **Release and Chromium** CI, including named H07–H15 PASS lines; fix any failing test without weakening rejection/no-write assertions, merge only if green, then verify merged-main CI. Keep #4/#29/#35 OPEN, five cached legacy writer KNOWN UNSAFE cases, and #14 financial semantics approval-gated. No release version bump for test/documentation-only work.

References: [MDN same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), [MDN IndexedDB databases](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases), [handoff contract](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md).
