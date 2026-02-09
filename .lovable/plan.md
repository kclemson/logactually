

## Hide Calorie Target Dot for Today in Calendar View

### What Changes

The calorie target dot currently shows on today's cell in the History calendar (visible as the green dot on Feb 9 in the screenshot). It should be hidden for today, matching the Food Log behavior where the dot only appears for past days.

### Fix

In `src/pages/History.tsx`, add `!isTodayDate` to the condition that renders the target dot inside the calendar cell.

```
// Before
{settings.dailyCalorieTarget && settings.dailyCalorieTarget > 0 && (
  <span className={...}>●</span>
)}

// After
{!isTodayDate && settings.dailyCalorieTarget && settings.dailyCalorieTarget > 0 && (
  <span className={...}>●</span>
)}
```

Single condition addition, one file affected.

