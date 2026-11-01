# P1 read-only equality is not a handoff fence — archived writer after inspection (2026-11-01)

**Scope:** synthetic Chromium characterization only. No product WEB bundle, index, financial formula, iOS code, real ledger, backup, migration, origin change or deletion is touched. WEB 18.67 stays unchanged.

## Question

Can a full, read-only comparison of decrypted histories on two independent web origins establish that an archived v1 writer will not change the source **after** the comparison? No. An equality observation is a point-in-time result; it is not a write fence, transaction or authority transfer.

## Deterministic adversarial sequence

Test: `tests/browser-distinct-origin-legacy-isolation-research.cjs` (actual archived WEB 18.33 AES-GCM vault modules; disposable loopback origins, shared Chromium context, synthetic data).

1. Save identical complete synthetic states at both origins: one expense, same ID, amount **125 RON**.
2. Load/decrypt both histories without writing, assert **full-state equality**, and compare each origin's encrypted KEY/PAYLOAD before/after inspection for byte-for-byte preservation.
3. **After** that successful equality check, let the archived old-origin tab save a replacement state with the **same ID now 205 RON** and an additional synthetic expense of **40 RON**.
4. Load/decrypt both origins again: old origin has the two updated rows; new origin still has the original 125 RON row. The old encrypted envelope changes; the new envelope remains byte-identical.
5. Verify that detecting this divergence itself does not write to either origin.

The test deliberately uses ordered operations, not timing guesses, and makes **no** claim about a production handoff. Its CI result must be checked independently.

## Design consequences

- `MATCH AT INSPECTION` cannot be shown as `CURRENT`, `SAFE TO DELETE OLD DATA`, `SYNCED`, or `MIGRATION COMPLETE`.
- A future read-only preview may show `identical at the time checked`, `different now`, or `freshness unknown`; it must not silently choose a winner. These are proposed UX semantics, **not implemented UI**.
- A second check immediately before a write is still insufficient when cached old code does not honor the new protocol.
- New-origin isolation prevents direct old-origin writes to new-origin storage but does **not** prevent split histories, source updates, or data left behind.
- An approved cutover contract would need a trustworthy source-writer shutdown/fence or an explicit acknowledged period of divergent histories, user-controlled encrypted-file transfer, crash-safe target commit, conflict/rollback rules, and non-destructive retention. No such contract has been approved.

## Acceptance gaps

No Safari iPhone/VoiceOver, cross-device encrypted-file transfer, production HTTPS origin, source freshness proof, interrupted import, crash-safe commit, accessibility of status presentation or durable migration is verified. Do not close #4/#29/#35 or claim safe recovery.

Related: [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35), [prior same-ID experiment](WEB_ORIGIN_SAME_ID_DIFFERENT_AMOUNT_RESEARCH_20261101.md).
