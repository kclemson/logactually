

## Fix Display Macros to match other settings rows

### Problem
The Display Macros section uses a vertical stacked layout that breaks the visual pattern every other row follows (`flex justify-between` with label left, control right).

### Change — `src/components/settings/PreferencesSection.tsx`

Switch back to the standard row pattern used everywhere else:

```text
Display macros              [Net Carbs ▾]
Values shown in tables      [Carbs      ▾]
  & charts                  [Fiber      ▾]
                           Reset to default
```

- Outer wrapper: `flex items-start justify-between` (same as toggle rows)
- Left side: label + shortened subtitle ("Values shown in tables & charts")
- Right side: `flex flex-col gap-1.5 items-end` with the 3 `Select` dropdowns + conditional reset link
- Dropdowns stay `w-[150px] h-8 text-xs`

This matches exactly how "Enable Custom logging" and "Daily Calorie Target" rows are structured — label+subtitle left, controls right.

One file, ~10 lines changed. No new logic.

