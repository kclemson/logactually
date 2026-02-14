

## Fix Nav Colors and Settings Icon Colors

### 1. Fix Food nav icon back to blue (`src/components/BottomNav.tsx`)

Change line 19 from orange to primary (blue):
```
{ to: '/', icon: Utensils, label: 'Food', activeColor: 'text-primary' }
```

### 2. Add a neutral gray color to general Settings section icons (`src/pages/Settings.tsx`)

For Account, Preferences, Import and Export, and About -- these are utility/system sections, not content-type sections. A muted gray works well as a subtle contrast to blue, keeping the colored icons (orange meals, purple routines, teal custom) as the standout items. This way the "content" sections pop while the "system" sections stay understated.

Color: `text-zinc-500 dark:text-zinc-400` (a neutral gray that works in both themes)

Lines to update:
- Line 125 (Account): add `iconClassName="text-zinc-500 dark:text-zinc-400"`
- Line 174 (Preferences): add `iconClassName="text-zinc-500 dark:text-zinc-400"`
- Line 448 (Import and Export): add `iconClassName="text-zinc-500 dark:text-zinc-400"`
- Line 487 (About): add `iconClassName="text-zinc-500 dark:text-zinc-400"`

