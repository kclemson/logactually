

## Fix Missing Colon in Similar Entry Prompt

### Change

**File: `src/components/SimilarEntryPrompt.tsx`** (line 46)

Add a colon after the match percentage to properly introduce the content below:

```tsx
// Before:
<span className="text-muted-foreground">({matchPercent}% match)</span>

// After:
<span className="text-muted-foreground">({matchPercent}% match):</span>
```

### Result

The text will read: "Looks like your entry from **Tue, Feb 3** (100% match):"

This grammatically makes sense since the entire phrase is a header introducing the food items table that follows.

