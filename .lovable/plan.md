

## Increase Exercise Chart Threshold to 25

### Overview

Change the default number of exercise charts displayed on the Trends page from 6 to 25, so users see more of their logged exercises without needing to use the dropdown.

---

### File to Modify

**`src/pages/Trends.tsx`**

---

### Changes

**Update the slice threshold (lines 197-198)**

```typescript
// Before
const top6Exercises = weightExercises.slice(0, 6);
const remainingExercises = weightExercises.slice(6);

// After
const top25Exercises = weightExercises.slice(0, 25);
const remainingExercises = weightExercises.slice(25);
```

**Update the variable reference in JSX (line 277)**

```typescript
// Before
{top6Exercises.map((exercise) => (

// After
{top25Exercises.map((exercise) => (
```

---

### Summary

- 1 file modified
- 2 lines changed (variable name and slice value)
- Users now see up to 25 exercise charts by default
- "More exercises" dropdown only appears if user has logged 26+ different exercises

