

## Change Protein Color to Super Light Blue

Replace the green protein color with a light blue that's distinct from the deeper Calories blue.

---

### Updated Color Palette

| Macro | Current | New | HSL Value |
|-------|---------|-----|-----------|
| Calories | Blue | Blue (no change) | `hsl(217 91% 60%)` |
| Protein | Green | Light Blue | `hsl(200 80% 70%)` |
| Carbs | Purple | Purple (no change) | `hsl(262 83% 58%)` |
| Fat | Teal | Teal (no change) | `hsl(173 80% 40%)` |

The light blue (`hsl(200 80% 70%)`) has:
- Similar hue to Calories blue (200 vs 217) but shifted slightly toward cyan
- Much higher lightness (70% vs 60%) making it distinctly "light"
- Clear visual separation from the deeper Calories blue while staying in the blue family

---

### Locations to Update

All changes in `src/pages/Trends.tsx`:

| Line | Current | New |
|------|---------|-----|
| 184 | `hsl(142 76% 36%)` (green) | `hsl(200 80% 70%)` (light blue) |
| 282 | `fill="hsl(142 76% 36%)"` | `fill="hsl(200 80% 70%)"` |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Update 2 protein color values |

