

## Fix Portion Display: Inline Text Flow + Proper Spacing

### The Problems
1. **Missing space before `(`**: Currently using `ml-0.5` (2px) which is too tight
2. **Ugly two-line wrapping**: The portion is a flex sibling that stays on its own baseline when the description wraps, causing "(0.5 tsp)" to float alone on the second line

### The Solution
Make the portion truly **inline** with the description text, not a flex sibling. This way it flows naturally with the text.

---

### Visual Comparison

```text
CURRENT (flex siblings):
┌─────────────────────────────────────┐
│ [description div] [portion span]   │  ← flex row
│ Ground           │ (0.5 tsp)       │  ← portion stays on own baseline
│ Cinnamon         │                 │
└─────────────────────────────────────┘

FIXED (inline text):
┌─────────────────────────────────────┐
│ Ground Cinnamon (0.5 tsp)          │  ← flows as one text block
│                                     │
└─────────────────────────────────────┘
OR when wrapping:
┌─────────────────────────────────────┐
│ Ground Cinnamon                     │  ← wraps naturally
│ (0.5 tsp)                          │  ← continues inline
└─────────────────────────────────────┘
```

---

### Technical Approach

**For non-editable rows (easier):**
Keep portion inside the same `<span>` as the description text:

```tsx
<span className="pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0">
  {item.description}
  {item.portion && (
    <span className="text-xs text-muted-foreground whitespace-nowrap"> ({item.portion})</span>
  )}
  {hasAnyEditedFields(item) && ...}
</span>
```

Key changes:
- Add space inside the text: ` ({item.portion})`
- Add `whitespace-nowrap` to keep the portion together as a unit
- Keep it inside the line-clamp container so it flows with text

**For editable rows (trickier):**
The contentEditable div contains only the description. We need the portion to appear inline but outside the editable area.

Options:
- **Option A**: Append portion visually after contentEditable but style it to appear inline (requires CSS trickery)
- **Option B**: For editable mode, keep the current layout but adjust spacing

For simplicity, I recommend:
- Non-editable: True inline text flow (best appearance)
- Editable: Keep flexbox but add proper spacing ` (` with `ml-1` instead of `ml-0.5`

---

### Code Changes

**File: `src/components/FoodItemsTable.tsx`**

**1. Non-editable rows (lines 403-414)** - Make portion truly inline:
```tsx
<span 
  title={getItemTooltip(item)}
  className="pl-1 pr-0 py-1 line-clamp-2 shrink min-w-0"
>
  {item.description}
  {item.portion && (
    <span className="text-xs text-muted-foreground whitespace-nowrap"> ({item.portion})</span>
  )}
  {hasAnyEditedFields(item) && (
    <span className="text-focus-ring font-bold" title={formatEditedFields(item) || 'Edited'}> *</span>
  )}
</span>
```

Changes:
- ` ({item.portion})` - space before paren inside the string
- `whitespace-nowrap` - keeps "(0.5 tsp)" together
- Remove `ml-0.5` - space is now in the text

**2. Editable rows (lines 377-382)** - Fix spacing:
```tsx
{item.portion && (
  <span className="text-xs text-muted-foreground shrink-0 ml-1 whitespace-nowrap">({item.portion})</span>
)}
```

Changes:
- `ml-1` instead of `ml-0.5` for visible spacing
- `whitespace-nowrap` to keep portion together
- Note: For editable, we can't make it truly inline because the contentEditable is a separate element

---

### Files to Change

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Fix spacing and wrapping for portion display in both editable and non-editable modes |

---

### Trade-off

- **Non-editable** (FoodLog view): Perfect inline flow
- **Editable** (AIResults dialog): Still uses flexbox so portion may still wrap awkwardly on very long names, but with better spacing. This is acceptable since the dialog is typically wider and items are confirmatory before save.

