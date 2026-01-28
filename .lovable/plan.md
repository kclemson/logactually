

## Collapse Settings Sections by Default

Change the default behavior so all Settings page sections start collapsed, while persisting any user-expanded sections.

---

### Current Behavior

| Scenario | Result |
|----------|--------|
| First visit | All sections open (defaultOpen=true) |
| Toggle closed | Stays closed (localStorage saves "false") |
| Return visit | Reads "false" from localStorage |

### Desired Behavior

| Scenario | Result |
|----------|--------|
| First visit | All sections collapsed |
| User expands section | Saves "true" to localStorage |
| Return visit | Previously expanded sections stay open |
| User collapses section | Removes from localStorage (back to default) |

---

### Implementation Approach

**Option 1: Change default in Settings.tsx (Simple)**

Pass `defaultOpen={false}` to each `CollapsibleSection` in Settings.tsx:

```tsx
<CollapsibleSection title="Account" icon={User} defaultOpen={false}>
```

This works but requires updating 5 places and localStorage will still save "false" values unnecessarily.

**Option 2: Update CollapsibleSection logic (Cleaner)**

Modify the component to:
1. Only save to localStorage when value differs from default (or only save "true")
2. On collapse, remove the localStorage key instead of saving "false"

This keeps localStorage cleaner and makes the default behavior more intuitive.

---

### Recommended: Option 2

**Changes to `src/components/CollapsibleSection.tsx`:**

1. Change `defaultOpen` prop default from `true` to `false`
2. Update useEffect to only persist when expanded (or remove key when collapsed to use default)

```typescript
// Current (line 29)
defaultOpen = true,

// New
defaultOpen = false,
```

```typescript
// Current useEffect (lines 45-47)
useEffect(() => {
  localStorage.setItem(key, String(isOpen));
}, [key, isOpen]);

// New useEffect - only persist when different from default
useEffect(() => {
  if (isOpen !== defaultOpen) {
    localStorage.setItem(key, String(isOpen));
  } else {
    localStorage.removeItem(key);
  }
}, [key, isOpen, defaultOpen]);
```

This means:
- Collapsed sections (matching default) have no localStorage entry
- Expanded sections save "true" to localStorage
- On load: no entry → collapsed; "true" entry → expanded

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/CollapsibleSection.tsx` | Change default to `false`, update persistence logic |

---

### Behavior After Change

```text
Fresh visit to Settings:
┌─────────────────────────────────────┐
│ ▶ Account                           │  (collapsed)
│ ▶ Saved Meals                   Add │  (collapsed)
│ ▶ Saved Routines                Add │  (collapsed)
│ ▶ Appearance                        │  (collapsed)
│ ▶ Export to CSV                     │  (collapsed)
└─────────────────────────────────────┘

After user expands "Account":
- localStorage: section-account = "true"
- Next visit: Account stays expanded, others collapsed
```

---

### Edge Case: Existing Users

Users who have existing localStorage values will retain their current settings because:
- "true" → section opens (as expected)
- "false" → section stays closed (as expected)

Over time, as users interact, values will migrate to the cleaner "only store expanded" pattern.

