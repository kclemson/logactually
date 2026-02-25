

## Problem

All three label interval functions were designed for a maximum of ~90 data points. With "All time" enabled, charts can have 200-400+ data points, and the current fallback returns intervals that are far too dense (every 10th, 7th, or 20th label), resulting in the cramped x-axis visible in the screenshot.

## Fix

**File: `src/lib/chart-label-interval.ts`** — extend all three functions with higher-range tiers.

### `getLabelInterval` (half-width charts)
Current max return: `10`. Add tiers for longer ranges:

| Data length | Interval | Approx labels shown |
|---|---|---|
| ≤ 120 | 14 | ~9 |
| ≤ 180 | 21 | ~9 |
| ≤ 365 | 30 | ~12 |
| > 365 | 60 | ~6-8 |

### `getFullWidthLabelInterval` (full-width charts)
Current max return: `7`. Add tiers:

| Data length | Interval | Approx labels shown |
|---|---|---|
| ≤ 120 | 7 | ~17 |
| ≤ 180 | 14 | ~13 |
| ≤ 365 | 21 | ~17 |
| > 365 | 30 | ~12+ |

### `getExerciseLabelInterval` (exercise charts)
Current max return: `20`. Add tiers:

| Data length | Interval | Approx labels shown |
|---|---|---|
| ≤ 150 | 21 | ~7 |
| ≤ 250 | 30 | ~8 |
| ≤ 400 | 45 | ~9 |
| > 400 | 60 | ~7+ |

This is a single-file change (~12 lines added). The intervals use month-friendly numbers (7, 14, 21, 30, 60) so labels land on roughly evenly-spaced dates rather than arbitrary positions.

