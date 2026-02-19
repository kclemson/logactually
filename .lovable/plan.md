

## Two improvements to the Create Chart dialog

### 1. Show all comparison rows (matches + mismatches) in verification results

Currently, the verification panel only shows mismatches. The user wants to see the full picture: green rows for matches and red rows for mismatches, regardless of overall accuracy.

**Changes to `VerificationResult` type** (`src/lib/chart-verification.ts`):

- Add a new `allComparisons` array to the interface alongside `mismatches`:
  ```typescript
  allComparisons?: Array<{ label: string; ai: number; actual: number; delta: number; match: boolean }>;
  ```
- In `verifyDaily`, `verifyAggregate`, and `verifyLegacy`: populate `allComparisons` with every data point (both matches and mismatches), with a `match` boolean flag.
- Keep `mismatches` as-is for backward compatibility.

**Changes to verification display** (`src/components/CustomChartDialog.tsx`):

- When `verification.allComparisons` exists, render all rows instead of just mismatches.
- Green-colored rows (`text-green-400`) for `match: true` entries.
- Red-colored rows (`text-red-400`) for `match: false` entries.
- Each row shows: `label: AI=X, actual=Y` (and delta for mismatches).

### 2. Loading overlay instead of collapsing the dialog

Currently, when generating a new chart while a result is showing, the dialog hides the result section and shows a small loading spinner, causing the dialog to shrink and jump.

**Changes to `src/components/CustomChartDialog.tsx`**:

- When `generateChart.isPending` AND there is already a `currentSpec` (or `lastQuestion`), render a semi-transparent overlay on top of the existing result content instead of hiding it.
- The overlay: `absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10` with spinner and "Generating..." text.
- Wrap the dialog's inner content in a `relative` container so the overlay positions correctly.
- Only use the current "collapse to spinner" layout for the first-ever request (no previous result to preserve).

Implementation detail:
- Change the loading condition: instead of hiding chips/textarea/result when `isPending`, keep them rendered but visually covered by the overlay.
- `showChips`, `showTextarea`, `showResult` no longer check `!generateChart.isPending` -- they stay true based on whether content exists.
- Add a separate overlay div that renders when `generateChart.isPending`.

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Add `allComparisons` array to `VerificationResult`; populate it in all three verify functions |
| `src/components/CustomChartDialog.tsx` | Render all comparison rows with green/red coloring; add loading overlay instead of collapsing dialog when a previous result exists |

