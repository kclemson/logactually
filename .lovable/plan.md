

## Unify Chart Title Styling with ChartTitle/ChartSubtitle Components

Create centralized typography components in `card.tsx` for consistent chart headers across Food and Weight Trends.

---

### Target Styling (from Weight charts)

| Component | Classes |
|-----------|---------|
| ChartTitle | `text-xs font-semibold leading-none tracking-tight` |
| ChartSubtitle | `text-[10px] text-muted-foreground font-normal` |

---

### Changes

**1. Add components to `src/components/ui/card.tsx`**

```tsx
const ChartTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4 ref={ref} className={cn("text-xs font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
ChartTitle.displayName = "ChartTitle";

const ChartSubtitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-[10px] text-muted-foreground font-normal", className)} {...props} />
  ),
);
ChartSubtitle.displayName = "ChartSubtitle";
```

Update exports to include both new components.

---

**2. Update `src/pages/Trends.tsx`**

| Location | Current | New |
|----------|---------|-----|
| Import | `CardTitle` | Add `ChartTitle, ChartSubtitle` |
| Line 67 | `<CardTitle className="text-xs font-semibold flex flex-col gap-0.5">` | `<div className="flex flex-col gap-0.5">` with `<ChartTitle>` and `<ChartSubtitle>` |
| Line 239 | `<CardTitle className="text-sm font-semibold">Calories</CardTitle>` | `<ChartTitle>Calories</ChartTitle>` |
| Line 267 | `<CardTitle className="text-sm font-semibold">Macros (g)</CardTitle>` | `<ChartTitle>Macros (g)</ChartTitle>` |
| Line 300 | `<CardTitle className="text-sm font-semibold">{label}</CardTitle>` | `<ChartTitle>{label}</ChartTitle>` |

---

### ExerciseChart Header Update

```tsx
<CardHeader className="p-2 pb-1">
  <div className="flex flex-col gap-0.5">
    <ChartTitle className="truncate">{exercise.description}</ChartTitle>
    <ChartSubtitle>Max: {exercise.maxWeight} lbs</ChartSubtitle>
  </div>
</CardHeader>
```

---

### Visual Result

All chart headers across Food and Weight Trends will use the same `text-xs` sizing, with optional `ChartSubtitle` for secondary information like "Max: 70 lbs".

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/card.tsx` | Add ChartTitle and ChartSubtitle components |
| `src/pages/Trends.tsx` | Import and use new components, remove inline styling overrides |

