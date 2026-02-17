

# Simplify Populate Demo Data dialog to all-checkbox approach

## Current problem

The dialog has three action buttons ("Saved Only", "Custom Logs Only", "Populate All") that are really just shortcuts for specific checkbox combinations. This is confusing -- the checkboxes already exist but get overridden by the button you click.

## New design

Remove the shortcut buttons entirely. Every data type gets its own checkbox. The footer simplifies to just "Cancel" and "Populate". The user checks exactly what they want and clicks one button.

### Checkbox layout

All options in one section:

- Generate Food (existing)
- Generate Exercise (existing)
- Generate Custom Logs (existing)
- Generate Saved Meals (new checkbox, replaces numeric input)
- Generate Saved Routines (new checkbox, replaces numeric input)

When "Generate Saved Meals" is checked, show the count input inline. Same for routines. When unchecked, count is sent as 0.

### Footer

Just two buttons:
- Cancel (ghost)
- Populate (primary, disabled when nothing is checked)

## Technical details

**File: `src/components/PopulateDemoDataDialog.tsx`**

1. Add two new boolean state variables: `generateSavedMeals` (default true) and `generateSavedRoutines` (default true)
2. Move saved meals/routines into the Options checkbox section as two more checkboxes, each with a conditional inline count input
3. Remove `handleRegenerateSavedOnly` and `handleCustomLogsOnly` functions
4. Remove the "Saved Only" and "Custom Logs Only" buttons from the footer
5. Update `handleSubmit` to send `generateSavedMeals ? savedMealsCount : 0` and `generateSavedRoutines ? savedRoutinesCount : 0`
6. Optionally disable the "Populate" button when all five checkboxes are unchecked

