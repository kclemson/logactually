
## Fix Mobile Button Layout in FoodInput

### Problem
The rightmost "Add Food" button is being clipped on mobile screens due to insufficient horizontal space.

### Solution
Three targeted changes to reclaim horizontal space on mobile:

---

### Changes

**File: `src/components/FoodInput.tsx`**

#### 1. Reduce padding on all buttons
Override the default `px-3` padding from `size="sm"` with tighter `px-2` on all action buttons.

#### 2. Shorten "Bar Code" label to "Scan"
More concise and still clear in context.

#### 3. Make "Add Food" responsive - show "Add" on narrow screens
Use responsive classes to show full label on wider screens and abbreviated on mobile.

---

### Code Changes

**Line 196-205 (Voice button):**
```tsx
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
```

**Line 208-211 (Scan button - rename from "Bar Code"):**
```tsx
<Button variant="outline" size="sm" className="px-2" onClick={() => setScannerOpen(true)} disabled={isBusy}>
  <ScanBarcode className="h-4 w-4 mr-1" />
  Scan
</Button>
```

**Line 216-218 (Saved button):**
```tsx
<Button variant="outline" size="sm" className="px-2" disabled={isBusy}>
  <Star className="h-4 w-4 mr-1" />
  Saved
</Button>
```

**Line 229-240 (Add Food button - responsive label):**
```tsx
<Button onClick={handleSubmit} disabled={!text.trim() || isBusy} size="sm" className="flex-1 px-2">
  {isBusy ? (
    <>
      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      <span className="hidden xs:inline">{isScanning ? "Looking up..." : "Adding..."}</span>
      <span className="xs:hidden">{isScanning ? "..." : "..."}</span>
    </>
  ) : (
    <>
      <Send className="mr-1 h-4 w-4" />
      <span className="hidden sm:inline">Add Food</span>
      <span className="sm:hidden">Add</span>
    </>
  )}
</Button>
```

**Line 2 (imports):**
Add `cn` import for conditional className merging on the Voice button.

---

### Result
- All buttons get `px-2` instead of `px-3` (saves ~8px per button = ~32px total)
- "Bar Code" → "Scan" (saves ~40px)
- "Add Food" → "Add" on screens < 640px (saves ~30px when needed)
- Buttons will fit comfortably within the max-w-lg container on all mobile devices
