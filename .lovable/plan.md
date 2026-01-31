

## Fix Duration Rounding for Accurate Speed Calculations

### Problem

When inputting "1 mile run in 11:33 minutes":
- The AI parses this as ~11.55 minutes
- Line 219 rounds to 12: `Math.round(duration_minutes)`
- The database column is `integer` - cannot store decimals
- Result: 12 min stored, 5.0 mph shown instead of accurate 5.2 mph

### Solution

**1. Database Migration**

Change `duration_minutes` from `integer` to `numeric`:

```sql
ALTER TABLE weight_sets 
ALTER COLUMN duration_minutes TYPE numeric USING duration_minutes::numeric;
```

**2. Edge Function Update**

Update line 219 in `supabase/functions/analyze-weights/index.ts`:

```typescript
// Before:
duration_minutes: hasCardioData && duration_minutes > 0 ? Math.round(duration_minutes) : null,

// After (match distance_miles pattern - 2 decimal precision):
duration_minutes: hasCardioData && duration_minutes > 0 ? Math.round(duration_minutes * 100) / 100 : null,
```

### Result

| Input | Before | After |
|-------|--------|-------|
| "11:33 run" | 12 min, 5.0 mph | 11.55 min, 5.2 mph |
| "45 min bike" | 45 min | 45 min (unchanged) |

### Files Modified

| File | Change |
|------|--------|
| Database migration | `duration_minutes` integer → numeric |
| `supabase/functions/analyze-weights/index.ts` | Line 219: preserve 2 decimal places |

