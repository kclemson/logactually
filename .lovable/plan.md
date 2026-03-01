

## Remove `log-scanner-debug` edge function and all references

The debug logging endpoint was temporary scaffolding for barcode scanner diagnostics. Here's the cleanup:

### 1. Delete the edge function
- Delete `supabase/functions/log-scanner-debug/index.ts`
- Remove the `[functions.log-scanner-debug]` block from `supabase/config.toml`

### 2. Strip debug logging from `src/components/BarcodeScanner.tsx`
- Remove the `import { supabase }` line (line 18) — only used for debug logging
- Delete the `logDebugEvents` function definition (lines 195–213)
- Remove all ~15 `logDebugEvents(...)` call sites throughout the file (lines 358, 398, 444, 467, 509, 578, 594, 658, 717, 745, 782, 793, 820). Each is a standalone statement that can be deleted without affecting surrounding logic.

### 3. Security finding
Already dismissed the `log_scanner_debug_no_auth` finding.

