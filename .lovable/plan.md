

## Update Help Page Changelog Tip

### Changes

**`src/pages/Help.tsx`** -- Reorder and rewrite the changelog bullet point.

Move the last item in `HELP_CONTENT.tips.items` (index 5, the changelog tip) to index 0, and change its text and highlights:

```ts
{
  text: "This app is under active development and new features are released regularly, sometimes multiple times a week — see the changelog for the latest.",
  highlights: ["changelog"],
  link: "/changelog",
},
```

All other tips remain in their current order, shifted down by one position.

