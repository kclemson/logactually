
## Temporarily Hide OAuth Sign-In Buttons

### Overview
Comment out/hide the Google and Apple OAuth buttons on the Auth page until the custom domain OAuth issue is properly resolved.

### Changes

**File: `src/pages/Auth.tsx`**

Comment out the OAuth section (the divider and both buttons):

```tsx
{/* OAuth temporarily disabled on custom domain - TODO: fix /~oauth routing
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">or</span>
  </div>
</div>

<div className="space-y-2">
  <Button ... onClick={handleGoogleSignIn}>Continue with Google</Button>
  <Button ... onClick={handleAppleSignIn}>Sign in with Apple</Button>
</div>
*/}
```

### What stays working
- Email/password sign in
- Email/password sign up  
- Password reset flow
- Demo mode

### Cleanup for later
When you pick this back up tomorrow, the OAuth buttons are still in the code (just commented out) and the backstop route in `App.tsx` is harmless. You can uncomment and continue debugging.
