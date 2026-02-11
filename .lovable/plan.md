

## Change Calorie Burn Button Label When Enabled

### What changes

When "Show estimated calorie burn" is enabled, the button currently displays a summary of your settings (e.g., "150 lbs"). Replace that with "Configure" so it reads as an action label rather than echoing back your weight.

### Technical Details

**`src/pages/Settings.tsx`** -- line 265-266:

Change the enabled-state label from `formatCalorieBurnSettingsSummary(settings) || 'Configured'` to simply `'Configure'`.

The `formatCalorieBurnSettingsSummary` import can also be removed since it will no longer be used anywhere in this file.

### Files Changed
- `src/pages/Settings.tsx` -- change button label on line 266, remove unused import on line 7
