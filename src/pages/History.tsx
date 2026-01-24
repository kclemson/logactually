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
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-title min-w-[160px] text-center">
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

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-1 text-center font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
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
                "flex flex-col items-center justify-center p-2 min-h-[68px] rounded-xl transition-colors",
                isCurrentMonth 
                  ? "bg-muted/40 hover:bg-muted/60 cursor-pointer" 
                  : "bg-transparent text-muted-foreground/30 cursor-default",
                hasEntries && isCurrentMonth && "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/20 dark:hover:bg-rose-800/30",
                isTodayDate && "ring-2 ring-primary ring-inset",
              )}
            >
              {/* Calorie count - above day number */}
              {hasEntries && isCurrentMonth && (
                <span className="text-rose-500 dark:text-rose-400 font-medium">
                  {Math.round(summary.totalCalories)}
                </span>
              )}
              
              {/* Day number - centered */}
              <span
                className={cn(
                  "font-medium",
                  isTodayDate && "text-primary font-semibold",
                  !isCurrentMonth && "text-muted-foreground/30",
                )}
              >
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};

export default History;
