
## Fix: Dark theme screenshots render poorly with html2canvas

### Root cause

`html2canvas` renders the DOM by reading inline styles and computed styles, but it has known limitations with CSS custom properties (CSS variables) that are toggled via a class on `<html>` (the `dark` class used by Tailwind/next-themes).

When the user is in dark mode, the `dark` class on `<html>` activates dark-theme CSS variables (`--background`, `--foreground`, etc.). `html2canvas` doesn't fully resolve these correctly — it either picks up the wrong variable values or defaults to transparent/black, producing a mostly-dark, near-unreadable screenshot as shown in the user's image.

### The fix

Before calling `html2canvas`, temporarily remove the `dark` class from `document.documentElement`, run the capture, then restore the class. This forces the page to render in light mode for the split second of capture, which html2canvas handles correctly.

```ts
// Before capture
const htmlEl = document.documentElement;
const wasDark = htmlEl.classList.contains("dark");
if (wasDark) htmlEl.classList.remove("dark");

// ... html2canvas call ...

// After capture
if (wasDark) htmlEl.classList.add("dark");
```

This is safe because:
- The class change is synchronous and instant — the user won't notice a visual flash since html2canvas is called right after
- The restore always happens (in a `finally`-style block) so dark mode is never left disabled
- No state or settings are modified — this only touches the DOM class for the duration of the capture

### Implementation details

**`src/components/FeedbackForm.tsx`** — inside `handleCapturePage`:

1. After the 600ms navigation wait (so the route is fully rendered in dark mode), save whether `dark` class is present
2. Remove `dark` class before calling `html2canvas`
3. Restore `dark` class immediately after `html2canvas` resolves (in a try/finally block wrapping just the capture call)

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | In `handleCapturePage`, temporarily remove `dark` class from `<html>` before the `html2canvas` call and restore it after |
