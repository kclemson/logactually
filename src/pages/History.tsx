import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DaySummary {
  date: string;
  totalCalories: number;
  entryCount: number;
}

const History = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch entries for the visible month range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { data: daySummaries = [], isLoading } = useQuery({
    queryKey: ['food-entries-summary', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('eaten_date, total_calories')
        .gte('eaten_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('eaten_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Aggregate by date
      const summaryMap = new Map<string, DaySummary>();
      (data || []).forEach((entry) => {
        const existing = summaryMap.get(entry.eaten_date);
        if (existing) {
          existing.totalCalories += entry.total_calories;
          existing.entryCount += 1;
        } else {
          summaryMap.set(entry.eaten_date, {
            date: entry.eaten_date,
            totalCalories: entry.total_calories,
            entryCount: 1,
          });
        }
      });

      return Array.from(summaryMap.values());
    },
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Map summaries by date for quick lookup
  const summaryByDate = useMemo(() => {
    const map = new Map<string, DaySummary>();
    daySummaries.forEach((s) => map.set(s.date, s));
    return map;
  }, [daySummaries]);

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    if (dateStr === todayStr) {
      navigate('/');
    } else {
      navigate(`/?date=${dateStr}`);
    }
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-heading">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goToNextMonth}
          disabled={isSameMonth(currentMonth, new Date())}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border bg-card">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-size-compact font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const summary = summaryByDate.get(dateStr);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const hasEntries = !!summary;

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 min-h-[60px] border-b border-r transition-colors",
                  "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  isCurrentMonth 
                    ? "hover:bg-muted/50 cursor-pointer" 
                    : "text-muted-foreground/40 cursor-default",
                  isTodayDate && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "text-size-compact font-medium",
                    isTodayDate && "text-primary font-semibold",
                  )}
                >
                  {format(day, 'd')}
                </span>
                {hasEntries && isCurrentMonth && (
                  <span className="text-size-caption text-muted-foreground mt-0.5">
                    {Math.round(summary.totalCalories)}
                  </span>
                )}
                {hasEntries && isCurrentMonth && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-size-compact text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Has entries</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary/10" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default History;
