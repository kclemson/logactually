

## Two Fixes for Resolved Feedback

### 1. Add spacing between date and "Resolved" badge

Add `ml-2` class to the resolved span so there's a visual gap between the date and the green indicator.

### 2. Let users reactivate resolved feedback with a follow-up message

When feedback is resolved (and has no response, i.e. the standalone resolved case), show a "Reopen" link. Clicking it opens an inline textarea where the user can type a follow-up message. Submitting:
- Clears `resolved_at` (unresolves the item)
- Appends the follow-up text to the existing message (separated by a newline marker like `\n\n---\nFollow-up:\n`)

This reuses existing hooks -- no new database columns or hooks needed.

### File Changes

**`src/components/FeedbackForm.tsx`**

1. Add state for tracking which feedback item is being reopened and the follow-up text:
   ```tsx
   const [reopeningId, setReopeningId] = useState<string | null>(null);
   const [followUp, setFollowUp] = useState("");
   ```

2. Import `useResolveFeedback` from the feedback hooks.

3. Fix spacing on line 109 -- add `ml-2` to the resolved span:
   ```tsx
   <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Resolved</span>
   ```

4. After the resolved badge (line 110), add a "Reopen" button and conditional textarea:
   ```tsx
   {item.resolved_at && (
     <>
       {reopeningId !== item.id ? (
         <button
           onClick={() => setReopeningId(item.id)}
           className="ml-2 text-xs text-primary hover:underline"
         >
           Reopen
         </button>
       ) : (
         <div className="mt-1 space-y-1">
           <Textarea
             placeholder="Add a follow-up message..."
             value={followUp}
             onChange={(e) => setFollowUp(e.target.value)}
             className="min-h-[60px] text-sm resize-none"
             maxLength={1000}
           />
           <div className="flex gap-2">
             <Button size="sm" onClick={handleReopen(item)} disabled={!followUp.trim()}>
               Send & Reopen
             </Button>
             <Button size="sm" variant="ghost" onClick={() => { setReopeningId(null); setFollowUp(""); }}>
               Cancel
             </Button>
           </div>
         </div>
       )}
     </>
   )}
   ```

5. Add a `handleReopen` function that:
   - Updates the feedback message by appending the follow-up text
   - Clears `resolved_at` via the existing resolve hook
   - Resets local state
   - Invalidates the `userFeedback` query

   ```tsx
   const handleReopen = (item) => async () => {
     const updatedMessage = `${item.message}\n\n---\nFollow-up:\n${followUp.trim()}`;
     await supabase.from('feedback')
       .update({ message: updatedMessage, resolved_at: null })
       .eq('id', item.id);
     queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
     queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
     setReopeningId(null);
     setFollowUp("");
   };
   ```

6. Import `useQueryClient` and `supabase` for the direct update (simpler than creating a new hook for this one-off operation).

### Summary

- The "Reopen" link appears inline next to the resolved badge (both standalone and response cases)
- Clicking it reveals a textarea below the item
- Submitting appends the follow-up to the original message and clears the resolved status
- The item reappears in the admin's "open" feedback list with the follow-up visible
