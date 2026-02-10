

## Trim Distance (Miles) to 2 Decimal Places

### Problem

Distance values like `1.380000000000001` are showing up due to floating-point aggregation. This affects the Trends page tooltips, chart labels, and the Weight Log's cardio shorthand and expanded detail view.

### Changes

All distance display points will use `.toFixed(2)` instead of raw values or `.toFixed(1)`.

**File: `src/components/WeightItemsTable.tsx`**

Three locations:
1. **Line 501** (cardio shorthand label): `dist.toFixed(1)` changes to `dist.toFixed(2)`
2. **Line 654/660** (weight column fallback for cardio): `Number(item.distance_miles).toFixed(1)` changes to `Number(item.distance_miles).toFixed(2)`
3. **Lines 754, 758** (expanded entry detail view): raw `${distance}` changes to `${distance.toFixed(2)}`

**File: `src/pages/Trends.tsx`**

Two locations:
1. **Line 188** (chart bar label in distance mode): `.toFixed(1)` changes to `.toFixed(2)`
2. **Lines 351, 361, 367** (tooltip): raw `${distance}` references change to use `.toFixed(2)`

