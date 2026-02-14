

## 1. Remove hardcoded USER_NAMES from Admin.tsx

The `USER_NAMES` map on lines 18-28 contains real names tied to user numbers. Every reference (lines 161, 376, 450) already has a fallback of `User #${user.user_number}`, so the fix is simple:

- Delete the `USER_NAMES` constant entirely
- Replace all 3 usages with just `User #${user.user_number}` (the existing fallback)

Files changed: `src/pages/Admin.tsx`

---

## 2. Create a dev logger utility

Create `src/lib/logger.ts` with a thin wrapper around `console` that only logs when `import.meta.env.DEV` is true. This replaces the scattered `if (import.meta.env.DEV) console.log(...)` pattern and ungated `console.error` calls throughout the frontend.

```ts
// src/lib/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
};
```

Then update all frontend files that use `console.log/warn/error` to import and use `logger` instead:

- `src/pages/Admin.tsx` (1 call)
- `src/pages/Auth.tsx` (2 calls)
- `src/hooks/useAuth.tsx` (5 calls -- mix of gated and ungated)
- `src/hooks/useUserSettings.ts` (2 calls)
- `src/hooks/useFoodEntries.ts` (2 calls)
- `src/hooks/useExportData.ts` (2 calls)
- `src/hooks/useReadOnly.ts` (1 call)
- `src/components/FoodInput.tsx` (2 gated + 2 ungated)
- `src/components/BarcodeScanner.tsx` (2 calls)
- `src/components/DeleteAccountDialog.tsx` (2 calls)
- `src/components/ErrorBoundary.tsx` (1 call)

**Edge functions are excluded** -- server-side logging in Deno is expected and useful for debugging deployed functions. The cleanup focuses only on client-side code in `src/`.

Files changed: `src/lib/logger.ts` (new), plus ~11 files updated to use it.
