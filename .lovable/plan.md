# Tap an analyte → trend chart popover

## Goal
Let the user tap a bloodwork analyte's **name** in the results list to open a small popover showing that analyte's all-time trend chart — without interfering with the existing pin (left) and question-mark Google lookup (right) icons.

## Hit-target confirmation
Each row already has three separable targets: a ~16px pin button (left), the flexible analyte-name text (center, fills remaining width), and a ~16px help/lookup button (right). The name is by far the largest target and becomes the trend trigger. Icons stay their own buttons with `stopPropagation`, so the question-mark link and pin remain independently tappable. Light vertical padding is added to the name for a comfortable touch target.

## New component: `src/components/AnalyteTrendPopover.tsx`
A self-contained wrapper that turns its children (the name text) into a Popover trigger.

- Props: `canonicalKey: string`, `displayName: string`, optional `referenceRange` (low/high from the row), `children` (the rendered name span).
- Uses `Popover` / `PopoverTrigger` (asChild, a `<button>`) / `PopoverContent` from `@/components/ui/popover`.
- Lazy data fetch: only when opened. Build a bloodwork DSL on the fly (same shape `usePinnedBloodworkCharts.pin` uses):
  ```ts
  { chartType: 'line', title: displayName, source: 'bloodwork',
    metric: 'value', groupBy: 'date', aggregation: 'sum',
    filter: { canonicalKey } }
  ```
  Then `fetchChartData(supabase, dsl, 0)` → `executeDSL(dsl, data)` → `ChartSpec`, rendered with `DynamicChart`. Wrap in a `useQuery` keyed by `['analyte-trend', canonicalKey]` with `enabled: open` and `staleTime: 60s` so reopening is instant and it shares cache.
- States inside the popover:
  - Loading: small skeleton / spinner at the chart's height (~96px).
  - Empty (no numeric history): short "No trend data yet" message.
  - Loaded: `<DynamicChart spec={spec} />`.
  - Single data point: chart still renders one marker (acceptable).
- `PopoverContent` sized `w-[300px] p-2`, `align="start"`, with `onClick`/pointer stopPropagation so taps inside don't toggle the panel row. Fits within the 440px mobile viewport.

## Wire-up in `src/components/BloodworkPanelGroup.tsx`
The analyte name is rendered in two places (filtering "rows-only" mode ~line 283, and normal expanded view ~line 419). Both currently:
```tsx
<span className="truncate">{r.display_name}</span>
```
Replace each with the popover trigger wrapping a button-styled name:
```tsx
<AnalyteTrendPopover canonicalKey={r.canonical_key} displayName={r.display_name}
  referenceRange={{ low: r.reference_low, high: r.reference_high }}>
  <button type="button"
    className="truncate text-left hover:text-foreground hover:underline decoration-dotted underline-offset-2 py-0.5"
    onClick={(e) => e.stopPropagation()}>
    {r.display_name}
  </button>
</AnalyteTrendPopover>
```
- Keep `renderPin` and `renderLookup` exactly as-is on either side.
- The subtle dotted underline on hover/active signals the name is interactive without adding visual noise on mobile.

## Reference band (nice-to-have, low risk)
Pass the row's `reference_low`/`reference_high` into the spec's `referenceRange` so the popover chart shades the normal range when both bounds exist (DynamicChart already supports `referenceRange`). Skipped silently when bounds are missing.

## Out of scope
- No change to pin/unpin, Google lookup, or the inline Pinned charts section on /custom.
- No backend/schema/DSL changes — reuses the existing bloodwork chart path client-side.

## Verification
- Typecheck/build stays green.
- Drive the preview with Playwright on mobile viewport: expand a panel, tap an analyte name → popover opens with a chart; tap the question-mark → opens Google search (popover does not open); tap the pin → toggles pin (popover does not open). Confirm the popover closes on outside tap and reopens instantly (cached).
