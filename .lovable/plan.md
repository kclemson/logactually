

## Fix Google OAuth on Custom Domain

### Overview

Implement a two-layer fix for the 404 error when using Google OAuth on the custom domain (logactually.com):

- **Layer A (Primary)**: Create a custom OAuth wrapper that uses an absolute URL to the broker
- **Layer B (Backstop)**: Add a React Router route to redirect any `/~oauth/*` requests that slip through

---

### Changes

#### 1. Create Custom OAuth Wrapper

**New file: `src/lib/lovable-auth.ts`**

```typescript
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

// Configure with absolute URL to fix custom domain OAuth
const lovableAuth = createLovableAuth({
  oauthBrokerUrl: "https://oauth.lovable.app/~oauth/initiate",
});

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: { redirect_uri?: string }
    ) => {
      const result = await lovableAuth.signInWithOAuth(provider, { ...opts });

      if (result.redirected) return result;
      if (result.error) return result;

      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    },
  },
};
```

---

#### 2. Update Auth Page Import

**File: `src/pages/Auth.tsx`**

Change line 5:
```typescript
// Before
import { lovable } from "@/integrations/lovable/index";

// After
import { lovable } from "@/lib/lovable-auth";
```

---

#### 3. Add Backstop Route

**File: `src/App.tsx`**

Add OAuth redirect component and route:

```typescript
// Add to imports
import { useEffect } from "react";

// New component (before App component)
const OAuthRedirect = () => {
  useEffect(() => {
    window.location.href = `https://oauth.lovable.app${window.location.pathname}${window.location.search}`;
  }, []);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

// Add route before the catch-all "*" route
<Route path="/~oauth/*" element={<OAuthRedirect />} />
```

---

### Summary

| File | Change |
|------|--------|
| `src/lib/lovable-auth.ts` | New file - custom wrapper with absolute `oauthBrokerUrl` |
| `src/pages/Auth.tsx` | Update import to use custom wrapper |
| `src/App.tsx` | Add `OAuthRedirect` component and `/~oauth/*` route |

