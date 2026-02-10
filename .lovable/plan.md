

## Add Activity-Specific Icons to Calendar

### What Changes

Each calendar day cell currently shows a single dumbbell icon for any exercise. After this change, it will show specific icons based on what was logged:

- **Dumbbell** -- lifting/strength exercises only
- **Footprints** -- walk/run
- **Bike** -- cycling
- **Activity** (pulse line) -- other cardio (swimming, elliptical, rowing, stair climber, jump rope)

Multiple icons can appear side-by-side if a day has mixed activity types.

### Technical Details (single file: `src/pages/History.tsx`)

**1. Import changes**

Add `Footprints`, `Bike`, `Activity` to the Lucide import. Import `isCardioExercise` from `@/lib/exercise-metadata`.

**2. Update the weight entries query**

Change `.select('logged_date')` to `.select('logged_date, exercise_key')` so we know what type of exercise each row is.

**3. Update `WeightDaySummary` interface**

```typescript
interface WeightDaySummary {
  date: string;
  hasLifting: boolean;
  hasRunWalk: boolean;
  hasCycling: boolean;
  hasOtherCardio: boolean;
}
```

**4. Update aggregation logic**

For each row, classify by `exercise_key`:
- `walk_run` sets `hasRunWalk`
- `cycling` sets `hasCycling`
- Other keys where `isCardioExercise()` returns true set `hasOtherCardio`
- Everything else sets `hasLifting`

**5. Update the `hasWeights` check**

Currently `hasWeights` checks `!!weightByDate.get(dateStr)`. This stays the same -- it means "has any exercise", used for background color and visibility.

**6. Update Row 3 icon rendering**

Replace the single dumbbell with a flex row of conditional icons:

```tsx
<span className={cn(
  "h-3 flex items-center justify-center gap-0.5",
  !(hasWeights && isCurrentMonth) && "invisible"
)}>
  {weightData?.hasLifting && <Dumbbell className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
  {weightData?.hasRunWalk && <Footprints className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
  {weightData?.hasCycling && <Bike className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
  {weightData?.hasOtherCardio && <Activity className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
</span>
```

At most 4 tiny icons (12px each + 2px gaps = ~54px), which fits within the ~50-55px cell width. In practice, 3+ categories on a single day would be rare.

