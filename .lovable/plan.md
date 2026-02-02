

## Fix Toggle Visibility in Dark Theme

### Problem
The "Show Weights" toggle is nearly invisible in dark mode because:
- Track (off state): `bg-muted` = `hsl(217.2 32.6% 17.5%)`
- Page background: `hsl(222.2 84% 4.9%)`

These colors are too similar, causing the toggle to blend into the background.

### Solution
Add a border to the toggle track to define its shape regardless of background color.

### Change

**File:** `src/pages/Settings.tsx` (lines 267-270)

```typescript
// Before
className={cn(
  "w-12 h-6 rounded-full transition-colors relative",
  settings.showWeights ? "bg-primary" : "bg-muted"
)}

// After
className={cn(
  "w-12 h-6 rounded-full transition-colors relative border",
  settings.showWeights ? "bg-primary border-primary" : "bg-muted border-border"
)}
```

### Why This Works
- Adds `border` base class for consistent 1px border
- When on: `border-primary` matches the filled background
- When off: `border-border` provides visible outline in both themes
  - Light mode: `hsl(214.3 31.8% 91.4%)` - visible gray
  - Dark mode: `hsl(217.2 32.6% 30%)` - visible contrast against dark background

This matches the design pattern already used for the theme and weight unit toggle buttons, which also use borders to define their bounds.

