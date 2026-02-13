

## Reorder Settings toggles and update label

**File**: `src/pages/Settings.tsx`

Two changes in the Preferences section:

1. **Update label** (current ~line 232): Change `"Log Other Things"` to `"Show other logging types (weight, measurements, mood, and more)"`

2. **Move the "Log Other Things" toggle block above "Show Exercise"**: Currently the order is Show Exercise, then Log Other Things, then Weight Units, then Calorie Burn. The problem is Log Other Things sits between Show Exercise and the weight-specific rows. Move it so the order becomes:

   - Theme
   - Daily Calorie Target
   - **Show other logging types** (moved up)
   - Show Exercise
   - Weight Units (conditional)
   - Calorie Burn (conditional)

This keeps the exercise-specific settings grouped together below the Show Exercise toggle.

One file changed, ~15 lines moved/edited.

