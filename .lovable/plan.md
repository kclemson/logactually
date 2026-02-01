

## Change Exercise Charts to "Load More" Pattern

Replace the current "top 25 + dropdown for specific exercises" pattern with a simpler "show 10, then load 10 more" approach.

---

### Current vs New Behavior

| Aspect | Current | New |
|--------|---------|-----|
| Initial charts | 25 | 10 |
| Overflow UI | Dropdown to pick specific exercise | "Show more" button |
| Sorting | By session count (descending) | Same |

---

### Technical Changes

**File: `src/pages/Trends.tsx`**

#### 1. Replace state variable

```typescript
// Before
const [extraExercise, setExtraExercise] = useState<string | null>(null);

// After
const [visibleExerciseCount, setVisibleExerciseCount] = useState(10);
```

#### 2. Update derived data

```typescript
// Before
const top25Exercises = weightExercises.slice(0, 25);
const remainingExercises = weightExercises.slice(25);
const selectedExtra = remainingExercises.find((e) => e.exercise_key === extraExercise);

// After
const visibleExercises = weightExercises.slice(0, visibleExerciseCount);
const hasMoreExercises = weightExercises.length > visibleExerciseCount;
```

#### 3. Replace UI

```typescript
// Exercise charts grid - use visibleExercises instead of top25Exercises
<div className="grid grid-cols-2 gap-3">
  {visibleExercises.map((exercise) => (
    <ExerciseChart ... />
  ))}
</div>

// Replace Popover dropdown with simple button
{hasMoreExercises && (
  <Button
    variant="outline"
    size="sm"
    className="w-full"
    onClick={() => setVisibleExerciseCount(prev => prev + 10)}
  >
    Show more
  </Button>
)}
```

#### 4. Remove unused code

- Remove the `selectedExtra` rendering block
- Remove unused imports (`Popover`, `PopoverContent`, `PopoverTrigger`, `ChevronDown`) if no longer needed elsewhere

---

### Summary

| Change | Details |
|--------|---------|
| State | `extraExercise` → `visibleExerciseCount` (default 10) |
| Data | `top25Exercises`/`remainingExercises`/`selectedExtra` → `visibleExercises`/`hasMoreExercises` |
| UI | Popover dropdown → "Show more" button that adds 10 more charts |

