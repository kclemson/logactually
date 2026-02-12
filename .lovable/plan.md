
## Fix Ask AI Dialog Mobile Overflow

**File: `src/components/AskTrendsAIDialog.tsx`**

Add `max-h-[85vh] overflow-y-auto` to the `DialogContent` className (matching the pattern already used in `CalorieBurnDialog`). This caps the dialog height at 85% of the viewport and makes its content scrollable.

### Change (line 110)

Current:
```tsx
className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] p-3 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"
```

Updated:
```tsx
className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"
```

Single line edit. The dialog will now stay within the viewport and scroll when content is tall.
