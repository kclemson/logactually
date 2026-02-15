

# Always Show RYG Hint Text

## Change

In `src/components/settings/PreferencesSection.tsx`, remove the conditional that swaps between the configured target summary and the RYG hint. Always show the RYG colored-dot hint text ("Show ... color indicators on calendar view") regardless of whether a target is configured.

## Technical Details

### File: `src/components/settings/PreferencesSection.tsx`

Replace the conditional block (lines ~75-82) with just the static RYG hint:

```tsx
<p className="text-[10px] text-muted-foreground/70">
  Show <span className="text-green-500 dark:text-green-400">●</span>{' '}
  <span className="text-amber-500 dark:text-amber-400">●</span>{' '}
  <span className="text-rose-500 dark:text-rose-400">●</span>{' '}
  color indicators on calendar view
</p>
```

Remove the `effectiveTarget` conditional and the `getEffectiveDailyTarget` import (and the `effectiveTarget` variable) if no longer used elsewhere in this file.

One file changed, no logic or consumer impact.

