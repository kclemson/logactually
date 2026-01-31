

## Fix OAuth URL Validation - Wrong Hostname Check

### Root Cause

The OAuth flow is failing because of incorrect hostname validation. When calling `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true`, the returned URL is **not** directly to `accounts.google.com` or `appleid.apple.com`.

Instead, it returns a URL to **Supabase's auth endpoint**:
```
https://enricsnosdrhmfvbjaei.supabase.co/auth/v1/authorize?provider=google&...
```

The current code validates:
```typescript
if (oauthUrl.hostname !== "accounts.google.com") {
  throw new Error("Invalid OAuth redirect URL");
}
```

This **always fails** because the hostname is `enricsnosdrhmfvbjaei.supabase.co`, not `accounts.google.com`.

### Solution

Update the URL validation to check for the Supabase auth endpoint hostname (which contains `supabase.co`) instead of the OAuth provider's hostname. The Supabase endpoint then handles the redirect to Google/Apple.

Also add `console.error` logging so future issues are easier to debug.

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Fix hostname validation and add error logging |

### Code Changes

**handleGoogleSignIn (lines 148-159)** - Change validation:
```typescript
// Validate OAuth URL before redirect (security: prevent open redirect)
if (data?.url) {
  try {
    const oauthUrl = new URL(data.url);
    // Supabase returns URL to its own auth endpoint, not directly to Google
    if (!oauthUrl.hostname.endsWith("supabase.co")) {
      throw new Error("Invalid OAuth redirect URL");
    }
    window.location.href = data.url;
  } catch (e) {
    console.error("Google OAuth error:", e, "URL:", data?.url);
    setErrorMessage("Google sign-in failed. Please try again.");
    setIsGoogleLoading(false);
  }
} else {
  console.error("Google OAuth: No URL returned from Supabase");
  setErrorMessage("Google sign-in failed. Please try again.");
  setIsGoogleLoading(false);
}
```

**handleAppleSignIn (lines 201-212)** - Same pattern:
```typescript
// Validate OAuth URL before redirect (security: prevent open redirect)
if (data?.url) {
  try {
    const oauthUrl = new URL(data.url);
    // Supabase returns URL to its own auth endpoint, not directly to Apple
    if (!oauthUrl.hostname.endsWith("supabase.co")) {
      throw new Error("Invalid OAuth redirect URL");
    }
    window.location.href = data.url;
  } catch (e) {
    console.error("Apple OAuth error:", e, "URL:", data?.url);
    setErrorMessage("Apple sign-in failed. Please try again.");
    setIsAppleLoading(false);
  }
} else {
  console.error("Apple OAuth: No URL returned from Supabase");
  setErrorMessage("Apple sign-in failed. Please try again.");
  setIsAppleLoading(false);
}
```

Also add logging for the Supabase error case (lines 142-146 and 195-199):
```typescript
if (error) {
  console.error("Google OAuth Supabase error:", error);
  setErrorMessage("Google sign-in failed. Please try again.");
  setIsGoogleLoading(false);
  return;
}
```

### OAuth Flow Explained

```text
1. User clicks "Continue with Google"
2. Code calls supabase.auth.signInWithOAuth with skipBrowserRedirect: true
3. Supabase returns: https://enricsnosdrhmfvbjaei.supabase.co/auth/v1/authorize?provider=google&...
4. We validate it's a supabase.co URL (security check)
5. We redirect user to that Supabase URL
6. Supabase redirects user to accounts.google.com
7. User authenticates with Google
8. Google redirects back to Supabase callback
9. Supabase redirects back to logactually.com with auth tokens
```

### Security Note

Validating against `supabase.co` is secure because:
- Only legitimate Supabase instances use `*.supabase.co` domains
- The URL contains the project ID in the subdomain
- Supabase handles the actual provider redirect securely

