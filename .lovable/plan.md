
# Add Color Indicator Hint to CalorieTargetDialog

## Change

In `src/components/CalorieTargetDialog.tsx`, add the same RYG dot hint text that appears on the Settings page underneath the "Daily calorie target" label inside the dialog. This hint should always be visible regardless of the toggle state, so users understand what the feature does before enabling it.

## Technical Details

### File: `src/components/CalorieTargetDialog.tsx`

Update the toggle row (around line 107-108) to wrap the label in a `div` and add the hint text below it:

```tsx
{/* Enable toggle */}
<div className="flex items-center justify-between pt-2">
  <div>
    <p className="text-sm font-medium">Daily calorie target</p>
    <p className="text-[10px] text-muted-foreground/70">
      Show <span className="text-green-500 dark:text-green-400">●</span>{' '}
      <span className="text-amber-500 dark:text-amber-400">●</span>{' '}
      <span className="text-rose-500 dark:text-rose-400">●</span>{' '}
      color indicators on calendar view
    </p>
  </div>
  <button ...>
```

This mirrors the exact same hint markup already used in `PreferencesSection.tsx` (around line 77), keeping the UI consistent between the settings row and the dialog.

One file, one spot changed.
