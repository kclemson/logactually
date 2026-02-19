

## Three improvements to Create Chart verification

### 1. Add tolerance label to verification summary

The verification summary currently shows "Accuracy: X/Y match (Z%)". Replace this with a human-readable description that includes the tolerance used.

**`src/lib/chart-verification.ts`:**
- Add `toleranceLabel?: string` to `VerificationResult`
- `verifyDaily` and `verifyLegacy`: set `toleranceLabel: "within 1% or 5 units"`
- `verifyAggregate`: for `method === "average"`, widen `isClose` tolerance (`delta < 20 || delta/actual < 2%`) and set `toleranceLabel: "within 2% or 20 units"`; otherwise use default tolerance and label

Update `isClose` to accept an optional method parameter:
```text
isClose(ai, actual)          -> delta < 5 or delta/actual < 1%
isClose(ai, actual, "average") -> delta < 20 or delta/actual < 2%
```

**`src/components/CustomChartDialog.tsx`:**
- Replace the summary line with: `{matched}/{total} AI values matched your logs ({toleranceLabel})`

### 2. Always show the textarea

The textarea currently hides once a chart is generated (unless refining). It should always be visible below the chips so users can type a new prompt at any time.

**`src/components/CustomChartDialog.tsx`:**
- Change `showTextarea` to: `!generateChart.isPending || hasExistingContent` (remove the `!currentSpec || refining` gate)
- Dynamic placeholder based on state:
  - Refining: "Refine this chart..."
  - Chart exists, not refining: "Describe another chart..."
  - No chart: "Describe the chart you'd like to see..."

### 3. Auto-run validator on AI response

Instead of requiring users to click "Verify accuracy", run verification automatically whenever a chart spec comes back from the AI.

**`src/components/CustomChartDialog.tsx`:**
- In both `handleSubmit` and `handleNewRequest`, after `setCurrentSpec(result.chartSpec)` and `setDailyTotals(result.dailyTotals)`, immediately call `verifyChartData` and `setVerification` with the result
- Keep the "Verify accuracy" button so users can re-run it manually if they want, but the panel will already be populated on load

The relevant code in both handlers changes from:
```text
setCurrentSpec(result.chartSpec);
setDailyTotals(result.dailyTotals);
```
to:
```text
setCurrentSpec(result.chartSpec);
setDailyTotals(result.dailyTotals);
setVerification(verifyChartData(result.chartSpec, result.dailyTotals));
```

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Add `toleranceLabel` to interface; widen `isClose` for averages; set label in all three verify functions |
| `src/components/CustomChartDialog.tsx` | Use `toleranceLabel` in summary; always show textarea; auto-run verification after AI response |

