

## Add "End Demo" Button to Demo Banner

### Overview

Add an "End demo" button next to the existing "Create Account" button in the DemoBanner. This will sign the user out and redirect them to the auth page without the "create account" intent framing.

---

### Implementation

**DemoBanner.tsx Changes**

1. Add a new `handleEndDemo` handler that signs out and navigates to `/auth`
2. Add a ghost-style "End demo" button next to "Create Account"

```tsx
const handleEndDemo = async () => {
  await signOut();
  navigate('/auth');
};
```

**Updated UI Layout**

```tsx
<div className="flex items-center gap-2">
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={handleEndDemo}
    className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50"
  >
    End demo
  </Button>
  <Button 
    variant="outline" 
    size="sm" 
    onClick={handleCreateAccount}
    className="h-7 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/50"
  >
    Create Account
  </Button>
</div>
```

---

### Visual Result

```text
┌─────────────────────────────────────────────────────────────────┐
│  You're viewing a demo              [End demo] [Create Account] │
└─────────────────────────────────────────────────────────────────┘
```

- "End demo" uses ghost variant (subtle, text-only look)
- "Create Account" remains outline variant (more prominent CTA)

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/DemoBanner.tsx` | Add `handleEndDemo` function and "End demo" button |

