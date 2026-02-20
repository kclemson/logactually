
## Fix: Scanner misreads UPC-A (748927028669) as EAN-8 (74890286)

### What's happening

The barcode on the Optimum Nutrition tub is a standard 12-digit UPC-A (`748927028669`). The ZXing decoder is finding a valid EAN-8 checksum pattern (`74890286`) embedded within the bars of the full barcode and returning that first — before it ever reads the full 12-digit code.

This is a known ZXing behavior: when `TRY_HARDER` is enabled, it searches for any valid match. EAN-8 is a strict subset pattern that can match 8 consecutive bars within a larger barcode.

### The fix: EAN-8 confirmation pass

When `runDecodeLoop` (line 617) gets a result and the format is `EAN_8`, immediately attempt a **second decode** on the same canvas frame using a reader configured *without* EAN_8 in the format list. If this second pass finds a longer code (UPC-A or EAN-13), use that instead. If the second pass finds nothing, accept the EAN-8.

This is a fast in-memory operation — no extra camera frames, no delay — because we reuse the already-drawn canvas.

```
result = EAN_8 "74890286"
  → retry canvas decode without EAN_8
  → finds UPC_A "748927028669"
  → use "748927028669" ✓
```

### Implementation details

**New constant** at the top of `BarcodeScanner.tsx`:
```ts
// Hints that prefer longer codes — used when EAN-8 is the initial read
const DECODER_HINTS_NO_EAN8 = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS.filter(f => f !== BarcodeFormat.EAN_8)],
]);
```

**New `BrowserMultiFormatReader` instance** held in a ref, pre-created alongside `readerRef` during scanner startup:
```ts
const readerNoEan8Ref = useRef<BrowserMultiFormatReader | null>(null);
// ...in startScanner():
readerNoEan8Ref.current = new BrowserMultiFormatReader(DECODER_HINTS_NO_EAN8);
```

**Confirmation logic** inserted in `runDecodeLoop` right after a result is found:
```ts
if (result) {
  // If we got an EAN-8, try once more without EAN-8 to see if UPC-A/EAN-13 is present
  if (result.format === 'EAN_8' && readerNoEan8Ref.current && canvasRef.current) {
    try {
      const luminanceSource = new HTMLCanvasElementLuminanceSource(canvasRef.current);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const longerResult = readerNoEan8Ref.current.decodeBitmap(binaryBitmap);
      if (longerResult) {
        result = {
          text: longerResult.getText(),
          format: BarcodeFormat[longerResult.getBarcodeFormat()] || 'unknown',
        };
      }
    } catch {
      // No longer code found — accept the EAN-8
    }
  }
  // ... existing success path
}
```

The same confirmation logic is added to `handleManualCapture` for consistency.

### Cleanup

`readerNoEan8Ref.current` is set to `null` alongside `readerRef.current` in the cleanup path (success timeout, unmount effect).

### Files changed

| File | Change |
|---|---|
| `src/components/BarcodeScanner.tsx` | Add `DECODER_HINTS_NO_EAN8` constant, `readerNoEan8Ref`, pre-create the no-EAN-8 reader on scanner start, add confirmation re-decode in `runDecodeLoop` and `handleManualCapture` |

### Expected outcome

Scanning the Optimum Nutrition tub:
1. ZXing initially reads `74890286` (EAN_8)
2. Confirmation pass re-decodes the same canvas frame without EAN_8 enabled
3. Finds `748927028669` (UPC_A)
4. `onScan("748927028669")` is called
5. Lookup finds the product correctly in Open Food Facts with full nutritional data

For genuine EAN-8 barcodes (small packaging), the confirmation pass will fail to find a longer code and the EAN-8 result is accepted normally — no regression.
