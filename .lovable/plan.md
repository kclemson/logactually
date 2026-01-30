
## Fix Voice Input Microphone Resource Leak on Safari/iOS

### Overview

Safari/iOS sometimes keeps the microphone active at the OS level even after the Web Speech API's `onend` fires. This fix adds explicit cleanup using `abort()` (more aggressive than `stop()`) and ensures the microphone is released on component unmount.

---

### Changes (Minimal)

#### 1. Use `abort()` Instead of `stop()` in Toggle Handler

**Line 187** - Change from `stop()` to `abort()` and immediately update UI:

```typescript
// Before
if (isListening) {
  recognitionRef.current?.stop();
  return;
}

// After
if (isListening) {
  recognitionRef.current?.abort();
  setIsListening(false);  // Don't wait for onend - update immediately
  return;
}
```

#### 2. Add Cleanup Effect

**After line 183** (after `getOrCreateRecognition`):

```typescript
// Cleanup on unmount - ensure microphone is released
useEffect(() => {
  return () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  };
}, []);
```

---

### Why This is Appropriate for useEffect

Per project guidelines, `useEffect` is correct here because:
- The Web Speech API is an **external browser system**
- We need **cleanup on unmount** to release the microphone resource
- No state synchronization is happening - this is purely resource management

---

### File Changes Summary

| Location | Change |
|----------|--------|
| Line 187 | Change `.stop()` to `.abort()` and add immediate `setIsListening(false)` |
| After line 183 | Add cleanup `useEffect` for unmount |

---

### Testing

1. Open on iPhone Safari
2. Start voice input, speak, then stay silent
3. Wait for button to auto-reset
4. Verify orange microphone icon disappears from iOS status bar
5. Also test: navigate away from the page while recording - mic should release
