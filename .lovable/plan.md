
# Three Changes: Deficit Alignment, Metabolic Dropdown, and Label Update

## 1. Fix deficit input alignment (CalorieTargetDialog.tsx, line 236)

The current `w-[8.5rem]` container is too narrow for "minus" + input + "cal/day". Widen to `w-[11rem]` so all three elements fit without clipping, while the outer `justify-between` keeps the row aligned with the biometrics rows above.

## 2. Replace metabolic profile toggle buttons with a Select dropdown (BiometricsInputs.tsx, lines 238-260)

Replace the three-button toggle (Average / Female / Male) with a Radix Select dropdown, matching the style used elsewhere in settings (e.g., theme picker, calorie target mode). Also rename "Average" to "Unspecified".

### Before
Three small bordered buttons in a row.

### After
A compact Select dropdown (similar width to other biometrics right-column elements) with three options:
- Unspecified (value: null, stored as empty string for Select compatibility)
- Female
- Male

---

## Technical Details

### CalorieTargetDialog.tsx (line 236)
- Change `w-[8.5rem]` to `w-[11rem]`

### BiometricsInputs.tsx
- Add imports for `Select, SelectTrigger, SelectContent, SelectItem, SelectValue` from `@/components/ui/select`
- Update `compositionOptions` array: rename "Average" label to "Unspecified"
- Replace the button-based metabolic profile section (lines 244-258) with a Select dropdown using the `rightColClass` container for alignment
- Map `null` body composition to a string like `"unspecified"` for Select value compatibility, converting back to `null` on change
