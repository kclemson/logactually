
## Fix Weight Chart Label Visibility Logic

A single-line change to correct the condition that determines when labels should render.

---

### Change

**File:** `src/pages/Trends.tsx`, line 56

**Before:**
```tsx
if (payload && payload.showLabel === false) return null;
```

**After:**
```tsx
if (!payload?.showLabel) return null;
```

---

### Why This Works

The current logic only hides labels when `showLabel` is explicitly `false`. By inverting to require `showLabel` to be truthy, we ensure labels only render when the interval logic explicitly sets `showLabel: true`.

| Scenario | Old Check | New Check |
|----------|-----------|-----------|
| `payload` undefined | Renders (bug) | Hidden |
| `showLabel` undefined | Renders (bug) | Hidden |
| `showLabel: false` | Hidden | Hidden |
| `showLabel: true` | Renders | Renders |
