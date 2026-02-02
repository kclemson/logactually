

## Fix Toggle Thumb Visibility in Dark Mode

### Problem
The toggle thumb (circle) is always `bg-white`, but in dark mode:
- When **on**: `bg-primary` = `hsl(210 40% 98%)` — near white
- White circle on near-white background = invisible

### Solution
Change the thumb color based on toggle state:
- When **off**: Keep white thumb (visible against dark `bg-muted` track)
- When **on**: Use dark thumb (visible against light `bg-primary` track)

### Change

**File:** `src/pages/Settings.tsx` (lines 272-276)

```typescript
// Before
<span
  className={cn(
    "absolute left-0 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
    settings.showWeights ? "translate-x-6" : "translate-x-0.5"
  )}
/>

// After
<span
  className={cn(
    "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
    settings.showWeights 
      ? "translate-x-6 bg-primary-foreground" 
      : "translate-x-0.5 bg-white"
  )}
/>
```

### Why This Works
- `bg-primary-foreground` in dark mode = `hsl(222.2 47.4% 11.2%)` — dark color
- Dark thumb on light `bg-primary` track = visible
- White thumb on dark `bg-muted` track = visible (existing behavior)
- Light mode unchanged: both states still work correctly

