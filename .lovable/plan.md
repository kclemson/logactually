
## Goal
1) Ensure Trends defaults to **30 days** on initial load (and stays that way).
2) Fix the **sets×reps×weight** labels so they actually render on the Weight Trends bars.

---

## What’s happening (why labels render “nothing”)
Right now `renderGroupedLabel` destructures `isRunMiddle`, `runLength`, and `runIndex` from `props`:

```ts
const { x, y, width, value, isRunMiddle, runLength, runIndex } = props;
if (!isRunMiddle || !value) return null;
```

In Recharts, a custom `LabelList content` function receives the *full data point* on `props.payload` (the original datum). The extra fields you computed in `chartData` (`isRunMiddle`, `runLength`, `runIndex`) are therefore on **`props.payload`**, not reliably on the top-level props.

So:
- `isRunMiddle` is currently `undefined`
- the guard `if (!isRunMiddle ...) return null` triggers for every bar
- result: **no labels at all** (not a z-index issue)

This matches the symptom: “it doesn’t render anything at all.”

---

## Confirming #1 (30-day default)
We will verify that `selectedPeriod` initializes to 30 in `src/pages/Trends.tsx`:
```ts
const [selectedPeriod, setSelectedPeriod] = useState(30);
```
If it’s already 30 (it appears to be), no further code change is needed for #1 beyond ensuring there is no other override (URL param/localStorage/etc.). We’ll quickly confirm there is no other state hydration logic.

---

## Fix for #2 (labels not showing): make the label renderer read the right fields and avoid NaN
### Change `renderGroupedLabel` to:
1) Pull “run metadata” from `props.payload` (with a safe fallback).
2) Default missing values to prevent `NaN` coordinates (SVG won’t render `<text>` if `x`/`y` is `NaN`).
3) Keep the existing “only render for the middle bar of the run” behavior.

**Implementation approach (robust):**
- `const entry = props.payload ?? props;`
- `const isRunMiddle = Boolean(entry.isRunMiddle);`
- `const runLength = Number(entry.runLength) || 1;`
- `const runIndex = Number(entry.runIndex) || 0;`
- Render only if `isRunMiddle` and `value` are present.
- Compute span center exactly as you already do, but now with guaranteed numeric inputs.

This should immediately restore labels, because the guard will stop returning `null` for every bar.

---

## Optional (targeted) debug step if anything still fails
Because this has been attempted multiple times, we’ll add a **one-time** dev-only log to confirm the runtime shape of the props Recharts is sending:

- A module-level boolean flag (so we only log once)
- `console.debug('LabelList props sample', props)` in dev mode

This lets us confirm whether:
- `payload` is present
- `payload.label`, `payload.isRunMiddle`, etc. exist
- `x/y/width` are numbers

If the labels still don’t show after the payload fix, this log will tell us whether it’s:
- the guard logic
- missing `payload`
- a coordinate issue (NaN/out of bounds)

---

## Files to touch
- `src/pages/Trends.tsx`
  - Verify `useState(30)` remains the initial value
  - Update `renderGroupedLabel` to read run metadata from `props.payload` and harden defaults
  - (Optional) add one-time debug logging guarded by dev mode

---

## Acceptance checks (what you should see)
1) Refresh `/trends`:
   - **30 days** button is selected by default.
2) In Weight Trends:
   - Each exercise chart shows **white “sets×reps×weight”** text on/near bars (at least on some bars).
   - No console errors.
3) Quick sanity checks:
   - Try a chart with multiple bars on the same date (if present) to confirm the grouping behavior still works.
   - Check on mobile width as well (labels are small; verify they still appear).

---

## Notes on the “z-index” theory
This is very unlikely to be z-index because these are SVG elements rendered by Recharts inside the same SVG stacking context. When labels disappear completely across all bars, it’s almost always:
- the renderer returning `null`, or
- `x/y` becoming `NaN` / out of bounds,
not CSS layering.

This plan directly addresses both of those failure modes.
