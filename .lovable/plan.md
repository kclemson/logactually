
## Tighten the date/value spacing in CustomLogTypeView

### The problem

In `src/components/CustomLogTypeView.tsx`, each row uses a flex layout:

```
<span class="w-36 shrink-0">Yesterday</span>     ← 144px fixed
<span class="flex-1">148.8 lbs</span>             ← takes ALL remaining space
<Button>trash</Button>
```

`flex-1` causes the value span to expand across the entire remaining row width, placing the actual text content right after the 144px date column — visually far from it, especially on wide screens.

### The fix

Two changes to `CustomLogTypeView.tsx`:

**1. Shrink the date column width.**
`w-36` (144px) is too wide for short strings like "Yesterday", "Feb 17", "Today". Drop it to `w-28` (112px) or even `w-24` (96px) — enough for "Yesterday" at `text-xs` without excess padding.

**2. Remove `flex-1` from the value span.**
Replace `flex-1` with `shrink min-w-0`. This lets the value span only take as much space as its content needs, sitting immediately after the date column, with the delete button pushed to the far right via the existing `justify-between` on the row container.

Actually a cleaner approach: change the row from `justify-between` to a simple left-to-right flow, and only push the trash button to the far right:

```jsx
<div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 group">
  <span className="text-xs text-muted-foreground shrink-0 w-24">
    {formatEntryDate(...)}
  </span>
  <span className="text-sm min-w-0 truncate flex-1">
    {formatEntryValue(...)}
  </span>
  <Button className="ml-auto shrink-0 ...">trash</Button>
</div>
```

Wait — with `flex-1` on the value, the content still aligns left. The visual gap comes from the wide `w-36` date column. Let me re-examine.

Looking at the screenshot: "Yesterday" takes up ~180px column, then "148.8 lbs" starts. The gap is large. The fix is simply **reducing `w-36` to something like `w-20` or `w-[4.5rem]`** while keeping `flex-1` on the value (which is fine — text left-aligns regardless of how wide the span is).

For "text" types the date is "Today, 2:14 PM" which is about 10 chars — still fits in `w-28`.
For "numeric" types the date is "Yesterday" or "Feb 17" — fits in `w-20`.

Since both types share the same column, use `w-28` (112px) as the date column — enough for "Yesterday, 2:14 PM" at `text-xs` without the excess gap visible in the screenshot.

### Exact change

In `src/components/CustomLogTypeView.tsx`, line 90:

**Before:**
```jsx
<span className="text-xs text-muted-foreground shrink-0 w-36">
```

**After:**
```jsx
<span className="text-xs text-muted-foreground shrink-0 w-28">
```

That's the only change needed. One line, one file. The `flex-1` on the value span is correct — it ensures the delete button stays at the far right. The fix is purely the date column width.

### Why `w-28` specifically

- "Yesterday" at `text-xs` (~12px font) = ~56px content width
- "Today, 2:14 PM" at `text-xs` = ~84px content width  
- `w-28` = 112px — comfortable fit with a few px breathing room, no excess
- The previous `w-36` = 144px added ~30-60px of dead space between date and value
