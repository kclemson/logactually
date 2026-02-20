
## Fix: Sticky header with scrollable content

### The problem

Currently the page is `min-h-screen` with a normal document scroll. The X button is `position: absolute` inside the content `div`, so it scrolls off the top as the user scrolls down.

### The fix

Convert the page to a full-viewport column layout where:
- The **header row** (title + X button) is fixed/sticky at the top
- The **content area** (entries + feedback form) scrolls independently underneath it

### Exact layout change

Replace the current structure:
```
<div className="min-h-screen bg-background">
  <div className="mx-auto max-w-2xl px-4 py-8">
    <div className="relative">
      <button absolute X />
      <h1>Changelog</h1>
      <p>Last updated</p>
      <ul>...entries...</ul>
      <FeedbackForm />
    </div>
  </div>
</div>
```

With a `flex flex-col h-screen` outer shell:

```
<div className="flex flex-col h-screen bg-background">

  {/* Sticky header row */}
  <div className="flex-shrink-0 border-b border-border">
    <div className="mx-auto max-w-2xl px-4 py-4 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>
      <button X />
    </div>
  </div>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto">
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ul>...entries...</ul>
      <FeedbackForm />
    </div>
  </div>

</div>
```

Key details:
- `h-screen` on the outer div caps the page to the viewport height (no document scroll)
- `flex-shrink-0` on the header prevents it from being squeezed
- `flex-1 overflow-y-auto` on the content area makes only that region scroll
- The X button moves from `absolute` to a natural `flex` child in the header row — positioned right with `justify-between`, aligned top with `items-start`
- `border-b border-border` gives the header a subtle separator from the content
- The `py-8` top padding from the old layout becomes `py-4` on the header and `py-6` on the content start — preserving similar visual spacing
- The lightbox overlay (`fixed inset-0`) is unaffected by this change

### Files changed

| File | Change |
|---|---|
| `src/pages/Changelog.tsx` | Replace `min-h-screen` scroll layout with `h-screen flex-col` sticky header + scrollable content body |
