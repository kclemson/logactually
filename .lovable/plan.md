
## Two visual tweaks to medication entry rows

### Issue #1 — Dose value font: bright → muted/smaller

In `CustomLogEntriesView.tsx`, the medication dose value (col 2) is currently rendered as:
```tsx
<span className="text-sm tabular-nums text-foreground whitespace-nowrap">
  {dose}
</span>
```

`text-foreground` is the bright/white foreground color. Since this value is read-only (you tap the pencil to edit it, not the value itself), it should match the same muted, smaller style used for the time column:

```tsx
<span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
  {dose}
</span>
```

This aligns with the visual principle: muted gray = read-only data, bright = interactive.

---

### Issue #2 — Pencil icon: muted → bright (foreground)

The pencil button currently uses `text-muted-foreground hover:text-foreground`, which means it starts gray and only brightens on hover. Since the pencil is the primary interactive affordance for editing a medication entry, it should start bright (white in dark mode) to signal interactivity:

```tsx
className="h-6 w-6 p-0 text-foreground hover:text-foreground hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
```

The trash button stays unchanged: `text-muted-foreground hover:text-destructive` — gray by default, red on hover. That's the intentional exception as noted.

---

### File to change

`src/components/CustomLogEntriesView.tsx` — two targeted changes, both inside the `isMedication` branch (lines ~304 and ~314).

No other files need changing. The By Meds view uses the same `CustomLogEntriesView` component, so both views are fixed in one edit.
