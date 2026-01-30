

## Privacy Page Text & Layout Updates

### Overview

Two small updates to the "How This Was Built" section:
1. Center the social media icons horizontally
2. Add a retirement sentence before the existing "I've done my best" text

### Changes

**File: `src/pages/Privacy.tsx`**

#### 1. Update `socialText` content (line 75)

Prepend the retirement sentence to the beginning of the paragraph:

```tsx
socialText: "I recently retired after >25 years in the tech industry — but once a product-maker, always a product-maker. I've done my best to make sure this app is built with care. You can find me on social media at the links below.",
```

#### 2. Center the social icons row (line 223)

Add `justify-center` to the flex container:

```tsx
<div className="flex justify-center gap-4 mt-2">
```

### Result

The "How This Was Built" section will show:
- Main text about AI-assisted development
- New paragraph starting with the retirement sentence, flowing into the "built with care" text
- Horizontally centered Bluesky and Mastodon icons

