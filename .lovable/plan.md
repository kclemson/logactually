

## Timeout Fix + AI Parsing for Saved Meals

### Overview
Two fixes to improve the demo data population:
1. **Timeout Fix**: Use background processing to return immediately while work continues
2. **Saved Meals Realism**: Parse saved meal templates through AI instead of random macros

---

### Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/populate-demo-data/index.ts` | Add background processing + AI parsing for saved meals |
| `src/hooks/usePopulateDemoData.ts` | Handle "started" status response |
| `src/components/PopulateDemoDataDialog.tsx` | Show processing status instead of waiting |

---

### 1. Edge Function: Background Processing

Refactor the main handler to return immediately and process in background:

```typescript
// Before line 585, add type declaration for EdgeRuntime
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

// In Deno.serve handler, after validation and before heavy work:

// Return immediately with processing status
const response = new Response(
  JSON.stringify({ 
    success: true, 
    message: 'Population started. Check demo account in 1-2 minutes.',
    status: 'processing'
  }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);

// Start background work
EdgeRuntime.waitUntil(doPopulationWork(params, demoUserId, serviceClient));

return response;
```

Extract the heavy work (AI parsing, DB inserts) into a separate async function `doPopulationWork()`.

---

### 2. Edge Function: AI Parsing for Saved Meals

Update `generateSavedMeals` to use parsed AI results instead of random values.

**Current (random macros):**
```typescript
food_items: template.items.map((item, idx) => ({
  description: item,
  calories: randomInt(100, 500),  // Random!
  protein: randomInt(5, 40),
  // ...
}))
```

**New approach:**

Before generating saved meals, parse all templates through AI:

```typescript
// Parse saved meal templates through AI
if (savedMealsCount > 0) {
  const savedMealInputs = SAVED_MEAL_TEMPLATES.slice(0, savedMealsCount)
    .map(t => t.items.join(', '));
  const savedMealResults = await bulkParseWithAI(savedMealInputs, 'savedmeals');
  savedMealResults.forEach((items, input) => parsedCache.set(input, items));
}
```

Then update `generateSavedMeals` to accept the cache:

```typescript
function generateSavedMeals(
  count: number, 
  parsedCache: Map<string, ParsedFoodItem[]>
): Array<{ name: string; original_input: string; food_items: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_MEAL_TEMPLATES).slice(0, count);
  
  return templates.map(template => {
    const originalInput = template.items.join(', ');
    const parsedItems = parsedCache.get(originalInput) || [];
    
    return {
      name: template.name,
      original_input: originalInput,
      food_items: parsedItems.length > 0 
        ? parsedItems.map((item, idx) => ({
            uid: `saved-${Date.now()}-${idx}`,
            description: item.name,
            portion: item.portion,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            // ... other fields
          }))
        : template.items.map((item, idx) => ({
            // Fallback to basic structure if AI parsing failed
            uid: `saved-${Date.now()}-${idx}`,
            description: item,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          })),
      use_count: randomInt(2, 10),
    };
  });
}
```

---

### 3. Hook: Handle Processing Status

Update `usePopulateDemoData.ts` to recognize the "processing" status:

```typescript
interface PopulateResult {
  success: boolean;
  summary?: PopulateSummary;
  error?: string;
  message?: string;        // Add message field
  status?: 'processing' | 'complete';  // Add status field
}

const populate = async (params: PopulateDemoDataParams) => {
  setIsLoading(true);
  setResult(null);

  try {
    const { data, error } = await supabase.functions.invoke("populate-demo-data", {
      body: params,
    });

    if (error) {
      setResult({ success: false, error: error.message });
    } else {
      setResult({ 
        success: true, 
        summary: data?.summary,
        message: data?.message,
        status: data?.status || 'complete'
      });
    }
  } catch (err) {
    setResult({ success: false, error: (err as Error).message });
  } finally {
    setIsLoading(false);
  }
};
```

---

### 4. Dialog: Show Processing Status

Update `PopulateDemoDataDialog.tsx` to show appropriate status messages:

```tsx
{/* Result display */}
{result && (
  <div
    className={cn(
      "text-xs p-2 rounded border",
      result.success
        ? result.status === 'processing'
          ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
          : "bg-green-500/10 border-green-500/30 text-green-600"
        : "bg-destructive/10 border-destructive/30 text-destructive"
    )}
  >
    {result.success ? (
      result.status === 'processing' ? (
        <div className="space-y-1">
          <p className="font-medium">⏳ Processing in background</p>
          <p>{result.message}</p>
          <p className="text-muted-foreground mt-1">You can close this dialog.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-medium">✓ Done!</p>
          {/* existing summary display */}
        </div>
      )
    ) : (
      <p>Error: {result.error}</p>
    )}
  </div>
)}
```

Also update the footer buttons logic to allow closing immediately when processing:

```tsx
<DialogFooter>
  <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
    {result?.success ? "Close" : "Cancel"}
  </Button>
  {!result?.success && !result?.status && (
    <Button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Starting...
        </>
      ) : (
        "Populate"
      )}
    </Button>
  )}
</DialogFooter>
```

---

### Execution Flow After Changes

```text
1. Client clicks "Populate"
2. Edge function receives request, validates admin
3. Edge function returns immediately: { success: true, status: "processing" }
4. Dialog shows "Processing in background" message
5. Background processing:
   - Parse all food inputs (12 batches, ~60-90 sec)
   - Parse saved meal templates (1 batch, ~8 sec)
   - Clear existing data if requested
   - Insert food entries
   - Insert weight entries  
   - Insert saved meals with AI-parsed items
   - Insert saved routines
   - Log completion
6. User can close dialog and check demo account in 1-2 min
```

---

### Technical Notes

- `EdgeRuntime.waitUntil()` is a Deno Edge Runtime API that keeps the function alive until the promise resolves
- The saved meals parsing adds 1 extra AI batch (8 templates / 10 batch size = 1 call)
- If AI parsing fails for saved meals, falls back to empty values rather than random ones
- Shutdown handling will log if the function is terminated early

