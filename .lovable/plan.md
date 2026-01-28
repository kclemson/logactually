

## Fix Asterisk Wrapping in FoodItemsTable Description Cell

The edited-field asterisk (*) is wrapping to a new line instead of staying inline with the description text because of how the current layout handles text overflow.

---

### Root Cause

In the editable description cell (lines 374-400), the structure is:
```tsx
<div className="flex-1 min-w-0 rounded pl-1 py-1 line-clamp-2 focus-within:...">
  <span contentEditable>description text</span>
  <span>(portion)</span>
  <span> *</span>  // Asterisk
</div>
```

The `line-clamp-2` limits visible lines, but when text fills 2 lines completely, the asterisk (being a separate inline span) naturally flows to what would be line 3, causing the wrap issue. The `line-clamp` truncates with ellipsis after 2 lines, but since the asterisk is a sibling element (not part of the clamped text), it appears on its own line below.

---

### Solution

Make the asterisk `inline-block` with a non-breaking relationship to the preceding text. The cleanest fix is to ensure the asterisk stays attached to the last piece of content by:

1. **Remove `line-clamp-2` from the container** - Instead, let the text wrap naturally and control height via `max-h-[3rem]` with `overflow-hidden`
2. **Use `inline` positioning** for asterisk to flow naturally with text

However, a simpler approach that preserves the current behavior:

**Wrap the asterisk in a `shrink-0` element that doesn't participate in line-clamp flow:**

Actually, the cleanest fix is to use CSS `display: inline` on the asterisk container and ensure it's truly inline with the contentEditable text. The issue is that when `contentEditable` is used, it creates a block-level editing context.

---

### Recommended Fix

Change the description cell structure to use a pseudo-element approach or restructure to keep the asterisk inline:

**File: `src/components/FoodItemsTable.tsx`**

For the editable case (lines 374-400), change from using separate spans to positioning the asterisk absolutely or using `after:content-['*']` when edited:

**Simpler approach**: Remove `line-clamp-2` and use `overflow-hidden max-h-[3rem]` which allows the asterisk to flow naturally:

```tsx
<div className={cn(
  "flex-1 min-w-0 rounded pl-1 py-1",
  "overflow-hidden max-h-[3rem]",  // Replace line-clamp-2
  "focus-within:ring-2 focus-within:ring-focus-ring focus-within:bg-focus-bg"
)}>
  <span contentEditable ... />
  {item.portion && <span ...> ({item.portion})</span>}
  {hasAnyEditedFields(item) && (
    <span className="text-focus-ring font-bold whitespace-nowrap"> *</span>
  )}
</div>
```

**Or**: Use `inline-flex items-baseline` wrapper for the asterisk to ensure it stays with the last line of text.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Replace `line-clamp-2` with `overflow-hidden max-h-[3rem]` on description container to allow asterisk to flow naturally with text |

---

### Alternative: Float-based approach

Another option is to float the asterisk right so it sits at the end of the first line:

```tsx
{hasAnyEditedFields(item) && (
  <span className="float-right text-focus-ring font-bold ml-0.5"> *</span>
)}
```

But this changes the visual position. The `max-h` overflow approach is cleaner and preserves the inline flow.

