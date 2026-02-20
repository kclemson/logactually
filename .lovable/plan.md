
## Fix swipe detection: ratio-based locking instead of pixel comparison

### Why the current logic fails

The current decision in `handleTouchMove` is:

```
LOCK if: dx >= 8px AND dx >= dy        ← "horizontal is winning by any amount"
CANCEL if: dy >= 10px AND dy > dx      ← "vertical is winning by any amount"
```

On a real phone, the first few millimeters of finger movement are almost never perfectly horizontal. A typical horizontal swipe starts with a tiny diagonal drift — so at the moment `dx` first crosses 8px, `dy` might be 9px. The lock condition fails (`dx >= dy` is false). Then `dy` hits 10px, the cancel condition fires, and the swipe is gone — even though the user was clearly swiping sideways.

The session replay confirms this: the clearly horizontal swipe (158px X / 34px Y overall) likely still failed because the *early* movement had more vertical drift before the horizontal direction was established.

### The fix: ratio-based intent detection

Instead of comparing raw `dx` vs `dy` at a single fixed pixel threshold, use the **angle of movement** — the ratio of `dx` to `dy`. This is insensitive to total distance traveled and accurately captures intent from the very start of the gesture.

```
LOCK if: dx >= 10px AND dx/dy > 1.5   ← "moving at least 56° from vertical"
CANCEL if: dy >= 15px AND dy/dx > 2.5 ← "moving at least 68° from horizontal"
```

In plain English:
- If the finger has moved 10px sideways and the horizontal distance is 1.5× the vertical distance, it's a swipe — lock it immediately.
- Only cancel for vertical scroll if the gesture is strongly vertical (2.5:1 ratio), giving swipes much more room to start slightly off-angle.

The asymmetry is intentional: we require a less strict ratio to claim a swipe (1.5:1) than to cancel one (2.5:1). This means swipes win ties.

### The `touchend` check also needs loosening

The final check in `onTouchEnd` also rejects gestures where `absDY / absDX > 0.6`. This means if the total swipe was 100px horizontal and 62px vertical (a 31° angle), it still gets rejected. On a phone, a natural swipe can easily be that diagonal.

Change `MAX_SWIPE_Y_RATIO` from `0.6` to `1.0`. This allows swipes up to 45° off-horizontal, which is the standard used by most swipe libraries. The initial lock logic already ensures that very vertical gestures never reach this point.

### All threshold changes at a glance

| Constant | Old value | New value | Reason |
|---|---|---|---|
| `HORIZONTAL_LOCK_PX` | 8px | 10px | Slightly more movement before locking, but ratio check means it's still fast |
| `VERTICAL_CANCEL_PX` | 10px | 15px | Give more grace before cancelling — swipes often start a bit vertical |
| `MIN_SWIPE_X` | 40px | 30px | Lower minimum so shorter deliberate swipes work |
| `MAX_SWIPE_Y_RATIO` | 0.6 | 1.0 | Allow swipes up to 45° off-axis at touchend |
| Horizontal lock ratio | `dx >= dy` (1:1) | `dx/dy > 1.5` | Require clear directional intent, not just winning by 1px |
| Vertical cancel ratio | `dy > dx` (1:1) | `dy/dx > 2.5` | Only cancel if strongly vertical |

### New `handleTouchMove` logic

```ts
const handleTouchMove = useCallback((e: TouchEvent) => {
  if (cancelled.current) return;
  if (locked.current) {
    e.preventDefault();
    return;
  }

  const dx = Math.abs(e.touches[0].clientX - startX.current);
  const dy = Math.abs(e.touches[0].clientY - startY.current);

  if (dx >= HORIZONTAL_LOCK_PX && (dy === 0 || dx / dy > HORIZONTAL_RATIO)) {
    // Clearly horizontal intent — lock and claim the gesture
    locked.current = true;
    e.preventDefault();
  } else if (dy >= VERTICAL_CANCEL_PX && (dx === 0 || dy / dx > VERTICAL_RATIO)) {
    // Clearly vertical intent — cancel and let scroll through
    cancelled.current = true;
  }
  // Otherwise: still ambiguous, keep waiting
}, []);
```

The `dy === 0` guard prevents division by zero on a perfectly horizontal movement (which should immediately lock).

### Files changed

Only **one file** changes: `src/hooks/useSwipeNavigation.ts`. The four page files do not need any changes — `touch-action` stays exactly as it is.
