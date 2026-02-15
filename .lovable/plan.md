

# Show Action Buttons as Disabled (Not Hidden) for Read-Only Users

## Updated approach

Instead of hiding Reply/Re-open and Delete buttons when read-only, render them in a disabled state so demo users can see the full feature set.

## Changes to `src/components/FeedbackForm.tsx`

1. Remove the early `if (isReadOnly) return null` check
2. Add `disabled={isReadOnly}` to the Textarea and Submit button
3. For the Reply/Re-open and Delete buttons: render them always, but when `isReadOnly`, disable click handlers and apply disabled styling (`opacity-50 pointer-events-none`)
4. The AlertDialog for Delete should not open when read-only -- wrap the trigger so it doesn't activate

Specifically for the action buttons, since they are plain `<button>` elements and AlertDialog triggers, the simplest approach is to add `disabled` attributes and matching styling:

```tsx
{/* Reply / Re-open */}
{!isReplying && (
  <>
    {isResolved ? (
      <button
        disabled={isReadOnly}
        onClick={(e) => { e.stopPropagation(); setReplyingId(item.id); }}
        className={cn("text-orange-500 hover:text-orange-600 hover:underline",
          isReadOnly && "opacity-50 pointer-events-none")}
      >
        Re-open
      </button>
    ) : (
      <button
        disabled={isReadOnly}
        onClick={(e) => { e.stopPropagation(); setReplyingId(item.id); }}
        className={cn("text-[hsl(217_91%_60%)] hover:underline",
          isReadOnly && "opacity-50 pointer-events-none")}
      >
        Reply
      </button>
    )}
  </>
)}

{/* Delete */}
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      disabled={isReadOnly}
      className={cn("text-destructive flex items-center gap-1",
        isReadOnly && "opacity-50 pointer-events-none")}
    >
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  </AlertDialogTrigger>
  {/* ... dialog content unchanged */}
</AlertDialog>
```

## SQL insert (unchanged from previous plan)

Three feedback items for user `f65d7de9-91bf-4140-b16e-5e4a951eeca5`.

## Summary

One component file edit (`FeedbackForm.tsx`) + one direct SQL insert. Everything visible, nothing hidden -- just disabled for read-only accounts.
