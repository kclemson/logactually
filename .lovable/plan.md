

## Trends header redesign, chip refresh button, and chart color codes

Three changes that were previously approved but need to be implemented together.

### 1. Replace period button toggle with Select dropdown and style "+ Chart" button

**`src/pages/Trends.tsx`**

Replace the three `Button` toggles (7/30/90 days) and the outline "+ Chart" button (lines 308-331) with:
- A compact `Select` dropdown for period selection (`h-9`, `w-auto`, `min-w-[100px]`)
- A filled emerald "+ Chart" button (`bg-emerald-600 hover:bg-emerald-700 text-white`)

Add imports for `Select, SelectTrigger, SelectContent, SelectItem, SelectValue` from the UI components.

### 2. Add refresh button with seen-tracking to CustomChartDialog

**`src/components/CustomChartDialog.tsx`**

Port the exact same pattern from `AskTrendsAIDialog`:

- Add `RefreshCw` import from lucide-react
- Replace `useMemo` chip selection (line 75-78) with `useRef<Set<string>>` + `useState` + `useCallback` pattern:
  - `seen` ref tracks shown chips
  - `pickFresh` callback filters out seen chips, picks 6, resets seen when pool runs low (<6 remaining)
  - Initial state seeds `seen` with first 6
- Add `refreshChips` handler: `() => setChips(pickFresh())`
- Add `RefreshCw` button in the `DialogTitle` area, positioned `absolute right-12 top-3.5`, styled identically to Ask AI dialog:
  `p-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150`
- Only visible when chips are visible (no currentSpec, not pending, no messages)

### 3. Specific chart color hex codes in system prompt

**`supabase/functions/generate-chart/index.ts`**

Replace line 72:
```
- Choose a color hex code that fits the data type (blue for calories, green for protein, teal for custom logs, purple for exercise)
```
With:
```
- Use these exact colors when the chart's primary metric matches: calories "#2563EB", protein "#115E83", carbs "#00B4D8", fat "#90E0EF", exercise/training "#7C3AED". For anything else, choose a reasonable color hex code.
```

### Files changed

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Replace period toggle with Select dropdown; emerald filled "+ Chart" button |
| `src/components/CustomChartDialog.tsx` | Add refresh button with seen-tracking for chip cycling |
| `supabase/functions/generate-chart/index.ts` | Replace loose color guideline with exact hex codes |

