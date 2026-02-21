

# Editable Chart Title and AI Note

## What this does
Adds two inline-editable text fields to the CustomChartDialog so users can customize the chart title (shown above the chart) and the AI note (shown below the chart as an italic footer). Works for both new charts and when editing saved charts.

## UI placement
The fields mirror where they appear in the rendered chart -- title above, note below:

```text
  "Daily fiber intake over time"

  Title *  [Walking-Only vs. Other Workout Days___]

  [========= chart preview =========]

  Note     [Counts days where walk/run was the___]

  [Regenerate] [Refine] [Save to Trends]
```

- **Title input**: placed between the question quote and the chart preview. Small text input, `text-sm font-medium`, placeholder "Chart title".
- **Note input**: placed between the chart preview and the action buttons. Smaller text input, `text-xs text-muted-foreground`, placeholder "Note (optional)".

This keeps the editing experience consistent with how the saved chart actually looks.

## Changes

### `src/components/CustomChartDialog.tsx`
1. Import the `Input` component from `@/components/ui/input`
2. In the result section (where `showResult` is true):
   - After the `lastQuestion` quote and before the chart preview div, add a Title input bound to `currentSpec.title`
   - After the chart preview div and before the action buttons row, add a Note input bound to `currentSpec.aiNote`
3. On change, update `currentSpec` via `setCurrentSpec(prev => ({ ...prev!, title: value }))` (same pattern for `aiNote`)
4. Both inputs use `autoComplete="off"` and ghost-text placeholder styling per project standards

### No other files change
- No database migration needed
- No changes to `useSavedCharts`, `DynamicChart`, `ChartCard`, or any other component
- The existing `handleSave` already persists the full `currentSpec` object, so edits are saved automatically
- Regenerating or refining overwrites both fields with new AI output; user can re-edit after

