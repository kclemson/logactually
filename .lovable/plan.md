

## Fix OAuth 404 Error on Custom Domains

### Problem

When clicking "Continue with Google" or "Sign in with Apple" on `logactually.com`, the app navigates to:
```
https://logactually.com/~oauth/initiate?provider=google&...
```

This returns a 404 because:
1. The `@lovable.dev/cloud-auth-js` library uses a **relative path** (`/~oauth/initiate`)
2. On Lovable preview domains (`*.lovable.app`), this route exists and is handled by Lovable's infrastructure
3. On custom domains, this route **doesn't exist** - the custom domain only serves static frontend files

### Solution

Detect custom domains and use Supabase OAuth directly with `skipBrowserRedirect: true`, which returns the OAuth URL for manual redirection instead of going through the non-existent proxy.

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update `handleGoogleSignIn` and `handleAppleSignIn` to detect custom domains and bypass the lovable auth proxy |

### Detection Logic

A custom domain is one that:
- Is NOT `*.lovable.app`
- Is NOT `*.lovableproject.com`
- Is NOT `localhost`

### Code Changes

**Lines 121-133** - Replace `handleGoogleSignIn`:

```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  setErrorMessage(null);
  
  // Detect if we're on a custom domain (not Lovable infrastructure)
  const hostname = window.location.hostname;
  const isCustomDomain = 
    !hostname.includes("lovable.app") &&
    !hostname.includes("lovableproject.com") &&
    hostname !== "localhost";

  if (isCustomDomain) {
    // Bypass lovable auth-bridge - use Supabase directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setErrorMessage("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
      return;
    }

    // Validate OAuth URL before redirect (security: prevent open redirect)
    if (data?.url) {
      try {
        const oauthUrl = new URL(data.url);
        if (oauthUrl.hostname !== "accounts.google.com") {
          throw new Error("Invalid OAuth redirect URL");
        }
        window.location.href = data.url;
      } catch {
        setErrorMessage("Google sign-in failed. Please try again.");
        setIsGoogleLoading(false);
      }
    }
  } else {
    // Use lovable auth for preview domains (handles iframe popup flow)
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      setErrorMessage("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  }
};
```

**Lines 135-147** - Replace `handleAppleSignIn`:

```typescript
const handleAppleSignIn = async () => {
  setIsAppleLoading(true);
  setErrorMessage(null);
  
  // Detect if we're on a custom domain (not Lovable infrastructure)
  const hostname = window.location.hostname;
  const isCustomDomain = 
    !hostname.includes("lovable.app") &&
    !hostname.includes("lovableproject.com") &&
    hostname !== "localhost";

  if (isCustomDomain) {
    // Bypass lovable auth-bridge - use Supabase directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setErrorMessage("Apple sign-in failed. Please try again.");
      setIsAppleLoading(false);
      return;
    }

    // Validate OAuth URL before redirect (security: prevent open redirect)
    if (data?.url) {
      try {
        const oauthUrl = new URL(data.url);
        if (oauthUrl.hostname !== "appleid.apple.com") {
          throw new Error("Invalid OAuth redirect URL");
        }
        window.location.href = data.url;
      } catch {
        setErrorMessage("Apple sign-in failed. Please try again.");
        setIsAppleLoading(false);
      }
    }
  } else {
    // Use lovable auth for preview domains (handles iframe popup flow)
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      setErrorMessage("Apple sign-in failed. Please try again.");
      setIsAppleLoading(false);
    }
  }
};
```

### How It Works

| Domain | Flow |
|--------|------|
| `logactually.com` | Detects custom domain → calls `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true` → validates URL → redirects to `accounts.google.com` or `appleid.apple.com` |
| `*.lovable.app` | Uses `lovable.auth.signInWithOAuth` → handles popup/iframe flow automatically |
| `localhost` | Uses `lovable.auth.signInWithOAuth` → handles popup flow in dev |

### Security

- URL validation prevents open redirect attacks
- Only allows redirects to:
  - `accounts.google.com` for Google OAuth
  - `appleid.apple.com` for Apple OAuth
- Any other hostname in the returned URL will show an error message

### Testing

After deployment:
1. Go to `https://logactually.com/auth?oauth=1`
2. Click "Continue with Google"
3. Should redirect to `accounts.google.com` (not `/~oauth/initiate`)
4. Complete Google sign-in
5. Should redirect back to `logactually.com` and be logged in

