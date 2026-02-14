

# Update README: Screenshot format, live URL, and third-party credits

Three changes to `README.md`:

## 1. Screenshot format (line 11)
Replace the HTML `<img>` tag with standard Markdown and remove the width restriction:
- Before: `<img src="public/logactually-screen3-charts.png" alt="Log Actually - Trends" width="500" />`
- After: `![Log Actually - Trends](public/logactually-screen3-charts.png)`

## 2. Live site URL (after line 7)
Add a line after the demo mode mention:
```
Try it out at [logactually.com](https://logactually.com).
```

## 3. Expand Tech Stack with third-party credits (lines 46-50)
Update the Tech Stack section to include external APIs and notable libraries:

```
## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase -- auth, database, edge functions
- **AI:** Google Gemini (via edge functions for food/exercise parsing, photo analysis, trend insights)
- **Charts:** Recharts
- **Barcode scanning:** ZXing
- **Food database:** Open Food Facts (UPC lookups)
- **Exercise data:** 2024 Compendium of Physical Activities (MET-based calorie estimates)
```

This surfaces the key external dependencies and data sources that make the app tick, which is exactly the kind of thing open-source browsers appreciate seeing.

No other files affected.
