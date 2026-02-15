

# Replace "Configure" with "Edit" on Active Feature Buttons

## Change

In `src/components/settings/PreferencesSection.tsx`, update the two button labels that currently show "Configure" when a feature is enabled to instead show "Edit".

## Technical Details

### File: `src/components/settings/PreferencesSection.tsx`

Two changes:

1. **Daily Calorie Target button** (~line 87): `'Configure'` -> `'Edit'`
2. **Calorie Burn Estimates button** (~line 140): `'Configure'` -> `'Edit'`

Both use the same ternary pattern:
```
{settings.someFlag ? 'Edit' : 'Set up'}
```

Two lines changed, one file.
