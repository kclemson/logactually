

## Make Input Textarea Taller

### Overview

Increase the minimum height of the input textarea on the food and weights log pages by one row (~20px) to reduce scrollbar appearance with longer placeholder text.

---

### File to Modify

**`src/components/LogInput.tsx`**

---

### Change

Update line 285 - increase the `min-h` class from `80px` to `100px`:

```typescript
// Before
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder={placeholderText}
  className="min-h-[80px] resize-none"
  disabled={isBusy}
  ...
/>

// After
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder={placeholderText}
  className="min-h-[100px] resize-none"
  disabled={isBusy}
  ...
/>
```

---

### Why This Works

- The `min-h-[80px]` currently accommodates ~3 lines of text
- Bumping to `min-h-[100px]` adds ~1 more row (~20px with standard line height)
- This applies to both food and weights pages since they share the same `LogInput` component
- The base `Textarea` component's default `min-h-[80px]` is overridden by the className passed from `LogInput`

---

### Summary

- 1 file modified
- 1 class value change (`80px` → `100px`)
- Affects both food and weights log input areas

