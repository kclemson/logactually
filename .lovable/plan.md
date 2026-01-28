

## Replace RYG Color Scheme with Neutral Complementary Colors

The current Red-Yellow-Green scheme implies value judgments that aren't appropriate for nutritional components. We'll use a palette of visually distinct, neutral colors.

---

### Proposed Color Palette

| Macro | New Color | HSL Value | Rationale |
|-------|-----------|-----------|-----------|
| Protein | Teal | `hsl(173 80% 40%)` | Cool, distinct, no value connotation |
| Carbs | Purple | `hsl(262 83% 58%)` | Matches weight chart line, visually distinct |
| Fat | Sky Blue | `hsl(199 89% 48%)` | Bright but neutral, complements teal and purple |

This palette:
- Uses cool-to-warm spectrum without traffic light associations
- Maintains high contrast between all three colors
- Works well in both light and dark themes
- Keeps Calories as blue (`hsl(217 91% 60%)`) for consistency

---

### Locations to Update

All changes in `src/pages/Trends.tsx`:

| Line | Current | New |
|------|---------|-----|
| 185 | `hsl(142 76% 36%)` (green) | `hsl(173 80% 40%)` (teal) |
| 186 | `hsl(38 92% 50%)` (yellow) | `hsl(262 83% 58%)` (purple) |
| 187 | `hsl(346 77% 49%)` (red) | `hsl(199 89% 48%)` (sky blue) |
| 283 | `fill="hsl(142 76% 36%)"` | `fill="hsl(173 80% 40%)"` |
| 284 | `fill="hsl(38 92% 50%)"` | `fill="hsl(262 83% 58%)"` |
| 285 | `fill="hsl(346 77% 49%)"` | `fill="hsl(199 89% 48%)"` |

---

### Visual Preview

```
Before (RYG):          After (Neutral):
[Protein] Green        [Protein] Teal
[Carbs]   Yellow       [Carbs]   Purple  
[Fat]     Red          [Fat]     Sky Blue
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Update 6 color values (3 in charts array, 3 in grouped bar chart) |

