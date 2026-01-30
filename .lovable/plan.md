

## Font Color Signals Interactivity

### Design Principle

**Text color indicates whether something is interactive:**
- `text-foreground` (bright) = Clickable/tappable
- `text-muted-foreground` (gray) = Static information, labels, descriptions

### Current Inconsistencies

| Element | Current | Should Be |
|---------|---------|-----------|
| Email address | `text-foreground` (bright) | `text-muted-foreground` (gray) — it's static info |
| "Privacy & Security" link | `text-muted-foreground` (gray) | `text-foreground` (bright) — it's clickable |

### Changes

**File: `src/pages/Settings.tsx`**

#### 1. Email address (line 116)

Make it gray since it's non-interactive:

```tsx
// Change from:
<p className="text-sm">{user?.email}</p>

// To:
<p className="text-sm text-muted-foreground">{user?.email}</p>
```

#### 2. Privacy & Security link (line 300-305)

Make it bright since it's clickable:

```tsx
// Change from:
<Link
  to="/privacy"
  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
>
  Privacy & Security
</Link>

// To:
<Link
  to="/privacy"
  className="text-sm text-foreground hover:underline underline-offset-2 transition-colors"
>
  Privacy & Security
</Link>
```

### Visual Result

**Account section:**
```
Email                              Delete account
foodlog@photo.lemson.com  ← Gray (static info)

Change Password           ← Bright (clickable)
Sign Out                  ← Bright (clickable)
```

**About section:**
```
Privacy & Security        ← Bright (clickable), underline on hover
```

### Updated Design System Summary

| Element Type | Color | Behavior |
|--------------|-------|----------|
| Interactive text (buttons, links) | `text-foreground` | Bright |
| Static info (email, labels) | `text-muted-foreground` | Gray |
| Destructive actions | `text-muted-foreground` → `hover:text-destructive` | Gray, turns red |
| Selection toggles | Bordered with state highlight | Shows which is active |

