
## Reduce Default Visible Exercise Charts to 4

A one-line change in `src/pages/Trends.tsx`.

### Change

**`src/pages/Trends.tsx`, line 533**

Change the initial state of `visibleExerciseCount` from `10` to `4`:

```typescript
// Before
const [visibleExerciseCount, setVisibleExerciseCount] = useState(10);

// After
const [visibleExerciseCount, setVisibleExerciseCount] = useState(4);
```

This only affects the individual exercise charts. The Total Volume and Estimated Calorie Burn charts are rendered independently above the exercise list, so they will always be visible regardless of this count.

The "Show more" button (which increments by 10) already exists and will appear whenever there are more than 4 exercises.
