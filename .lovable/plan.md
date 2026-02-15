

# Reorder Settings sections

Move Account to the bottom (above About) and move Custom Log Types below Saved Routines.

## New order
1. Preferences
2. Saved Meals
3. Saved Routines (conditional)
4. Custom Log Types (conditional)
5. Import/Export
6. Account
7. About

## Technical change

**File:** `src/pages/Settings.tsx` -- reorder the JSX children in the return block. No logic changes needed, just rearrange the lines.

Current (lines 22-31):
```tsx
<AccountSection ... />
<PreferencesSection ... />
{settings.showCustomLogs && <CustomLogTypesSection ... />}
<SavedMealsSection ... />
{settings.showWeights && <SavedRoutinesSection ... />}
<ImportExportSection ... />
<AboutSection />
```

New order:
```tsx
<PreferencesSection ... />
<SavedMealsSection ... />
{settings.showWeights && <SavedRoutinesSection ... />}
{settings.showCustomLogs && <CustomLogTypesSection ... />}
<ImportExportSection ... />
<AccountSection ... />
<AboutSection />
```

