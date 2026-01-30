

## Text Updates for Privacy Page

### Overview
Three minor text adjustments to improve readability and flow.

---

### Changes to `src/pages/Privacy.tsx`

#### 1. Remove Bold from Terms of Use Items
**Lines 272-279** - Remove the `<strong>` tag wrapping `{item.label}`:

Change from:
```tsx
<span>
  <strong>{item.label}:</strong> {item.description}
</span>
```

To:
```tsx
<span>
  {item.label}: {item.description}
</span>
```

---

#### 2. Update Social Media Text
**Line 79** - Change the `socialText` to end with "You can find me on social media here:":

Change from:
```tsx
socialText: "I recently retired after >25 years in the tech industry — but once a product-maker, always a product-maker. I've done my best to make sure this app is built with care. You can find me on social media at the links below.",
```

To:
```tsx
socialText: "I recently retired after >25 years in the tech industry — but once a product-maker, always a product-maker. I've done my best to make sure this app is built with care. You can find me on social media here:",
```

---

#### 3. Simplify Browser Storage Label
**Lines 66-69** - Change "Browser storage" label to just `localStorage` (code-style formatting):

Change from:
```tsx
{
  label: "Browser storage",
  description: "(localStorage) is used only for UI preferences like theme and collapsed sections — no tracking or analytics cookies",
},
```

To:
```tsx
{
  label: "localStorage",
  description: "is used only for UI preferences like theme and collapsed sections — no tracking or analytics cookies",
},
```

---

### Summary

| Change | Location |
|--------|----------|
| Remove `<strong>` from ToS items | Lines 275-276 in JSX |
| Update socialText ending | Line 79 in PRIVACY_CONTENT |
| Simplify localStorage label | Lines 67-68 in PRIVACY_CONTENT |

