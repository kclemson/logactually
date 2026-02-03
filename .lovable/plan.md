

## Fix: Stop Storing "From saved routine" Placeholder

### Root Cause

On **line 283** in `src/pages/WeightLog.tsx`:

```typescript
createEntryFromExercises(exercises, `From saved routine`, routineId);
```

When you log a saved routine, the code explicitly stores `"From saved routine"` as the `raw_input` field. This is redundant because:
1. We already pass `routineId` as `source_routine_id`
2. The database function now resolves the actual routine name

Editing entries afterward doesn't affect this - the placeholder text is set at creation time.

---

### Fix

Change line 283 from:
```typescript
createEntryFromExercises(exercises, `From saved routine`, routineId);
```

To:
```typescript
createEntryFromExercises(exercises, null, routineId);
```

---

### Additional Fix for Display

Since existing data already has this placeholder, also update the tooltip logic to handle it:

**File: `src/pages/Admin.tsx` (weight tooltip)**

Change the condition to skip the placeholder text:
```typescript
{entry.raw_input && entry.raw_input !== "From saved routine" ? (
  <p>...</p>
) : entry.saved_routine_name ? (
  <p>...</p>
) : (
  <p>...</p>
)}
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/WeightLog.tsx` | Pass `null` instead of `"From saved routine"` placeholder |
| `src/pages/Admin.tsx` | Handle legacy `"From saved routine"` values in tooltip |

