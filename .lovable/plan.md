

## Update SimilarEntryPrompt Button Label

### Change

Rename the "Dismiss" button to clarify that it will log the user's input as a new entry.

**Recommended label**: `Log as New`

This works well because:
- Parallel structure with "Use Past Entry" (both start with action verbs)
- Short and scannable (3 words)
- Clearly contrasts with reusing the past entry
- Implies fresh AI analysis of their input

### Alternative Options

| Label | Notes |
|-------|-------|
| Log My Input | More explicit about using their typed text |
| Analyze Instead | Technical but accurate |
| Use My Description | Personal but longer |

### File Change

**File**: `src/components/SimilarEntryPrompt.tsx`

**Line 77**: Change `Dismiss` to `Log as New`

```tsx
<Button
  size="sm"
  variant="outline"
  onClick={onDismiss}
  disabled={isLoading}
>
  Log as New
</Button>
```

### Note

The X button in the top-right corner also calls `onDismiss` - we should update its `aria-label` from "Dismiss" to something like "Log as new entry" for accessibility consistency.

