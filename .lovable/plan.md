

## Always Populate All Days with Demo Data

### Problem
The demo account currently skips some days to "mimic real-world usage," but this means users loading the demo might land on a day with no data, which is confusing.

### Solution
1. **Change the default** so all days in the range are populated with food entries
2. **Keep weight entries at ~50%** to show realistic workout patterns (most people don't lift every day)
3. **Backfill** by calling the edge function with `clearExisting: true` after deployment

---

### File Changed

| File | Change |
|------|--------|
| `supabase/functions/populate-demo-data/index.ts` | Update defaults to populate all days |

---

### Code Changes

**Line 926 - Change default daysToPopulate:**
```typescript
// Before: Only 80 days, leaving gaps
const daysToPopulate = params.daysToPopulate ?? 80;

// After: Calculate total days in range to fill all days
const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
const daysToPopulate = params.daysToPopulate ?? totalDays; // Fill all days by default
```

This calculates the actual number of days in the range (~121 days for 90 days ago to 30 days from now) and uses that as the default.

---

### Weight Entries (No Change Needed)

The current logic at line 1045 (`Math.random() < 0.5`) already makes weight entries appear on roughly half the days, which is realistic for workout tracking. This stays as-is since:
- Food is logged daily
- Workouts are typically 3-5 days per week

---

### Backfill Process

After deploying, you'll need to call the edge function to repopulate:

```bash
curl -X POST 'https://enricsnosdrhmfvbjaei.supabase.co/functions/v1/populate-demo-data' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"clearExisting": true}'
```

Or I can invoke it directly after deployment if you're logged in as admin.

---

### Result

| Metric | Before | After |
|--------|--------|-------|
| Days with food | ~80/121 (66%) | 121/121 (100%) |
| Days with weights | ~40/121 (33%) | ~60/121 (50%) |
| "Today" always has data | No | Yes |

