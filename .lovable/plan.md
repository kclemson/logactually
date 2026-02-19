

## Two changes to pinned (saved) charts

### 1. Edit button in chart header instead of full-card click

Currently the entire saved chart card is wrapped in a clickable div that opens the chart editor. This will be replaced with a small pencil icon button in the chart's header row (right-aligned next to the title), always visible on saved charts -- no need for the separate "edit mode" toggle.

**Changes:**

| File | What changes |
|---|---|
| `src/pages/Trends.tsx` | Remove the wrapper `<div className="cursor-pointer" onClick={...}>` around each saved chart. Instead, pass a `headerAction` to `DynamicChart` that renders a pencil icon button which opens the editor. The pencil and delete button both show in the header -- pencil always, delete only in edit mode. Remove the section-level edit-mode pencil toggle since delete can stay inline (or keep it for delete-only). |

The pencil button will be small and muted, similar to the existing delete button styling, to avoid visual clutter.

### 2. Click-to-navigate for date-axis dynamic charts

`DynamicChart` already supports an `onNavigate` prop that hooks into `useChartInteraction` (bar click on desktop navigates, on touch it shows tooltip with a "Go to day" button). The saved charts just never pass `onNavigate`.

The fix: when rendering saved charts, pass `onNavigate` based on `chart.chart_spec.dataSource`:
- `"food"` or `"mixed"` navigates to `/?date=YYYY-MM-DD` (food log)
- `"exercise"` navigates to `/weights?date=YYYY-MM-DD`

This only works for charts where the X axis represents dates (i.e., `groupBy: "date"` or `groupBy: "week"`). For other groupBy types (`dayOfWeek`, `item`, `category`, `hourOfDay`, `weekdayVsWeekend`), the data points don't have a `rawDate` field, so `onNavigate` naturally does nothing -- no special handling needed.

**Changes:**

| File | What changes |
|---|---|
| `src/pages/Trends.tsx` | Pass `onNavigate` to each saved `DynamicChart`. The callback checks `chart.chart_spec.dataSource` to determine the target route (`/` for food, `/weights` for exercise), then calls `navigate`. |

No changes needed in `DynamicChart`, `useChartInteraction`, or `CompactChartTooltip` -- the plumbing is already there.

### Summary

Two small changes, both in `Trends.tsx`:
1. Replace card-level click with a pencil icon `headerAction`
2. Add `onNavigate` prop based on `dataSource`
