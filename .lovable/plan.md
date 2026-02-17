

# Add "First day of week" setting

## Overview
Add a dropdown letting users choose which day starts their week (Sun–Sat). Affects the History calendar grid and all date-picker calendars. Default: Sunday.

## UI Layout Change in Preferences

Current order:
1. Theme (dropdown)
2. Daily Calorie Target (button)
3. Enable Custom logging (toggle)
4. Enable Exercise logging (toggle)
5. Weight Units (dropdown) -- conditional
6. Show estimated calorie burn (button) -- conditional

New order:
1. Theme (dropdown)
2. Daily Calorie Target (button)
3. Enable Custom logging (toggle)
4. Enable Exercise logging (toggle)
5. Show estimated calorie burn (button) -- conditional, moved up
6. Weight Units (dropdown) -- conditional
7. **First day of week (dropdown)** -- always visible, sits right below Weight Units

This gives two adjacent dropdown rows at the bottom of the section.

## Technical Changes

### 1. `src/hooks/useUserSettings.ts`
- Add `weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6` to the `UserSettings` interface
- Add `weekStartDay: 0` to `DEFAULT_SETTINGS`

### 2. `src/components/settings/PreferencesSection.tsx`
- Move the "Show estimated calorie burn" row above "Weight Units" (both remain inside the `showWeights` conditional)
- Add a new "First day of week" row after the `showWeights` block (always visible), with a Select dropdown listing all 7 days (Sunday through Saturday), ~130px trigger width to match Theme dropdown

### 3. `src/pages/History.tsx`
- Read `settings.weekStartDay`
- Pass `{ weekStartsOn: settings.weekStartDay }` to `startOfWeek` / `endOfWeek` calls
- Rotate the `weekDays` header array so the chosen day appears first

### 4. `src/components/DateNavigation.tsx`
- Accept optional `weekStartDay` prop (default 0)
- Pass `weekStartsOn={weekStartDay}` to the `<Calendar>` component

### 5. Log page callers (FoodLog, WeightLog, OtherLog)
- Read `useUserSettings()` and pass `settings.weekStartDay` to `<DateNavigation>`

### 6. `src/pages/Settings.test.tsx`
- Add `weekStartDay: 0` to the mock settings object

No database migration needed -- stored in the existing JSON `settings` column.
