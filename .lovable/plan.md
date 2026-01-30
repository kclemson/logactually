

## Add Social Media Links to Privacy Page Footer

### Overview

Add LinkedIn, Bluesky, and Mastodon icons in the footer of the Privacy page, styled similarly to your portfolio page - a row of clickable icons above the "Last updated" text.

### Design Approach

Since Lucide-react only has LinkedIn (and it's deprecated for brand icons), I'll create inline SVG components for all three icons to ensure visual consistency. This also avoids any deprecation warnings.

### Changes

**File: `src/pages/Privacy.tsx`**

1. **Add social links data to `PRIVACY_CONTENT.footer`** (around line 76-78):
```tsx
footer: {
  lastUpdated: "Last updated: January 29, 2026",
  socialLinks: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/kc-lemson-b58467/" },
    { name: "Bluesky", url: "https://bsky.app/profile/kclemson.bsky.social" },
    { name: "Mastodon", url: "https://mastodon.social/@kclemson" },
  ],
},
```

2. **Create simple SVG icon components** (before the Privacy component):
- LinkedIn icon (the "in" logo)
- Bluesky icon (the butterfly)
- Mastodon icon (the "M" elephant logo)

3. **Update the footer section** (around line 206-209):
- Add a flex row with the three social icons
- Each icon opens in a new tab
- Icons styled with muted color that transitions to foreground on hover
- Keep the "Last updated" text below

### Visual Result

The footer will display:

```text
[LinkedIn icon]  [Bluesky icon]  [Mastodon icon]

Last updated: January 29, 2026
```

Icons will be ~20px, spaced apart, with hover effects matching the reference image style.

