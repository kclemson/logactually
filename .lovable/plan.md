

# Two small fixes

## 1. Update "last updated" text on Settings page
In `src/components/settings/AboutSection.tsx`, change the changelog link text from "Feb-14" to "Feb-15".

## 2. Fix exercise-adjusted example to exclude today and future dates
In `src/components/CalorieTargetDialog.tsx`, the `exampleData` memo currently skips only today's date. Since the demo account has data pre-loaded into the future, the loop can pick up a future date as its example, which doesn't make sense. Change the logic to skip any date that is today or later -- i.e., only consider dates strictly before today.

### Technical details

**File: `src/components/settings/AboutSection.tsx` (line 19)**
```
Changelog (last updated Feb-14)  -->  Changelog (last updated Feb-15)
```

**File: `src/components/CalorieTargetDialog.tsx` (~lines 65-68)**
Replace the today-skip with a "yesterday and earlier" check:
```ts
const todayStr = format(new Date(), 'yyyy-MM-dd');
for (const food of dailyFoodData) {
  if (food.date >= todayStr) continue;   // skip today and any future dates
  ...
```
