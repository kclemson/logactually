
## Accessibility Improvements: aria-labels and aria-expanded

### Overview
This plan adds accessibility attributes throughout the codebase to ensure screen readers can properly identify interactive elements. The changes fall into four categories:

1. **Icon-only navigation buttons** - Add `aria-label` to previous/next day/month buttons
2. **Icon-only action buttons** - Add `aria-label` to delete and expand buttons
3. **Collapsible sections** - Add `aria-expanded` attribute
4. **Form inputs without visible labels** - Add `aria-label` to search inputs and textareas

---

### File-by-File Changes

#### 1. `src/components/CollapsibleSection.tsx`

Add `aria-expanded` attribute to the toggle button:

**Line 55** - Add `aria-expanded={isOpen}` to button:
```tsx
<button
  type="button"
  onClick={handleToggle}
  aria-expanded={isOpen}
  className="flex items-center gap-2..."
>
```

---

#### 2. `src/pages/FoodLog.tsx`

Add `aria-label` to navigation buttons:

**Line 510** - Previous day button:
```tsx
<Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11" aria-label="Previous day">
```

**Line 554-560** - Next day button:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={goToNextDay}
  disabled={isTodaySelected}
  className={cn("h-11 w-11", isTodaySelected && "opacity-20")}
  aria-label="Next day"
>
```

---

#### 3. `src/pages/WeightLog.tsx`

Add `aria-label` to navigation buttons:

**Line 320** - Previous day button:
```tsx
<Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11" aria-label="Previous day">
```

**Lines 364-370** - Next day button:
```tsx
<Button 
  variant="ghost" 
  size="icon" 
  onClick={goToNextDay}
  disabled={isTodaySelected}
  className="h-11 w-11"
  aria-label="Next day"
>
```

---

#### 4. `src/pages/History.tsx`

Add `aria-label` to month navigation buttons:

**Line 142** - Previous month button:
```tsx
<Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
```

**Lines 148-154** - Next month button:
```tsx
<Button 
  variant="ghost" 
  size="icon" 
  onClick={goToNextMonth}
  disabled={isSameMonth(currentMonth, new Date())}
  aria-label="Next month"
>
```

---

#### 5. `src/components/FoodItemsTable.tsx`

Add `aria-label` to delete and expand buttons:

**Lines 313-319** - Delete all button in totals row:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete all entries"
>
```

**Lines 419-427 and 466-474** - Expand/collapse chevron buttons (there are two - editable and non-editable modes):
```tsx
<button
  onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
  aria-label={isCurrentExpanded ? "Collapse entry" : "Expand entry"}
  className={cn(...)}
>
```

**Lines 564-571** - Delete item button:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => onRemoveItem?.(index)}
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete item"
>
```

**Lines 578-585** - Delete entry button:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete entry"
>
```

---

#### 6. `src/components/WeightItemsTable.tsx`

Add `aria-label` to delete and expand buttons:

**Lines 240-246** - Delete all button in totals row:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete all exercises"
>
```

**Lines 337-345 and 378-386** - Expand/collapse chevron buttons:
```tsx
<button
  onClick={() => currentEntryId && onToggleEntryExpand?.(currentEntryId)}
  aria-label={isCurrentExpanded ? "Collapse entry" : "Expand entry"}
  className={cn(...)}
>
```

**Lines 552-558** - Delete entry button:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => onDeleteEntry?.(currentEntryId!)}
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete entry"
>
```

**Lines 561-568** - Delete exercise button:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => onRemoveItem?.(index)}
  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  aria-label="Delete exercise"
>
```

---

#### 7. `src/components/FoodEntryCard.tsx`

Add `aria-label` to delete button:

**Lines 50-56**:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleDelete}
  className="h-8 w-8 text-muted-foreground hover:text-destructive"
  aria-label="Delete entry"
>
```

---

#### 8. `src/components/SavedMealsPopover.tsx`

Add `aria-label` to search input:

**Line 94-99**:
```tsx
<Input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search meals..."
  aria-label="Search saved meals"
  className="pl-8 h-8"
/>
```

---

#### 9. `src/components/SavedRoutinesPopover.tsx`

Add `aria-label` to search input:

**Line 94-99**:
```tsx
<Input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search routines..."
  aria-label="Search saved routines"
  className="pl-8 h-8"
/>
```

---

#### 10. `src/components/LogInput.tsx`

Add `aria-label` to the main textarea:

**Lines 294-306** - Add dynamic aria-label based on mode:
```tsx
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder={placeholderText}
  aria-label={mode === 'food' ? 'Describe what you ate' : 'Describe your workout'}
  className="min-h-[100px] resize-none"
  disabled={isBusy}
  ...
/>
```

---

#### 11. `src/components/FoodInput.tsx`

Add `aria-label` to the main textarea:

**Lines 189-201**:
```tsx
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder={placeholderText}
  aria-label="Describe what you ate"
  className="min-h-[80px] resize-none"
  disabled={isBusy}
  ...
/>
```

---

### Summary of Changes

| Component | Change Type | Count |
|-----------|-------------|-------|
| CollapsibleSection | `aria-expanded` | 1 |
| FoodLog | `aria-label` on nav buttons | 2 |
| WeightLog | `aria-label` on nav buttons | 2 |
| History | `aria-label` on nav buttons | 2 |
| FoodItemsTable | `aria-label` on buttons | 5 |
| WeightItemsTable | `aria-label` on buttons | 5 |
| FoodEntryCard | `aria-label` on delete | 1 |
| SavedMealsPopover | `aria-label` on input | 1 |
| SavedRoutinesPopover | `aria-label` on input | 1 |
| LogInput | `aria-label` on textarea | 1 |
| FoodInput | `aria-label` on textarea | 1 |

**Total: 11 files, ~22 accessibility improvements**

---

### Testing Notes

After implementation, test with:
- **VoiceOver (macOS/iOS)**: Navigate through buttons to verify labels are announced
- **Keyboard navigation**: Ensure Tab order and focus states work correctly
- **Screen reader simulation**: Chrome DevTools accessibility inspector can preview aria-label output
