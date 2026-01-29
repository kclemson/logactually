

## Update End Demo Button Styling

### Overview

Change the "End demo" button from ghost variant to outline variant to match the "Create Account" button styling.

---

### Change

Update the "End demo" button in `DemoBanner.tsx`:

**Before:**
```tsx
<Button 
  variant="ghost" 
  size="sm" 
  onClick={handleEndDemo}
  className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50"
>
  End demo
</Button>
```

**After:**
```tsx
<Button 
  variant="outline" 
  size="sm" 
  onClick={handleEndDemo}
  className="h-7 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50"
>
  End demo
</Button>
```

---

### Visual Result

Both buttons will now appear as outlined buttons with consistent styling:

```text
┌─────────────────────────────────────────────────────────────────┐
│  You're viewing a demo           [End demo] [Create Account]   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/DemoBanner.tsx` | Change End demo button from `variant="ghost"` to `variant="outline"` and add border styling |

