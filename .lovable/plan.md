

# Add changelog entry for rolling calorie target summary

## Changes

### 1. Copy screenshot to public/changelog/
Copy the uploaded image `calorie_rolling.png` to `public/changelog/calorie-rolling.png`.

### 2. Add new changelog entry (`src/pages/Changelog.tsx`)
Insert a new entry at the top of `CHANGELOG_ENTRIES` dated "Feb-16":

> "Added rolling 7-day and 30-day average calorie summaries to the Calendar view, with color-coded status dots showing whether you're on track relative to your daily target. Works across all calorie target modes — fixed, exercise-adjusted, and estimated burn rate. Also added tooltips on the Food Log and Calendar pages that break down the math behind your target."

Image: `calorie-rolling.png`

### 3. Update `LAST_UPDATED` (`src/pages/Changelog.tsx`)
Change from `"Feb-15-26"` to `"Feb-16-26"`.

### 4. Update Settings link text (`src/components/settings/AboutSection.tsx`)
Change `"Changelog (last updated Feb-15)"` to `"Changelog (last updated Feb-16)"`.

