

## Add OAuth with Consistent Button Styling

### Overview

Add Google and Apple OAuth sign-in using Lovable Cloud's managed solution, with all 4 sign-in options displayed as visually consistent buttons (same `outline` variant).

---

### UI Layout

```text
+------------------------------------------+
|    [G] Continue with Google              |  <- outline button
+------------------------------------------+
|    [] Continue with Apple                |  <- outline button  
+------------------------------------------+
|    [Mail] Sign up with Email             |  <- outline button (expands form)
+------------------------------------------+
|    [Play] Try Demo - no account needed   |  <- outline button
+------------------------------------------+
```

All 4 buttons use the same `outline` variant. Text remains as-is from current implementation.

---

### Implementation Steps

#### Step 1: Configure Social Auth Providers

Use the system tool to:
- Install `@lovable.dev/cloud-auth-js` package
- Generate `src/integrations/lovable/index.ts`
- Enable Google and Apple providers

#### Step 2: Refactor Auth.tsx

**New state:**
```typescript
const [showEmailForm, setShowEmailForm] = useState(false);
```

**OAuth handlers:**
```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleSignIn = async () => {
  setErrorMessage(null);
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (error) setErrorMessage(error.message);
};

const handleAppleSignIn = async () => {
  setErrorMessage(null);
  const { error } = await lovable.auth.signInWithOAuth("apple", {
    redirect_uri: window.location.origin,
  });
  if (error) setErrorMessage(error.message);
};
```

**Button layout (default view):**
```tsx
<div className="space-y-3">
  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
    <Chrome className="h-4 w-4" />
    Continue with Google
  </Button>
  <Button variant="outline" className="w-full" onClick={handleAppleSignIn}>
    <Apple className="h-4 w-4" />
    Continue with Apple
  </Button>
  <Button variant="outline" className="w-full" onClick={() => setShowEmailForm(true)}>
    <Mail className="h-4 w-4" />
    Sign up with Email
  </Button>
  <Button variant="outline" className="w-full" onClick={handleTryDemo} disabled={isDemoLoading}>
    <Play className="h-4 w-4" />
    {isDemoLoading ? "Loading demo..." : "Try Demo — no account needed"}
  </Button>
</div>
```

When email button clicked, show existing email/password form with a back arrow to return.

---

### Files Changed

1. **Configure social auth** (system tool):
   - Generates `src/integrations/lovable/index.ts`
   - Installs `@lovable.dev/cloud-auth-js`

2. **`src/pages/Auth.tsx`**:
   - Import `lovable` client
   - Import icons: `Mail`, `Play`, `Chrome` from lucide-react
   - Add `showEmailForm` state
   - Add OAuth handler functions
   - Refactor to show 4 outline buttons by default
   - Existing form renders when `showEmailForm` is true
   - Add back navigation from form view

---

### Key Points

| Item | Kept As-Is |
|------|------------|
| "Sign up with Email" text | ✓ |
| "no account needed" demo clarification | ✓ |
| Existing email/password form behavior | ✓ |
| Sign In / Sign Up toggle within form | ✓ |
| Demo login logic | ✓ |

Only the visual presentation changes - all 4 options become equal-weight outline buttons.

