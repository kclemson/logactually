## Goals

1. Fix the analyte popover header so the pin icon lines up with the title (the `fullName` subtitle currently pushes the row out of alignment).
2. Show the expected/reference range in parentheses in the chart **title**, so it appears both in the popover and on the pinned charts — giving context for what the shaded band represents.

## 1. Popover header alignment — `src/components/AnalyteTrendPopover.tsx`

Current header uses `items-start` with the pin (a 28px `md` box) and a two-line title/subtitle column, so the pin's centered icon doesn't align with the first line.

Restructure into a single centered top row (pin · title · lookup) with the subtitle on its own line beneath, indented to sit under the title:

```text
<div className="mb-1.5">
  <div className="flex items-center gap-1.5">
    <AnalytePinButton ... size="md" />
    <span className="text-sm font-semibold leading-tight truncate flex-1">
      {displayName}
      {rangeText && <span className="font-normal text-muted-foreground"> {rangeText}</span>}
    </span>
    <AnalyteLookupLink ... size="md" alwaysVisible />
  </div>
  {showFullName && (
    <span className="block text-[11px] text-muted-foreground leading-tight pl-[2.125rem]">
      {fullName}
    </span>
  )}
</div>
```

`pl-[2.125rem]` = pin width (`h-7` = 1.75rem) + `gap-1.5` (0.375rem), so the subtitle aligns under the title text. Now the pin, title, and lookup icon share one centered row regardless of whether a subtitle is present.

`rangeText` is derived from `spec.referenceRange`: `(low–high unit)` (en dash), e.g. `(65–175 ug/dL)`, omitted when no range exists.

## 2. Reference range in the title — pinned charts

To make the range show on pinned charts too (which render through `DynamicChart` → `ChartCard`) without breaking the inline-editable title, add a non-editable **title suffix**:

- `src/components/trends/ChartCard.tsx`: add an optional `titleSuffix?: string` prop, rendered inline right after the title inside `ChartTitle` in muted, normal-weight text. It sits outside the `contentEditable` span so editing the title is unaffected.
- `src/components/trends/DynamicChart.tsx`: when `isBloodwork` and `spec.referenceRange` has both bounds, compute `(low–high unit)` and pass it as `titleSuffix` to `ChartCard`. Non-bloodwork charts pass nothing.

Result: pinned bloodwork charts show e.g. `Iron (65–175 ug/dL)`, matching the popover.

## Technical detail

- Range formatting lives in a tiny shared inline helper in each spot (numbers shown as-is, en dash between, unit appended when present). Kept trivial rather than adding a util.
- The range value comes from the live-executed spec (`spec.referenceRange`), which is already populated by `executeBloodworkDSL` from the most recent panel with a reference range.
- Pure presentation: no backend, DSL, data, or stored-title changes. Existing pins pick up the suffix automatically at render time.
