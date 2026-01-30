
## Add Browser Storage Note + Terms of Use Section

### Overview
Update the Privacy page to include a browser storage explanation and add a Terms of Use section, creating a comprehensive single-page legal document.

---

### Changes to `src/pages/Privacy.tsx`

#### 1. Update Page Title
Change from "Privacy & Security" to "Privacy, Security & Terms"

```tsx
header: {
  title: "Privacy, Security & Terms",
},
```

#### 2. Add Browser Storage to Technical Section
Add one item to the `technical.items` array:

```tsx
{
  label: "Browser storage",
  description: "(localStorage) is used only for UI preferences like theme and collapsed sections — no tracking or analytics cookies",
},
```

#### 3. Add Terms of Use Section
Add a new section to `PRIVACY_CONTENT`:

```tsx
terms: {
  title: "Terms of Use",
  items: [
    {
      label: "As-is service",
      description: "This app is provided as-is, without warranties of any kind. Use it at your own discretion.",
    },
    {
      label: "AI-generated data",
      description: "Nutritional estimates and exercise parsing are AI-generated and may contain errors. Always verify important health data.",
    },
    {
      label: "Service availability", 
      description: "The service may be modified, suspended, or discontinued at any time without notice.",
    },
    {
      label: "Account termination",
      description: "Accounts may be removed for abuse or at the operator's discretion. You can delete your own account anytime.",
    },
    {
      label: "Liability",
      description: "The developer is not liable for any damages arising from use of this service.",
    },
  ],
},
```

#### 4. Add Terms Section to JSX
Add a new `CollapsibleSection` after the "How This Was Built" section, using a `FileText` or `ScrollText` icon from lucide-react:

```tsx
import { Shield, Database, Bot, Code, Eye, Wrench, ScrollText, X } from "lucide-react";

// ... in JSX, after howBuilt section:
<CollapsibleSection 
  title={PRIVACY_CONTENT.terms.title} 
  icon={ScrollText} 
  defaultOpen 
  storageKey="privacy-terms"
>
  <ul className="text-sm text-muted-foreground">
    {PRIVACY_CONTENT.terms.items.map((item, index) => (
      <li key={index} className="flex gap-2">
        <span>•</span>
        <span>
          <strong>{item.label}:</strong> {item.description}
        </span>
      </li>
    ))}
  </ul>
</CollapsibleSection>
```

---

### Summary of Changes

| Change | Location |
|--------|----------|
| Update page title | `PRIVACY_CONTENT.header.title` |
| Add browser storage bullet | `PRIVACY_CONTENT.technical.items` |
| Add terms section content | New `PRIVACY_CONTENT.terms` object |
| Add terms UI section | New `CollapsibleSection` in JSX |
| Import ScrollText icon | Import statement |

---

### Result
The page becomes a complete single-page legal document covering:
- Privacy practices
- Security implementation  
- Browser storage usage
- Terms of use / liability

All in the same clean, collapsible format with consistent styling.
