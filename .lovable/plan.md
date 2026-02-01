

## Add Persistence to Collapsible Sections on Trends & Settings

### Summary

The `CollapsibleSection` component already has localStorage persistence built in via the `storageKey` prop - we just need to add unique `storageKey` values to each section. Currently, all sections fall back to using `'default'` as the key, which would make them all share state.

### Changes Required

**1. Trends.tsx** - Add `storageKey` to each section:

| Section | storageKey |
|---------|------------|
| Food Trends | `"trends-food"` |
| Weights Trends | `"trends-weights"` |

**2. Settings.tsx** - Add `storageKey` to each section:

| Section | storageKey |
|---------|------------|
| Account | `"settings-account"` |
| Saved Meals | `"settings-meals"` |
| Saved Routines | `"settings-routines"` |
| Preferences | `"settings-preferences"` |
| Export to CSV | `"settings-export"` |
| About | `"settings-about"` |

### How It Works

The `CollapsibleSection` component already:
1. Reads from localStorage on mount: `localStorage.getItem(`section-${storageKey}`)`
2. Persists on toggle: `localStorage.setItem(key, String(newValue))`
3. Cleans up when returning to default: `localStorage.removeItem(key)`

### localStorage Keys Created

- `section-trends-food`
- `section-trends-weights`
- `section-settings-account`
- `section-settings-meals`
- `section-settings-routines`
- `section-settings-preferences`
- `section-settings-export`
- `section-settings-about`

### No Other Changes Needed

The component handles everything else - no additional code required.

