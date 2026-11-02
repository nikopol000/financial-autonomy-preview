# P1 #4/#29/#35 — actual WEB 18.72 no-Web-Locks browser gate (2026-11-02)

**RESEARCH / TEST ONLY; PR-head CI VERIFIED and MERGED, not a product fix, migration, or approval to change storage.** Base main `c10f2158a1e3e7d8f41514e2704e9a39e5fefcda`, active immutable WEB 18.72. PR [#482](https://github.com/nikopol000/financial-autonomy-preview/pull/482). No product bundle, index, backup, financial formula, real ledger, backend, telemetry, or iOS modification.

## Specific gap

Existing synthetic VM tests assert that modern real-mode writes fail closed when Web Locks is unavailable. Those assertions do not establish that the **actual WEB 18.72 module 309 in a browser** refuses both first save and reset when `navigator.locks` is unavailable. A fallback check-then-write would reintroduce the simultaneous-writer risk. This test isolates that boundary without pretending it protects against an already-loaded cached v1 client.

## Disposable Chromium acceptance

`tests/browser-p1-active-no-web-locks-research.cjs` serves the repository's real `index.html` and active immutable bundle from a loopback origin with `?fa_real=1`. In fresh browser context it loads the actual module 309, temporarily hides `navigator.locks` in the page realm and instruments protected `localStorage` set/remove/clear operations. It then requires:

1. First encrypted save with no Web Locks: actionable rejection, **zero protected writes**, no new KEY/PAYLOAD/RESET footprint.
2. Empty-vault destructive reset with no Web Locks: actionable rejection and unchanged footprint.
3. After a valid synthetic encrypted save under native Web Locks, an update without Web Locks: actionable rejection, zero protected writes, unchanged authenticated ciphertext.
4. Destructive reset of that existing vault without Web Locks: actionable rejection, zero protected writes, unchanged ciphertext.
5. After restoring native Web Locks and reloading the page, the original synthetic transaction remains authenticated and the rejected update is absent.

The test logs only presence and SHA-256 fingerprints of protected bytes, never raw keys, ciphertext or financial data. It uses no real user storage. **Exact PR-head CI VERIFIED:** [Chromium #41515425795](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41515425795) SUCCESS, [Release #41515425831](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41515425831) SUCCESS on head `a98b785c6d896432fa4bc73f026d612eb9bea2b6`. Chromium job `125517645062` contains two named `PASS P1 real WEB 18.72` lines: first save + empty reset blocked with zero protected writes, existing-vault update + destructive reset blocked and authenticated ledger preserved after reload. [PR #482](https://github.com/nikopol000/financial-autonomy-preview/pull/482) squash-merged as `de342918f594d88694925ce7c52f85076f81a5dc`. **Merged-main CI must be verified separately.**

## Interpretation and limits

This is a *modern cooperating-client* no-lock guard, not cross-version atomicity. Five cached WEB 18.27/18.33/18.34 legacy writer scenarios remain **KNOWN UNSAFE**, including two stale overwrites and three post-reset resurrections. An archived client can ignore new locks and reset markers; a same-origin patch cannot retroactively revoke its write capability. #29 split-key reset deletion and #35 ambiguous KEY-only provenance also remain unresolved.

The preferred independent-HTTPS-origin, user-selected encrypted-file handoff in [the decision contract](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md) is still **approval-gated**. Do not ship an origin migration, automatic reset, repair, rekey, restore, replay, or merge based on this gate. No Safari/VoiceOver, actual cross-origin import, crash/eviction, or newest-backup guarantee is tested.

**First next:** verify exact merged-main Chromium, Release and Pages CI, then update #4/#29/#35. Do not interpret a green characterization as a legacy-writer repair. Continue version-skew authority/consent contract research, not an unapproved cutover. Keep WEB 18.72 unchanged and return to the cross-version authority decision rather than declaring the P1 issue resolved.
