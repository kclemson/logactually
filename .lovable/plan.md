

## Fix Ask AI Dialog Keyboard Overlap on Mobile

**Problem**: The dialog is vertically centered (`top-[50%] translate-y-[-50%]`) in the viewport. When the mobile keyboard opens, the layout viewport doesn't shrink but the visual viewport does, causing the dialog to spill off the top of the screen. The `max-h-[85vh]` fix helps with content height but doesn't address the centering problem with the keyboard present.

**Solution**: Position the dialog near the top of the screen on mobile instead of vertically centered. This ensures the dialog stays visible above the keyboard. On desktop (sm+), keep the centered positioning.

### Changes

**File: `src/components/AskTrendsAIDialog.tsx` (line 110)**

Update the `DialogContent` className to:
- Override `top-[50%] translate-y-[-50%]` with `top-[5%] translate-y-0` on mobile
- Keep centered positioning on desktop via `sm:top-[50%] sm:translate-y-[-50%]`
- Remove `autoFocus` from the Textarea (line 162) to avoid the keyboard opening immediately

```tsx
// DialogContent className becomes:
className="left-2 right-2 top-[5%] translate-y-0 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-3 sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md"
```

And remove `autoFocus` from the Textarea (line 162) since the suggestion chips are the primary interaction on mobile, and tapping the textarea will focus it when the user is ready.

Two line edits in one file. The dialog will anchor near the top on mobile, leaving room for the keyboard below, while remaining centered on desktop.
