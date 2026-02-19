
# Responsive Medication Name Append: Dose Always Visible, Frequency Optional

## The Problem

In `SavedItemRow`, `nameAppend` is rendered as a single `<span className="... shrink-0">`. Currently `CustomLogTypeRow` builds one concatenated string (`"2 mg · as needed"`) and passes it as that single `shrink-0` span. Because the whole thing is `shrink-0`, it never yields space — causing the name to wrap (as seen with "Ativan (anti-anxiety, anti-nausea)").

The goal: on narrow viewports, the name + dose part should always show; the frequency part ("as needed" / "3x/day") should simply disappear if there isn't room.

## Solution

Split the medication `nameAppend` into two separate `<span>` elements passed as a JSX fragment:

```tsx
// In CustomLogTypeRow, for medication types:
const nameAppend = (() => {
  if (type.value_type === 'medication') {
    const dosePart = type.default_dose != null && type.unit
      ? `${type.default_dose} ${type.unit}`
      : type.unit || null;
    const freqPart = type.doses_per_day > 0 ? `${type.doses_per_day}x/day` : 'as needed';

    return (
      <>
        {dosePart && (
          <span className="text-xs text-muted-foreground shrink-0">{dosePart}</span>
        )}
        <span className="text-xs text-muted-foreground shrink min-w-0 truncate hidden sm:inline">
          {dosePart ? `· ${freqPart}` : freqPart}
        </span>
      </>
    );
  }
  return type.unit ? `(${type.unit})` : null;
})();
```

The frequency `<span>` uses `hidden sm:inline` — hidden on the smallest breakpoint (mobile), visible from `sm` (640px) upward. This is a clean cut: mobile never sees it, tablet/desktop always does.

However, "smallest viewport" in the screenshot could be anything below `sm`. An alternative that handles the in-between gracefully is `shrink min-w-0 overflow-hidden` — this lets the span shrink all the way to zero when space is exhausted, disappearing naturally without a hard breakpoint cut.

The best approach combines both: `shrink min-w-0 overflow-hidden whitespace-nowrap` on the frequency span, with **no** hard breakpoint — it just vanishes organically as the name grows. No text truncation ellipsis (which would show "· as need…"), just clean disappearance via `overflow-hidden` on a shrinkable element.

## Layout Flow

```
[  name div (flex-1 min-w-0)  ] [ dose span (shrink-0) ] [ freq span (shrinks to 0) ] [pencil] [trash]
```

- Name div has `flex-1 min-w-0` — it gets first claim on space and can wrap/truncate
- Dose span has `shrink-0` — never gives up space
- Freq span has `shrink min-w-0 overflow-hidden whitespace-nowrap` — last to get space, first to disappear

## Changes Required

`SavedItemRow` currently wraps `nameAppend` in its own `<span className="text-xs text-muted-foreground shrink-0">`. Since we're now passing pre-styled JSX spans from `CustomLogTypeRow`, we need to update `SavedItemRow` to render `nameAppend` without its own wrapping span (when it's ReactNode, just render it directly inside the flex container). Or alternatively: keep the wrapper but remove `shrink-0` from it so the child spans control their own shrink behavior.

The cleanest approach: change `SavedItemRow`'s `nameAppend` rendering from:
```tsx
{nameAppend && (
  <span className="text-xs text-muted-foreground shrink-0">{nameAppend}</span>
)}
```
to:
```tsx
{nameAppend && (
  <span className="flex items-center gap-1 min-w-0">{nameAppend}</span>
)}
```

This neutral wrapper lets child spans control their own shrink/grow/truncate behavior. Non-medication rows still pass a plain string, which renders fine inside this wrapper with no visual change (it will just be text inside a flex span).

## Files Changed

| File | Change |
|---|---|
| `src/components/SavedItemRow.tsx` | Change `nameAppend` wrapper from `shrink-0` span to a neutral `flex items-center gap-1 min-w-0` span |
| `src/components/CustomLogTypeRow.tsx` | For medication: return JSX fragment with two separate spans — dose (`shrink-0`) and frequency (`shrink min-w-0 overflow-hidden whitespace-nowrap`) |

No DB changes, no hook changes.
