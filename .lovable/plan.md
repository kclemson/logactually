

## Add Conditional Green Coloring for Demo Logins 24h

### Change

**`src/pages/Admin.tsx` line 105:**

```tsx
// Before
<p>Last 24h: {demoLogins24h ?? 0}</p>

// After  
<p className={(demoLogins24h ?? 0) > 0 ? "text-green-500" : ""}>
  Last 24h: {demoLogins24h ?? 0}
</p>
```

### Pattern Reference

This matches the existing pattern used for F2day and W2day columns (lines 143-161), where values > 0 get `text-green-500` styling.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add conditional `text-green-500` class to "Last 24h" line |

