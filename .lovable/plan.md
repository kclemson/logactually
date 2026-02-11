

## Make Calorie Burn Enabled by Default (Opt-Out)

### Changes

1. **`src/hooks/useUserSettings.ts`** -- Change `calorieBurnEnabled` default from `false` to `true` in `DEFAULT_SETTINGS`.

That's it. Since settings are merged as `{ ...DEFAULT_SETTINGS, ...storedSettings }`, any user who hasn't explicitly set `calorieBurnEnabled` will now get `true`. Users who have already toggled it off will keep their stored `false` value. No database migration needed.

