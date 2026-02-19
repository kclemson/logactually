
## Fix: type-view three-control row on mobile

### What's happening

The three-control row in type view:
- Left Select: `h-8 text-sm w-auto min-w-[130px]` → renders as ~130px+
- Middle Select: `h-8 text-sm w-auto min-w-[120px]` → renders as ~120px+
- Right Button: `h-8 ... gap-1` + text "Log Body Weight" → ~140px

Total: ~390px+ on a ~375px viewport. The button clips off-screen.

The Settings dropdowns look compact because they have `w-[150px]` fixed widths with the default `px-3` padding — just enough for content.

### Two changes, one file: `src/pages/OtherLog.tsx`

**Change 1: Shorten the button label**

```tsx
// Before
<Plus className="h-3 w-3" />
Log {selectedType.name}

// After
<Plus className="h-3 w-3" />
+ Log New
```

This drops the button from ~140px (for "Log Body Weight") to ~80px — a fixed-width label regardless of log type name length.

**Change 2: Reduce padding on the two selects in type view**

Both the view-mode select and the log-type select get `px-2` instead of the default `px-3` on their triggers, and tighter `min-w` values:

- Left (view mode): `h-8 text-sm px-2 w-auto min-w-[110px]` → down from `min-w-[130px]`
- Middle (log type): `h-8 text-sm px-2 w-auto min-w-[100px]` → down from `min-w-[120px]`

With those changes the three controls total roughly:
- Left: ~110px
- Middle: ~100px  
- Right: ~80px
- Gaps (2×8px): 16px
- **Total: ~306px** — well within a 375px viewport

### Only file changed

`src/pages/OtherLog.tsx` — lines 148-188 (the type-view controls block):
- `SelectTrigger` className on the left select: add `px-2`, reduce `min-w-[130px]` → `min-w-[110px]`
- `SelectTrigger` className on the middle select: add `px-2`, reduce `min-w-[120px]` → `min-w-[100px]`
- Button text: `Log {selectedType.name}` → `+ Log New` (remove the redundant `<Plus>` icon since the label already has `+`)

No changes to `CustomLogTypeView.tsx`, `select.tsx`, Settings, or any other file.
