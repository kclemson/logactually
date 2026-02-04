

## Add Image Support to Changelog Entries

### Overview

Extend the changelog entry structure to support optional images/screenshots that display below the text description. Images will be stored in a dedicated `/public/changelog/` subfolder to keep assets organized.

### Changes

**File: `src/pages/Changelog.tsx`**

1. **Add a TypeScript type** for changelog entries with optional image:

```typescript
type ChangelogEntry = {
  date: string;
  text: string;
  image?: string; // Path relative to /public/changelog/, e.g., "dashboard.png"
};
```

2. **Update the comment header** to document usage:

```typescript
// Each entry: { date: "Mon-DD", text: "description", image?: "feature.png" }
// Images go in /public/changelog/ folder
```

3. **Update the list item rendering** to show images when present:

```tsx
<li key={index} className="text-sm">
  <div className="flex gap-2">
    <span className="text-muted-foreground shrink-0">{entry.date}:</span>
    <span className="text-foreground">{entry.text}</span>
  </div>
  {entry.image && (
    <img 
      src={`/changelog/${entry.image}`} 
      alt={`Screenshot for ${entry.date} update`}
      className="mt-2 rounded-lg border border-border max-w-full"
    />
  )}
</li>
```

### Folder Structure

```
public/
├── changelog/           ← New folder for changelog screenshots
│   └── (your images go here)
├── favicon.ico
├── logactually-logo-horiz.png
└── ...
```

### Usage Example

After adding an image to `/public/changelog/`:

```typescript
{ 
  date: "Feb-04", 
  text: "Added new dashboard with improved charts.", 
  image: "dashboard-v2.png"  // References /public/changelog/dashboard-v2.png
}
```

The image path in the entry is just the filename - the `/changelog/` prefix is added automatically in the rendering.

