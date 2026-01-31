

## Minimal Fix: Clear Query Cache on Sign Out

### Overview

Add a single line to clear the React Query cache when the user signs out. This prevents stale data from the previous user leaking into a new session.

---

### Changes

#### 1. Create Shared QueryClient Module

**New file: `src/lib/query-client.ts`**

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();
```

---

#### 2. Update App.tsx

Change from creating queryClient locally to importing it:

```typescript
// Remove this line:
const queryClient = new QueryClient();

// Add this import:
import { queryClient } from "@/lib/query-client";
```

---

#### 3. Update useAuth.tsx

Add one import and one line in `signOut`:

```typescript
// Add import at top:
import { queryClient } from "@/lib/query-client";

// In signOut function, add this line before clearing auth state:
const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    // ... existing error handling
  }
  
  // ADD THIS LINE - Clear React Query cache to prevent data leakage
  queryClient.clear();
  
  // EXISTING CODE - Clear local auth state
  cachedSession = null;
  cachedUser = null;
  setSession(null);
  setUser(null);
};
```

---

### Summary

| File | Change |
|------|--------|
| `src/lib/query-client.ts` | New file (3 lines) |
| `src/App.tsx` | Change import source (1 line) |
| `src/hooks/useAuth.tsx` | Add import + 1 line in signOut |

**Total: ~5 lines of actual changes**

