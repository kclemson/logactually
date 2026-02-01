

## Fix Raw Input Font Size on Mobile

The raw input text (italic original input displayed when expanding an entry) appears larger than expected on mobile because it inherits the 16px base font size instead of using an explicit smaller size.

---

### Problem Analysis

| Element | Current Classes | Mobile Size | Desktop Size |
|---------|----------------|-------------|--------------|
| Raw input text | `text-muted-foreground` (no size) | 16px (inherited) | 14px (inherited) |
| "From saved meal" text | `text-sm text-muted-foreground` | 14px | 14px |

The 16px mobile base is applied to prevent iOS auto-zoom on **editable inputs**. Since the raw input text is read-only display text, it should use `text-sm` to match other metadata text.

---

### Solution

Add `text-sm` to the raw input paragraph element so it matches the "From saved meal" text size.

---

### File Change

**`src/components/FoodItemsTable.tsx`** - Line 625:

```typescript
// Before
<p className="text-muted-foreground whitespace-pre-wrap italic">
  {currentRawInput}
</p>

// After
<p className="text-sm text-muted-foreground whitespace-pre-wrap italic">
  {currentRawInput}
</p>
```

---

### Result

Both the raw input text and "From saved meal" text will render at 14px (`text-sm`) on all viewports, creating consistent typography in the expanded entry section.

