# Premium mobile-finance navigation benchmark — 2 November 2026

**Research, not a product feature or user-preference claim.** Scope: navigation discoverability and accessible reachability on narrow/mobile layouts, especially WEB #85 at 320/390 CSS px with enlarged text. Do not copy a competitor's visual design, brand or layout.

## Source-based observations

1. **WCAG 2.2, Focus Not Obscured (Minimum), Level AA:** a focused control must not be *entirely* hidden by author-created content. The separate enhanced criterion is stricter. Our Chromium *center hit test* is a useful product UX diagnostic but is **not itself the WCAG conformance test**. Source: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
2. **WCAG 2.2, Target Size (Minimum), Level AA:** 24 × 24 CSS px minimum, subject to explicit exceptions/spacing; the team's 44 px mobile design target is a stronger product heuristic, **not** the AA normative threshold. Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
3. **Monarch Money community discussion, 17 January 2026:** commenters describe editing which mobile tabs appear in navigation; another commenter requests a different shortcut. This is anecdotal evidence that navigation prominence is task-dependent, **not** proof that Financial Autonomy users want customizable tabs. Source: https://www.reddit.com/r/MonarchMoney/comments/1qff6vy/reports_on_mobile/
4. **Monarch Money community discussion, 25 September 2024:** a request for mobile budget progress bars received both support and counterarguments favoring the numeric remaining amount. A later thread also reports disagreement over visual density and rollover semantics. These are **conflicting anecdotes**, not representative research. Sources: https://www.reddit.com/r/MonarchMoney/comments/1fpaobg and https://www.reddit.com/r/MonarchMoney/comments/1fs42cm

## Principles to extract, not imitate

- **Reachability before customization.** Keep the five existing destinations distinct and operable; don't add a settings feature for rearranging navigation based only on external anecdotes. The active issue is *occlusion* and text enlargement, not lack of personalization.
- **Preserve truthful safety copy.** DEMO's fictitious-data warning, memory-only explanation and exit must remain visible/reachable and not be silently replaced with an icon. The C6 4px vertical interval at 320px demonstrates that simply stacking a bounded panel below the existing banner is not viable.
- **Use one coherent navigation region.** Prefer a structural More destination/sheet with clear heading, consistent focus order and a persistent safety region. Do not solve 200% text growth by forcing tiny type or relying on scroll padding alone.
- **No fake financial meaning.** Navigation/UI changes must not alter budget calculations, account ownership, credit, backup/restore, or the distinction between real and DEMO data.
- **Test actual operation.** A DOM-present link or successful Playwright trial click is insufficient. Require real pointer activation, natural forward/reverse keyboard order, Enter activation, visible focus, no author-created overlay hiding the control, and safety controls hit-testable. Verify normal and enlarged text, light/dark, narrow/reduced-height, and separately Safari iPhone/VoiceOver. Chromium CSS `zoom` is only a stress proxy.

## Decision for current backlog

C3–C6 are negative research, not product fixes. C7 probes full-document flow with actual React controls; it is also **not automatically acceptable** if warning/exit scroll away. If C7 fails, prototype a dedicated More sheet with a sticky, truthful DEMO safety header and independently scrollable destinations, with focus restoration on close and no accidental destructive action. Do not publish until strict interactive evidence exists. #4/#29/#35 remain higher-priority integrity risks. #14 budget perspectives stay approval-gated discovery.

**Evidence limitations:** No direct interviews, usage analytics, statistically representative preferences, or physical iPhone Safari/VoiceOver session were conducted. Community posts are qualitative anecdotes only. No product files or user data changed by this benchmark.
