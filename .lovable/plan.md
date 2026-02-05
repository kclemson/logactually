
## Fix Demo Logins 24h Display

### Issues to Fix

1. **Duplicate line**: Remove the redundant "Last 24h" paragraph (lines 106-108)
2. **Green only on number**: Update the original line (105) so only the count turns green, not the label

### Solution

Replace lines 105-108 with a single line that wraps only the number in a conditional span:

```tsx
// Before (lines 105-108)
<p>Last 24h: {demoLogins24h ?? 0}</p>
<p className={(demoLogins24h ?? 0) > 0 ? "text-green-500" : ""}>
  Last 24h: {demoLogins24h ?? 0}
</p>

// After (single line)
<p>Last 24h: <span className={(demoLogins24h ?? 0) > 0 ? "text-green-500" : ""}>{demoLogins24h ?? 0}</span></p>
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Remove duplicate, wrap only the number in conditional green span |
