

## Plan: Reduce Horizontal Padding in Save Dialogs

### Changes

Both `SaveMealDialog.tsx` and `SaveRoutineDialog.tsx` will get the same update to the `DialogContent` className:

**Current:**
```tsx
className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6"
```

**Proposed:**
```tsx
className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-6"
```

### Summary of Changes

| Property | Current | Proposed | Effect |
|----------|---------|----------|--------|
| Outside margin | `left-4 right-4` (16px) | `left-2 right-2` (8px) | +8px content per side |
| Max width | `calc(100vw-32px)` | `calc(100vw-16px)` | Matches new margins |
| Inside padding | `p-4` (16px) | `p-3` (12px) | +4px content per side |

**Net gain**: ~12px more horizontal content space per side on mobile.

Desktop remains unchanged (`sm:p-6`).

### Files Modified

| File | Line | Change |
|------|------|--------|
| `src/components/SaveMealDialog.tsx` | 117 | Update DialogContent className |
| `src/components/SaveRoutineDialog.tsx` | 141 | Update DialogContent className |

