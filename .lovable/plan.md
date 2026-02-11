

## Photo Food Logging -- Complete Feature Plan

### Overview
Add a camera/photo button to the food input bar that lets users snap a photo or pick one from their gallery. The image is sent to a vision-capable AI model which returns structured food items using the same shared schema as text-based analysis.

### 1. UI: Photo Button + Camera vs Gallery Picker

**`src/components/LogInput.tsx`**
- Add a new "Photo" button (Camera icon) in the button row, visible only in food mode when camera is supported
- On mobile (below `sm` breakpoint), hide text labels on Voice, Scan, and Photo buttons -- show only icons. "Saved" keeps its label for discoverability.
- The Photo button opens a `Popover` with two options:
  - **Take Photo** (Camera icon) -- triggers a hidden file input with `capture="environment"`
  - **Choose Photo** (ImagePlus icon) -- triggers a hidden file input without `capture` (opens gallery/file picker)
- New props: `onPhotoSubmit?: (base64: string) => void`

**Button bar layout:**
```text
Desktop:  [Mic Voice] [Camera Photo] [Scan] [Star Saved] [======= Add Food =======]
Mobile:   [Mic] [Cam] [Scan] [Star Saved] [======= Add Food =======]
```

### 2. Image Capture + Compression

**`src/components/PhotoCapture.tsx`** (new)
- Contains two hidden `<input type="file">` elements:
  - Camera: `accept="image/*" capture="environment"`
  - Gallery: `accept="image/*"` (no capture attribute)
- Exposes `openCamera()` and `openGallery()` via `forwardRef` + `useImperativeHandle`
- On file select from either input:
  1. Read file as data URL
  2. Draw to canvas, scaling to max 800px on longest side
  3. Export as JPEG at 0.8 quality
  4. Strip data URL prefix, call `onPhotoSelected(base64: string)` callback

### 3. Analysis Hook

**`src/hooks/useAnalyzeFoodPhoto.ts`** (new)
- Same shape as `useAnalyzeFood`: returns `{ analyzePhoto, isAnalyzing, error }`
- Calls `supabase.functions.invoke('analyze-food-photo', { body: { imageBase64 } })`
- Returns the same result shape (food_items array with totals)
- Assigns `uid` via `crypto.randomUUID()` to each item

### 4. Edge Function

**`supabase/functions/analyze-food-photo/index.ts`** (new)
- Same auth pattern as `analyze-food` (manual JWT validation via `getClaims`)
- Same CORS headers
- Imports `FOOD_ITEM_FIELDS` and `FOOD_ITEM_JSON_EXAMPLE` from `_shared/prompts.ts`
- Builds a photo-specific prompt using a new `buildPhotoAnalysisPrompt()` helper
- Sends multimodal request to Lovable AI Gateway using `google/gemini-2.5-flash` (vision-capable, cost-effective):
  ```text
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: photoPrompt },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
      ]
    }
  ]
  ```
- Same response parsing, validation, filtering of zero-nutrient items, and totals calculation as `analyze-food`

**`supabase/functions/_shared/prompts.ts`** -- Add photo prompt builder:
- New exported function `buildPhotoAnalysisPrompt()` that reuses `FOOD_ITEM_FIELDS` and `FOOD_ITEM_JSON_EXAMPLE`
- Prompt text instructs the model to identify all food items visible in the photo, estimate portions visually, and return the standard JSON schema
- This ensures if we add new nutritional fields in the future, both text and photo analysis stay in sync automatically

**`supabase/config.toml`** -- Add entry:
```
[functions.analyze-food-photo]
verify_jwt = false
```

### 5. FoodLog Integration

**`src/pages/FoodLog.tsx`**
- Import `useAnalyzeFoodPhoto`
- Add `handlePhotoSubmit` callback:
  1. Call `analyzePhoto(base64)`
  2. If in demo/read-only mode, show `DemoPreviewDialog`
  3. Otherwise, call `createEntryFromItems(result.food_items, "photo")`
- Pass `onPhotoSubmit={handlePhotoSubmit}` and photo loading state down to `LogInput`
- The `isLoading` prop on LogInput should also include the photo analysis loading state

### Files Changed (summary)
1. `src/components/PhotoCapture.tsx` -- new (two file inputs, compression, imperative ref)
2. `src/hooks/useAnalyzeFoodPhoto.ts` -- new (hook calling the edge function)
3. `supabase/functions/analyze-food-photo/index.ts` -- new (vision edge function)
4. `supabase/functions/_shared/prompts.ts` -- add `buildPhotoAnalysisPrompt()` reusing shared constants
5. `src/components/LogInput.tsx` -- add Photo popover with Take/Choose options, icon-only labels on mobile
6. `src/pages/FoodLog.tsx` -- wire up photo analysis flow with new hook and callback

