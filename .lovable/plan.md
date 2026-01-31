

## Add URL Parameter to Show OAuth Buttons

### Overview

Add a `?oauth=1` URL parameter that enables the Google and Apple sign-in buttons. Without this parameter, the OAuth buttons will be hidden from regular users while you debug the 404 issue in production.

### Usage

- **Regular users**: `https://logactually.com/auth` → OAuth buttons hidden
- **Testing**: `https://logactually.com/auth?oauth=1` → OAuth buttons visible

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add `showOAuth` flag based on URL param, conditionally render OAuth buttons |

### Code Changes

**Line 17** - Add the OAuth param check (after existing `isResetCallback`):
```typescript
const isResetCallback = searchParams.get("reset") === "true";
const showOAuth = searchParams.get("oauth") === "1";
```

**Lines 361-414** - Wrap the Google and Apple buttons in a conditional:
```tsx
{/* OAuth buttons - hidden unless ?oauth=1 */}
{showOAuth && (
  <>
    {/* Google */}
    <Button ... >
      Continue with Google
    </Button>

    {/* Apple */}
    <Button ... >
      Sign in with Apple
    </Button>
  </>
)}

{/* Email Sign Up - always visible */}
<Button ... >
  Sign up with email
</Button>
```

### Result

| URL | Google Button | Apple Button | Email Sign Up |
|-----|---------------|--------------|---------------|
| `/auth` | Hidden | Hidden | Visible |
| `/auth?oauth=1` | Visible | Visible | Visible |
| `/auth?reset=true` | N/A (password update form) | N/A | N/A |

### Notes

- The "Sign up with email" button remains visible always
- Demo link remains visible always
- Once OAuth is fixed, remove the conditional and show buttons to everyone

