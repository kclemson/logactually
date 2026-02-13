import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, isToday, parseISO, isFuture, startOfMonth } from 'date-fns';
import { useCustomLogDatesWithData } from '@/hooks/useDatesWithData';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  const dateStr = initialDate;
  const selectedDate = parseISO(initialDate);
  const isTodaySelected = isToday(selectedDate);

  const { logTypes, createType } = useCustomLogTypes();
  const { entries, createEntry, deleteEntry } = useCustomLogEntries(dateStr);
  const { data: datesWithData = [] } = useCustomLogDatesWithData(calendarMonth);
  const { isReadOnly } = useReadOnlyContext();

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

  const handleCreateType = (name: string, valueType: 'numeric' | 'text_numeric' | 'text') => {
    createType.mutate({ name, value_type: valueType }, {
      onSuccess: () => setCreateTypeOpen(false),
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
                onDelete={(id) => deleteEntry.mutate(id)}
                isReadOnly={isReadOnly}
              />
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground py-1">No entries for this date.</p>
        )}
      </div>

      {/* Entry creation controls */}
      {!isReadOnly && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          {logTypes.map((logType) => (
            <LogEntryInput
              key={logType.id}
              valueType={logType.value_type}
              label={logType.name}
              onSubmit={(params) =>
                createEntry.mutate({
                  log_type_id: logType.id,
                  logged_date: dateStr,
                  ...params,
                })
              }
              isLoading={createEntry.isPending}
            />
          ))}
          <button
            onClick={() => setCreateTypeOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add Tracking Type</span>
          </button>
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
