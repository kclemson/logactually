

## Skip null/zero data points in dual-series charts

The fix is straightforward: in `chart-merge.ts`, use `null` (not `0`) for missing data points — which is already happening. The issue is in `DynamicChart.tsx` where Recharts renders dots/bars at `null` values as `0`.

### Changes

**`DynamicChart.tsx`** — For both `Line` and `Bar` components in dual-series mode:
- On `Line`: add `connectNulls={true}` so the line skips gaps, and filter dots so they don't render at null values
- On `Bar`: Recharts naturally skips `null` bars, but we need to ensure the data uses `null` not `0`

**`chart-merge.ts`** — The merge already sets `null` for missing values, which is correct. No changes needed here.

The key rendering fix is adding `connectNulls` to Line components and ensuring null values aren't coerced to 0 anywhere in the pipeline. This way, days without strength training simply show no dot/bar for that series while the other series renders normally.

