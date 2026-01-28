
## Show Last 7 Days in Daily Stats Table

Change the daily stats table from showing the last 3 days to showing the last 7 days.

---

### Change

**File: `src/pages/Admin.tsx`**

Line 130 - update the slice limit:

```tsx
// Before
{stats.daily_stats.slice(0, 3).map((row) => (

// After  
{stats.daily_stats.slice(0, 7).map((row) => (
```

---

### Note

The database function `get_usage_stats` already fetches 14 days of data, so no backend changes are needed - we're just displaying more of the already-available data.

---

### Files Summary

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Change `.slice(0, 3)` to `.slice(0, 7)` on line 130 |
