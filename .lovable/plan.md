

# Divide Activity Hint by Days With Exercise

## Change

In `src/components/CalorieTargetDialog.tsx`, change the average daily burn calculation to divide by `dailyBurnData.length` (days with exercise) instead of the fixed `30`. Update the hint text to show the count, e.g. "avg ~250 cal/day burned (12 active days)".

## Technical Details

### File: `src/components/CalorieTargetDialog.tsx` (lines 51-56)

Replace:
```tsx
const avgDailyBurn = Math.round(totalMidpoints / 30);
const suggested = suggestActivityLevel(avgDailyBurn);
return { avgDailyBurn, suggested, label: ACTIVITY_LABELS[suggested].label };
```

With:
```tsx
const activeDays = dailyBurnData.length;
const avgDailyBurn = Math.round(totalMidpoints / activeDays);
const suggested = suggestActivityLevel(avgDailyBurn);
return { avgDailyBurn, suggested, label: ACTIVITY_LABELS[suggested].label, activeDays };
```

Update the hint text (~line 186) to include the active days count:
```
Based on your last 30 days: avg ~250 cal/day burned (12 active days) -- closest to "Lightly active"
```

One file changed.
