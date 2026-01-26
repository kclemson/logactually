

## Smart Text Wrapping at Parentheses

### The Idea
When a food item description needs to wrap to two lines, prefer breaking before the first `(` so the name stays on line 1 and the portion on line 2:

```text
Current:                    Proposed:
┌────────────────────┐      ┌────────────────────┐
│ Bacon, pan-fried   │      │ Bacon, pan-fried   │
│ (1 slice)          │      │ (1 slice)          │
└────────────────────┘      └────────────────────┘
        ↑                           ↑
  (random break)              (break at `(`)
```

---

### Technical Approach

Use HTML's `<wbr>` (Word Break Opportunity) element. This tells the browser "if you need to wrap, prefer wrapping here" - but it won't force a break if everything fits on one line.

**Helper function:**
```tsx
const formatDescriptionWithBreakHint = (description: string) => {
  const parenIndex = description.indexOf('(');
  if (parenIndex === -1) {
    return description; // No parenthesis, return as-is
  }
  const namePart = description.slice(0, parenIndex);
  const portionPart = description.slice(parenIndex);
  return <>{namePart}<wbr />{portionPart}</>;
};
```

---

### Where to Apply

| Mode | Apply? | Reason |
|------|--------|--------|
| Non-editable rows | Yes | Simple JSX replacement, no interaction concerns |
| Editable rows | No | `contentEditable` handles raw text; injecting `<wbr>` would complicate editing and saving |

This keeps the implementation clean and avoids fragility in the editable case.

---

### Code Changes

**File: `src/components/FoodItemsTable.tsx`**

1. Add helper function near top of component (around line 65):
```tsx
// Format description with word-break hint before first parenthesis
const formatDescriptionWithBreakHint = (description: string) => {
  const parenIndex = description.indexOf('(');
  if (parenIndex === -1) {
    return description;
  }
  const namePart = description.slice(0, parenIndex);
  const portionPart = description.slice(parenIndex);
  return <>{namePart}<wbr />{portionPart}</>;
};
```

2. Update non-editable description cell (around line 396):
```tsx
// Before:
{item.description}

// After:
{formatDescriptionWithBreakHint(item.description)}
```

---

### Complexity Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Lines of code | ~10 | Small helper function + one usage |
| Fragility | Low | Only affects display, not data |
| Edge cases | Minimal | Gracefully handles no-parenthesis case |
| Maintenance burden | Low | Self-contained, doesn't touch editing logic |

This is a **safe, low-complexity change** that improves visual consistency without touching the more complex editable/contentEditable code paths.

---

### Files to Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `formatDescriptionWithBreakHint` helper, apply to non-editable description cell |

