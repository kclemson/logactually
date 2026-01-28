

## Fix Timezone Bug in Weight Trends Chart

The Leg Press chart is showing "Jan 27" when the data is actually from Jan 28 due to a JavaScript timezone parsing bug.

---

### Root Cause

When parsing a date string like `"2026-01-28"` with `new Date()`, JavaScript interprets it as midnight UTC. For users in western timezones (like Pacific Time, UTC-8), this UTC time converts to the **previous day** in local time:

```
"2026-01-28" → 2026-01-28T00:00:00Z (UTC midnight)
                    ↓ (in Pacific Time)
              2026-01-27T16:00:00 (Jan 27!)
```

This affects line 119 in `src/pages/Trends.tsx`:
```typescript
dateLabel: format(new Date(d.date), 'MMM d'),
```

The same issue exists on line 217 for food trends.

---

### Database Verification

| logged_date | exercise_key | weight_lbs |
|-------------|--------------|------------|
| 2026-01-28  | leg_press    | 160        |
| 2026-01-25  | leg_press    | 180        |
| 2026-01-23  | leg_press    | 180        |

**There is no Leg Press on Jan 27.** The bar showing "Jan 27, 160 lbs" is actually the Jan 28 entry mislabeled due to the timezone bug.

---

### Solution

Add a time component when parsing to avoid timezone shifts. Using noon (`T12:00:00`) ensures the date stays correct regardless of timezone:

```typescript
// Before (buggy)
dateLabel: format(new Date(d.date), 'MMM d'),

// After (fixed)
dateLabel: format(new Date(`${d.date}T12:00:00`), 'MMM d'),
```

---

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | 119 | Fix weight trends date parsing |
| `src/pages/Trends.tsx` | 217 | Fix food trends date parsing |

---

### Changes

**Line 119 (ExerciseChart):**
```typescript
// Current
dateLabel: format(new Date(d.date), 'MMM d'),

// Fixed
dateLabel: format(new Date(`${d.date}T12:00:00`), 'MMM d'),
```

**Line 217 (food chartData):**
```typescript
// Current
date: format(new Date(date), 'MMM d'),

// Fixed
date: format(new Date(`${date}T12:00:00`), 'MMM d'),
```

---

### Why This Works

By specifying `T12:00:00` (noon local time), the date parsing stays in local timezone context rather than UTC. Even with timezone offsets up to +/- 12 hours, the date will remain on the correct calendar day.

---

### After Fix

The Leg Press chart will correctly show:
- Jan 28: 160 lbs (today's entry)
- Jan 25: 180 lbs
- Jan 23: 180 lbs
- etc.

And the Log Weights page for Jan 27 will correctly show no Leg Press entries (because there aren't any).

