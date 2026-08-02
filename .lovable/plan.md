# Quick Add: better demo routines + pin control in Settings

## 1. Demo account routines feel arbitrary

Today the demo generator builds ~70% single-exercise routines (that's why "Leg Extension" ends up as the habitual routine), ~20% two-exercise minis, ~10% full-day templates, and then picks the *first* strength routine as the habit item.

Change the generation so the habitual items read like real habits:

- Prefer named day-style routines ("Leg Day", "Upper Body Day", "Push Day", "Pull Day", "Arms Finisher", "Quick Pull") for the first routines created, so the routine chosen as the strength habit is always a day/theme routine, never a single isolation lift.
- Keep single-exercise routines in the mix, but only after the day routines are allocated, so they stay in the tail of the list rather than becoming the habit.
- Keep the existing guarantee of one cardio routine as the cardio habit.
- Bias which routine is picked as `habitStrengthRoutine` toward a multi-exercise routine explicitly, instead of "first in list".

Result: after re-running Populate Demo Data, Quick Add for exercise shows things like "Leg Day" and "Morning Run" rather than "Leg Extension".

## 2. Manual pin/unpin from Settings

Yes — Settings is the right home for this, and the plumbing already exists: `settings.quickAddPinned` / `quickAddHidden` are respected by the selection logic and pins bypass the frequency and recency thresholds.

Add a small pin icon button to each saved meal and saved routine row in Settings:

- Outline pin = not pinned, filled/accent pin = pinned to Quick Add.
- Tapping toggles the id in `quickAddPinned`; pinning also clears it from `quickAddHidden` (so a previously dismissed item comes back).
- `title` tooltip text: "Pin to Quick Add" / "Unpin from Quick Add".
- Hidden when the user is read-only, and hidden (or shown disabled with an explanatory tooltip) when Quick Add is turned off in Preferences.

Behaviour stays consistent with the log pages: the "Remove from Quick Add" menu item there writes `quickAddHidden`, and pinning from Settings undoes it.

## Technical notes

- `supabase/functions/populate-demo-data/index.ts`: reorder `generateSavedRoutines` shape-mix and adjust `habitStrengthRoutine` choice.
- `src/components/SavedItemRow.tsx`: add optional `isPinned` / `onTogglePin` props rendering the pin button before the delete popover (shared by both meals and routines).
- `src/components/SavedMealRow.tsx` and `SavedRoutineRow` pass the props through.
- `src/components/settings/SavedMealsSection.tsx` and `SavedRoutinesSection.tsx`: read `settings.quickAddPinned` / `quickAddHidden` and call `updateSettings` on toggle.
- No database or schema changes; pins already live in the profile settings JSON.
