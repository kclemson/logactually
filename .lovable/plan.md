
# Add "Regenerate" button and fix button layout

## Current state

The result section has two rows of buttons:
- **Row 1**: `[Save to Trends / Save Changes]` (flex-1 — takes up almost all width) + `[Refine]`
- **Row 2**: `[Show DSL / debug JSON]` + optionally `[Verify accuracy]`

Issues:
1. Save button is `flex-1` which makes it unnecessarily wide
2. No regenerate option — user must open the textarea and re-type or re-submit the same question
3. Button ordering hasn't been thought through deliberately

## Proposed button order rationale

Using the principle that the most "committed" / irreversible action sits rightmost (standard convention: Cancel → secondary → primary):

| Position | Button | Why |
|---|---|---|
| Left | Regenerate | Destructive-ish (replaces current result), least committed |
| Middle | Refine | Opens a follow-up, moderate commitment |
| Right | Save | The terminal, intentional action — rightmost |

## Implementing "Regenerate"

Regenerate is a fresh call with the same `lastQuestion` and same `mode`, clearing all current chart state — identical in behavior to `handleNewRequest(lastQuestion)`. No new function needed; just wire the button to `handleNewRequest(lastQuestion)`.

The button should be:
- Disabled while `generateChart.isPending`
- Shows `<Loader2>` spinner when pending (since it's the one that triggered the load, the user can see the overlay, so a simple disabled state is enough)
- Label: "Regenerate" with a `RefreshCw` icon (already imported)

## Button sizing fix

Remove `className="flex-1"` from the Save button. All three buttons in the row (`Regenerate`, `Refine`, `Save`) should be `size="sm"` with no width forcing — they'll naturally size to their label width. Use `flex gap-2 justify-end` on the container so buttons hug the right edge (matching the textarea's submit button alignment).

## Files changed

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Replace the 2-button row with a 3-button row: `[Regenerate] [Refine] [Save]`; remove `flex-1` from Save; add `onClick={() => handleNewRequest(lastQuestion)}` for Regenerate; use `justify-end` on the row container |

## Before / After

```text
BEFORE:
[ Save to Trends ←————————————→ ]  [ Refine ]

AFTER:
                  [ Regenerate ]  [ Refine ]  [ Save to Trends ]
```

The row uses `flex justify-end gap-2` so the three buttons sit at the right, naturally sized. No button dominates the row.
