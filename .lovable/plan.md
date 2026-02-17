

# Fix: Prevent Saving Empty Description on Enter

## Problem
When editing a food item description in the table, deleting all text and pressing Enter saves an empty description. The blur handler already guards against this, but the Enter handler does not.

## Change

**File: `src/hooks/useInlineEdit.ts`** (lines ~108-113 in `getDescriptionEditProps` > `onKeyDown`)

Current Enter handler:
```typescript
const newDescription = e.currentTarget.textContent || '';
if (newDescription !== descriptionOriginalRef.current) {
  onSaveDescription?.(index, newDescription);
}
```

Updated:
```typescript
const newDescription = (e.currentTarget.textContent || '').trim();
if (!newDescription) {
  e.currentTarget.textContent = descriptionOriginalRef.current;
} else if (newDescription !== descriptionOriginalRef.current) {
  onSaveDescription?.(index, newDescription);
}
```

This makes Enter behave identically to blur: empty input reverts to the original value.

## Files changed
| File | Lines changed |
|---|---|
| `src/hooks/useInlineEdit.ts` | ~3 lines in `onKeyDown` handler |

No other files affected.

