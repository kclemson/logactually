

## Improve Calories Chart Color in Dark Mode

### Problem

The Calories bar chart uses `hsl(var(--primary))` which becomes bright white (`210 40% 98%`) in dark mode, creating a harsh, jarring contrast against the dark background.

### Solution

Replace the dynamic `--primary` color with a dedicated chart color that looks good in both light and dark themes. A blue tone will:
- Visually distinguish calories from the macro colors (green/orange/red)
- Match the app's existing blue accent (focus-ring, buttons)
- Provide good contrast without being harsh

### Recommended Color

**Blue: `hsl(217 91% 60%)`** - This matches the existing `--focus-ring` color and provides a vibrant but balanced look in both themes.

Alternative options if you prefer:
- Softer blue: `hsl(217 70% 55%)`
- Cyan/teal: `hsl(190 80% 45%)`
- Slate: `hsl(215 25% 55%)`

### Changes

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Update Calories bar fill color from `hsl(var(--primary))` to a fixed blue |

### Implementation

Update the `charts` array definition (line 138):

```tsx
const charts = [
  { key: 'calories', label: 'Calories', color: 'hsl(217 91% 60%)' },  // Blue
  { key: 'protein', label: 'Protein (g)', color: 'hsl(142 76% 36%)' },
  { key: 'carbs', label: 'Carbs (g)', color: 'hsl(38 92% 50%)' },
  { key: 'fat', label: 'Fat (g)', color: 'hsl(346 77% 49%)' },
];
```

And update the Calories chart Bar fill (line 207):

```tsx
<Bar dataKey="calories" fill="hsl(217 91% 60%)" radius={[2, 2, 0, 0]} />
```

### Visual Result

| Theme | Before | After |
|-------|--------|-------|
| Dark | Bright white bars (jarring) | Blue bars (cohesive) |
| Light | Dark navy bars | Blue bars (slightly lighter, still readable) |

The blue matches the app's button/accent color, creating visual consistency across the interface.

