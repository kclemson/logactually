

## Phase 2: Add macro display picker to Settings

### What to build

A new row in PreferencesSection with 3 inline `Select` dropdowns that let the user choose which macros appear in the 3 display slots. A "Reset" link appears when non-default values are selected.

### UI design

```text
Display macros                    [Protein ▾] [Carbs ▾] [Fat ▾]
Customize the 3 values shown
in food tables and charts                          Reset to default
```

- Label + subtitle on the left, 3 compact selects on the right stacked in a column or row depending on space
- Each select shows all 9 macro options from `MACRO_META`
- Duplicate prevention: each select excludes values already chosen in the other two slots
- "Reset to default" text link appears only when current selection differs from `['protein', 'carbs', 'fat']`
- Saving is immediate per-slot (same as all other settings — calls `updateSettings` on change)

### Implementation

**One file changed: `src/components/settings/PreferencesSection.tsx`**

Add a new settings row after "Daily Calorie Target" (or after "First day of week" — placement is flexible). The row contains:
- 3 `Select` components, each bound to `settings.displayMacros[0]`, `[1]`, `[2]`
- On change of any slot, call `updateSettings({ displayMacros: [newSlot0, newSlot1, newSlot2] })`
- Filter each select's options to exclude the other two selected values (no duplicates)
- Conditional "Reset to default" button that sets `displayMacros` back to `DEFAULT_DISPLAY_MACROS`

Import `MACRO_META`, `MacroKey`, `DEFAULT_DISPLAY_MACROS`, `isStandardMacros` from `@/lib/macro-display`.

### Scope

One file, ~40 lines added.

