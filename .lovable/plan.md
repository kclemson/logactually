
# Update README with Screenshots

## What will change

1. **Copy both uploaded images** to `public/` so they work in the README on GitHub:
   - `user-uploads://logactually-screen1.png` → `public/logactually-screen1.png`
   - `user-uploads://logactually-sreen2.png` → `public/logactually-screen2.png`

2. **Update `README.md`** to add both images right after the tagline (before Tech Stack):
   - **Image 1** (`logactually-screen1.png`): Full width, no scaling — this is the hero shot showing food + exercise side by side
   - **Image 2** (`logactually-screen2.png`): Scaled down using an HTML `<img>` tag with a fixed width (around 300px) so it doesn't dominate the page — shows the Trends view

The markdown will look roughly like:

```markdown
# Log Actually

AI-powered food, exercise, and custom metric logging...

![Log Actually - Food and Exercise logging](public/logactually-screen1.png)

<img src="public/logactually-screen2.png" alt="Log Actually - Trends" width="300" />

## Tech Stack
...
```

No other files are affected.
