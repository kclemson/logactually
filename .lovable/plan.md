## Problem
`CollapsibleSection` uses `max-h-[2000px]` with `overflow-visible` when open. Once the exercise grid exceeds 2000px (via "Show more"), the extra content visually overflows but the section's layout box is still 2000px tall — so the next section ("Custom Trends") is positioned starting at 2000px and overlaps the overflowing charts.

## Fix
In `src/components/CollapsibleSection.tsx`, drop the max-height cap when the section is open so its layout height matches its content.

Change:
```tsx
isOpen ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
```
to:
```tsx
isOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
```

Trade-off: the open→close animation loses its height transition (still fades). This matches the actual behavior users see — the max-h cap was already broken for tall sections — and eliminates the overlap for every collapsible section on the page.

## Verification
- Typecheck
- Open Trends, click Show more repeatedly; Custom Trends header should sit below the last exercise chart with no overlap.
