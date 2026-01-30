

## Fix Section Header Bolding

### Problem

The section headers on the Privacy page don't appear bold because:
1. `font-medium` (weight 500) isn't strong enough contrast against the body text
2. The headers use `text-muted-foreground` which is a lighter color, further reducing visual weight

### Solution

Update the CollapsibleSection component to make headers visibly bolder by:
1. Change `font-medium` to `font-semibold` (weight 600) for stronger visual weight
2. Change `text-muted-foreground` to `text-foreground` so headers are brighter/darker than body text
3. Keep the `hover:text-foreground` behavior (it will just stay the same color on hover since already foreground)

### Changes to `src/components/CollapsibleSection.tsx`

**Line 63, change from:**
```tsx
className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
```

**To:**
```tsx
className="flex items-center gap-2 font-semibold text-foreground transition-colors"
```

### Result

Section headers will be:
- **Bolder** (semibold 600 vs medium 500)
- **Brighter/higher contrast** (foreground color instead of muted)
- Clearly distinguishable from the muted body text underneath

This affects both the Privacy page and Settings page, providing consistent bold headers across the app.

