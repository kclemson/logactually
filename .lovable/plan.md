

## Add Custom Log Demo Data with "Custom Only" Admin Button

### What gets built

1. A "Weight" custom log type (numeric, lbs) for the demo account with ~25-30 entries showing gradual weight loss from 175 to 165 lbs over 90 days
2. A new "Custom Logs Only" button in the Populate Demo Data dialog that generates only the custom log data without touching food/exercise/saved items
3. The demo user's `showCustomLogs` setting gets enabled automatically

### Changes

**1. Edge function (`supabase/functions/populate-demo-data/index.ts`)**

- Add `generateCustomLogs` boolean to `RequestParams` and `PopulationParams` (default: `false` to avoid changing existing behavior)
- In `doPopulationWork`, after saved routines generation:
  - If `generateCustomLogs` is true:
    1. Delete existing custom_log_entries and custom_log_types for demo user (always clears to regenerate cleanly)
    2. Upsert a "Weight" custom_log_type (name="Weight", value_type="numeric", unit="lbs")
    3. Generate entries every 3-4 days across the date range: `weight = 175 - (progress * 10) + random(-0.5, 0.5)`, rounded to 1 decimal
    4. Update the demo user's profile settings to merge `{ showCustomLogs: true }`
- Also clear custom log data in the `clearExisting` block when `generateCustomLogs` is true
- Add `customLogEntries` to the summary log output

**2. Hook (`src/hooks/usePopulateDemoData.ts`)**

- Add `generateCustomLogs?: boolean` to `PopulateDemoDataParams`
- Add `customLogEntries?: number` to `PopulateSummary`

**3. Dialog (`src/components/PopulateDemoDataDialog.tsx`)**

- Add a third button "Custom Logs Only" in the footer (between "Saved Only" and "Populate All") that calls populate with `generateFood: false, generateWeights: false, generateSavedMeals: 0, generateSavedRoutines: 0, generateCustomLogs: true`
- Display `customLogEntries` count in the result summary
- Add `generateCustomLogs` checkbox to the Options section (checked by default when using "Populate All")

### Technical Details

Weight generation pseudocode:
```text
totalDays = daysBetween(startDate, endDate)
day = 0
while day < totalDays:
  progress = day / totalDays
  weight = 175 - (progress * 10) + (Math.random() - 0.5)
  weight = round to 1 decimal
  insert custom_log_entry(logged_date, numeric_value=weight, unit="lbs")
  day += randomInt(3, 4)
```

This produces ~25-30 data points with a natural-looking decline from 175 to 165 lbs.

Profile settings update (merge, not overwrite):
```text
fetch current settings -> merge { showCustomLogs: true } -> update profile
```
