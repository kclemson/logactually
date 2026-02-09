

## Add Colored Indicator Circles to Calorie Target Description

### What Changes

Update the subtitle text under "Daily Calorie Target" in Settings to show the three colored dot indicators inline, replacing "Show color indicators on calendar view" with "Show `●` `●` `●` color indicators on calendar view" where the dots are green, amber, and red respectively.

### Technical Details

In `src/pages/Settings.tsx`, update the description `<p>` tag (currently around line 168) from:

```
<p className="text-[10px] text-muted-foreground/70">Show color indicators on calendar view</p>
```

To:

```
<p className="text-[10px] text-muted-foreground/70">
  Show <span className="text-green-500 dark:text-green-400">●</span> <span className="text-amber-500 dark:text-amber-400">●</span> <span className="text-rose-500 dark:text-rose-400">●</span> color indicators on calendar view
</p>
```

The color classes match the existing `getTargetDotColor` function in `src/lib/calorie-target.ts`. Single line change, one file affected.

