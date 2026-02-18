

## Unified Create Chart dialog with inline result flow

### Summary

Restructure the dialog so the input area (chips + textarea) and the result area coexist in a single scrollable view. After a chart is generated, the textarea hides and the result appears below the chips. A "Refine" button re-reveals the textarea for follow-up adjustments.

### Dialog states

**Initial (no chart):**
```text
[icon] Create Chart                    [refresh] [X]

[chip] [chip] [chip]
[chip] [chip] [chip]

[textarea: "Describe the chart..."]
                                        [Create]
```

**Loading:**
```text
[icon] Create Chart                              [X]

"Average calories by hour of day"
                          [spinner] Generating...
```

**Result showing:**
```text
[icon] Create Chart                    [refresh] [X]

[chip] [chip] [chip]
[chip] [chip] [chip]

"Average calories by hour of day"
[============ chart ============]

[Save to Trends]  [Refine]
[Verify accuracy] [Show debug JSON]
```

**Refining (after clicking Refine):**
```text
[icon] Create Chart                    [refresh] [X]

[chip] [chip] [chip]
[chip] [chip] [chip]

"Average calories by hour of day"
[============ chart ============]

[textarea: "Refine this chart..."]
                      [Cancel] [Refine]

[Verify accuracy] [Show debug JSON]
```

### State changes

Add a `refining` boolean state:
- `false` (default): chips visible, textarea hidden when a chart exists, submissions start fresh requests
- `true`: textarea visible below chart, submissions carry conversation history for refinement
- Reset to `false` after successful generation, after start-over, and when clicking Cancel

### Submission logic

Two paths depending on context:

1. **New request** (chip click or textarea submit when `refining === false` and a chart exists): Atomically clear messages/currentSpec/dailyTotals/verification/editingIdRef, then submit the question as a fresh single-message conversation. No flash of empty state -- go straight to loading.

2. **Refinement** (textarea submit when `refining === true`): Existing behavior -- append to conversation history, keep currentSpec context so the AI can modify it.

3. **First request** (no chart exists yet): Existing behavior -- submit as first message.

### Chip behavior

- Chips are visible whenever `!generateChart.isPending` (both initial state AND after result)
- Clicking a chip always triggers a **new request** (never refinement), regardless of whether a chart is showing
- Refresh button visible whenever chips are visible

### Button layout in result section

- **Save to Trends** / **Save Changes**: primary action, saves and closes dialog
- **Refine**: sets `refining = true`, scrolls/focuses textarea
- Remove the old "Start over" button -- chips already serve that purpose (clicking one starts fresh)

### Edge cases

- **Edit mode** (`initialChart`): Opens with chart showing and chips visible. "Refine" works for follow-up edits. Clicking a chip clears `editingIdRef` and starts a new unrelated chart.
- **Error state**: Error message shows below where the chart would be. Chips and textarea remain visible above so user can retry or try something different.
- **Loading transition from result**: When a chip is clicked while a chart is showing, immediately clear the chart and show the loading state. No intermediate "empty" flash.

### Technical details

**File: `src/components/CustomChartDialog.tsx`**

1. Add `const [refining, setRefining] = useState(false)`
2. Add `handleNewRequest(question)` function that atomically resets state and submits:
   - Clear `messages`, `currentSpec`, `dailyTotals`, `verification`, `showDebug`
   - Set `editingIdRef.current = null`, reset `generateChart`
   - Set `lastQuestion` and call `generateChart.mutateAsync` with a single-message array
3. Restructure JSX render order:
   - **Chips section**: render when `!generateChart.isPending` (remove the `messages.length === 0` gate)
   - **Textarea section**: render when `!generateChart.isPending && (!currentSpec || refining)`
     - When `refining`: placeholder = "Refine this chart...", buttons = Cancel + Refine
     - When no chart: placeholder = "Describe the chart...", button = Create
   - **Loading section**: render when `generateChart.isPending` (unchanged)
   - **Error section**: unchanged
   - **Result section**: render when `currentSpec && !generateChart.isPending`
     - Question label, chart preview, Save + Refine buttons, verify/debug buttons
4. Chip `onClick`: call `handleNewRequest(chip)` (always fresh, never refinement)
5. Textarea submit: if `refining`, use existing `handleSubmit`; if not and chart exists, use `handleNewRequest`; if no chart, use `handleSubmit`
6. After successful generation in both paths: set `refining = false`
7. Refresh button: visible whenever `!generateChart.isPending`
8. Remove "Start over" button from result section (replaced by chip clicks and "New Chart" is implicit)

### Files changed

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Restructure layout, add `refining` state, add `handleNewRequest`, show chips after result, hide textarea after result unless refining |

