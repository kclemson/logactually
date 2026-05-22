In the bloodwork TypeCard header, replace the permanently-visible search input with a tap-to-expand pattern: a search icon button is shown by default; tapping it reveals the narrow filter input. The collapse/expand-all toggle remains always visible.

**1. PanelHeaderControls refactor (CustomLogByTypeView.tsx)**

- Add local `isSearchOpen` boolean state.
- Default: render only a small `Search` icon button + the collapse/expand-all toggle.
- Tap search icon → `isSearchOpen = true`, input appears (same `w-28` narrow style) with auto-focus.
- The input still has the inline `×` clear button. When query is cleared AND the input loses focus, collapse back to the icon button.
- Keep `onClick` stop-propagation so tapping doesn't collapse the TypeCard.
- When `query` is non-empty, the input stays rendered regardless of focus so the user can still see what they're filtering by.

**Visual flow:**
```
Default:       [🔍] [⇅]
Tapped:        [🔍 Filter… ×]
With query:    [🔍 Filter… ×]
Cleared+blur:  [🔍] [⇅]
```

**File:** `src/components/CustomLogByTypeView.tsx` (PanelHeaderControls component only)