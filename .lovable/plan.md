

## Make Demo Mode More Visible on Login Page

### Summary

Move the demo link from the bottom of the login form to directly below the app tagline, making it more prominent for first-time visitors.

### Changes to `src/pages/Auth.tsx`

**1. Add demo link in CardHeader (after the description)**

Insert a new paragraph right after the `CardDescription` component (line 257):

```tsx
<CardHeader className="text-center">
  <img src="/logactually-logo-horiz.png" alt={APP_NAME} className="h-16 mx-auto mb-2" />
  <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
  <CardDescription>Braindump what you ate or lifted — AI handles the rest</CardDescription>
  <p className="text-sm text-muted-foreground pt-1">
    <button
      type="button"
      onClick={handleTryDemo}
      disabled={submitting || isDemoLoading || isGoogleLoading}
      className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
    >
      {isDemoLoading ? "loading demo..." : "Try the demo"}
    </button>
    {" "}— no account needed
  </p>
</CardHeader>
```

**2. Remove the old demo link (currently at lines 405-417)**

Delete the existing demo paragraph from below the OAuth buttons:

```tsx
{/* Demo link - REMOVE THIS */}
<p className="mt-4 text-center text-sm text-muted-foreground">
  Or{" "}
  <button ...>
    {isDemoLoading ? "loading demo..." : "try the demo"}
  </button>{" "}
  — no account needed
</p>
```

### Text Changes

| Before | After |
|--------|-------|
| `Or try the demo — no account needed` | `Try the demo — no account needed` |

- Removed "Or" since it's no longer following other options
- Capitalized "Try" since it's now at the start of the sentence

