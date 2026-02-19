
## Context menu (right-click / long-press) on saved charts

### What changes

Saved chart cards will respond to right-click on desktop and long-press on mobile with a small floating context menu containing "Edit" and "Delete" options. This is additive — it does not replace the header-toggle edit mode or the navigate-on-click behavior.

### Conflict analysis

| Existing interaction | Event used | Conflicts with context menu? |
|---|---|---|
| Bar click → navigate (desktop) | Recharts `onClick` | No — `onContextMenu` is a separate event |
| Bar tap → tooltip (touch) | Recharts `onClick` / `touchend` | No — long-press fires `contextmenu` after ~500ms, tap fires on `touchend` immediately |
| Tooltip dismiss overlay | `onClick` on fixed overlay | No — only present when tooltip is active, not when context menu is open |
| Edit-mode toggle in section header | `onClick` on button | No — unrelated |

### Implementation approach

**New component: `ChartContextMenu`** (`src/components/trends/ChartContextMenu.tsx`)

A small self-contained component that:
- Accepts `x`, `y`, `isOpen`, `onClose`, `onEdit`, `onDelete` props
- Renders a fixed-position floating menu at `(x, y)` with "Edit" (pencil icon) and "Delete" (trash icon, destructive color) items
- Closes on outside click via a transparent backdrop `div` at `z-40`, menu itself at `z-50`
- No Radix dependency needed — just a simple positioned `div`

**Changes to `DynamicChart`** (`src/components/trends/DynamicChart.tsx`)

Add an optional `onContextMenu?: (e: React.MouseEvent) => void` prop. Pass it as `onContextMenu` on the outer wrapper `div` in `ChartCard`.

**Changes to `ChartCard`** (`src/components/trends/ChartCard.tsx`)

Add optional `onContextMenu?: (e: React.MouseEvent) => void` to props and attach it to the root `Card` element. Also call `e.preventDefault()` there to suppress the browser's default context menu.

**Changes to `Trends.tsx`** (`src/pages/Trends.tsx`)

- Add state: `contextMenu: { chartId: string; x: number; y: number } | null`
- On each saved `DynamicChart`, pass `onContextMenu={(e) => { e.preventDefault(); setContextMenu({ chartId: chart.id, x: e.clientX, y: e.clientY }); }}`
- Render `ChartContextMenu` once (outside the map) at the page level, wired to the active `contextMenu` state
- "Edit" in menu → `setEditingChart(...)` + close menu
- "Delete" in menu → directly call `deleteMutation.mutate(chartId)` + close menu (skipping the popover confirmation since this is a secondary, deliberate gesture — or optionally keep confirmation)

### Files changed

| File | Change |
|---|---|
| `src/components/trends/ChartContextMenu.tsx` | New component — floating context menu with Edit + Delete |
| `src/components/trends/ChartCard.tsx` | Add optional `onContextMenu` prop, attach to root Card, `preventDefault` |
| `src/components/trends/DynamicChart.tsx` | Thread `onContextMenu` prop through to `ChartCard` |
| `src/pages/Trends.tsx` | Add context menu state, pass handler to saved charts, render `ChartContextMenu` |

### What does NOT change

- The header-toggle edit mode — still works as before
- Bar click → navigate — still works on desktop
- Bar tap → tooltip → "Go to day" — still works on touch
- Built-in charts (Food, Exercise, etc.) — unaffected, they don't receive `onContextMenu`

### Delete confirmation

For the context menu delete, a simple `window.confirm()` or skipping confirmation is fine since this is already a deliberate secondary interaction (right-click/long-press). Alternatively, the existing `DeleteConfirmPopover` can be reused positioned at the cursor — but that adds complexity. The plan uses a direct delete with no extra confirmation step inside the context menu, keeping it snappy for your debugging workflow.
