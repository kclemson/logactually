

## Fix Text Entry Row Alignment and Multiline Textarea Styling

### File: `src/components/CustomLogEntryRow.tsx`

**Three changes in this file:**

1. **Top-align rows for single-line text entries (e.g. "Mood")**
   - Update the outer row div's alignment condition from `isMultiline ? "items-start" : "items-center"` to `(isMultiline || valueType === 'text') ? "items-start" : "items-center"`
   - This ensures the "Mood" label sits at the top of its editable text span, not vertically centered

2. **Top-align rows for multiline text entries (already working, no change needed)**
   - The `isMultiline` check already handles this

3. **Add visible border and proper padding to the MultilineTextArea component**
   - Change `border-0` to `border border-input`
   - Change `bg-transparent` to `bg-background`
   - Change `rounded` to `rounded-md`
   - Change `px-1` to `px-2 py-1`
   - This gives the textarea a proper bordered box appearance matching other inputs, instead of being an invisible borderless area crammed into the corner

### Technical detail

In the `MultilineTextArea` component's className (around line 40), change:
```
"min-w-[180px] max-w-[240px] min-h-[40px] rounded px-1 text-sm bg-transparent border-0 resize-y ..."
```
to:
```
"min-w-[180px] max-w-[240px] min-h-[40px] rounded-md border border-input bg-background px-2 py-1 text-sm resize-y ..."
```

In the outer row div (around line 141), change the alignment condition:
```
isMultiline ? "items-start" : "items-center"
```
to:
```
(isMultiline || valueType === 'text') ? "items-start" : "items-center"
```
