

## Consistent Width for Multiline Textarea

### Problem
The multiline textarea has different widths during input vs. after save. During input it stretches wide, but after saving the `MultilineTextArea` in `CustomLogEntryRow.tsx` shrinks to fit the content text, making it look inconsistent.

### Fix

**File: `src/components/CustomLogEntryRow.tsx`**

Update the `MultilineTextArea` component's className to use a fixed `w-[280px]` instead of `min-w-[180px] max-w-[240px]`. This gives it a consistent standard width whether empty or full of text. Also update the `LogEntryInput.tsx` textarea to use the same width so input and display match.

**File: `src/components/LogEntryInput.tsx`**

Update the multiline textarea to use `w-[280px]` instead of `flex-1` so it matches the saved entry width.

### Technical detail

**CustomLogEntryRow.tsx** -- MultilineTextArea className change:
```
"min-w-[180px] max-w-[240px] min-h-[40px]"
```
becomes:
```
"w-[280px] min-h-[60px]"
```

**LogEntryInput.tsx** -- input textarea className change:
```
"flex-1 min-h-[60px]"
```
becomes:
```
"w-[280px] min-h-[60px]"
```

This ensures both the input textarea and the saved entry textarea render at the same consistent width.

