

## Streamline Calorie Burn Dialog: Naming, Structure, and Live Preview

### Problem
The current flow has string inconsistency: Settings says "Calorie Burn Estimates", the dialog title repeats "Calorie Burn Estimates", a sub-description says "Estimate how many calories...", and the toggle says "Show estimated calorie burn". Three variations of the same concept creates cognitive noise.

### 1. Single Feature Name

Settle on one name used everywhere: **"Show estimated calorie burn"**

- Settings row label: "Show estimated calorie burn"
- Dialog: uses the same string as the toggle label (no separate title or subtitle needed)
- The dialog header/title becomes just the toggle row itself -- no `DialogTitle` or description paragraph above it

### 2. Simplified Dialog Structure

Remove the `DialogTitle` ("Calorie Burn Estimates") and the description paragraph ("Estimate how many calories each workout burns, shown as a range."). The toggle row "Show estimated calorie burn" IS the header -- it tells the user what this is and lets them control it.

New dialog layout:

```text
[Show estimated calorie burn]  [toggle]

--- Live preview (when enabled) ---
  Walking 25 min               ~65-95 cal est.
  Bench Press 3x10 @135        ~35-50 cal est.
  Running 30 min               ~280-410 cal est.

--- Your info (narrows the range) ---
  Body weight    [___] lbs
  Height         [___] in / cm
  Age            [___]
  Body composition  [Average] [Female] [Male]

--- Workout defaults ---
  Default intensity  [___] /10

--- What affects your estimates ---
  (help text)
```

### 3. Live Preview Section

This is the big new addition. Just below the toggle, show a preview of calorie burn estimates that updates in real-time as the user adjusts their settings.

**Data source:**
- Query the user's most recent weight entries (up to ~5 distinct exercises) from the database
- If the user has no exercises logged yet, show a hardcoded set of sample exercises: Walking 25 min, Running 30 min, Elliptical 20 min, Bench Press 3x10 at 135 lbs

**Display:**
- A compact list: exercise description on the left, calorie burn estimate on the right
- Uses the existing `estimateCalorieBurn()` function with the current dialog settings
- As the user changes weight, height, age, composition, or default intensity, the preview numbers update instantly (since settings are optimistically updated via React Query)
- Subtle label above: "Preview" or no label needed -- the context is obvious

**Implementation:**
- New hook or inline query in `CalorieBurnDialog` to fetch a few recent distinct exercises
- Map them through `estimateCalorieBurn()` with current settings
- Render as a simple list (not using the full `WeightItemsTable` -- just description + estimate)

### 4. Settings Row Update

Change the label from "Calorie Burn Estimates" to "Show estimated calorie burn" to match the feature's single name.

### Technical Details

**Files to modify:**

1. **`src/components/CalorieBurnDialog.tsx`**
   - Remove `DialogHeader`, `DialogTitle`, and the description `<p>` tag
   - Move the toggle to the very top as the first element
   - Add a preview section below the toggle (when enabled) showing recent exercises with live calorie estimates
   - Add a small query (using supabase) to fetch ~5 recent distinct exercises, with fallback sample data
   - Compute estimates inline using `estimateCalorieBurn()` with current settings values

2. **`src/pages/Settings.tsx`**
   - Change the label text from "Calorie Burn Estimates" to "Show estimated calorie burn"

**New data fetching in CalorieBurnDialog:**
- Query `weight_sets` for the current user, select distinct on `exercise_key`, limit 5, ordered by `created_at desc`
- Transform to `ExerciseInput` format
- If no results, use hardcoded samples:
  - Walking, 25 min (walk_run/walking)
  - Running, 30 min (walk_run/running)
  - Elliptical, 20 min (elliptical)
  - Bench Press, 3x10 at 135 lbs (bench_press)

**Preview rendering:**
- Simple rows: `<div>` with description left-aligned, calorie estimate right-aligned in muted text
- Uses `formatCalorieBurn()` for consistent formatting
- Wrapped in a subtle bordered container or light background to visually separate from the controls below

