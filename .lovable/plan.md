

## Add "Show Weights" Toggle Setting

### Overview
Add a user preference toggle in Settings → Preferences to control visibility of weight-tracking features. Uses positive framing with a simple toggle, defaulting to enabled.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/hooks/useUserSettings.ts` | Add `showWeights: boolean` to interface & defaults |
| `src/pages/Settings.tsx` | Add toggle in Preferences section, conditionally hide weight-related settings |
| `src/components/BottomNav.tsx` | Update visibility logic to include `settings.showWeights` |
| `src/pages/Trends.tsx` | Update visibility logic to include `settings.showWeights` |
| `src/pages/History.tsx` | Update visibility logic to include `settings.showWeights` |

---

### Implementation Details

**1. UserSettings Hook**

```typescript
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
  showWeights: boolean;  // NEW
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,    // Enabled by default
};
```

**2. Settings Page UI**

Add in Preferences section (after Weight Units, but only visible when weights are shown):

```
Show Weights
[Toggle ✓]
```

Simple toggle button - when disabled, also hides:
- "Saved Routines" section
- "Weight Units" option
- "Weights Log" export option

**3. Visibility Logic Updates**

In BottomNav, Trends, and History:

```typescript
const { settings } = useUserSettings();
const showWeights = (FEATURES.WEIGHT_TRACKING || isAdmin) && settings.showWeights;
```

---

### Areas Hidden When Toggle is Off

| Location | What Gets Hidden |
|----------|------------------|
| Bottom Nav | "Weights" tab |
| Trends | "Weights Trends" section |
| History | Dumbbell icons, weight query disabled |
| Settings | "Saved Routines", "Weight Units", weights export |

---

### Technical Notes

- No database migration needed - JSONB blob handles new keys via spread/merge
- Default `true` ensures existing users see no change
- Toggle only appears when `FEATURES.WEIGHT_TRACKING` is enabled globally
- Changes apply immediately (optimistic update pattern already in place)

