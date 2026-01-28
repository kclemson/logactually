

## Minimal Fix: Remove Height Restriction

Remove only the `height < 12` check from `renderGroupedLabel` to test if that's causing the missing labels.

---

### Current Code (line 60)

```typescript
if (!payload?.isRunMiddle || !value || height < 12) return null;
```

### Updated Code

```typescript
if (!payload?.isRunMiddle || !value) return null;
```

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Remove `height < 12` from the condition on line 60 |

---

### What This Tests

- If labels appear after this change → the height check was too restrictive
- If labels still missing → the issue is elsewhere (run detection, isRunMiddle logic, or payload passing)

No other changes - same label position (`y + 10`), same font size, same spanning calculation.

