

## Update Auth Page: Email Toggle and Demo as Buttons

### Overview

Convert the text links at the bottom of the auth form into full-width ghost buttons for better visibility and parallel UI with the OAuth options.

---

### Changes to `src/pages/Auth.tsx`

**Current (lines 390-417):**
```tsx
<div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
  <p>
    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
    <button
      type="button"
      onClick={() => {
        setIsSignUp(!isSignUp);
        setConfirmPassword("");
        setErrorMessage(null);
      }}
      className="text-primary underline-offset-4 hover:underline"
    >
      {isSignUp ? "Sign In" : "Sign Up"}
    </button>
  </p>
  <p>
    Or{" "}
    <button
      type="button"
      onClick={handleTryDemo}
      disabled={submitting || isDemoLoading}
      className="text-blue-500 underline-offset-4 hover:underline disabled:opacity-50"
    >
      {isDemoLoading ? "loading demo..." : "try the demo"}
    </button>{" "}
    — no account needed
  </p>
</div>
```

**After:**
```tsx
<div className="mt-4 space-y-2">
  <Button
    type="button"
    variant="ghost"
    className="w-full"
    onClick={() => {
      setIsSignUp(!isSignUp);
      setConfirmPassword("");
      setErrorMessage(null);
    }}
  >
    {isSignUp ? "Sign in with email" : "Sign up with email"}
  </Button>
  <Button
    type="button"
    variant="ghost"
    className="w-full"
    onClick={handleTryDemo}
    disabled={submitting || isDemoLoading}
  >
    {isDemoLoading ? "Loading demo..." : "Try the demo — no account needed"}
  </Button>
</div>
```

---

### Visual Result

```text
┌─────────────────────────────────┐
│  [        Sign In           ]   │  ← Primary button
│                                 │
│  ─────────── or ───────────     │
│                                 │
│  [ G  Continue with Google  ]   │  ← Outline button
│  [   Sign in with Apple    ]   │  ← Outline button
│                                 │
│  [   Sign up with email     ]   │  ← Ghost button
│  [ Try the demo — no account ]  │  ← Ghost button
│                                 │
│        Privacy & Security       │
└─────────────────────────────────┘
```

---

### Summary

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace text links (lines 390-417) with two ghost `Button` components |

