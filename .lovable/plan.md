

## Track First Login for New Signups

Currently, `increment_login_count` is only called in the `signIn` function, so users who sign up never get their first login counted. We'll add tracking after successful signup.

### Changes

**File: `src/pages/Auth.tsx`**

After a successful signup (when `!error` and `isSignUp`), call the same `increment_login_count` RPC to count the account creation as the user's first engagement.

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setErrorMessage(null);

  if (isSignUp && password !== confirmPassword) {
    setErrorMessage("Passwords do not match.");
    setSubmitting(false);
    return;
  }

  const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

  if (error) {
    setErrorMessage(error.message);
  } else if (isSignUp) {
    // Track signup as first login (fire-and-forget)
    // Note: User may not be immediately available if email confirmation is required
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.rpc('increment_login_count', { user_id: user.id });
      }
    });
  }

  setSubmitting(false);
};
```

### Considerations

- Uses fire-and-forget pattern (same as `signIn`) so it doesn't block the auth flow
- Only attempts to increment if we can get the user (handles email confirmation scenarios gracefully)
- New users will now start with `login_count = 1` instead of 0

