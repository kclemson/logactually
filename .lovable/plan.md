

## Replace Native Date Input with Shadcn Calendar Picker

The native browser `<input type="date">` has uncontrollable behavior -- clicking "Today" closes the picker. Replacing it with the Shadcn Calendar + Popover component gives us full control over the interaction.

### Changes

**File: `src/components/AppleHealthImport.tsx`**

1. **Add imports**: `format` from `date-fns`, `CalendarIcon` from `lucide-react`, `Calendar` from `@/components/ui/calendar`, `Popover`/`PopoverTrigger`/`PopoverContent` from `@/components/ui/popover`, `cn` from `@/lib/utils`.

2. **Change `fromDate` state type** from `string` to `Date | undefined`. Update the default date logic to produce a `Date` object instead of an ISO string.

3. **Replace the native `<input type="date">`** (lines 332-339) with a Popover-based calendar picker:
   - A Button trigger showing the formatted date (or "Pick a date" placeholder)
   - A PopoverContent containing the Calendar component in `mode="single"`
   - The calendar stays open when selecting a date -- no auto-close on "today"

4. **Update references to `fromDate`**: Anywhere that passes `fromDate` as a string (e.g., to the `scan` function and the cutoff date comparison), convert with `format(fromDate, 'yyyy-MM-dd')` or use the Date object directly as appropriate.

5. **Update the last-import-date loader**: Convert the loaded `logged_date` string to a `Date` object when setting state, and adjust `defaultFromDate` to return a `Date`.

