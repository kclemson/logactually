

# Strip units from labels, show them as input suffixes instead

## Problem

Every label carries its unit in parentheses: "Distance (mi):", "Cal Burned (cal):", "Heart Rate (bpm):", "Incline (%):", "Cadence (rpm):". These bloat label width by 30-50% and are the primary reason the left column is too wide. For fields with unit toggles (Distance, Weight), the unit is shown twice -- in the label AND as toggle buttons.

## Solution

1. **Remove unit text from labels entirely.** Labels become just: "Distance:", "Cal Burned:", "Heart Rate:", "Incline:", "Cadence:", "Duration:", "Speed:".

2. **For fields with unit toggles** (Distance, Weight): the toggle buttons (mi/km, lbs/kg) already communicate the unit -- no additional suffix needed.

3. **For plain-unit fields** (Duration, Cal Burned, Effort, Speed, Heart Rate, Incline, Cadence): show the unit as a small text suffix AFTER the input/value, not in the label. This keeps the information visible but moves it out of the width-critical label column.

## Changes

**`src/components/DetailDialog.tsx`**

### Label rendering (lines 147-148 and 184-185)

Currently both grids render labels as:
```
{field.label}{field.unitToggle ? ` (${unit})` : field.unit ? ` (${field.unit})` : ''}:
```

Change to just:
```
{field.label}:
```

### View mode value (line 150-152)

After the value span, add a unit suffix span:
```
<span className="text-sm">{displayValue(...)}</span>
{field.unit && !field.unitToggle && (
  <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
)}
```

### Edit mode value (line 222-227)

After the Input (and after the UnitToggle for toggle fields), add the same suffix for plain-unit fields:
```
{field.unit && !field.unitToggle && (
  <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
)}
```

This is 4 small edits in a single file. Labels shrink dramatically, the grid ratio works properly, and units remain visible as compact suffixes.
