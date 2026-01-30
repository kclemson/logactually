

## Add All Nutritional Metadata Columns to Prompt Eval Results Table

### Overview

Expand the results table in DevToolsPanel to display all the nutritional metadata returned by the AI as separate columns, making it easy to scan and verify the full response.

---

### New Column Layout

| Column | Key | Width | Content |
|--------|-----|-------|---------|
| Input | input | 250px | Test input text |
| Source | source | 70px | UPC / AI / AI (fallback) |
| Prompt | prompt | 80px | Default / Experimental |
| Description | description | 200px | Food item name |
| Portion | portion | 80px | Portion size text |
| Cal | calories | 50px | Calories |
| P | protein | 40px | Protein (g) |
| C | carbs | 40px | Carbs (g) |
| Fb | fiber | 40px | Fiber (g) |
| Sg | sugar | 40px | Sugar (g) |
| F | fat | 40px | Fat (g) |
| SF | satFat | 40px | Saturated Fat (g) |
| Na | sodium | 50px | Sodium (mg) |
| Ch | cholesterol | 50px | Cholesterol (mg) |
| Conf | confidence | 60px | Confidence level |
| Note | sourceNote | 250px | Source note |

---

### File Changes

#### `src/components/DevToolsPanel.tsx`

**1. Update FoodItemOutput interface (lines 12-17)**

Add all the nutritional fields to match what the AI returns:

```typescript
interface FoodItemOutput {
  description: string;
  portion?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  sodium?: number;
  cholesterol?: number;
  confidence?: 'high' | 'medium' | 'low';
  source_note?: string;
}
```

**2. Update ColumnKey type (line 40)**

Replace with all the new column keys:

```typescript
type ColumnKey = 
  | 'input' 
  | 'source' 
  | 'prompt' 
  | 'description'
  | 'portion'
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fiber'
  | 'sugar'
  | 'fat'
  | 'satFat'
  | 'sodium'
  | 'cholesterol'
  | 'confidence'
  | 'sourceNote';
```

**3. Update columnWidths state (lines 54-60)**

Replace with widths for all columns:

```typescript
const [columnWidths, setColumnWidths] = useState({
  input: 250,
  source: 70,
  prompt: 80,
  description: 200,
  portion: 80,
  calories: 50,
  protein: 40,
  carbs: 40,
  fiber: 40,
  sugar: 40,
  fat: 40,
  satFat: 40,
  sodium: 50,
  cholesterol: 50,
  confidence: 60,
  sourceNote: 250,
});
```

**4. Update table header**

Replace existing headers with all new columns. Use abbreviated labels with title tooltips:

```tsx
<thead className="bg-background sticky top-0">
  <tr>
    <th title="Test input">Input</th>
    <th title="Data source">Source</th>
    <th title="Prompt version">Prompt</th>
    <th title="Food description">Desc</th>
    <th title="Portion size">Portion</th>
    <th title="Calories">Cal</th>
    <th title="Protein (g)">P</th>
    <th title="Carbs (g)">C</th>
    <th title="Fiber (g)">Fb</th>
    <th title="Sugar (g)">Sg</th>
    <th title="Fat (g)">F</th>
    <th title="Saturated Fat (g)">SF</th>
    <th title="Sodium (mg)">Na</th>
    <th title="Cholesterol (mg)">Ch</th>
    <th title="AI confidence">Conf</th>
    <th title="Source note">Note</th>
  </tr>
</thead>
```

**5. Update table body**

Replace existing cells with individual columns for each field. For multi-item results, each food item renders as stacked values in the cell:

```tsx
{/* Description */}
<td><div className="truncate">{f.description}</div></td>

{/* Portion */}
<td>{f.portion || '—'}</td>

{/* Calories */}
<td className="text-right">{f.calories}</td>

{/* Protein */}
<td className="text-right">{f.protein ?? '—'}</td>

{/* Carbs */}
<td className="text-right">{f.carbs ?? '—'}</td>

{/* Fiber */}
<td className="text-right">{f.fiber ?? '—'}</td>

{/* Sugar */}
<td className="text-right">{f.sugar ?? '—'}</td>

{/* Fat */}
<td className="text-right">{f.fat ?? '—'}</td>

{/* Saturated Fat */}
<td className="text-right">{f.saturated_fat ?? '—'}</td>

{/* Sodium */}
<td className="text-right">{f.sodium ?? '—'}</td>

{/* Cholesterol */}
<td className="text-right">{f.cholesterol ?? '—'}</td>

{/* Confidence - with color */}
<td>
  <span className={
    f.confidence === 'high' ? 'text-green-600' 
    : f.confidence === 'medium' ? 'text-yellow-600' 
    : f.confidence === 'low' ? 'text-red-600' 
    : 'text-muted-foreground'
  }>
    {f.confidence || '—'}
  </span>
</td>

{/* Source Note */}
<td><div className="line-clamp-2">{f.source_note || '—'}</div></td>
```

---

### Multi-Item Handling

When a single test case returns multiple food items, each cell will display stacked values using the existing `space-y-0.5` pattern. This keeps all items for a single input aligned across columns.

---

### Summary

| Change | Details |
|--------|---------|
| Remove "Output" column | Split into Description + Calories columns |
| Add Description column | 200px, truncated text |
| Add Calories column | 50px, right-aligned number |
| Add Portion column | 80px, portion text |
| Add 8 macro/micro columns | 40-50px each, right-aligned numbers |
| Add Confidence column | 60px, color-coded text |
| Keep Source Note column | 250px, line-clamped text |

Total: 16 columns (vs current 5), all individually resizable.

