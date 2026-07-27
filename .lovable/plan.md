# Fix: Customize-mode eye toggle does nothing

## Root cause (verified)

`ChartVisibilityWrapper` renders its eye/eye-off button as an absolutely-positioned sibling of the chart:

```
<div className="relative">
  <div className="transition-opacity">{children /* ChartCard */}</div>
  <button className="absolute right-1 top-1 z-10 …">…</button>
</div>
```

Inside every `ChartCard` (`src/components/trends/ChartCard.tsx`) the actual card body is wrapped in `<div className="relative z-40">`. The `Card` itself uses `position: relative` **without** a `z-index`, which per spec does not create a stacking context. As a result the inner `z-40` div participates in the wrapper's stacking context and paints on top of the `z-10` toggle button — taps on the eye icon hit the chart surface instead of the button, so nothing happens.

## Fix

Bump the toggle button's stacking level above the chart's `z-40` layer.

### Change
- `src/components/trends/ChartVisibilityWrapper.tsx`: change the button's `z-10` to `z-50` (matches the app's existing tooltip-active z-50 convention and clears the chart's z-40).

That's the whole fix — one class change. No other files need to change and no behavior beyond the toggle is affected.

## Verification
- Manual: enter Customize on `/trends`, tap eye on any chart → it dims/undims and persists in `settings.hiddenCharts`; tap Done → hidden charts disappear.
- Existing test `src/lib/chart-visibility.test.ts` continues to cover the toggle logic itself (unchanged).
