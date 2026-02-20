
## Fix: Stop the input section from flashing on swipe

### What's happening

In all three pages, the slide animation is applied to a wrapper `div` that contains **everything** — the `LogInput` textarea, error messages, save suggestions, `DateNavigation`, and the entries list:

```
<div className="animate-slide-in-from-right">   ← animates ALL of this
  <section>
    <LogInput ... />       ← textarea + buttons (date-independent, shouldn't move)
    <SimilarEntryPrompt /> ← also date-independent
  </section>

  <div ref={swipeHandlers.ref} ...>   ← swipe zone
    <DateNavigation />
    <FoodItemsTable />                ← only this should animate
  </div>
</div>
```

The swipe zone `div` (already at line 776 in FoodLog, similar in the others) is already a natural boundary. The fix is to move the animation class from the outer wrapper down to the swipe zone `div`. The `LogInput` section stays completely still.

### The change — three files, one line each

**`src/pages/FoodLog.tsx`** — lines 693–697 and 776:
```tsx
// Before: animation on outer wrapper
<div className={cn("space-y-4", mountDir === 'left' && 'animate-slide-in-from-right', ...)}>
  <section><LogInput ... /></section>
  <div ref={swipeHandlers.ref} ...>   ← no animation class here
    <DateNavigation /><FoodItemsTable />
  </div>
</div>

// After: animation moved to swipe zone only
<div className="space-y-4">
  <section><LogInput ... /></section>  ← completely still
  <div ref={swipeHandlers.ref} className={cn(mountDir === 'left' && 'animate-slide-in-from-right', ...)} ...>
    <DateNavigation /><FoodItemsTable />
  </div>
</div>
```

Same pattern in `WeightLog.tsx` and `OtherLog.tsx`.

### What the user will see

- Swipe left/right: the textarea and buttons stay perfectly still. Only the date nav row and the entries list below it slide in.
- Arrow button presses: same — only the entries section animates (the textarea was always still for arrows too, since it was re-rendered in place — but this makes it consistent).
- No structural refactoring, no prop changes, no new components.

### Files changed

| File | Change |
|---|---|
| `src/pages/FoodLog.tsx` | Remove animation classes from outer `div`; add them to the swipe zone `div` (line 776) |
| `src/pages/WeightLog.tsx` | Same — move animation to the swipe zone `div` |
| `src/pages/OtherLog.tsx` | Same — move animation to the swipe zone `div` |

That's the entire change. Three files, approximately two lines modified in each.
