
## Goal
Make Food Trend bar labels easier to read in dense views (e.g., 90 days) without adding much complexity, by increasing the vertical gap between the top of a bar and its label only when there are many bars.

## What’s happening now (from the code)
- Food charts render labels via `createFoodLabelRenderer(...)`, which positions text at `y - 4`.
- When there are many days, bars get narrow and the label “crowding” feels worse, especially with spiky / varying bar heights (as in the demo account).
- Even after reducing how many labels show, the remaining labels are still “tight” against the bar tops and can feel visually noisy.

## Approach (minimal change)
1. **Compute a “dense chart” label offset once**
   - Based on `chartData.length` (or equivalently, the labelInterval tier).
   - Only increase the offset for the higher thresholds (where we currently show every 4th/5th label):
     - `dataLength <= 21` (interval 1–3): keep current `4px` gap
     - `22–35` (interval 4): use a bigger gap (e.g. `8px`)
     - `> 35` (interval 5): use the biggest gap (e.g. `10–12px`)

2. **Plumb that offset into the label renderer**
   - Update `createFoodLabelRenderer(chartData, color)` to accept a third param (e.g. `yOffsetPx`), and use `y={y - yOffsetPx}` instead of `y - 4`.
   - Update the call sites for:
     - Calories chart `<LabelList ... />`
     - Protein/Carbs/Fat charts in the loop

3. **Prevent label clipping at the top**
   - If we move labels further up, they may get clipped by the chart container when the tallest bars are near the top.
   - Keep this simple by increasing `BarChart` `margin.top` only in dense views:
     - today: `margin={{ top: 12, ... }}`
     - dense: `margin={{ top: 18 or 20, ... }}` (based on the same thresholds as above)

4. **(Optional, low-risk) Fix a small correctness detail**
   - Currently the renderer has `if (!value) return null;` which hides labels when `value === 0`.
   - If you want 0-values to still label, we can change that to `if (value == null) return null;`.
   - This is optional and independent of readability.

## Concrete code-level changes (single-file, straightforward)
File: `src/pages/Trends.tsx`

### A) Add helper(s) for density-based spacing (near the other helpers)
- Add a small function like:
  - `getFoodLabelOffsetPx(dataLength): number`
  - `getFoodChartMarginTop(dataLength): number`
- Example mapping:
  - offset: `4 / 8 / 11`
  - marginTop: `12 / 18 / 22`

### B) Update `createFoodLabelRenderer`
- Signature becomes:
  - `createFoodLabelRenderer(chartData, color, yOffsetPx)`
- Use `y={y - yOffsetPx}`

### C) Use the computed values in the Food charts
- In the Trends component (near where `chartData` is used), compute:
  - `const foodLabelOffsetPx = getFoodLabelOffsetPx(chartData.length)`
  - `const foodMarginTop = getFoodChartMarginTop(chartData.length)`
- Apply:
  - Calories chart: `BarChart margin={{ top: foodMarginTop, ... }}`
  - Macro charts row 2: same `foodMarginTop`
  - LabelList calls pass `foodLabelOffsetPx`

## Why this stays simple
- No new state, no effects, no new components.
- It’s a tiny “presentation tweak”: only changes `y` positioning and (if needed) top margin.
- The behavior is deterministic and only depends on `chartData.length`.

## Testing checklist (demo account)
1. Go to **Trends → Food Trends → 90 days**
2. Confirm:
   - Labels are still shown at the intended interval (every 4th/5th + last).
   - Labels have visibly more breathing room above bars in dense mode.
   - No label clipping at the top (especially on tall bars).
3. Spot-check **7 days** and **30 days**:
   - The spacing should look unchanged (or nearly unchanged) compared to before.

## Rollback / adjustment knobs
If the spacing feels too big or too small, we only adjust:
- `offset` numbers (e.g., `8` and `11`)
- `margin.top` numbers (e.g., `18` and `22`)
No other code needs to change.
