

## Fix Height Unit Conversion Math

### Problem

When switching between "in" and "cm" in the height field, the conversion uses `settings.heightInches` (the stored value from React Query) rather than the current display value. Due to React's render cycle, these values can be out of sync, leading to incorrect conversions. The fix is to derive the conversion from `heightDisplay` (what the user actually sees) instead of the stored settings value.

### Technical Details

**`src/components/CalorieBurnDialog.tsx`** -- update `handleHeightUnitChange` (lines 183-192):

Replace the current logic that reads `settings.heightInches` with logic that:
1. Parses the current `heightDisplay` string
2. Converts using the *previous* unit (`settings.heightUnit`, which hasn't been updated yet in this render) to the *new* unit
3. Updates the display with the converted value

```typescript
const handleHeightUnitChange = (unit: 'in' | 'cm') => {
  const currentVal = parseFloat(heightDisplay);
  if (!isNaN(currentVal) && currentVal > 0) {
    if (settings.heightUnit === 'in' && unit === 'cm') {
      setHeightDisplay(String(Math.round(currentVal * 2.54)));
    } else if (settings.heightUnit === 'cm' && unit === 'in') {
      setHeightDisplay(String(Math.round(cmToInches(currentVal) * 10) / 10));
    }
  }
  updateSettings({ heightUnit: unit });
};
```

Also moves `updateSettings` to the end so `settings.heightUnit` still reflects the *old* unit during conversion logic.

### Files Changed
- `src/components/CalorieBurnDialog.tsx` -- fix `handleHeightUnitChange` to convert from display value
