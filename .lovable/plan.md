
## Category 2 Cleanup: Safe/Simple Fixes

### 1. Remove useEffect from NotFound.tsx
**File:** `src/pages/NotFound.tsx`

Remove the `useEffect` + `console.error` entirely. A user hitting a 404 is normal behavior, not an application error. The `useEffect` import and `useLocation` hook can also be removed since nothing else uses them.

The component becomes a simple stateless render with a link back to `/`.

### 2. Guard production console.log statements
**Files:** `src/components/FoodInput.tsx`, `src/hooks/useScanBarcode.ts`

Wrap the three `console.log` calls in `import.meta.env.DEV` checks so they only fire during local development:

- `FoodInput.tsx` line 136: `"Detected UPC in text input..."`
- `FoodInput.tsx` line 154: `"Barcode scanned:"`
- `useScanBarcode.ts` line 28: `"Looking up UPC:"`

The `console.error` in useScanBarcode's catch block stays -- that's legitimate error logging.

### 3. Remove feature-flags.ts
**File:** `src/lib/feature-flags.ts` (delete)

`FEATURES.WEIGHT_TRACKING` is always `true`, making every check like `FEATURES.WEIGHT_TRACKING || isAdmin` evaluate to just `true`. Remove the file and simplify all 5 consumer files:

| File | Current | After |
|------|---------|-------|
| `BottomNav.tsx` | `(FEATURES.WEIGHT_TRACKING \|\| isAdmin) && settings.showWeights` | `settings.showWeights` |
| `Settings.tsx` | `FEATURES.WEIGHT_TRACKING \|\| isAdmin` | `true` (remove the variable, just show it) |
| `Trends.tsx` | `(FEATURES.WEIGHT_TRACKING \|\| isAdmin) && settings.showWeights` | `settings.showWeights` |
| `History.tsx` | `(FEATURES.WEIGHT_TRACKING \|\| isAdmin) && settings.showWeights` | `settings.showWeights` |
| `WeightLog.tsx` | Guard that redirects if flag is off | Remove the guard entirely |

The `isAdmin` checks in these specific lines were only there as an override for when the flag was off -- they're no longer needed. (Admin checks used elsewhere for other purposes remain untouched.)

### 4. Document the next-themes hydration workaround
**File:** `src/pages/Settings.tsx`

Expand the comment on the `mounted` state + `useEffect` from the vague `// Avoid hydration mismatch` to:

```typescript
// next-themes can't determine the resolved theme on the server/first render,
// so `theme` is undefined until the client mounts. We delay rendering the
// theme toggle until mounted to avoid showing the wrong selected value.
```

### Summary

| Change | Files touched |
|--------|--------------|
| Remove useEffect from NotFound | `src/pages/NotFound.tsx` |
| Guard console.logs with DEV check | `src/components/FoodInput.tsx`, `src/hooks/useScanBarcode.ts` |
| Delete feature-flags.ts + simplify consumers | `src/lib/feature-flags.ts` (delete), `src/components/BottomNav.tsx`, `src/pages/Settings.tsx`, `src/pages/Trends.tsx`, `src/pages/History.tsx`, `src/pages/WeightLog.tsx` |
| Document hydration workaround | `src/pages/Settings.tsx` |

All changes are safe -- no functional behavior changes.
