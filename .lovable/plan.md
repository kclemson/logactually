
## Fix Pinned Chats UI Issues

Seven issues to address across two files.

### Changes

**File: `src/components/AskTrendsAIDialog.tsx`**

1. **Move pin icon out of response header, only show when pinCount > 0** -- Remove the pin icon button from the header area entirely when there are 0 pinned chats. When pinCount >= 1, show it in the header alongside the refresh button.

2. **Move pin icon to the "ask" view only (not the response view header)** -- The user's feedback says the entrypoint should be on the "ask AI" dialog, not on the AI response. The current code already only shows it in the `view === "ask"` branch, but it shows on the response too (since `data?.answer` doesn't hide the header icons). Fix: only show the pin badge icon when in the pre-response state OR when there's a response (it's fine in both -- the user's complaint is about it being on the response dialog header which is actually fine since it's still the ask dialog). Re-reading: the user says "the entrypoint for viewing pinned chats is on the 'ask AI' dialog, not the AI response" -- meaning the pin icon in the header should NOT show when a response is displayed. Only show it on the initial ask screen.

3. **Style the Pin button to match "Ask another question"** -- Change from gray muted styling to use `variant="outline"` Button styling so it looks equally clickable. Use `text-foreground` instead of `text-muted-foreground`.

4. **Remove the temporary "Pinned!" feedback** -- Since the button text changes from "Pin" to "Pinned", that's sufficient feedback. Remove the `pinFeedback` state and `setTimeout` logic entirely.

5. **Fix header icon spacing and alignment** -- Increase gap between refresh and pin icons, ensure vertical alignment with the X close button by adjusting positioning.

**File: `src/components/PinnedChatsView.tsx`**

6. **Fix Back button overlapping with X close** -- The "Back" button is positioned where it conflicts with the dialog's built-in X close button. Move it to the left side or adjust positioning so they don't overlap.

7. **Replace X unpin with Trash icon + confirm popover** -- Use the existing `DeleteConfirmPopover` component pattern (Trash2 icon with a confirmation popover) instead of a plain X icon for unpinning.

### Technical Details

#### `AskTrendsAIDialog.tsx`

- Remove `pinFeedback` state and `setTimeout` logic
- Header icons container: only render pin icon when `pinCount > 0` AND when not showing a response (`!data?.answer && !isPending`)
- Pin badge: soften the badge styling -- use smaller, more subtle colors (e.g., `bg-muted text-muted-foreground` or `bg-primary/20 text-primary` instead of solid `bg-primary text-primary-foreground`)
- Increase gap in the icons container from `gap-1` to `gap-2`
- Fix vertical alignment: adjust `top-4` and `right-12` positioning to properly align with the dialog close X
- Pin button on response: style as `variant="outline"` Button with `size="sm"` to match "Ask another question", with `text-foreground` for icon and text

#### `PinnedChatsView.tsx`

- Move "Back" button to the left or make it a text link that doesn't overlap with the dialog X (which is at `right-4 top-4`)
- Replace X unpin button with `DeleteConfirmPopover` from existing component. This requires adding `openPopoverId` / `setOpenPopoverId` state to manage which popover is open
- Pass appropriate label ("Unpin chat") and description ("This will remove the pinned chat") to the confirm popover

### Files to modify
- `src/components/AskTrendsAIDialog.tsx` -- header icons, pin button styling, remove pinFeedback
- `src/components/PinnedChatsView.tsx` -- fix back button overlap, replace X with trash + confirm
