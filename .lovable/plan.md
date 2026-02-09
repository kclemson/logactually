

## Restyle Account and Export Action Items

### Account Section

Replace the current layout with four clean labeled rows using the consistent label-left, value/buttons-right pattern:

```text
┌──────────────────────────────────────────────────────┐
│  Email                          user@example.com     │
│  Security          [Change Password] [Delete Account]│
│  Session                               [Sign Out]   │
└──────────────────────────────────────────────────────┘
```

- **Email**: Label on the left, email address right-justified as read-only text (same `text-sm` styling as other values)
- **Security**: "Change Password" (hidden when read-only) + "Delete Account" (hidden for demo users), right-aligned outlined buttons. "Delete Account" uses a destructive style (`text-destructive border-destructive/30 hover:bg-destructive/5`)
- **Session**: "Sign Out" button, right-aligned

### Export Section

Replace the stacked full-width text rows with labeled rows:

```text
┌────────────────────────────────────────────────┐
│  Food        [Daily Totals]  [Detailed Log]    │
│  Weights                     [Detailed Log]    │
└────────────────────────────────────────────────┘
```

- **Food**: "Daily Totals" and "Detailed Log" buttons
- **Weights**: "Detailed Log" button (only when weights enabled)
- All disabled when exporting or read-only
- Read-only hint message preserved

### Button Style

All action buttons use the same outlined style as Theme/Weight Units:

```
rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors
```

Exception: "Delete Account" uses `text-destructive border-destructive/30 hover:bg-destructive/5`.

### File Changed

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Account section: replace email display + floating delete link with "Email" labeled row (address right-justified); add "Security" row with Change Password + Delete Account buttons; add "Session" row with Sign Out button. Export section: replace three stacked text buttons with "Food" and "Weights" labeled rows containing outlined buttons. |

