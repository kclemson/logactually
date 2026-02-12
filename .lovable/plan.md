

## List all items in the "Delete this group" alert dialog

Instead of showing "Strawberry Jell-O to Strawberries (in Jell-O)", list every item individually as a bulleted list.

### Changes

**`src/components/FoodItemsTable.tsx`** (line 722)

Replace the "first to last" text with a bulleted list of all item descriptions:

```
This will permanently remove {count} items:
<ul>
  {entryItems.map(item => <li key={item.uid}>{item.description}</li>)}
</ul>
```

**`src/components/WeightItemsTable.tsx`** (line 856)

Same change but using `entryExercises`:

```
This will permanently remove {count} items:
<ul>
  {entryExercises.map(item => <li key={item.uid}>{item.description}</li>)}
</ul>
```

The list will use a simple `<ul>` with small text styling to keep it compact inside the dialog. No logic changes needed.

