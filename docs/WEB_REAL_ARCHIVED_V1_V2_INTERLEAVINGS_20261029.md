# Real archived v1 writes versus isolated v2 authority — 2026-10-29

## Evidence and exact scope

[PR #239](https://github.com/nikopol000/financial-autonomy-preview/pull/239) merged as `175c877f215b18c303e384b62d08282a6ab85b56`. Test `tests/browser-archived-v2-interleavings-research.cjs` runs **real immutable Metro platform/vault/crypto modules 309/310/311** from WEB 18.33 and 18.34 in Chromium tab A. Tab B runs the **isolated research-only v2 staged authority**, with browser-native AES-GCM and Web Locks. Both share actual v1 localStorage key names. Financial model 204/205 is deliberately stubbed; records are synthetic. No production migration exists.

Candidate [Chromium #40791709318](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40791709318) and [Release #40791709319](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40791709319) **SUCCESS**; three named PASS lines inspected in Chromium job `123178263390`.

1. **Legacy write during staged restore (18.33):** while tab B holds the v2 restore lock, actual 18.33 code writes changed encrypted v1 bytes. After cross-renderer visibility is observed, tab B refuses authority promotion (`changed-during-stage`); no new v2 authority is committed. The staged ciphertext is non-authoritative. Old v1 data remains readable.
2. **Legacy write after explicit v2 cutover (18.33):** after a fresh v2 commit, actual 18.33 code writes to the old v1 namespace. V2 stays readable and authoritative, reports `legacyDiverged=true`, and refuses destructive reset with zero writes.
3. **Legacy write after experimental v2 reset (18.34):** a v2 tombstone remains authoritative even when a reloaded 18.34 client writes a new v1 ciphertext. This test does not assert that old v1 data is erased, nor does it simulate a full archived UI.

## What these results do NOT establish

- **No production fix:** active WEB 18.62 still uses v1; archived 18.27/18.33 stale overwrites and 18.33/18.34 reset resurrection remain reproducible against v1.
- Web Locks coordinate **cooperating v2 tabs only**. Cached v1 ignores the lock. Cross-renderer localStorage visibility was explicitly synchronized before assertions; this is not an atomicity guarantee.
- A SHA-256 stage digest does not authenticate authority pointer metadata. Previously valid authority replay and plain epoch alteration are already characterized in [authority research](WEB_V2_AUTHORITY_RESEARCH_20261028.md). Full-origin rollback and transient ABA edits cannot be reliably detected from only rolled-back local bytes.
- Not tested: production module-311 backup/restore controller, malicious same-origin scripts, browser crash/OS crash, iPhone Safari, VoiceOver, full UI, real financial records or Vercel-served behavior.

## Design alternatives and current decision

- **A. Keep v1 as sole authority:** avoids migration risk, but leaves confirmed cached-tab loss/resurrection hazard. Not an acceptable final resolution.
- **B. Isolated v2 authority + immutable encrypted revisions + explicit divergence recovery (research preference):** old clients can write v1 without overwriting v2; retain v1 and prior v2 bytes until explicit user recovery. Must authenticate/validate authority metadata, review epoch and rollback limitations, preserve v1 portable backup compatibility and make reset crash-safe. No silent merge or deletion.
- **C. Automatic latest-timestamp/byte-hash winner:** reject; old clients can write later, and ABA/transient edits may be invisible. No reliable intent signal.
- **D. Require all users to export and manually reimport:** potential fallback, not safe as the only path for users lacking backups or holding divergent edits.

## Acceptance before product activation

1. Exact-version archived 18.27/18.33/18.34 + current 18.62 interaction matrix, including cached reset, key-only, payload-only and interrupted writes.
2. Authenticated authority provenance, epoch/revision binding and honest anti-rollback threat model. Fail closed on unknown metadata without deleting original encrypted bytes.
3. Durable staged migration, explicit restore, and reset fault injection before/after each storage operation; preserve last recoverable encrypted state and existing backup files.
4. Read-only, accessible divergence recovery UX with source/revision indicators and explicit user confirmation; never infer which ledger is correct.
5. Real HTTPS two-tab Chromium, Safari iPhone and keyboard/VoiceOver; CI, immutable version, Vercel exact SHA, served HTML and diagnostic/export verification.

**Status:** RESEARCH ONLY. Issue #4 remains P1 OPEN. Issue #14 budget modes/formulas remain DISCOVERY ONLY pending explicit financial contract approval.
