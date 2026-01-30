

## Truncate Muscle Groups with Tooltip

### Overview
Limit the muscle group display to prevent line wrapping, while adding a native `title` tooltip to show the full list on hover.

---

### Changes to `src/lib/exercise-metadata.ts`

#### 1. Add New Function for Truncated Display (after line 102)

Add a new function that returns both the truncated display string and the full string:

```tsx
// Returns truncated display with full text for tooltip
export function getMuscleGroupDisplayWithTooltip(exerciseKey: string): { display: string; full: string } | null {
  const muscles = EXERCISE_MUSCLE_GROUPS[exerciseKey];
  if (!muscles) return null;
  
  if (!muscles.secondary?.length) {
    return { display: muscles.primary, full: muscles.primary };
  }
  
  const full = `${muscles.primary}, ${muscles.secondary.join(', ')}`;
  
  // If 2 or fewer secondary muscles, no truncation needed
  if (muscles.secondary.length <= 2) {
    return { display: full, full };
  }
  
  // Truncate: show primary + 2 secondary + indicator
  const shownSecondary = muscles.secondary.slice(0, 2);
  const remainingCount = muscles.secondary.length - 2;
  const display = `${muscles.primary}, ${shownSecondary.join(', ')} +${remainingCount}`;
  
  return { display, full };
}
```

---

### Changes to `src/pages/Trends.tsx`

#### 1. Update Import (line 18)

```tsx
// From:
import { getMuscleGroupDisplay } from "@/lib/exercise-metadata";

// To:
import { getMuscleGroupDisplayWithTooltip } from "@/lib/exercise-metadata";
```

#### 2. Update ChartSubtitle Usage (lines 157-162)

Wrap the muscle group text in a `<span>` with a `title` attribute for the native tooltip:

```tsx
// From:
<ChartSubtitle>
  Max: {maxWeightDisplay} {unit}
  {getMuscleGroupDisplay(exercise.exercise_key) && (
    <> · {getMuscleGroupDisplay(exercise.exercise_key)}</>
  )}
</ChartSubtitle>

// To:
<ChartSubtitle>
  Max: {maxWeightDisplay} {unit}
  {(() => {
    const muscleInfo = getMuscleGroupDisplayWithTooltip(exercise.exercise_key);
    if (!muscleInfo) return null;
    return (
      <span title={muscleInfo.full}> · {muscleInfo.display}</span>
    );
  })()}
</ChartSubtitle>
```

---

### Examples

| Exercise | Display | Tooltip (on hover) |
|----------|---------|-------------------|
| Deadlift | Glutes, Hamstrings, Quads +2 | Glutes, Hamstrings, Quads, Hips, Lower Back |
| Clean | Quads, Hamstrings, Glutes +2 | Quads, Hamstrings, Glutes, Shoulders, Upper Back |
| Squat | Quads, Glutes, Hips +1 | Quads, Glutes, Hips, Abs |
| Lat Pulldown | Back, Biceps | Back, Biceps |
| Bench Press | Chest, Triceps | Chest, Triceps |

---

### Result
- All chart subtitles stay on a single line
- Hovering over the muscle group text shows the full list via native browser tooltip
- No external tooltip library needed - uses simple HTML `title` attribute

