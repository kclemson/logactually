

## Use Blue Accent Color for CollapsibleSection Header Icons

### Changes

**File: `src/components/CollapsibleSection.tsx`**

Two modifications:

1. **Remove the background styling** we just added from the button
2. **Add blue color to the Icon** component

```tsx
// Line 64: Revert button className to remove background/padding:
className="flex items-center gap-2 font-semibold text-foreground transition-colors"

// Line 67: Add blue color to Icon:
<Icon className="h-4 w-4 text-[hsl(217_91%_60%)]" />
```

### What's changing

| Element | Before | After |
|---------|--------|-------|
| Button background | `bg-[hsl(217_91%_60%/0.08)]` | None |
| Button padding | `px-2 py-1.5 -ml-2 rounded-md` | None |
| Icon color | `currentColor` (inherits foreground) | `hsl(217 91% 60%)` — focus blue |

### Why this works

- **Consistent with design language**: The blue matches the focus ring, new-item highlights, and other interactive accents
- **Visible in both themes**: The `60%` lightness blue has good contrast against both light and dark backgrounds
- **Reinforces interactivity**: Blue icons signal "this is clickable" without adding visual weight
- **Cleaner look**: No background box means less visual clutter in the settings layout

### Visual result

The section header icons (User, Star, Settings2, etc.) will appear in the app's signature blue, while the text remains in the standard foreground color. This creates a subtle but clear distinction from the action rows below.

