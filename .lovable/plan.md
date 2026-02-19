
# Add Date Navigation to the "By Type" View

## The Problem

In `src/pages/OtherLog.tsx`, the three view modes each render their body content differently:

- **By Meds** (line 378): renders `<DateNavigation>` then `<AllMedicationsView>` ✓
- **By Date** (line 416): renders `<DateNavigation>` then the grouped entries list ✓
- **By Type** (line 406): renders only `<CustomLogTypeView>` — **no `<DateNavigation>`** ✗

The "By Type" view was intentionally designed to show all history across all dates (hence no date navigator), but per the user's request, it should behave consistently with the other views and include the date header/picker/navigator.

## The Fix — one file, three lines

### `src/pages/OtherLog.tsx`

Wrap the `type` branch to add `<DateNavigation>` before `<CustomLogTypeView>`, matching the exact same pattern used by the other two views:

```tsx
// Before (line 406-415):
) : effectiveViewMode === 'type' && selectedType ? (
  /* Type view body */
  <CustomLogTypeView
    logType={selectedType}
    entries={typeEntries}
    isLoading={typeEntriesLoading}
    onDelete={(id) => deleteTypeEntry.mutate(id)}
    onEdit={(entry) => setEditingEntry(entry)}
    isReadOnly={isReadOnly}
  />

// After:
) : effectiveViewMode === 'type' && selectedType ? (
  /* Type view body */
  <>
    <DateNavigation
      selectedDate={selectedDate}
      isTodaySelected={isTodaySelected}
      calendarOpen={dateNav.calendarOpen}
      onCalendarOpenChange={dateNav.setCalendarOpen}
      calendarMonth={dateNav.calendarMonth}
      onCalendarMonthChange={dateNav.setCalendarMonth}
      onPreviousDay={dateNav.goToPreviousDay}
      onNextDay={dateNav.goToNextDay}
      onDateSelect={dateNav.handleDateSelect}
      onGoToToday={dateNav.goToToday}
      datesWithData={datesWithData}
      highlightClassName="text-teal-600 dark:text-teal-400 font-semibold"
      weekStartDay={settings.weekStartDay}
    />
    <CustomLogTypeView
      logType={selectedType}
      entries={typeEntries}
      isLoading={typeEntriesLoading}
      onDelete={(id) => deleteTypeEntry.mutate(id)}
      onEdit={(entry) => setEditingEntry(entry)}
      isReadOnly={isReadOnly}
    />
  </>
```

All the necessary props (`selectedDate`, `isTodaySelected`, `dateNav.*`, `datesWithData`, `settings.weekStartDay`) are already available in scope — they're used identically by the other two view branches. No new hooks, no new imports, no database changes.

Note: The "By Type" view currently shows all history regardless of the selected date (it uses `useCustomLogEntriesForType` which fetches all entries for the type, not filtered by date). After adding the date navigator, the data shown will still be all-time history — the date picker will navigate the app's selected date but won't filter the By Type entries. This is consistent with the current behaviour of that view and can be addressed separately if needed.

## Files Changed

| File | Change |
|---|---|
| `src/pages/OtherLog.tsx` | Wrap the `type` branch body in a fragment, adding `<DateNavigation>` before `<CustomLogTypeView>` |

No new imports needed — `DateNavigation` is already imported at line 10.
