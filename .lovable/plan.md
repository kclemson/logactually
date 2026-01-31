

## Fix OAuth on Custom Domains - Use Absolute Broker URL

### Summary

Update the OAuth implementation to use Lovable's managed credentials on custom domains by configuring the `@lovable.dev/cloud-auth-js` library with an absolute broker URL pointing to the preview domain.

### Root Cause

The current implementation tries to bypass Lovable auth and call Supabase directly on custom domains, which fails because Lovable's managed OAuth credentials (Google/Apple Client IDs) are only accessible through the Lovable auth broker—not directly from Supabase.

### Solution

Instead of bypassing the Lovable auth system, configure it to use the **absolute URL** of the preview domain's OAuth broker. This allows custom domains to leverage the same managed credentials as preview domains.

### File Changes

**File:** `src/pages/Auth.tsx`

| Section | Change |
|---------|--------|
| Imports (line 5) | Replace `lovable` import with `createLovableAuth` from `@lovable.dev/cloud-auth-js` |
| After imports (line 12) | Add `PREVIEW_DOMAIN` constant |
| `handleGoogleSignIn` (lines 121-179) | Replace Supabase direct call with configured Lovable auth |
| `handleAppleSignIn` (lines 181-239) | Replace Supabase direct call with configured Lovable auth |

### Implementation Details

**1. Update imports:**
```typescript
// Remove: import { lovable } from "@/integrations/lovable/index";
// Add:
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
```

**2. Add preview domain constant:**
```typescript
const PREVIEW_DOMAIN = "https://id-preview--db525336-2711-490b-a991-6d235ef8c0ef.lovable.app";
```

**3. Simplified handler pattern (both Google and Apple):**
```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  setErrorMessage(null);
  
  const hostname = window.location.hostname;
  const isCustomDomain = 
    !hostname.includes("lovable.app") &&
    !hostname.includes("lovableproject.com") &&
    hostname !== "localhost";

  // Configure auth with absolute broker URL for custom domains
  const lovableAuth = createLovableAuth(
    isCustomDomain 
      ? { oauthBrokerUrl: `${PREVIEW_DOMAIN}/~oauth/initiate` }
      : {}
  );

  const result = await lovableAuth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (result.redirected) {
    return; // Page is redirecting to OAuth provider
  }

  if (result.error) {
    console.error("Google OAuth error:", result.error);
    setErrorMessage("Google sign-in failed. Please try again.");
    setIsGoogleLoading(false);
    return;
  }

  // Set the session in Supabase
  try {
    await supabase.auth.setSession(result.tokens);
  } catch (e) {
    console.error("Failed to set session:", e);
    setErrorMessage("Google sign-in failed. Please try again.");
    setIsGoogleLoading(false);
  }
};
```

### OAuth Flow (Fixed)

```text
Custom Domain (logactually.com):
1. User clicks "Continue with Google"
2. Code creates lovableAuth with oauthBrokerUrl = "https://[preview].lovable.app/~oauth/initiate"
3. lovableAuth.signInWithOAuth redirects to preview domain's broker
4. Broker uses Lovable's managed Google credentials
5. User authenticates with Google
6. Broker redirects back to logactually.com (via redirect_uri)
7. Session is set in Supabase client
```

### Feature Flag Preserved

The `?oauth=1` feature flag remains intact. The OAuth buttons are only rendered when `showOAuth` is true (line 455), so production users won't see OAuth options unless they explicitly use `?oauth=1`.

### Testing

After implementation, test at: `https://logactually.com/auth?oauth=1`

