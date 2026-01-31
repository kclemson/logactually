

## Clean Up OAuth Code - Remove Dead Workarounds

### Summary

Remove the broken custom domain workarounds from `Auth.tsx` and use the standard auto-generated `lovable` module. With BYOK credentials configured in Lovable Cloud, the standard flow works on all domains without special handling.

### Dead Code to Remove

| Location | What | Why It's Dead |
|----------|------|---------------|
| Line 5 | `import { createLovableAuth }` | Duplicates what `lovable` module already does |
| Lines 14-15 | `PREVIEW_DOMAIN` constant | Workaround that doesn't solve BYOK requirement |
| Lines 128-140 | `isCustomDomain` detection + manual `createLovableAuth` | Workaround that doesn't work |
| Lines 157-164 | Manual `supabase.auth.setSession()` | Already handled by `lovable` module |
| Lines 171-183 | Duplicate domain detection for Apple | Same dead workaround |
| Lines 200-207 | Duplicate manual session setting for Apple | Already handled by `lovable` module |

### File Changes

**File:** `src/pages/Auth.tsx`

**1. Fix imports (lines 4-5)**
```typescript
// Before:
import { supabase } from "@/integrations/supabase/client";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";

// After:
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
```

**2. Remove dead constant (lines 14-15)**
```typescript
// DELETE these lines:
// Preview domain for OAuth broker (works on custom domains too)
const PREVIEW_DOMAIN = "https://id-preview--db525336-2711-490b-a991-6d235ef8c0ef.lovable.app";
```

**3. Simplify handleGoogleSignIn (lines 124-165)**
```typescript
// Before: 42 lines with domain detection, manual auth creation, manual session setting
// After: 18 lines using the standard module

const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  setErrorMessage(null);
  
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (result.redirected) {
    return; // Page is redirecting to OAuth provider
  }

  if (result.error) {
    console.error("Google OAuth error:", result.error);
    setErrorMessage("Google sign-in failed. Please try again.");
  }
  
  setIsGoogleLoading(false);
};
```

**4. Simplify handleAppleSignIn (lines 167-208)**
```typescript
// Before: 42 lines with duplicate workarounds
// After: 18 lines using the standard module

const handleAppleSignIn = async () => {
  setIsAppleLoading(true);
  setErrorMessage(null);
  
  const result = await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });

  if (result.redirected) {
    return; // Page is redirecting to OAuth provider
  }

  if (result.error) {
    console.error("Apple OAuth error:", result.error);
    setErrorMessage("Apple sign-in failed. Please try again.");
  }
  
  setIsAppleLoading(false);
};
```

### Why This Works

The auto-generated `src/integrations/lovable/index.ts` module already:
1. Creates `lovableAuth` with default configuration
2. Calls the OAuth provider
3. Sets the session in Supabase after successful authentication

With BYOK credentials configured in Lovable Cloud dashboard:
- Your Google OAuth client has your custom domain in its redirect URIs
- Lovable Cloud uses your credentials (not managed ones)
- The standard flow works on any domain you've whitelisted

### Code Reduction

| Metric | Before | After |
|--------|--------|-------|
| Lines in OAuth handlers | 84 | 36 |
| Custom domain detection | 2 copies | 0 |
| Manual session setting | 2 copies | 0 |
| Dead constants | 1 | 0 |

### What Stays the Same

- `?oauth=1` feature flag (line 21) - keeps OAuth hidden until ready
- OAuth button UI and styling (lines 427-503)
- All other auth flows (email/password, demo, reset)

### Testing After Implementation

1. Finish Google Cloud Console setup (add redirect URIs)
2. Save Client ID and Secret in Lovable Cloud dashboard  
3. Publish the cleaned-up code
4. Test at `https://logactually.com/auth?oauth=1`

