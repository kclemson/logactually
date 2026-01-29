

## Enable Weight Tracking for All Users

### Overview
The weight logging feature is currently gated behind development mode (`import.meta.env.DEV`) which means it only shows for developers locally or for admin users in production. To make it available to all users, the feature flag needs to be enabled.

---

### Changes

**File:** `src/lib/feature-flags.ts`

Update the `WEIGHT_TRACKING` flag from development-only to enabled for everyone:

```tsx
// Before (line 9)
WEIGHT_TRACKING: import.meta.env.DEV,

// After
WEIGHT_TRACKING: true,
```

---

### What This Enables

Once the flag is set to `true`, all users will see:

1. **"Log Weights" tab** in the bottom navigation (between "Log Food" and "Calendar")
2. **"Weight Trends" section** on the Trends page showing exercise charts

---

### No Other Changes Required

The navigation (`BottomNav.tsx`) and Trends page already have the correct logic:
```tsx
const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
```

Once `FEATURES.WEIGHT_TRACKING` becomes `true`, all users will have access.

---

### Files to Modify
1. `src/lib/feature-flags.ts` - Change `WEIGHT_TRACKING` from `import.meta.env.DEV` to `true`

