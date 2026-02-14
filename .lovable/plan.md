

## Two Changes: Saved Meals Icon Color + Food Nav Icon Color

### 1. Saved Meals icon color (`src/pages/Settings.tsx`, line 334)

Change `iconClassName="text-orange-500 dark:text-orange-400"` to `iconClassName="text-primary"` on the Saved Meals section.

### 2. Fix Food bottom nav active color (`src/components/BottomNav.tsx`, line 19)

The `text-primary` color maps to near-white in dark mode, making the icon invisible. Change it to an explicit blue:

```
// Before
{ to: '/', icon: Utensils, label: 'Food', activeColor: 'text-primary' }

// After
{ to: '/', icon: Utensils, label: 'Food', activeColor: 'text-blue-500 dark:text-blue-400' }
```

Also update the other nav items that use `text-primary` (Calendar, Trends, Settings, Admin) to the same explicit blue so they all remain visible in dark mode.

