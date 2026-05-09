Add a "Show DSL" toggle to the Single and Compare chart builders, mirroring the existing one in the AI tab.

## What

In `SingleChartBuilder.tsx` and `CompareChartBuilder.tsx`, render a small `Show DSL` / `Hide DSL` text button next to the Save button (in the preview footer). When toggled on, render a `<pre>` block below the preview showing `JSON.stringify(currentDsl, null, 2)` — same styling as the existing AI-tab debug block (`text-[9px] leading-tight text-muted-foreground whitespace-pre-wrap font-mono`, bordered muted background, `max-h-48 overflow-auto`).

- Single builder: show `currentDsl` (already in state).
- Compare builder: show both `currentDsl` and `currentDsl2` side-by-side (or stacked) since compare charts have two series.

## Why

You can't currently inspect what the form-built chart actually queries, which makes it hard to debug cases like the rolling 7-day protein average looking wrong. The AI tab already has this affordance; bringing it to the form builders is a small consistency fix.

## Out of scope

Not investigating the protein chart math itself in this change — once the DSL is visible, we can look together and decide if anything's actually off (likely just a smoothing artifact, since today=33 drags the trailing window down).