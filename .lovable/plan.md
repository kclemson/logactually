

## Friendlier Network Error Messages

### Summary

Replace the technical Supabase error message with a user-friendly alternative in both analyze hooks.

### Error Message Change

| Current | New |
|---------|-----|
| `"failed to send a request to the edge function"` | `"Couldn't connect - please try again"` |

### Files to Modify

**1. `src/hooks/useAnalyzeWeights.ts`** (lines 36-40)

Update the catch block to intercept the technical error:

```typescript
} catch (err) {
  let message = err instanceof Error ? err.message : 'Failed to analyze workout';
  
  if (message.includes('failed to send a request to the edge function')) {
    message = "Couldn't connect - please try again";
  }
  
  setError(message);
  console.error('Analyze weights error:', err);
  return null;
}
```

**2. `src/hooks/useAnalyzeFood.ts`** (lines 54-57)

Apply the same pattern for consistency across both logging features.

### Technical Notes

- Original error still logged to console for debugging
- No changes to logic or flow
- Inline error display continues to work as before

