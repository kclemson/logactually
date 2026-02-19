

## Clean up v2 debug controls

Two small changes to `src/components/CustomChartDialog.tsx`:

1. **Hide "Verify accuracy" button when in v2 mode** — the data is deterministic by construction, so there's nothing to verify.

2. **Replace "Show debug JSON" with "Show DSL" when in v2 mode** — instead of showing the final computed `ChartSpec`, show the raw `ChartDSL` object the AI returned. This is the useful debug artifact for iterating on the DSL approach.

### Technical details

- Store the `chartDSL` from the `GenerateChartResult` in a new state variable (it's already returned by `useGenerateChart` in v2 mode but currently discarded in the dialog).
- When `mode === "v2"`:
  - Hide the "Verify accuracy" button entirely
  - Change the debug toggle label to "Show DSL" / "Hide DSL"
  - Display `JSON.stringify(chartDSL, null, 2)` instead of the chartSpec
- When `mode === "v1"`: behavior unchanged (show debug JSON and verify accuracy as before)

### File changes

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Add `chartDSL` state, conditionally hide verify button, swap debug content in v2 |

