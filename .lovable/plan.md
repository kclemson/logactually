

## Add Changelog Entry for Calorie Burn Estimation

### What happens

Add a **new** entry at the top of the changelog array (position 0), keeping the existing Feb-11 photo-food-logging entry intact.

### File changes

**`src/pages/Changelog.tsx`**

Add this line at the top of the `CHANGELOG_ENTRIES` array (before the existing Feb-11 entry):

```ts
{ date: "Feb-11", text: "Added estimated calorie burn for exercises. Enable it in Settings to see per-exercise and daily burn estimates on your Weight Log, calculated using MET values from the 2024 Compendium of Physical Activities. Optionally provide your body weight, height, age, and metabolic profile to narrow the estimated range.", image: "calorie-burn-config.png" },
```

No other entries are modified or removed. `LAST_UPDATED` is already "Feb-11-26" so no change needed. Settings page link text is already current.

### Asset

Copy the uploaded screenshot to `public/changelog/calorie-burn-config.png`.

