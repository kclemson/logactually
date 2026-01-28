

## Fix "Log Weights" Navigation Alignment

The "Log Weights" label wraps to two lines on mobile, causing the icon to appear higher and the text to be misaligned compared to other single-word nav items.

---

### Problem Analysis

| Item | Label | Lines | Issue |
|------|-------|-------|-------|
| Log Food | "Log Food" | 2 | Also wraps, but both words similar length |
| Log Weights | "Log Weights" | 2 | "Weights" is longer, causing uneven wrap |
| Calendar | "Calendar" | 1 | Single word - aligned correctly |
| Trends | "Trends" | 1 | Single word - aligned correctly |

The icon appears higher because the two-line text below it takes more vertical space, but the container aligns items to center.

---

### Solution

Add `text-center` to the label span to ensure wrapped text is horizontally centered:

**File: `src/components/BottomNav.tsx`**

```tsx
// Line 38: Add text-center class
<span className="text-xs text-center">{label}</span>
```

This ensures that when labels wrap to multiple lines, each line is centered within the span, matching the icon alignment above it.

---

### Why This Works

- `items-center` on the flex container centers children horizontally
- But when text wraps, the default `text-align: left` causes lines to align left within the span
- Adding `text-center` ensures wrapped text lines are centered within their container

---

### Files Summary

| File | Change |
|------|--------|
| `src/components/BottomNav.tsx` | Add `text-center` class to label span |

