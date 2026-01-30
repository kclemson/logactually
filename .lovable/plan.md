

## Fix Theme Reverting on Settings Page Interactions

### Problem

When you change the theme on the Settings page, then interact with other elements (like collapsing sections), the theme unexpectedly reverts to its previous value.

**Root cause**: The `updateSettings` function in `useUserSettings.ts` uses a stale closure of `settings` when creating the new settings object. If a re-render happens during the async database update, the callback can capture outdated state.

### Solution

Use a functional state update pattern to ensure we always work with the latest state, not a stale closure:

**File: `src/hooks/useUserSettings.ts`**

```tsx
const updateSettings = useCallback(
  async (updates: Partial<UserSettings>) => {
    if (!user) return;

    // Store previous settings for potential rollback
    let previousSettings: UserSettings;
    
    // Use functional update to ensure we get latest state
    setSettings(current => {
      previousSettings = current;
      return { ...current, ...updates };
    });

    const { error } = await supabase
      .from('profiles')
      .update({ settings: { ...previousSettings!, ...updates } })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to save settings:', error);
      // Revert on error using the captured previous state
      setSettings(previousSettings!);
    }
  },
  [user]  // Remove `settings` from dependencies
);
```

### Why This Fixes It

1. **Functional state update** (`setSettings(current => ...)`) always receives the latest state value, avoiding stale closures
2. **Removing `settings` from dependencies** means the callback doesn't get recreated on every settings change, preventing closure staleness
3. **Capturing `previousSettings`** inside the functional update ensures rollback uses the correct value

### Changes Summary

| File | Change |
|------|--------|
| `src/hooks/useUserSettings.ts` | Update `updateSettings` to use functional state pattern |

