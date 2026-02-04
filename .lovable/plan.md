

## Make Changelog More Visible in Help Page

### Changes

**File: `src/pages/Help.tsx`**

**1. Add a new tip item for the changelog (lines 28-31)**

Add a new tip at the end of the `items` array that links to the changelog:

```tsx
{
  text: "Check out the changelog for the latest features and updates.",
  highlights: ["changelog"],
  link: "/changelog",
},
```

**2. Update the type/interface to support optional links**

The current `highlightText` function just highlights text, but we need a way to make the "changelog" word a clickable link. We'll need to:
- Add an optional `link` property to tip items
- Modify the rendering logic to handle linked tips specially

**3. Remove changelog from the footer (lines 96-102)**

Remove the changelog link from the footer, leaving only "Privacy & Security":

```tsx
{/* Footer */}
<div className="pt-4 text-center text-sm">
  <Link
    to="/privacy"
    className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
  >
    Privacy & Security
  </Link>
</div>
```

**4. Update the tip item rendering to handle the changelog link**

For the changelog tip specifically, we'll render the highlighted "changelog" as a `<Link>` component instead of just a `<span>`:

```tsx
// Render logic will check if item has a link property
// If so, wrap the highlighted word in a Link component
```

### Result
- Changelog appears as a new bullet point at the end of Tips: "Check out the **changelog** for the latest features and updates."
- The word "changelog" will be a clickable link to `/changelog`
- Footer will only show "Privacy & Security" link

