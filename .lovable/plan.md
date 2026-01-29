

## Simplify Close Button Navigation

### Overview
Update the close button on the Help page to always navigate to the home page (`/`) instead of trying to go back in history.

---

### Changes

**File:** `src/pages/Help.tsx`

Update line 76 to change `navigate(-1)` to `navigate('/')`:

```tsx
<button
  onClick={() => navigate('/')}
  className="absolute right-0 top-0 p-2 -mr-2 -mt-2 text-muted-foreground hover:text-foreground transition-colors"
  aria-label="Close help"
>
  <X className="h-5 w-5" />
</button>
```

---

### Files to Modify
1. `src/pages/Help.tsx` - Change `navigate(-1)` to `navigate('/')`

