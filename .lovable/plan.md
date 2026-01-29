

## Update Ghost Text and Trends Charts for Kg Support

### Overview

Two changes are needed to fully support the user's weight unit preference:

1. **Ghost text placeholders**: The weights input placeholder examples currently show "lbs" but should match the user's selected unit
2. **Trends charts**: The `ExerciseChart` component currently hardcodes "lbs" in multiple places

---

### Part 1: Weight Input Placeholder Examples

**File: `src/components/LogInput.tsx`**

Currently, the weight placeholder examples are defined as a static array (lines 30-38) with hardcoded "lbs":
```typescript
const WEIGHTS_PLACEHOLDER_EXAMPLES = [
  "Describe your workout: 3 sets of 10 reps lat pulldown at 100 lbs",
  // ...
];
```

**Solution**: Create both lbs and kg versions of placeholder examples, then select based on user's preference.

| Change | Detail |
|--------|--------|
| Add new array | `WEIGHTS_PLACEHOLDER_EXAMPLES_KG` with metric examples (e.g., "45 kg") |
| Accept new prop | `weightUnit?: WeightUnit` on LogInput |
| Select placeholders dynamically | Use the appropriate array based on unit |

**New kg placeholder examples:**
```typescript
const WEIGHTS_PLACEHOLDER_EXAMPLES_KG = [
  "Describe your workout: 3 sets of 10 reps lat pulldown at 45 kg",
  "Describe your workout: bench press 4x8 at 60 kg",
  "Describe your workout: squats 5x5 at 85 kg, then leg press 3x12 at 90 kg",
  "Describe your workout: bicep curls 3x12 at 12 kg",
  "Describe your workout: cable rows 4x10 at 35 kg",
  // ...
];
```

**File: `src/pages/WeightLog.tsx`**

Pass the weight unit to LogInput:
```typescript
<LogInput
  mode="weights"
  weightUnit={settings.weightUnit}
  // ... other props
/>
```

---

### Part 2: Trends Page Exercise Charts

**File: `src/pages/Trends.tsx`**

The `ExerciseChart` component has three locations where "lbs" is hardcoded:

| Line | Current | Change |
|------|---------|--------|
| 118 | `Max: {exercise.maxWeight} lbs` | Convert and use dynamic unit label |
| 139 | `${weight} lbs` (tooltip) | Convert and use dynamic unit label |
| 61 | `label: ${d.weight}` (bar label) | Convert weight value for display |

**Solution**:

1. Import `useUserSettings` hook in Trends.tsx
2. Pass `weightUnit` as a prop to `ExerciseChart`
3. Update ExerciseChart to:
   - Convert `maxWeight` for header display
   - Convert `weight` values in chart data for bar heights and labels
   - Update tooltip text with correct unit

**Chart data transformation:**
```typescript
// Convert weight data for display in user's preferred unit
const chartData = useMemo(() => {
  return exercise.weightData.map((d, index) => {
    const displayWeight = unit === 'kg' 
      ? Math.round(d.weight * 0.453592) 
      : d.weight;
    return {
      ...d,
      weight: displayWeight,  // For bar height
      label: `${d.sets}×${d.reps}×${displayWeight}`,
      // ...
    };
  });
}, [exercise.weightData, unit]);
```

**Max weight in header:**
```typescript
const maxWeightDisplay = unit === 'kg' 
  ? Math.round(exercise.maxWeight * 0.453592)
  : exercise.maxWeight;

<ChartSubtitle>Max: {maxWeightDisplay} {unit}</ChartSubtitle>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/LogInput.tsx` | Add kg placeholder array, accept `weightUnit` prop, select placeholders dynamically |
| `src/pages/WeightLog.tsx` | Pass `weightUnit` to LogInput |
| `src/pages/Trends.tsx` | Import `useUserSettings`, pass unit to `ExerciseChart`, update chart rendering |

---

### Technical Notes

- All stored values remain in pounds (database unchanged)
- Conversions happen at display time only
- For kg display: use `Math.round()` for whole numbers (matching the lbs display style)
- The `formatWeight` utility could be used, but for chart performance, inline conversion is preferred

