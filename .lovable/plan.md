

## Add Changelog Entry for Calorie Burn Estimation

### New entry

**Date:** Feb-11

**Suggested blurb:** "Added estimated calorie burn for exercises. Enable it in Settings to see per-exercise and daily burn estimates on your Weight Log, calculated using MET values from the 2024 Compendium of Physical Activities. Optionally provide your body weight, height, age, and metabolic profile to narrow the estimated range."

**Image:** The uploaded screenshot will be copied to `public/changelog/calorie-burn-config.png` and referenced in the entry.

### File changes

**`src/pages/Changelog.tsx`**
- Replace the existing Feb-11 entry (photo-based food logging) with this new one, and move the photo entry to its original position below
- Actually, since both are dated Feb-11, add this as a new entry at the top and keep the photo entry as-is
- Update `LAST_UPDATED` if needed (already "Feb-11-26", no change needed)

**`src/pages/Settings.tsx`**
- Already says "last updated Feb-11" -- no change needed

### Changelog array update

Add at position 0 (top of array):
```ts
{ date: "Feb-11", text: "Added estimated calorie burn for exercises. Enable it in Settings to see per-exercise and daily burn estimates on your Weight Log, calculated using MET values from the 2024 Compendium of Physical Activities. Optionally provide your body weight, height, age, and metabolic profile to narrow the estimated range.", image: "calorie-burn-config.png" },
```

### Asset copy

Copy `user-uploads://image-692.png` to `public/changelog/calorie-burn-config.png`

