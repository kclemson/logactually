

## Remove remaining dead code from BarcodeScanner.tsx

After the debug logging cleanup, several artifacts are still present but unused:

### Deletions

**`src/components/BarcodeScanner.tsx`**

1. **`computeFrameStats` function** (lines 77-128) — 50-line image analysis helper, was only used in debug logging. Delete entirely.

2. **`DebugInfo` interface** (lines 45-53) — type definition for debug state that's no longer rendered. Delete.

3. **`debugInfo` state + all `setDebugInfo` calls** — the state (lines 135-143) and every `setDebugInfo(...)` call throughout the file (~10 occurrences). The value is never read in JSX. Delete the state declaration and all setter calls.

4. **`decodeStartTimeRef`** (line 151) — set on lines 289 and 411 but never read. Delete ref and both assignments.

5. **`errorCountsRef`** (line 152) — set on lines 290 and 476 but never read. Delete ref and all assignments.

6. **`dialogRef`** (line 146) — passed to `DialogContent` ref prop but never used for measurement or scrolling. Delete ref and remove `ref={dialogRef}` from JSX.

7. **`usedRotation` variable** (line 423) — assigned but never read. Delete.

8. **`logger` import** (line 18) — check if any `logger.log` calls remain after cleanup. If the only remaining ones are the EAN-8 streak logs (lines 444, 450) and manual capture (line 245), those are legitimate operational logs — keep. Otherwise remove import.

All changes are mechanical deletions with no behavioral impact.

