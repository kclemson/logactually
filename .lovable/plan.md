

## Text Link Approach for Demo Button

### Overview

Replace the visually heavy demo section (horizontal divider + outline button + helper text) with a clean text link that matches the existing "Don't have an account? Sign Up" pattern.

---

### Current State (lines 327-339)

```tsx
<div className="mt-6 pt-6 border-t border-border">
  <Button variant="outline" className="w-full" onClick={handleTryDemo} ...>
    Try Demo
  </Button>
  <p className="text-xs text-muted-foreground text-center mt-2">
    Explore with sample data — no account needed
  </p>
</div>
```

**Issues:** Too many visual elements (divider line, outline button, card outline)

---

### Proposed Change

Replace with a simple text paragraph below the sign up/sign in toggle:

```tsx
<div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
  <p>
    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
    <button ...>{isSignUp ? 'Sign In' : 'Sign Up'}</button>
  </p>
  <p>
    Or{' '}
    <button
      type="button"
      onClick={handleTryDemo}
      disabled={submitting || isDemoLoading}
      className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
    >
      {isDemoLoading ? 'loading demo...' : 'try the demo'}
    </button>
    {' '}— no account needed
  </p>
</div>
```

---

### Visual Result

**Before:**
```
[Sign In button]
Don't have an account? Sign Up
────────────────────────────────
[Try Demo button (outline)]
Explore with sample data...
```

**After:**
```
[Sign In button]
Don't have an account? Sign Up
Or try the demo — no account needed
```

---

### Technical Details

**File:** `src/pages/Auth.tsx`

**Changes:**
1. Remove lines 327-339 (the entire `border-t` div with Button and helper text)
2. Modify the existing text div (lines 313-326) to add a second paragraph with the demo link
3. Add `space-y-2` to the container for proper spacing between the two text lines
4. Add `text-sm` to the container (currently no font size specified)

**Behavior preserved:**
- `handleTryDemo` function unchanged
- Loading state still shows "loading demo..."
- Disabled state while submitting or loading

