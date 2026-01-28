
## Switch New Row Highlight from Background Fill to Blue Outline

### Current Behavior

Newly added food rows display with a solid blue background (`hsl(var(--new-item))`) that fades to transparent over 2.5 seconds.

### Proposed Change

Replace the filled background animation with a visible blue **outline/border** around the newly added row(s). The outline will:
- Use a consistent blue color in both light and dark themes: `hsl(217 91% 60%)` (matches `--focus-ring`)
- Fade out after the same 2.5s timer
- Wrap the entire row with rounded corners for a clean "pill" appearance

### Changes

| File | Change |
|------|--------|
| `tailwind.config.ts` | Create new `outline-fade` keyframe animation using `box-shadow` instead of `backgroundColor` |
| `src/components/FoodItemsTable.tsx` | Replace `animate-highlight-fade` with new `animate-outline-fade` class |

### Implementation Details

**1. Update Tailwind keyframes (tailwind.config.ts)**

Replace the `highlight-fade` keyframe with a new `outline-fade` that uses `box-shadow` to create an inset-like outline effect:

```tsx
keyframes: {
  // ... existing keyframes
  "outline-fade": {
    "0%, 80%": {
      boxShadow: "inset 0 0 0 2px hsl(217 91% 60%)",
    },
    "100%": {
      boxShadow: "inset 0 0 0 2px transparent",
    },
  },
},
animation: {
  // ... existing animations
  "outline-fade": "outline-fade 2.5s ease-out forwards",
},
```

Using `box-shadow: inset` instead of `border` avoids layout shift since box-shadow doesn't affect element dimensions.

**2. Update FoodItemsTable.tsx**

Replace `animate-highlight-fade` with the new `animate-outline-fade` class on the row wrapper:

```tsx
// Line 337
isNewItem(item) && "animate-outline-fade"
```

**3. Remove the old highlight-fade keyframe** (cleanup)

Since we're switching approaches entirely, remove the now-unused `highlight-fade` keyframe and animation from `tailwind.config.ts`.

### Visual Result

| Aspect | Before | After |
|--------|--------|-------|
| Style | Solid blue background fill | Blue border/outline around row |
| Color | `hsl(217 70% 75%)` (varies slightly by theme) | `hsl(217 91% 60%)` (same in both themes) |
| Fade | Background fades to transparent | Outline fades to transparent |
| Duration | 2.5 seconds | 2.5 seconds (unchanged) |
| Shape | Rounded row with fill | Rounded row with 2px border |

### Technical Notes

- Using `box-shadow: inset` creates a border effect without affecting layout or grid sizing
- The fixed HSL value (`217 91% 60%`) ensures identical appearance in light and dark modes
- The 80% hold time keeps the outline fully visible for most of the animation before fading
