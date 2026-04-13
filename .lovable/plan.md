

## Remove cholesterol from display macros

### Change

**`src/lib/macro-display.ts`**

Remove the `cholesterol` entry from the `MACRO_META` record and remove `'cholesterol'` from the `MacroKey` type union. This single change propagates everywhere: the settings picker won't show it, and no other code references cholesterol independently.

If any user currently has `cholesterol` selected in their `displayMacros`, add a migration guard in `useUserSettings.ts` (inside the query parse, next to the existing `'deficit'` migration) that replaces any `'cholesterol'` slot with `'fat'` (or the first available macro not already selected).

Two files, ~5 lines changed.

