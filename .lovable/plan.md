

## Add "Go to Today" Link in Date Navigation Row

### Change

After the `>` chevron button in both `FoodLog.tsx` and `WeightLog.tsx`, add a conditional "Go to today" text link that only appears when viewing a past date.

### Layout

```text
  < [calendar] Tue, Feb 10 >  Go to today
```

### Technical Details

**`src/pages/FoodLog.tsx`** (after line 764, before the closing `</div>`):

```tsx
{!isTodaySelected && (
  <button
    className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1"
    onClick={() => {
      setStoredDate(format(new Date(), 'yyyy-MM-dd'));
      setSearchParams({}, { replace: true });
    }}
  >
    Go to today
  </button>
)}
```

**`src/pages/WeightLog.tsx`** (after line 658, before the closing `</div>`): Same snippet.

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Add "Go to today" link after `>` chevron |
| `src/pages/WeightLog.tsx` | Add "Go to today" link after `>` chevron |

