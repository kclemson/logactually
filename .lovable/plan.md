
## Fix "(see how)" Link Styling

**File: `src/components/AppleHealthImport.tsx`** (lines 533-539)

Three fixes that were approved earlier but not applied:

1. **Move parentheses outside the button** so the underline only covers "see how" / "hide", not the parens
2. **Add `text-xs`** to the button so font size matches the surrounding label on mobile
3. **Add `py-1`** for a better touch target

Change from:
```tsx
Import from Apple Health{" "}
<button
  onClick={() => setShowInstructions(!showInstructions)}
  className="underline underline-offset-2 hover:text-foreground transition-colors"
>
  {showInstructions ? "(hide)" : "(see how)"}
</button>
```

To:
```tsx
Import from Apple Health{" "}
(<button
  onClick={() => setShowInstructions(!showInstructions)}
  className="text-xs underline underline-offset-2 hover:text-foreground transition-colors py-1"
>
  {showInstructions ? "hide" : "see how"}
</button>)
```
