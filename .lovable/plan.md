
## Add storageKey Props for Persistent Collapsed State

### Summary

Add unique `storageKey` props to all `CollapsibleSection` components in Settings.tsx and Trends.tsx so each section's expanded/collapsed state is persisted independently in localStorage.

### Changes to Trends.tsx

| Line | Section | storageKey to add |
|------|---------|-------------------|
| 556 | Food Trends | `storageKey="trends-food"` |
| 775 | Weights Trends | `storageKey="trends-weights"` |

### Changes to Settings.tsx

| Line | Section | storageKey to add |
|------|---------|-------------------|
| 112 | Account | `storageKey="settings-account"` |
| 152 | Saved Meals | `storageKey="settings-meals"` |
| 187 | Saved Routines | `storageKey="settings-routines"` |
| 222 | Preferences | `storageKey="settings-preferences"` |
| 265 | Export to CSV | `storageKey="settings-export"` |
| 299 | About | `storageKey="settings-about"` |

### localStorage Keys Created

When users collapse/expand sections, these keys will be written:

- `section-trends-food`
- `section-trends-weights`
- `section-settings-account`
- `section-settings-meals`
- `section-settings-routines`
- `section-settings-preferences`
- `section-settings-export`
- `section-settings-about`

### How It Works (Already Built)

The `CollapsibleSection` component already:
1. Reads from localStorage on mount using the `storageKey` prop
2. Persists the new state on toggle
3. Removes the key when returning to the default state (cleanup)

No changes to the component itself are needed.
