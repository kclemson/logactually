

## Update Barcode Prefix with Shared Constant and Italicize Labels

### Overview
Three related improvements:
1. Create a shared constant for the "Scanned barcode:" prefix to avoid duplication
2. Update both input components to use the constant
3. Italicize the "Logged as:" label to match the "From saved meal/routine:" styling

---

### Visual Result

**Regular entries:**
> *Logged as:* "2 eggs, toast with butter"

**Barcode entries:**
> *Logged as:* "Scanned barcode: 717524611109"

**Saved meal entries (unchanged):**
> *From saved meal:* Breakfast Bowl

---

### Implementation

**1. Add constant to `src/lib/upc-utils.ts`**

Add a new exported constant at the top of the file:
```typescript
/** Prefix used when logging scanned barcode entries */
export const SCANNED_BARCODE_PREFIX = "Scanned barcode:";
```

Also update the regex comment to reflect the new prefix format.

**2. Update `src/components/FoodInput.tsx`**

- Import the constant from upc-utils
- Line 162: Change `\`Scanned: ${code}\`` → `\`${SCANNED_BARCODE_PREFIX} ${code}\``
- Line 169: Change `\`Scanned: ${code}\`` → `\`${SCANNED_BARCODE_PREFIX} ${code}\``

**3. Update `src/components/LogInput.tsx`**

- Import the constant from upc-utils
- Line 253: Change `\`Scanned: ${code}\`` → `\`${SCANNED_BARCODE_PREFIX} ${code}\``
- Line 260: Change `\`Scanned: ${code}\`` → `\`${SCANNED_BARCODE_PREFIX} ${code}\``

**4. Update `src/components/FoodItemsTable.tsx`** (lines 631-633)

Italicize "Logged as:" label to match "From saved meal:" styling:
```tsx
<p className="text-sm text-muted-foreground italic">
  Logged as:{' '}<span className="not-italic">"{currentRawInput}"</span>
</p>
```

**5. Update `src/components/WeightItemsTable.tsx`** (lines 658-660)

Same styling update:
```tsx
<p className="text-sm text-muted-foreground italic">
  Logged as:{' '}<span className="not-italic">"{currentRawInput}"</span>
</p>
```

---

### Files Changed
| File | Change |
|------|--------|
| `src/lib/upc-utils.ts` | Add `SCANNED_BARCODE_PREFIX` constant |
| `src/components/FoodInput.tsx` | Import and use constant (2 places) |
| `src/components/LogInput.tsx` | Import and use constant (2 places) |
| `src/components/FoodItemsTable.tsx` | Italicize "Logged as:" label |
| `src/components/WeightItemsTable.tsx` | Italicize "Logged as:" label |

