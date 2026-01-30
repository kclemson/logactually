

## Underline "Not" in Section Title

### Problem

The word "Not" in "What Data Is Not Collected" isn't emphasized. Currently the title is built from string concatenation, so we can't style individual words.

### Solution

1. Update `CollapsibleSection` to accept `ReactNode` for the title (allowing JSX)
2. Pass JSX with a simple `<u>` tag around "Not"

### Changes

**1. `src/components/CollapsibleSection.tsx` (line 7)**

```tsx
// Change from:
title: string;

// To:
title: ReactNode;
```

**2. `src/pages/Privacy.tsx` (line 117)**

```tsx
// Change from:
title={`${PRIVACY_CONTENT.notCollected.title} ${PRIVACY_CONTENT.notCollected.titleEmphasis} ${PRIVACY_CONTENT.notCollected.titleEnd}`}

// To:
title={<>What Data Is <u>Not</u> Collected</>}
```

### Result

The section header will display "What Data Is Not Collected" with "Not" underlined, making the emphasis clearly visible.

