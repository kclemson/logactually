import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO, isFuture, startOfMonth } from 'date-fns';
import { useCustomLogDatesWithData } from '@/hooks/useDatesWithData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomLogTypes } from '@/hooks/useCustomLogTypes';
import { useCustomLogEntries } from '@/hooks/useCustomLogEntries';
import { CreateLogTypeDialog } from '@/components/CreateLogTypeDialog';
import { LogEntryInput } from '@/components/LogEntryInput';
import { CustomLogEntryRow } from '@/components/CustomLogEntryRow';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { getStoredDate, setStoredDate } from '@/lib/selected-date';

// Wrapper: extracts date from URL, forces remount via key
const OtherLog = () => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateKey = dateParam || getStoredDate() || format(new Date(), 'yyyy-MM-dd');
  return <OtherLogContent key={dateKey} initialDate={dateKey} />;
};

export default OtherLog;

const OtherLogContent = ({ initialDate }: { initialDate: string }) => {
  const [, setSearchParams] = useSearchParams();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(parseISO(initialDate)));
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);

  const { logTypes, createType, recentUsage } = useCustomLogTypes();
  const { entries, createEntry, deleteEntry } = useCustomLogEntries(dateStr);
  const { data: datesWithData = [] } = useCustomLogDatesWithData(calendarMonth);
  const { isReadOnly } = useReadOnlyContext();

  // Sort log types by most recent usage (most recent first), then by creation order
  const sortedLogTypes = useMemo(() => {
    return [...logTypes].sort((a, b) => {
      const aRecent = recentUsage[a.id];
      const bRecent = recentUsage[b.id];
      if (aRecent && bRecent) return bRecent.localeCompare(aRecent);
      if (aRecent) return -1;
      if (bRecent) return 1;
      return a.created_at.localeCompare(b.created_at);
    });
  }, [logTypes, recentUsage]);

  const selectedType = logTypes.find((t) => t.id === selectedTypeId);

  // Navigation
  const goToPreviousDay = () => {
    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    setStoredDate(prevDate);
    setSearchParams({ date: prevDate }, { replace: true });
  };

  const goToNextDay = () => {
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(nextDate);
    if (nextDate === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: nextDate }, { replace: true });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(d);
    if (d === todayStr) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date: d }, { replace: true });
    }
    setCalendarOpen(false);
  };

  const handleCreateType = (name: string, valueType: 'numeric' | 'text_numeric' | 'text', unit?: string) => {
    createType.mutate({ name, value_type: valueType, unit: unit || null }, {
      onSuccess: (newType) => {
        setCreateTypeOpen(false);
        setSelectedTypeId(newType.id);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-1 relative">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-11 w-11" aria-label="Previous day">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={(open) => {
          if (open) setCalendarMonth(startOfMonth(selectedDate));
          setCalendarOpen(open);
        }}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-heading",
                "text-foreground underline decoration-2 underline-offset-4 decoration-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, isTodaySelected ? "'Today,' MMM d" : 'EEE, MMM d')}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-teal-600 dark:text-teal-400"
                onClick={() => {
                  setStoredDate(format(new Date(), 'yyyy-MM-dd'));
                  setSearchParams({}, { replace: true });
                  setCalendarOpen(false);
                }}
              >
                Go to Today
              </Button>
            </div>
            <Calendar
              mode="single"
              month={calendarMonth}
              selected={selectedDate}
              onSelect={handleDateSelect}
              onMonthChange={setCalendarMonth}
              disabled={(date) => isFuture(date)}
              modifiers={{ hasData: datesWithData }}
              modifiersClassNames={{ hasData: "text-teal-600 dark:text-teal-400 font-semibold" }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-11 w-11" disabled={isTodaySelected} aria-label="Next day">
          <ChevronRight className="h-5 w-5" />
        </Button>

        {!isTodaySelected && (
          <button
            onClick={() => {
              setStoredDate(format(new Date(), 'yyyy-MM-dd'));
              setSearchParams({}, { replace: true });
            }}
            className="absolute right-0 text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            Go to today
          </button>
        )}
      </div>

      {/* All logged entries, flat list */}
      <div className="space-y-1">
        {entries.length > 0 ? (
          entries.map((entry) => {
            const logType = logTypes.find((t) => t.id === entry.log_type_id);
            return (
              <CustomLogEntryRow
                key={entry.id}
                entry={entry}
                typeName={logType?.name || ''}
                valueType={logType?.value_type || 'text'}
                typeUnit={logType?.unit}
                onDelete={(id) => deleteEntry.mutate(id)}
                isReadOnly={isReadOnly}
              />
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground py-1">No entries for this date.</p>
        )}
      </div>

      {/* Inline input form -- visible when a type is selected */}
      {selectedTypeId && selectedType && !isReadOnly && (
      <LogEntryInput
          valueType={selectedType.value_type}
          label={selectedType.name}
          unit={selectedType.unit}
          onSubmit={(params) =>
            createEntry.mutate({
              log_type_id: selectedType.id,
              logged_date: dateStr,
              unit: selectedType.unit || null,
              ...params,
            })
          }
          onCancel={() => setSelectedTypeId(null)}
          isLoading={createEntry.isPending}
        />
      )}

      {/* Bottom row: dropdown + add tracking type */}
      {!isReadOnly && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
          {sortedLogTypes.length > 0 && (
            <Select
              value={selectedTypeId || ''}
              onValueChange={(val) => setSelectedTypeId(val)}
            >
              <SelectTrigger className="h-8 text-sm w-auto min-w-[140px]">
                <SelectValue placeholder="Log..." />
              </SelectTrigger>
              <SelectContent>
                {sortedLogTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    Log {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            onClick={() => setCreateTypeOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Add Tracking Type
          </Button>
        </div>
      )}

      <CreateLogTypeDialog
        open={createTypeOpen}
        onOpenChange={setCreateTypeOpen}
        onSubmit={handleCreateType}
        isLoading={createType.isPending}
      />
    </div>
  );
};
