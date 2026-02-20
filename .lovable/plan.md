
# Fix: Regenerate preserves the "Save Changes" association

## Root cause

In `handleNewRequest` (the function called by both the chip buttons and the "Regenerate" button), there is a state reset block that includes:

```ts
editingIdRef.current = null;
```

This is intentional when the user types a completely new question — that creates a new chart. But "Regenerate" calls the same function with `lastQuestion` as the question. Once `editingIdRef.current` is cleared, `handleSave` sees `null` and routes to `saveMutation` ("Save to Trends") instead of `updateMutation` ("Save Changes").

## Fix

`handleNewRequest` needs to know whether it's being called as a genuine new request or as a regeneration of the current chart. The cleanest way is to add an optional `preserveId` boolean parameter (defaulting to `false`). Only the "Regenerate" button passes `preserveId: true`.

### Change 1: Add `preserveId` param to `handleNewRequest`

```ts
const handleNewRequest = async (question: string, overrideMode?: "v1" | "v2", preserveId?: boolean) => {
  ...
  // Only clear the id if this is genuinely a new chart request
  if (!preserveId) {
    editingIdRef.current = null;
  }
  ...
```

### Change 2: Pass `preserveId: true` from the Regenerate button

The Regenerate button currently calls:
```tsx
onClick={() => handleNewRequest(lastQuestion)}
```

Change to:
```tsx
onClick={() => handleNewRequest(lastQuestion, undefined, true)}
```

That's the entire fix — two lines touched. No state shape changes, no new hooks, no other logic affected. Chip clicks and textarea new-questions still pass `preserveId: false` (the default), so those correctly clear the editing id.

## Files changed

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Add `preserveId?: boolean` param to `handleNewRequest`; skip `editingIdRef.current = null` when `preserveId` is true; pass `true` from the Regenerate button's `onClick` |
