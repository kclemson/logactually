import { format, isToday, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateNavigationProps {
  selectedDate: Date;
  isTodaySelected: boolean;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  calendarMonth: Date;
  onCalendarMonthChange: (month: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onDateSelect: (date: Date | undefined) => void;
  onGoToToday: () => void;
  datesWithData: Date[];
  highlightClassName: string;
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  mountDir?: 'left' | 'right' | null;
}

export function DateNavigation({
  selectedDate,
  isTodaySelected,
  calendarOpen,
  onCalendarOpenChange,
  calendarMonth,
  onCalendarMonthChange,
  onPreviousDay,
  onNextDay,
  onDateSelect,
  onGoToToday,
  datesWithData,
  highlightClassName,
  weekStartDay = 0,
  mountDir,
}: DateNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-1 relative">
      <Button variant="ghost" size="icon" onClick={onPreviousDay} className="h-11 w-11" aria-label="Previous day">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Popover
        open={calendarOpen}
        onOpenChange={(open) => {
          if (open) onCalendarMonthChange(startOfMonth(selectedDate));
          onCalendarOpenChange(open);
        }}
      >
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-heading",
              "text-foreground underline decoration-2 underline-offset-4 decoration-foreground",
              mountDir === 'left' && 'animate-slide-in-from-right',
              mountDir === 'right' && 'animate-slide-in-from-left',
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
              className="w-full justify-center text-foreground"
              onClick={() => {
                onGoToToday();
                onCalendarOpenChange(false);
              }}
            >
              Go to Today
            </Button>
          </div>
          <Calendar
            mode="single"
            month={calendarMonth}
            selected={selectedDate}
            onSelect={onDateSelect}
            onMonthChange={onCalendarMonthChange}
            disabled={() => false}
            modifiers={{ hasData: datesWithData }}
            modifiersClassNames={{ hasData: highlightClassName }}
            weekStartsOn={weekStartDay}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNextDay}
        disabled={false}
        className="h-11 w-11"
        aria-label="Next day"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {!isTodaySelected && (
        <button
          onClick={onGoToToday}
          className="text-sm text-foreground hover:underline absolute right-0 top-1/2 -translate-y-1/2"
        >
          Go to today
        </button>
      )}
    </div>
  );
}
