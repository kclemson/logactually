
## Fix: Screenshot thumbnail disappears after navigating back to /help

### Root cause

In `handleCapturePage`, the `finally` block runs `navigate("/help")` immediately after `setAttachedFile` and `setPreviewUrl`. The problem is a React + React Router timing issue:

- `navigate("/help")` causes React Router to unmount and remount `FeedbackForm` (since the component is mounted under the `/help` route)
- This unmount/remount happens before React has flushed the state updates from `setAttachedFile` / `setPreviewUrl`
- The newly-mounted `FeedbackForm` starts with clean state — no attached file, no preview URL

The navigation back to `/help` is essentially destroying the component that holds the state we just set.

### The fix

Move `navigate("/help")` to **after** the state is set, with a minimal `await` to let React flush the state before triggering the navigation. Specifically:

```ts
const handleCapturePage = useCallback(async (path: string) => {
  setShowPagePicker(false);
  setIsCapturing(true);
  try {
    navigate(path);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const html2canvas = (await import("html2canvas")).default;
    const target = document.querySelector("main") as HTMLElement;
    if (!target) throw new Error("No <main> element found");
    const canvas = await html2canvas(target, { useCORS: true, allowTaint: false, scale: 1, logging: false });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const compressed = await compressImageToFile(dataUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    // Navigate back FIRST, then set state after a tick
    navigate("/help");
    await new Promise((resolve) => setTimeout(resolve, 50)); // let /help mount
    setAttachedFile(compressed);
    setPreviewUrl(fileToPreviewUrl(compressed));
  } catch (err) {
    console.error("Screenshot failed:", err);
    navigate("/help");
  } finally {
    setIsCapturing(false);
  }
}, [navigate, previewUrl]);
```

Wait — this still has the same problem since `/help` mounting creates a new `FeedbackForm` instance.

### The real fix: store the result in a ref that survives remount, or use sessionStorage

The cleanest solution: write the captured image blob to `sessionStorage` (as a base64 data URL) **before** navigating back, then read it on mount in `FeedbackForm` via a `useEffect`/initial state.

Flow:
1. Capture canvas → compress → `dataUrl`
2. `sessionStorage.setItem("feedback-screenshot", dataUrl)` 
3. `navigate("/help")`
4. On mount, `FeedbackForm` checks `sessionStorage` for a pending screenshot, converts it to a `File`, sets `attachedFile` and `previewUrl`, then clears the sessionStorage key

This is robust because sessionStorage persists across component unmount/remount within the same tab.

### Implementation details

#### `src/components/FeedbackForm.tsx`

1. In `handleCapturePage`: after capture and compression, instead of calling `setAttachedFile`/`setPreviewUrl` directly:
   - Convert the `File` back to a base64 data URL
   - Store it in `sessionStorage` under the key `"feedback-pending-screenshot"`
   - Then `navigate("/help")`
   - Remove the `setAttachedFile`/`setPreviewUrl` calls from this function entirely

2. In the component's initial state for `attachedFile` / `previewUrl` — or in a `useEffect` that runs once on mount:
   - Check `sessionStorage.getItem("feedback-pending-screenshot")`
   - If present, call `compressImageToFile(dataUrl)` to get a `File`, then `setAttachedFile` + `setPreviewUrl`
   - Clear the sessionStorage key immediately after reading it

3. Remove `navigate("/help")` from the `finally` block (it belongs in the success path and error path only).

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | Store screenshot in sessionStorage before navigating, read it on mount |
