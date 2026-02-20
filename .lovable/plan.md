
# Remove the v1/v2 UI toggle, default to v2, preserve chip-level mode routing

## What changes and why

The v1/v2 toggle is removed from the UI. The `mode` state and `chip.mode` routing logic stay — chips marked `mode: "v1"` will still fire directly against v1 without the DSL roundtrip. The only thing disappearing is:
- The visible toggle buttons (the user can't change the global mode)
- `localStorage` persistence of the mode (no toggle means no user preference to save)
- The `setMode("v1")` + `localStorage.setItem` side effects in the `usedFallback` blocks (a single unsupported query no longer poisons future requests)

The default changes from `"v1"` to `"v2"`, so freehand text input and v2 chips will use the DSL path — meaning `window`, `transform: "cumulative"`, and future DSL features are now live for all users by default.

## One file: `src/components/CustomChartDialog.tsx`

### Change 1 — Default mode: `"v1"` → `"v2"` (line 62)

```ts
// BEFORE
const [mode, setMode] = useState<"v1" | "v2">(() => (localStorage.getItem("chart-mode") as "v1" | "v2") || "v1");

// AFTER
const [mode, setMode] = useState<"v1" | "v2">("v2");
```

No more localStorage read. `setMode` is still called by `handleNewRequest` when a chip passes `chip.mode` — that's the only remaining writer.

### Change 2 — Remove UI toggle block (lines 261–289)

The entire `{/* Mode toggle */}` div with the two v1/v2 pill buttons is deleted. Nothing else references these buttons.

### Change 3 — `handleSubmit`: remove `usedFallback` localStorage + setMode side effects (lines 134–137)

```ts
// REMOVE these two lines:
setMode("v1");
localStorage.setItem("chart-mode", "v1");
```

`resultMode` is still set to `"v1"` via `actualMode` — the debug label continues to show which engine ran.

### Change 4 — `handleNewRequest`: remove localStorage write on chip-mode sync (line 176)

```ts
// REMOVE:
localStorage.setItem("chart-mode", effectiveMode);
```

`setMode(effectiveMode)` stays — this is what makes chip-level v1/v2 routing work. The mode is set for the duration of that request and stays until the next chip click or new fresh request. No localStorage involved.

### Change 5 — `handleNewRequest`: remove `usedFallback` localStorage + setMode side effects (lines 189–191)

```ts
// REMOVE these two lines (same as Change 3, but in handleNewRequest):
setMode("v1");
localStorage.setItem("chart-mode", "v1");
```

## Summary of net result

| Scenario | Before | After |
|---|---|---|
| New user opens dialog | v1 (localStorage default) | v2 |
| User with `"v1"` in localStorage | v1 (sticky) | v2 (localStorage no longer read) |
| Clicks a v2 chip | v2 | v2 |
| Clicks a v1 chip | v1 | v1 (chip.mode still respected) |
| Types a custom prompt | whatever localStorage said | v2 |
| Request falls back to v1 | Permanently writes v1 to localStorage | Uses v1 for that result only, next request stays v2 |
| Regenerate button | `handleNewRequest(lastQuestion, undefined, true)` → uses current mode | Same — uses `mode` state (v2 unless last chip was v1) |

No changes to `Chip` interface, `ALL_CHIPS`, `handleNewRequest` signature, chip `onClick`, `useGenerateChart`, or any other file.
