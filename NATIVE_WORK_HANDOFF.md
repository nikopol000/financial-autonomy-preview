# Native Work Handoff

Status: IN_PROGRESS
Owner: Financial Autonomy iOS automation
Updated UTC: 2026-11-19T19:12:00Z
Lease expires UTC: 2026-11-19T20:00:00Z
Working branch: financial-autonomy-app:feat/sync-preview-v18-20-ios
Verified app feature HEAD: f41dc27288b387d75f6403d13859a7ead2b7c8b2
Verified app main HEAD: a9b30be147abecea45a63bf7dd8d0a3eb3370366
Verified preview main before lease commit: 8e08b9d5df93dd88968b3401605d3386cdcf1190
Feature comparison: 373 commits ahead, 0 behind; app/main remains unchanged.

## Work in progress
- Startup documents and exact HEADs were re-read. The previous exact CI run for f41dc27288b387d75f6403d13859a7ead2b7c8b2 is still a pre-step failure: job 135773264709 has zero steps, no logs, no artifacts, empty combined status; the connector exposes no repository-level hosted-runner diagnostics or push-run listing. No retry was made.
- Independent source audit against archived WEB v18.20 found a recurring amount-input normalization mismatch: WEB removes all JavaScript whitespace with /\\s/g, while native SubscriptionEngine.parseAmountMinor removes only ASCII spaces. Tab, NBSP and narrow NBSP group separators are rejected natively but accepted by WEB.
- Next: fix normalization using Unicode whitespace filtering and add deterministic unit coverage; run a focused Swift helper harness; checkpoint exact results. No financial formula, ledger or backup schema changes planned.

Privacy invariants: local-only data; no backend, mandatory account, bank sync or telemetry. Available credit is not owned money. Do not modify or merge app/main; do not claim 1:1 completion.
