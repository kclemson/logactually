

## Fix Calendar Layout + Add "cal" Label

### Overview
Two changes to the calendar cells:
1. Use a fixed 3-row grid layout so day numbers stay centered regardless of content
2. Add "cal" suffix after the calorie count for clarity

---

### Changes

**File:** `src/pages/History.tsx` (lines 178-216)

**1. Change layout from flexbox to 3-row grid:**

```tsx
// Before
<button className={cn("flex flex-col items-center justify-center ...")}>

// After  
<button className={cn("grid grid-rows-3 items-center justify-items-center ...")}>
```

**2. Always render all 3 rows (use invisible placeholders):**

```tsx
<button className={cn("grid grid-rows-3 items-center justify-items-center p-2 min-h-[68px] rounded-xl transition-colors", ...)}>
  {/* Row 1: Calorie count (always takes space) */}
  <span className={cn(
    "text-sm font-medium",
    hasEntries && isCurrentMonth 
      ? "text-rose-500 dark:text-rose-400" 
      : "invisible"
  )}>
    {hasEntries && isCurrentMonth 
      ? `${Math.round(summary.totalCalories).toLocaleString()} cal` 
      : "\u00A0"}
  </span>
  
  {/* Row 2: Day number (always centered in middle row) */}
  <span className={cn(
    "font-medium",
    isTodayDate && "text-primary font-semibold",
    !isCurrentMonth && "text-muted-foreground/30",
  )}>
    {format(day, 'd')}
  </span>

  {/* Row 3: Weight indicator (always takes space) */}
  <span className={cn(
    "h-3 w-3 flex items-center justify-center",
    !(hasWeights && isCurrentMonth) && "invisible"
  )}>
    <Dumbbell className="h-3 w-3 text-purple-500 dark:text-purple-400" />
  </span>
</button>
```

---

### Visual Result

```text
Before (shifts):          After (stable):
+------------+            +------------+
| 1,850      |            | 1,850 cal  |  <- Row 1 (always reserved)
|     15     |            |     15     |  <- Row 2 (always middle)
|    🏋️     |            |    🏋️     |  <- Row 3 (always reserved)
+------------+            +------------+

+------------+            +------------+
|     15     |  <- shifts | [invisible]|  <- Row 1 placeholder
+------------+            |     15     |  <- Row 2 stays centered
                          | [invisible]|  <- Row 3 placeholder
                          +------------+
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/History.tsx` | Modify lines 178-216 - grid layout + "cal" suffix |

