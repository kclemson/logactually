

## Reduce Vertical Padding Below Chart X-Axis Labels

Remove unnecessary whitespace below the X-axis date labels to make the charts more compact.

---

### Root Cause

Recharts XAxis has default values that create extra space:
- Default `height` reserves space for tick labels + padding
- Default `tickMargin` adds space between axis line and labels
- The `BarChart` without explicit `margin` uses Recharts defaults (which includes bottom margin)

---

### Solution

Add two XAxis properties to minimize bottom spacing:

```tsx
<XAxis
  dataKey="date"
  tick={{ fontSize: 8 }}
  stroke="hsl(var(--muted-foreground))"
  interval="preserveStartEnd"
  tickMargin={2}    // Reduce gap between axis line and labels (default ~5)
  height={16}       // Minimize reserved height for axis (default ~30)
/>
```

Also add explicit `margin` to BarChart components that don't have it:

```tsx
<BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
```

---

### Changes Summary

| Chart Location | Current | Change |
|----------------|---------|--------|
| All XAxis components | No tickMargin/height | Add `tickMargin={2}` and `height={16}` |
| Food BarCharts (Calories, Macro Split, P/C/F) | No margin prop | Add `margin={{ top: 4, right: 0, left: 0, bottom: 0 }}` |
| ExerciseChart BarChart | Already has margin | Keep existing (top: 12 for weight labels above bars) |

---

### Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | 322-326 | Calories chart XAxis - add tickMargin/height |
| `src/pages/Trends.tsx` | 320 | Calories BarChart - add margin |
| `src/pages/Trends.tsx` | 350-354 | Macro Split chart XAxis - add tickMargin/height |
| `src/pages/Trends.tsx` | 348 | Macro Split BarChart - add margin |
| `src/pages/Trends.tsx` | 385-389 | P/C/F charts XAxis - add tickMargin/height |
| `src/pages/Trends.tsx` | 383 | P/C/F BarChart - add margin |
| `src/pages/Trends.tsx` | 137-141 | ExerciseChart XAxis - add tickMargin/height |

---

### Before/After

```text
Before:                          After:
┌────────────────────┐           ┌────────────────────┐
│  Calories          │           │  Calories          │
│  ▐█▌ ▐█▌ ▐█▌       │           │  ▐█▌ ▐█▌ ▐█▌       │
│  ▐█▌ ▐█▌ ▐█▌       │           │  ▐█▌ ▐█▌ ▐█▌       │
│  Jan 22   Jan 28   │           │  Jan 22   Jan 28   │
│                    │  ←gap     └────────────────────┘
└────────────────────┘           (gap removed)
```

---

### Code Changes

**XAxis updates (apply to all 7 XAxis components):**
```tsx
<XAxis
  dataKey="date"
  tick={{ fontSize: 8 }}
  stroke="hsl(var(--muted-foreground))"
  interval="preserveStartEnd"
  tickMargin={2}
  height={16}
/>
```

**BarChart margin updates (food charts only):**
```tsx
<BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
```

This will significantly reduce the wasted vertical space in all chart cards while keeping the labels readable.

