

## Coherent Button Design System: Borders + Layout

### Design Principles

1. **Borders indicate state** — Use bordered buttons only for toggles/selections where the user needs to see which option is active
2. **Vertical stacking for action lists** — When actions don't have borders, stack them vertically so each has a clear, unambiguous tap target

### Layout Rules

| Context | Layout | Style |
|---------|--------|-------|
| Selection toggles (theme, units) | Horizontal row | Bordered, selected state highlighted |
| Stateless action list | Vertical stack | Plain text, full-width rows, hover background |
| In-list add action | First row in list | Plain text with hover background |
| Destructive inline | Text link style | Muted, turns red on hover |

### Changes

**File: `src/pages/Settings.tsx`**

#### 1. Account Section (lines 127-144)

Stack "Change Password" and "Sign Out" vertically as full-width rows:

```tsx
<div className="space-y-1">
  {!isReadOnly && (
    <button
      onClick={() => setChangePasswordOpen(true)}
      className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground"
    >
      Change Password
    </button>
  )}
  <button
    onClick={async () => {
      setIsSigningOut(true);
      await signOut();
    }}
    disabled={isSigningOut}
    className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
  >
    {isSigningOut ? 'Signing out...' : 'Sign Out'}
  </button>
</div>
```

#### 2. Export CSV Section (lines ~252-270)

Stack export options vertically:

```tsx
<div className="space-y-1">
  <button 
    onClick={exportDailyTotals} 
    disabled={isExporting || isReadOnly}
    className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
  >
    Food Daily Totals
  </button>
  <button 
    onClick={exportFoodLog} 
    disabled={isExporting || isReadOnly}
    className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
  >
    Food Log
  </button>
  {showWeights && (
    <button 
      onClick={exportWeightLog} 
      disabled={isExporting || isReadOnly}
      className="w-full text-left py-2 hover:bg-accent/50 transition-colors text-sm text-foreground disabled:opacity-50"
    >
      Weights Log
    </button>
  )}
  {isReadOnly && (
    <p className="text-xs text-muted-foreground mt-2">
      Create an account to export your data
    </p>
  )}
</div>
```

#### 3. Keep as-is

- **Theme toggles** — Horizontal bordered (shows which is selected)
- **Weight unit toggles** — Horizontal bordered (shows which is selected)
- **Add Saved Meal/Routine** — Already correct (vertical, plain text)
- **Delete account** — Already correct (muted text link style)

### Visual Result

**Account section:**
```
Email: user@example.com                    Delete account

Change Password      ← Full-width row, hover background
Sign Out             ← Full-width row, hover background
```

**Export section:**
```
Food Daily Totals    ← Full-width row
Food Log             ← Full-width row  
Weights Log          ← Full-width row
```

**Theme (unchanged):**
```
[☀ Light] [☾ Dark] [🖥 System]   ← Horizontal, bordered, shows selection
```

### Technical Notes

- Uses same `w-full text-left py-2 hover:bg-accent/50` pattern as "Add Saved Meal"
- Removes dependency on `Button` component for these actions (uses native `<button>`)
- Consistent tap target height across all action rows

