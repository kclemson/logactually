

## Add Minutes Per Mile to Cardio Tooltips + Fix Duration Decimals

### Overview

Enhance the cardio chart tooltips to show pace (min/mi) alongside mph and distance for runners who think in terms of pace. Also fix the long decimal duration display in the Weight Log page.

---

### Changes

#### 1. Add Pace to Tooltip (Trends.tsx)

**Location**: Line 261-262 in the tooltip formatter

**Current:**
```typescript
if (showMph && entry.payload.mph) {
  return `${entry.payload.mph} mph · ${distance} mi`;
}
```

**Updated:**
```typescript
if (showMph && entry.payload.mph) {
  const pace = entry.payload.pace; // pre-calculated min/mi
  return `${entry.payload.mph} mph · ${pace} min/mi · ${distance} mi`;
}
```

---

#### 2. Pre-calculate Pace in Chart Data (Trends.tsx)

**Location**: Line 126-128 in `chartData` useMemo

Add pace calculation alongside mph:
```typescript
const mph = d.distance_miles && d.duration_minutes 
  ? Number((d.distance_miles / (d.duration_minutes / 60)).toFixed(1))
  : null;
const pace = d.distance_miles && d.duration_minutes
  ? Number((d.duration_minutes / d.distance_miles).toFixed(1))
  : null;
```

And include `pace` in the returned data object.

---

#### 3. Fix Duration Decimals in Weight Log (WeightItemsTable.tsx)

**Locations**: 
- Line 561: Table cell display
- Line 619: Expanded cardio metadata

**Fix:**
```typescript
// Line 561: Table cell
`${Number(item.duration_minutes).toFixed(1)} min`

// Line 619: Expanded view
parts.push(`${Number(ex.duration_minutes).toFixed(1)} min`);
```

---

#### 4. Fix Duration Decimals in Routine Dialogs

**Files**: `SaveRoutineDialog.tsx` (line 33), `CreateRoutineDialog.tsx` (line 30)

Apply same `.toFixed(1)` formatting for consistency.

---

### Result

| Component | Before | After |
|-----------|--------|-------|
| Tooltip (mph view) | `5.1 mph · 1 mi` | `5.1 mph · 11.7 min/mi · 1 mi` |
| Weight Log table | `11.666666666666666 min` | `11.7 min` |
| Cardio metadata | `11.666666666666666 min` | `11.7 min` |

---

### Why min/mi as decimal vs mm:ss?

Using `11.7 min/mi` (decimal) instead of `11:42` (mm:ss) for consistency:
- Matches the mph format (also uses decimal)
- Simpler implementation
- Can revisit mm:ss format later if preferred

