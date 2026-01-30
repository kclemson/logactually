

## Darker Zero Values

### Overview
Change the zero-value styling from `text-muted-foreground` to a darker shade for less visual prominence.

---

### Changes to `src/pages/Admin.tsx`

Replace all instances of `text-muted-foreground` (for zero values) with `text-muted-foreground/50` to apply 50% opacity, making them significantly darker while still legible.

**Affected lines:**
- Line 116: `entries_today`
- Line 119: `weight_today`
- Line 122: `total_entries`
- Line 123: `saved_meals_count`
- Line 124: `total_weight_entries`
- Line 125: `saved_routines_count`
- Line 126: `login_count`
- Line 152: `entry_count`
- Line 153: `weight_count`
- Line 155: `users_with_entries`
- Line 156: `users_created`

**Example change:**
```tsx
// From:
text-muted-foreground

// To:
text-muted-foreground/50
```

---

### Result
Zero values will appear much darker (50% opacity of the muted gray), making non-zero values stand out more prominently.

