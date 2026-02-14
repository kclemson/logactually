

## Settings Refactor: Skip Heavy Tests, Write a Smoke Test

### Rationale

The Settings page is 584 lines of conditional JSX rendering with ~15 `useState` calls and 8+ hook dependencies. Writing a full test suite requires mocking all of those hooks, and those mocks become tightly coupled to implementation details -- they'd need updating during the refactor itself, defeating the purpose.

The refactor is a **mechanical extraction** (moving JSX blocks into separate files with the same props). The real risk isn't logic breakage -- it's accidentally dropping a section or misrouting a prop. A lightweight smoke test catches that without the mock maintenance burden.

### What we'll create

**One file: `src/pages/Settings.test.tsx`**

A single smoke test that renders Settings with minimal mocks and checks that all 7 section headers are present in the DOM:

- Account
- Preferences
- Custom Log Types (when `showCustomLogs=true`)
- Saved Meals
- Saved Routines (when `showWeights=true`)
- Import and Export
- About

Plus one additional case: verify that "Saved Routines" and "Custom Log Types" are **absent** when their respective feature flags are off.

**Total: 2 test cases** -- enough to catch section-level breakage during refactor, without the fragility of deep mock trees.

### Mocking approach

We'll mock the hooks to return safe defaults (empty arrays, no-op functions) so the component renders without crashing. We won't assert on specific button text or toggle states -- just section presence.

Hooks to mock with minimal stubs:
- `useAuth` -- `{ user: { id: '1', email: 'test@test.com' }, signOut: vi.fn() }`
- `useUserSettings` -- returns settings object (toggling `showWeights` and `showCustomLogs` between tests)
- `useReadOnlyContext` -- `{ isReadOnly: false }`
- `useSavedMeals` / `useSavedRoutines` -- `{ data: [], isLoading: false }`
- `useCustomLogTypes` -- `{ logTypes: [], isLoading: false, createType/updateType/deleteType: mock mutations }`
- `useExportData` -- `{ isExporting: false, exportFoodLog: vi.fn(), exportWeightLog: vi.fn() }`
- `useIsAdmin` -- `{ data: false }`
- `useTheme` (next-themes) -- `{ theme: 'system', setTheme: vi.fn() }`
- Wrap in `MemoryRouter` for Link components

### After this

Once this smoke test passes, we proceed directly to the section extraction refactor. The same test file runs unchanged after the refactor to confirm all sections still render.

