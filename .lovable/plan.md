

## Split toggle label into main + subtitle

**File**: `src/pages/Settings.tsx` (~line 208)

Change the single `<p>` label from:

```
Show other logging types (weight, measurements, mood, and more)
```

To a stacked layout matching Daily Calorie Target's pattern:

```html
<div>
  <p class="text-xs text-muted-foreground">Show other logging types</p>
  <p class="text-[10px] text-muted-foreground/70">Weight, measurements, mood, and more</p>
</div>
```

The subtitle uses `text-muted-foreground/70` (the darker gray at reduced opacity) -- the same class used for the "Show color indicators on calendar view" subtitle above it.

One file, ~3 lines changed.

