

## Add Diverging Low Row to Exercise Lists

### Overview

Add "Diverging Low Row" to both the canonical exercise list and the frontend muscle group lookup so it displays "Back" as its muscle group.

---

### File Changes

#### 1. `supabase/functions/_shared/exercises.ts`

Add to the "Upper Body - Pull" section (around line 24):

```typescript
{ key: 'diverging_low_row', name: 'Diverging Low Row', aliases: ['diverging row', 'low row machine', 'plate loaded row'], muscleGroup: 'Back' },
```

---

#### 2. `src/lib/exercise-metadata.ts`

Add to the "Upper Body - Pull" section (around line 21):

```typescript
diverging_low_row: 'Back',
```

---

### Result

| Before | After |
|--------|-------|
| **Diverging Low Row** | **Diverging Low Row** |
| Max: 70 lbs | Max: 70 lbs · Back |

---

### Note

If the exercise was logged with a different key (e.g., `diverging_low_row` vs something else), we may need to check the database to confirm the exact key being used. However, based on the display name "Diverging Low Row", the key is almost certainly `diverging_low_row` following our snake_case convention.

