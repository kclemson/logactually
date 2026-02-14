

## Unify Blue Color Across Food-Related Icons

The "Add Food" button blue matches Tailwind's `blue-500` which is essentially `hsl(217 91% 60%)`. Three spots need to use this same blue consistently:

### 1. Food bottom nav active icon -- already correct
Currently `text-blue-500 dark:text-blue-400` -- no change needed.

### 2. Saved Meals icon in Settings (`src/pages/Settings.tsx`)
Currently uses `iconClassName="text-primary"` which renders near-white in dark mode. Change to `iconClassName="text-blue-500 dark:text-blue-400"`.

### 3. Food Trends icon on Trends page (`src/pages/Trends.tsx`, line 818)
Currently uses the default CollapsibleSection icon color (`text-[hsl(217_91%_60%)]`). While visually very close, for explicit consistency add `iconClassName="text-blue-500 dark:text-blue-400"` to this CollapsibleSection.

### Technical Details

**`src/pages/Settings.tsx`** -- Saved Meals CollapsibleSection: change `iconClassName="text-primary"` to `iconClassName="text-blue-500 dark:text-blue-400"`.

**`src/pages/Trends.tsx`** (line 818) -- Food Trends CollapsibleSection: add `iconClassName="text-blue-500 dark:text-blue-400"` prop.

