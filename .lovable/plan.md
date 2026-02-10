

## Apple Health Import Dialog -- Multiple Fixes

### 1. Fix "see how" link styling in dialog

The parentheses are part of the link text, making the underline extend across them. Fix by moving the parentheses outside the button element and matching the text-xs size.

Change from: `(see how)` as button text
To: `(` then `<button>see how</button>` then `)` -- parentheses outside the clickable element.

### 2. Rewrite dialog description text

Replace "Select your exported Apple Health XML file to import workouts." with a more helpful, left-aligned description:

"First, export your exercise data from the Health app on your phone."

The "(see how)" link stays on the same line. Only show this description during the `config` phase -- once scanning is done, the user knows what they're doing.

### 3. Change "Import workouts from" to "Import workouts since"

"Since" reads more naturally -- it implies "everything from this date onward" which is what it does.

### 4. Hide unsupported workout types

Filter out unmapped types from the sorted list entirely instead of showing them grayed out. Change the `sortedTypes` rendering to skip `!info.mapped` entries.

### 5. Fix workout count discrepancy (Walking 416 vs 238 in range)

The type summary `count` tallies ALL workouts in the file regardless of date filter, but "workouts in range" only counts those after the cutoff. The count next to each type name should reflect how many of that type are in the date range, not the total in the file.

Fix: compute per-type counts from `allWorkouts` (the date-filtered list) instead of using `typeSummaries[type].count`.

### 6. Hide header/description after config phase

The DialogDescription with "see how" should only show during the config phase. After scanning, just show the title and the phase-specific content.

### Technical Details

**File: `src/components/AppleHealthImport.tsx`**

**Lines 551-558 (dialog description)**: Rewrite to "First, export your exercise data from the Health app on your phone." with fixed "(see how)" link where parentheses are outside the button. Make this block conditional on `phase === "config"` by passing phase down or moving the description into the dialog content component.

Actually, since the description and "see how" state live in the parent `AppleHealthImport` component but phase lives in the child `AppleHealthImportDialog`, the cleanest approach is:
- Move the description + see-how into the `AppleHealthImportDialog` component (it already has `phase`)
- Or pass a callback/ref up. Simpler: just render the DialogHeader content conditionally from the parent by passing phase up via a callback.

Simplest: Keep DialogTitle always visible. Move the DialogDescription + instructions block into `AppleHealthImportDialog` so it can conditionally render based on phase. Add `showDialogInstructions` state there.

**Lines 349 (date label)**: Change "Import workouts from" to "Import workouts since"

**Lines 400-427 (type list rendering)**: 
- Filter `sortedTypes` to only show mapped types: `.filter(([_, info]) => info.mapped)`
- Compute per-type counts from `allWorkouts` instead of `typeSummaries`

**Lines 402-403 (workout count heading)**: Keep "Workout types found (X workouts in range)" using `allWorkouts.length` which is already correct.

