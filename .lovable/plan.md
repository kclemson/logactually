

## Fix Smart Text Wrapping for Editable Rows

### The Problem
The `formatDescriptionWithBreakHint` function with `<wbr>` was only applied to the non-editable code path. On the FoodLog page, `editable={true}` is used, so the editable code path runs instead - which uses `contentEditable` with plain text.

### Solution
Use a **zero-width space character** (`\u200B`) instead of `<wbr>`. This invisible Unicode character:
- Works in both plain text and HTML contexts
- Acts as a word-break opportunity for the browser
- Is invisible and doesn't affect editing or saving (it's a valid text character)

---

### Code Changes

**File: `src/components/FoodItemsTable.tsx`**

1. **Create a text-based helper** (works for both editable and display contexts):
```tsx
// Insert zero-width space before first parenthesis for smart wrapping
const addBreakHintToDescription = (description: string): string => {
  const parenIndex = description.indexOf('(');
  if (parenIndex === -1) {
    return description;
  }
  // Insert zero-width space before the parenthesis
  return description.slice(0, parenIndex) + '\u200B' + description.slice(parenIndex);
};
```

2. **Update the editable contentEditable ref** (line 371-372):
```tsx
ref={(el) => {
  if (el && el.textContent !== item.description && document.activeElement !== el) {
    el.textContent = addBreakHintToDescription(item.description);
  }
}}
```

3. **Update the JSX-based helper for non-editable rows** to use the same approach (or keep `<wbr>` since it already works there - either is fine).

---

### Why This Works

| Approach | Editable Works? | Non-Editable Works? |
|----------|-----------------|---------------------|
| `<wbr>` HTML element | No (requires JSX/HTML) | Yes |
| Zero-width space `\u200B` | Yes (plain text) | Yes |

The zero-width space is a standard Unicode character that browsers treat as a valid word-break opportunity, similar to `<wbr>` but compatible with plain text contexts.

---

### Edge Case Consideration
When the user edits and saves the description, the zero-width space might be saved to the database. This is harmless (invisible character), but if you want to strip it on save, we can add a cleanup step in the save handler.

---

### Files to Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `addBreakHintToDescription` helper, apply to editable contentEditable ref |

