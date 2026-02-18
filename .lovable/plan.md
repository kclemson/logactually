

# Add inline "Copied!" feedback to Copy to today

## Approach
After a successful copy, briefly replace the "Copy to today" link text with a green "Copied!" label for 2 seconds, then revert. No toast, no navigation, no dismiss required.

No auto-navigation to today -- the user may want to copy multiple entries from the same past day.

## Changes

### 1. `src/components/EntryExpandedPanel.tsx`
- Add local `copied` state (`useState(false)`).
- On click: call `onCopyToToday()`, set `copied` to `true`, `setTimeout` to reset after 2 seconds.
- Render: when `copied` is true, show a green "Copied!" span (with `text-green-600 dark:text-green-400`) instead of the clickable "Copy to today" link.

### 2. `src/pages/FoodLog.tsx`
- Make `handleCopyEntryToToday` return a promise (it currently calls `createEntryFromItems` without `await` -- add `await` so callers can chain).
- Alternatively, the feedback is fire-and-forget since `EntryExpandedPanel` just needs to show the label immediately on click; the entry will appear on today regardless. No change strictly required, but adding `await` is cleaner.

### 3. `src/pages/WeightLog.tsx`
- Already returns a promise (`async` function). No change needed.

Total: one file gets meaningful changes (`EntryExpandedPanel.tsx`), one gets a minor cleanup (`FoodLog.tsx`).

