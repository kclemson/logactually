

## Persist Cardio Chart MPH Toggle to LocalStorage

### Summary

Add localStorage persistence for the time/mph toggle on cardio charts that support it (walk_run and cycling). When you switch to mph view, that preference will be remembered for each exercise type.

### Current Behavior
- Line 111: `const [showMph, setShowMph] = useState(false);`
- Every time you navigate away and come back to Trends, the toggle resets to "time" view

### Proposed Behavior
- Each exercise with distance tracking gets its own persisted preference
- LocalStorage key format: `trends-mph-{exercise_key}` (e.g., `trends-mph-walk_run`, `trends-mph-cycling`)
- On mount, reads from localStorage; on toggle, writes to localStorage

### Implementation

**File:** `src/pages/Trends.tsx`

**Change 1:** Update `showMph` state initialization (line 111)

Replace:
```tsx
const [showMph, setShowMph] = useState(false);
```

With:
```tsx
const [showMph, setShowMph] = useState(() => {
  if (!supportsSpeedToggle) return false;
  return localStorage.getItem(`trends-mph-${exercise.exercise_key}`) === 'true';
});
```

**Change 2:** Update the toggle handler (line 216)

Replace:
```tsx
const handleHeaderClick = supportsSpeedToggle ? () => setShowMph(!showMph) : undefined;
```

With:
```tsx
const handleHeaderClick = supportsSpeedToggle 
  ? () => {
      const newValue = !showMph;
      localStorage.setItem(`trends-mph-${exercise.exercise_key}`, String(newValue));
      setShowMph(newValue);
    }
  : undefined;
```

### Why This Pattern

This follows the existing patterns in the same file:
- `trends-period` (lines 301-304, 537): Period selector persistence
- `dismissed-duplicate-exercises` (lines 306-313, 379): Dismissed duplicates persistence

Both use the same approach: initialize from localStorage in useState, save in the handler.

### LocalStorage Keys

| Exercise | Key |
|----------|-----|
| Walk/Run | `trends-mph-walk_run` |
| Cycling | `trends-mph-cycling` |

### Testing

1. Go to Trends page
2. Find a walk_run or cycling chart
3. Click the header to toggle to "mph" view
4. Navigate to another page (e.g., /weights)
5. Return to Trends
6. Verify the chart is still in "mph" view

