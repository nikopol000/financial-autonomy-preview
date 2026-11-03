# Archived WEB 18.20 real-client provenance — 2026-11-03

Status: **verified source identification; Chromium execution NOT performed; no product change**.

## Evidence
- Starting main HEAD: `5237728ba00fd515aae86468f520ee4111a6f676`; current product metadata WEB 18.74.
- Historical Git commit `9c58a593399f71747fce1cd3c505efa06695ff35` contains `index.html` with `financial-autonomy-version=18.20` and script `/financial-autonomy-preview/_expo/static/js/web/index-v01820-history-back-navigation-20261014.js?build=18.20.1`.
- Archived JS repository path: `_expo/static/js/web/index-v01820-history-back-navigation-20261014.js`; Git blob SHA-1 `be453db2699273a194543de4532db6ea4b2e1cf2`, UTF-8 length 783793 characters (GitHub connector response). **This is Git blob SHA-1, NOT SHA-256; SHA-256 remains to be calculated from exact downloaded bytes.**
- Inspected actual archived bundle source: exactly one occurrence each of `financial-autonomy.preview.key.v1` and `financial-autonomy.preview.payload.v1`; three `localStorage` occurrences; no `indexedDB` string. Archived adapter invokes `loadWebVault(globalThis.localStorage)`, `saveWebVault(globalThis.localStorage,...)`, `clearWebVault(globalThis.localStorage)`.
- This is a **candidate authentic legacy writer** matching the v1 key/payload contract, not yet proof of its runtime behavior under concurrent tabs. Avoid conflating v18.20 with the later current v18.74 implementation.

## Test design for the next execution
1. Materialize exact historical HTML and JS bytes; calculate SHA-256 for both. Serve on a localhost isolated origin in Chromium with a test-only second page, no production preview origin.
2. Initialize synthetic v1 ledger and open actual archived client tab A; capture raw v1 key/payload bytes and authenticated ledger.
3. In test-only tab B write a separate v2 synthetic encrypted record and explicit selection witness; record hashes.
4. In tab A make a legitimate UI write based on stale state; capture before/after bytes, then reload tab B. Repeat with actual UI reset in tab A. Check ciphertext authentication, selected source, whether writes block, and user-visible state independently.
5. Cover crash/reload and KEY-only partial deletion; store only synthetic traces. If browser harness cannot execute the real archived code, report **NOT RUN** rather than claiming coverage.

## Safety gates
No automatic restoration after legacy reset; no source migration, formula change, key deletion, production vault access, or iOS modification. P1 #4/#29/#35 remain OPEN. Budget issue #14 remains DISCOVERY ONLY pending explicit approval.
