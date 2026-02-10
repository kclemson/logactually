

## Add "Metadata" Column to Weights Results Table

The most concise approach: add a single "Meta" column that formats the `exercise_metadata` object as a readable string, stripping braces and quotes.

### What changes

**File: `src/components/DevToolsPanel.tsx`**

1. Add `meta: 120` to the `weightsColumnWidths` state object (line ~139)

2. Add a new `<th>` after the Miles column header:
```
<th ... style={{ width: weightsColumnWidths.meta }} title="Exercise metadata">
  <span className="font-medium text-xs">Meta</span>
  <WeightsResizeHandle columnKey="meta" />
</th>
```

3. Add a new `<td>` after the distance cell in each row. The cell formats `exercise_metadata` into a clean string like `incline: 5, effort: 8, cal: 320` using a simple inline formatter:

```typescript
// For each exercise in the row:
e.exercise_metadata
  ? Object.entries(e.exercise_metadata)
      .map(([k, v]) => `${k.replace(/_pct$/, '').replace('calories_burned', 'cal')}: ${v}`)
      .join(', ')
  : '—'
```

This strips the JSON noise (`{}`, `""`) and shortens key names for readability. Examples:
- `{ incline_pct: 5, effort: 8 }` displays as `incline: 5, effort: 8`
- `{ calories_burned: 320 }` displays as `cal: 320`
- `null` displays as `--`

### No other changes needed
The data is already flowing through -- `exercise_metadata` is part of the `exercises` array in the test results output. This is purely a display change to one file.
