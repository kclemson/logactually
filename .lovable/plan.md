

## Smart Close Button Navigation

### Overview
Update the Privacy page close button to navigate based on authentication status instead of using browser history.

---

### Changes to `src/pages/Privacy.tsx`

#### 1. Add Import
Add `useAuth` to imports at line 2:
```tsx
import { useAuth } from "@/hooks/useAuth";
```

#### 2. Get User in Component
Add after the `navigate` hook (around line 136):
```tsx
const { user } = useAuth();
```

#### 3. Update Close Button Handler
Change line 145 from:
```tsx
onClick={() => navigate(-1)}
```
To:
```tsx
onClick={() => navigate(user ? "/" : "/auth")}
```

---

### Summary

| Change | Description |
|--------|-------------|
| Import | Add `useAuth` hook |
| Hook call | Extract `user` from auth context |
| Navigation | `user ? "/" : "/auth"` instead of `navigate(-1)` |

### Result
- Authenticated users closing the page → goes to main app (`/`)
- Unauthenticated users closing the page → goes to login (`/auth`)

