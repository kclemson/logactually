

## Switch Save Suggestion Detection to Creation Time

### Why This Change

Optimize for new user onboarding: when a user backdates historical entries in a single session (e.g., logging December, January, and February workouts all at once), they should immediately see "Save as Routine?" prompts based on their recent *logging activity*, not the calendar dates.

### Current Behavior

| Hook | Current Filter |
|------|----------------|
| `useRecentFoodEntries` | `.gte('eaten_date', cutoffDate)` |
| `useRecentWeightEntries` | `.gte('logged_date', cutoffDate)` |

Both filter by the calendar date of the entry, meaning backdated entries outside the 90-day window are excluded from pattern detection.

### New Behavior

Switch both hooks to filter by `created_at` instead:
- Detects patterns based on **when you logged** items
- Backdated entries are included if logged recently
- New users filling in historical data will see save suggestions immediately

---

### Technical Changes

#### File: `src/hooks/useRecentFoodEntries.ts`

1. **Line 25**: Change cutoff to ISO timestamp for `created_at` comparison
2. **Line 30**: Filter by `created_at` instead of `eaten_date`
3. **Line 31-32**: Order by `created_at` for consistency
4. **Update docstring** to reflect the change

```typescript
// Line 25: Generate ISO timestamp instead of date string
const cutoffDate = subDays(new Date(), daysBack).toISOString();

// Line 30: Filter by created_at
.gte('created_at', cutoffDate)

// Lines 31-32: Order by created_at
.order('created_at', { ascending: false })
```

#### File: `src/hooks/useRecentWeightEntries.ts`

1. **Line 18**: Change cutoff to ISO timestamp
2. **Line 22**: Add `created_at` to the select fields
3. **Line 23**: Filter by `created_at` instead of `logged_date`
4. **Line 24**: Order by `created_at`

```typescript
// Line 18: Generate ISO timestamp
const cutoffDate = subDays(new Date(), daysBack).toISOString();

// Line 22-24: Select created_at and filter/order by it
.select('entry_id, logged_date, exercise_key, source_routine_id, created_at')
.gte('created_at', cutoffDate)
.order('created_at', { ascending: false })
```

---

### Test Scenario: New User Backdating

1. Clear any existing data or use a fresh account
2. Log "leg press 200 lbs" for **December 15** (backdated)
3. Log "leg press 220 lbs" for **January 15** (backdated)  
4. Log "leg press 230 lbs" for **today**

**Expected**: After the 3rd log, see "You've logged similar exercises 3 times. Save as Routine?"

**Old behavior**: Would NOT trigger because December 15 and January 15 might be outside the 90-day `logged_date` window.

---

### Note

This change is isolated to the detection hooks. The cache invalidation bug (new entries not refreshing the query) is a separate fix we'll tackle next.

