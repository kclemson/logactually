

## Adjust Fat/Protein Colors for Better Distinction

The current sky blue (`hsl(199 89% 48%)`) for Fat is too similar to the Calories blue (`hsl(217 91% 60%)`). We'll swap Protein to green and Fat to teal for better visual distinction.

---

### Updated Color Palette

| Macro | Current | New | HSL Value |
|-------|---------|-----|-----------|
| Calories | Blue | Blue (no change) | `hsl(217 91% 60%)` |
| Protein | Teal | Green | `hsl(142 76% 36%)` |
| Carbs | Purple | Purple (no change) | `hsl(262 83% 58%)` |
| Fat | Sky Blue | Teal | `hsl(173 80% 40%)` |

This creates clear visual separation:
- **Calories**: Blue (warm-ish blue)
- **Protein**: Green (distinctly different hue)
- **Carbs**: Purple (cool, mid-spectrum)
- **Fat**: Teal (cool, between blue and green but distinct from both)

---

### Locations to Update

All changes in `src/pages/Trends.tsx`:

| Line | Macro | Current | New |
|------|-------|---------|-----|
| 184 | Protein | `hsl(173 80% 40%)` | `hsl(142 76% 36%)` |
| 186 | Fat | `hsl(199 89% 48%)` | `hsl(173 80% 40%)` |
| 282 | Protein | `hsl(173 80% 40%)` | `hsl(142 76% 36%)` |
| 284 | Fat | `hsl(199 89% 48%)` | `hsl(173 80% 40%)` |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Update 4 color values (2 in charts array, 2 in grouped bar chart) |

