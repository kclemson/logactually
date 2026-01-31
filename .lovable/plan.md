
## Fix Input Column Text Clipping in Prompt Eval Tools Table

### Problem

The "Input" column in the DevToolsPanel results table currently uses `line-clamp-2`, which limits the displayed text to exactly 2 lines with ellipsis ("...") truncation. However, since other columns (like "Note") can make rows taller, there's unused vertical space in the Input column that could display more of the input text.

### Solution

Remove the `line-clamp-2` class from the Input column's inner div so the text can wrap naturally and use all available row height. The text will still be constrained by the column width (via `maxWidth`) and will wrap with `break-words`, but it won't artificially limit to 2 lines.

### File to Modify

| File | Change |
|------|--------|
| `src/components/DevToolsPanel.tsx` | Remove `line-clamp-2` from input cell |

### Code Change

**Line 479** - Change from:
```tsx
<div className="line-clamp-2 break-words">{result.input}</div>
```

To:
```tsx
<div className="break-words">{result.input}</div>
```

### Result

- Input text will wrap naturally within the column width
- Text will expand vertically to use available row height
- No more artificial 2-line truncation with "..."
- The title tooltip (already present) still provides full text on hover if needed
- Column width is still controlled by the resizable `columnWidths.input` value
