

## Add Debug Panel and User Query Display to Create Chart Dialog

Two small UI additions to `CreateChartDialog.tsx`:

### 1. Show user's original query above the chart
When a chart is rendered (and during loading), display the user's question in italics above the chart preview -- similar to the Ask AI dialog pattern. This is already partially done during loading state but not shown once the chart renders.

### 2. Add a collapsible debug JSON panel (temporary)
Below the chart and action buttons, add a toggle button ("Show debug JSON") that expands to show the raw `currentSpec` as formatted JSON in a scrollable `pre` block. This makes it easy to copy/paste the spec into bug reports.

### Changes (single file)

**`src/components/CreateChartDialog.tsx`**
- Add a `showDebug` boolean state
- In the chart preview section, add the user's query (`lastQuestion`) as italic text above the chart (same `text-xs text-muted-foreground italic` style already used in the loading state)
- Below the Save/Start over buttons, add a small "Debug JSON" toggle button (muted, text-xs) that reveals a `pre` block with `JSON.stringify(currentSpec, null, 2)` in a max-height scrollable container

### Technical details
- The debug toggle is a simple `outline` variant button with `text-xs`
- The JSON block uses `whitespace-pre-wrap break-all text-[10px] max-h-[200px] overflow-auto bg-muted/50 rounded p-2`
- No new dependencies needed
