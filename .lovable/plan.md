

## Tighten Vertical Space Around Date Navigation

### Current Layout Structure

```
<div className="space-y-6">           ← 24px gap between all children
  <section>FoodInput</section>        ← Child 1
  <div>Date Navigation</div>          ← Child 2 (24px above, 24px below)
  <section>FoodItemsTable</section>   ← Child 3
</div>
```

### Solution

Reduce the gap around the date navigation by changing from `space-y-6` (24px) to `space-y-4` (16px). This tightens the entire layout uniformly.

If you want the date row specifically tighter while keeping other gaps at 24px, we can add negative margin to the date navigation div instead.

### Recommended Change

**Option A: Uniform tightening (simple)**

Change line 416 from `space-y-6` to `space-y-4`:
```tsx
<div className="space-y-4">
```

This reduces vertical gaps from 24px to 16px throughout the page.

**Option B: Target only the date row (more precise)**

Keep `space-y-6` but add negative vertical margin to the date navigation div:
```tsx
<div className="flex items-center justify-center gap-1 -my-1">
```

This pulls the date row closer to its neighbors by 4px on each side while keeping other gaps at 24px.

---

### Files to Change

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Reduce `space-y-6` to `space-y-4` OR add `-my-1` to date navigation div |

