

## Fix: Preserve User-Entered Name in Create Saved Dialog

Prevent the fallback name from overwriting a name the user has already entered.

---

### Root Cause

In `CreateSavedDialog.tsx` line 128, after analysis completes, the code unconditionally sets the name:

```tsx
setName(config.getFallbackName(result));
```

This overwrites any name the user typed before submitting the ingredient description.

---

### Fix

Only set the fallback name if the user hasn't already entered one:

```tsx
// Before
setName(config.getFallbackName(result));

// After
setName(prevName => prevName.trim() ? prevName : config.getFallbackName(result));
```

This uses the functional update form of `setName` to check the current value:
- If user already typed a name → keep it
- If name is empty → use the fallback from first item

---

### File Changed

| File | Change |
|------|--------|
| `src/components/CreateSavedDialog.tsx` | Line 128: Preserve existing name when setting fallback |

