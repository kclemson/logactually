

## Allow Two-Line Wrapping in Prompt Eval Results Table

### Overview
Update the "Input" and "Source Note" columns in the DevToolsPanel results table to wrap to two lines instead of truncating with an ellipsis, making long content readable without hovering.

---

### Changes

**File:** `src/components/DevToolsPanel.tsx`

1. **Input column cell (line 398-400)**
   - Remove `truncate` class
   - Add `line-clamp-2` for 2-line limit with ellipsis overflow
   - Add `break-words` to allow word wrapping

2. **Source Note column cell (line 452)**
   - Change `truncate` to `line-clamp-2 break-words`

---

### Technical Details

The `line-clamp-2` utility (built into Tailwind) limits content to 2 lines and adds an ellipsis (`...`) if the text overflows. This is a better fit than `truncate` (single line) since you want to read more of the text but still cap it at a reasonable height.

**Before:**
```tsx
<td className="px-1 py-1 font-mono text-xs truncate" ...>
  {result.input}
</td>
```

**After:**
```tsx
<td className="px-1 py-1 font-mono text-xs" ...>
  <div className="line-clamp-2 break-words">{result.input}</div>
</td>
```

Same pattern for the Source Note column.

---

### Files to Modify
1. `src/components/DevToolsPanel.tsx` - Update Input and Source Note cell styling

