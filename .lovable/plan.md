

## Improve Chart Tooltip Contrast

Add a distinct background color to chart tooltips so the blue/purple text is readable against it.

---

### Problem

The chart tooltips currently use `bg-card` which is now the same soft warm gray (`220 14% 96%`) as the page background. When the tooltip text uses chart colors (blues and purples), there's poor contrast and readability.

---

### Solution

Use a crisp white background (`#FFFFFF`) for the chart tooltips specifically. This provides excellent contrast with all the blue and purple text colors used in the charts:

| Chart Color | Hex | Contrast on White |
|-------------|-----|-------------------|
| Calories | `#0033CC` | Excellent |
| Protein | `#115E83` | Excellent |
| Carbs | `#00D4FF` | Good |
| Fat | `#B8F4FF` | Fair (light cyan) |
| Weight (purple) | `hsl(262 83% 58%)` | Excellent |

For dark mode, the tooltip will use a dark background that also contrasts well.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Update `CompactTooltip` background to use fixed white |

---

### Code Change (lines 38-39)

**Before:**
```tsx
<div className="rounded-md border border-border bg-card px-2 py-1 shadow-sm">
  <p className="text-[10px] font-medium text-foreground mb-0.5">{label}</p>
```

**After:**
```tsx
<div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
  <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
```

---

### Visual Result

- Light mode: White tooltip background with colored text (excellent contrast)
- Dark mode: Dark slate tooltip background with colored text (good contrast)
- Slightly stronger shadow (`shadow-md`) to make the tooltip pop from the background
- Softer border (`border-border/50`) to not compete visually

