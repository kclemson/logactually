

## Add Distance View to Cardio Charts

### Overview
Extend cardio charts (walk_run, cycling) to support a third view mode: **Distance**. This creates a 3-way toggle: Time → MPH → Distance → Time...

---

### Key Considerations

**Data Availability**
- Not all cardio entries have distance data (e.g., "30min on treadmill")
- When distance view is selected, entries without distance will be filtered out (same approach as current MPH mode)
- Chart subtitle will indicate when data is limited

**Visual Design**

| Mode | Y-axis | Bar Labels | Subtitle |
|------|--------|------------|----------|
| Time | `duration_minutes` | `30.0` (minutes) | Cardio · time ▾ |
| MPH | `mph` | `5.1` | Cardio · mph ▾ |
| Distance | `distance_miles` | `1.2` (miles) | Cardio · distance ▾ |

---

### Implementation

**1. Change state from boolean to enum** (`src/pages/Trends.tsx`)

Replace:
```tsx
const [showMph, setShowMph] = useState(() => {
  if (!supportsSpeedToggle) return false;
  return localStorage.getItem(`trends-mph-${exercise.exercise_key}`) === 'true';
});
```

With a 3-option mode:
```tsx
type CardioViewMode = 'time' | 'mph' | 'distance';

const [cardioMode, setCardioMode] = useState<CardioViewMode>(() => {
  if (!supportsSpeedToggle) return 'time';
  const saved = localStorage.getItem(`trends-cardio-mode-${exercise.exercise_key}`);
  if (saved === 'mph' || saved === 'distance') return saved;
  return 'time';
});
```

**2. Update localStorage migration**

For backwards compatibility, also check for old `trends-mph-{key}` key:
```tsx
// Migration: convert old boolean to new mode
const legacyMph = localStorage.getItem(`trends-mph-${exercise.exercise_key}`);
if (legacyMph === 'true') {
  localStorage.removeItem(`trends-mph-${exercise.exercise_key}`);
  localStorage.setItem(`trends-cardio-mode-${exercise.exercise_key}`, 'mph');
  return 'mph';
}
```

**3. Update filter logic in chartData**

Current MPH filter also applies to Distance mode (both require distance data):
```tsx
const sourceData = (cardioMode === 'mph' || cardioMode === 'distance')
  ? exercise.weightData.filter(d => d.distance_miles && d.distance_miles > 0)
  : exercise.weightData;
```

**4. Update bar labels**

```tsx
label: isCardio 
  ? (cardioMode === 'mph' 
      ? `${mph}` 
      : cardioMode === 'distance'
        ? `${Number(d.distance_miles || 0).toFixed(1)}`
        : `${Number(d.duration_minutes || 0).toFixed(1)}`)
  : `${d.sets}×${d.reps}×${displayWeight}`,
```

**5. Update Bar dataKey**

```tsx
<Bar 
  dataKey={isCardio 
    ? (cardioMode === 'mph' ? "mph" : cardioMode === 'distance' ? "distance_miles" : "duration_minutes") 
    : "weight"
  }
  // ...
/>
```

**6. Update toggle cycle**

Clicking header cycles: time → mph → distance → time:
```tsx
const handleHeaderClick = supportsSpeedToggle 
  ? () => {
      const nextMode: CardioViewMode = 
        cardioMode === 'time' ? 'mph' :
        cardioMode === 'mph' ? 'distance' : 'time';
      localStorage.setItem(`trends-cardio-mode-${exercise.exercise_key}`, nextMode);
      setCardioMode(nextMode);
    }
  : undefined;
```

**7. Update subtitle display**

```tsx
<ChartSubtitle>
  {supportsSpeedToggle ? (
    <>Cardio · {cardioMode} <span className="opacity-50">▾</span></>
  ) : isCardio ? (
    // ...
  )}
</ChartSubtitle>
```

**8. Update ExerciseTrend interface** (`src/hooks/useWeightTrends.ts`)

Add `maxDistance` field for potential future use in subtitles:
```tsx
export interface ExerciseTrend {
  // ... existing fields
  maxDistance: number;  // Maximum distance in a single session
}
```

And track it during aggregation:
```tsx
trend.maxDistance = Math.max(trend.maxDistance, distance);
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Convert `showMph` boolean to `cardioMode` enum, update filter/label/toggle logic |
| `src/hooks/useWeightTrends.ts` | Add `maxDistance` field to ExerciseTrend interface |

