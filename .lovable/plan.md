

## Fix Calories Bar Color

The Calories chart is using the wrong color. It's hardcoded to `hsl(217 91% 60%)` (a lighter blue) instead of the intended `#0033CC` (deep blue).

---

### Issue

| Location | Current Color | Expected Color |
|----------|---------------|----------------|
| Line 312, Calories Bar | `hsl(217 91% 60%)` | `#0033CC` |

---

### Fix

**File: `src/pages/Trends.tsx`**

Update line 312:

```typescript
// Current
<Bar dataKey="calories" fill="hsl(217 91% 60%)" radius={[2, 2, 0, 0]} />

// Updated
<Bar dataKey="calories" fill="#0033CC" radius={[2, 2, 0, 0]} />
```

---

### Note

The `charts` array already has the correct color defined (`#0033CC`) - it's just not being used for this specific chart which was created separately for the 2-column layout.

