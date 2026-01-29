

## Remove Pulse Animation from Voice Button

### Overview

Remove the `animate-pulse` class from the voice button while keeping the red background and "Stop" label during recording.

---

### Files to Modify

1. **`src/components/LogInput.tsx`**
2. **`src/components/FoodInput.tsx`**

---

### Changes

**LogInput.tsx (line 301)**

```typescript
// Before
className={cn("px-2", isListening && "bg-destructive text-destructive-foreground animate-pulse")}

// After
className={cn("px-2", isListening && "bg-destructive text-destructive-foreground")}
```

**FoodInput.tsx (line 209)**

```typescript
// Before
className={cn("px-2", isListening && "bg-destructive text-destructive-foreground animate-pulse")}

// After
className={cn("px-2", isListening && "bg-destructive text-destructive-foreground")}
```

---

### Result

| State | Icon | Label | Background | Animation |
|-------|------|-------|------------|-----------|
| Idle | Mic | "Voice" | Default outline | None |
| Recording | Mic | "Stop" | Red | None |

---

### Summary

- 2 files modified
- Remove `animate-pulse` from both button classNames
- Keeps the clear red background + "Stop" text feedback

