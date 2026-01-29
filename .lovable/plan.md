

## Fix Voice Button UX

### Overview

Keep the `Mic` icon showing in both states, change the label text to "Stop" when recording, and add a subtle pulse animation to make the active recording state clear.

---

### File to Modify

**`src/components/LogInput.tsx`**

---

### Changes

**1. Update the button (lines 296-305)**

```typescript
// Before
<Button
  variant="outline"
  size="sm"
  onClick={toggleListening}
  disabled={isBusy}
  className={cn("px-2", isListening && "bg-destructive text-destructive-foreground")}
>
  {isListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
  Voice
</Button>

// After
<Button
  variant="outline"
  size="sm"
  onClick={toggleListening}
  disabled={isBusy}
  className={cn("px-2", isListening && "bg-destructive text-destructive-foreground animate-pulse")}
>
  <Mic className="h-4 w-4 mr-1" />
  {isListening ? "Stop" : "Voice"}
</Button>
```

**2. Remove unused import (line 2)**

Remove `MicOff` from the lucide-react imports since it's no longer used.

---

### Result

| State | Icon | Label | Background | Animation |
|-------|------|-------|------------|-----------|
| Idle | Mic | "Voice" | Default outline | None |
| Recording | Mic | "Stop" | Red (`bg-destructive`) | Pulse |

Users will clearly see:
- The red pulsing button indicates active recording
- "Stop" text provides a clear action to end recording
- The microphone icon stays consistent (no confusing "muted" appearance)

---

### Summary

- 1 file modified
- Icon always shows `Mic` (never `MicOff`)
- Label changes from "Voice" to "Stop" when recording
- Pulse animation added for visual feedback
- Removes unused `MicOff` import

