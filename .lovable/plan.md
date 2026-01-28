

## Update Macro Chart Colors to New Hex Palette

Replace the current HSL colors with the user's specified hex color palette for all macro charts.

---

### New Color Palette

| Macro | Hex Code | Visual |
|-------|----------|--------|
| Calories | `#0033CC` | Deep blue |
| Protein | `#43EBD7` | Teal/turquoise |
| Carbs | `#9933FF` | Purple |
| Fat | `#00CCFF` | Cyan/light blue |

---

### Locations to Update

All changes in `src/pages/Trends.tsx`:

**Charts configuration array (lines 183-186):**
| Line | Macro | Current | New |
|------|-------|---------|-----|
| 183 | Calories | `hsl(217 91% 60%)` | `#0033CC` |
| 184 | Protein | `hsl(200 80% 70%)` | `#43EBD7` |
| 185 | Carbs | `hsl(262 83% 58%)` | `#9933FF` |
| 186 | Fat | `hsl(173 80% 40%)` | `#00CCFF` |

**Grouped bar chart components (lines 282-284):**
| Line | Macro | Current | New |
|------|-------|---------|-----|
| 282 | Protein | `hsl(200 80% 70%)` | `#43EBD7` |
| 283 | Carbs | `hsl(262 83% 58%)` | `#9933FF` |
| 284 | Fat | `hsl(173 80% 40%)` | `#00CCFF` |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Update 7 color values to new hex codes |

