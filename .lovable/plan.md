

## Add Training Volume Tooltip

### Overview

Add a native `title` attribute to the training volume number in the totals row, providing a simple browser tooltip that explains what training volume means.

---

### File to Modify

**`src/components/WeightItemsTable.tsx`**

---

### Change

Update lines 230-232 - add a `title` attribute to the volume span:

```typescript
// Before
<span className="px-1 text-heading text-center text-xs">
  {Math.round(totals.volume).toLocaleString()}
</span>

// After
<span 
  className="px-1 text-heading text-center text-xs"
  title="Training volume – the total weight lifted (sets × reps × weight)"
>
  {Math.round(totals.volume).toLocaleString()}
</span>
```

---

### Result

When users hover over the volume number (e.g., "18,010"), they'll see a tooltip explaining:
- What the term "training volume" means
- How it's calculated

---

### Summary

- 1 file modified
- 1 line changed
- No new dependencies
- Matches existing pattern used in FoodItemsTable for description tooltips

