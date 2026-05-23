Make the bloodwork "Retry" action visibly do something.

## Problem

Clicking the retry icon on a failed bloodwork panel looks like a no-op. The mutation does fire (it flips `parse_status` to `pending` server-side and invokes the edge function), but the UI never reflects the in-progress state — the row stays on "failed" for the entire 10–30s parse, then either flips silently to success or stays on "failed" with the same error.

The `BloodworkPanelRow` already renders a `Loader2` spinner and a "parsing…" label when `parse_status === 'pending'` — the cache just never gets that value until the request settles.

## Fix

In `src/hooks/useBloodworkPanels.ts`, update the `retryParse` mutation (lines 191–200):

- Add an `onMutate(panelId)` that optimistically rewrites the cached panel in `['bloodwork-panels', dateStr, user?.id]` to `parse_status: 'pending'`, `parse_error: null`. Save the previous cache snapshot in the context.
- Add an `onError(_e, _id, ctx)` that restores the previous snapshot if the mutation throws.
- Keep the existing `onSettled` invalidate so the real DB state takes over once parsing finishes.

Same pattern already used by `deletePanel` in the same file.

Result: clicking retry instantly shows the spinner + "parsing…" label. Eventually the row flips to either success (results expand) or back to failed (with whatever new `parse_error` came back). No more silent no-op.

## Why it failed in the first place — separate investigation

Defer until UI fix lands. The original parse_error is `"AI could not extract any results."` from `parse-bloodwork/index.ts` line 215, meaning Gemini returned a response but with zero `sections`. This is usually a content issue (e.g. the PDF is a portal landing page, photo of a screen, or a multi-page document where the lab page is buried). We'll dig in once the retry UX is fixed.

No DB schema changes.