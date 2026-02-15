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
import { ChevronLeft, ChevronRight, Dumbbell, Footprints, Bike, Activity, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isCardioExercise } from '@/lib/exercise-metadata';
import { getTargetDotColor, getEffectiveDailyTarget } from '@/lib/calorie-target';

import { useUserSettings } from '@/hooks/useUserSettings';
import { setStoredDate } from '@/lib/selected-date';

interface DaySummary {
  date: string;
  totalCalories: number;
  entryCount: number;
}

interface WeightDaySummary {
  date: string;
  hasLifting: boolean;
  hasRunWalk: boolean;
  hasCycling: boolean;
  hasOtherCardio: boolean;
}

const History = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { settings } = useUserSettings();
  const showWeights = settings.showWeights;
  const showCustomLogs = settings.showCustomLogs;

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

  // Weight entries query (feature-gated)
  const { data: weightSummaries = [] } = useQuery({
    queryKey: ['weight-entries-summary', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_sets')
        .select('logged_date, exercise_key')
        .gte('logged_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('logged_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Classify exercises per date
      const map = new Map<string, WeightDaySummary>();
      (data || []).forEach((entry) => {
        if (!map.has(entry.logged_date)) {
          map.set(entry.logged_date, {
            date: entry.logged_date,
            hasLifting: false,
            hasRunWalk: false,
            hasCycling: false,
            hasOtherCardio: false,
          });
        }
        const summary = map.get(entry.logged_date)!;
        const key = entry.exercise_key;
        if (key === 'walk_run') {
          summary.hasRunWalk = true;
        } else if (key === 'cycling') {
          summary.hasCycling = true;
        } else if (isCardioExercise(key)) {
          summary.hasOtherCardio = true;
        } else {
          summary.hasLifting = true;
        }
      });

      return Array.from(map.values());
    },
    enabled: showWeights,
  });

  // Custom log entries query (gated by showCustomLogs)
  const { data: customLogDates = new Set<string>() } = useQuery({
    queryKey: ['custom-log-dates-summary', format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('logged_date')
        .gte('logged_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('logged_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      return new Set((data || []).map((e: any) => e.logged_date));
    },
    enabled: showCustomLogs,
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

  // Map weight summaries by date
  const weightByDate = useMemo(() => {
    const map = new Map<string, WeightDaySummary>();
    weightSummaries.forEach((s) => map.set(s.date, s));
    return map;
  }, [weightSummaries]);

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(dateStr);
    
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
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="Previous month">
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
          aria-label="Next month"
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
          const isFutureDate = day > new Date();
          const hasEntries = !!summary;
          const weightData = weightByDate.get(dateStr);
          const hasWeights = showWeights && !!weightData;
          const hasCustomLogs = showCustomLogs && customLogDates.has(dateStr);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={isFutureDate}
              className={cn(
                "grid grid-rows-3 content-center items-center justify-items-center p-1.5 min-h-[64px] rounded-xl transition-colors",
                isFutureDate && "bg-muted/20 text-muted-foreground/50 cursor-default",
                !isCurrentMonth && !isFutureDate && "bg-muted/30 hover:bg-muted/50 text-muted-foreground/60 cursor-pointer",
                isCurrentMonth && !isFutureDate && !hasEntries && !hasWeights && "bg-muted/40 hover:bg-muted/60 cursor-pointer",
                hasEntries && !hasWeights && !isFutureDate && "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800/50",
                hasWeights && !hasEntries && !isFutureDate && "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800/50",
                hasWeights && hasEntries && !isFutureDate && "bg-gradient-to-br from-rose-100 to-purple-100 hover:from-rose-200 hover:to-purple-200 dark:from-rose-900/40 dark:to-purple-900/40 dark:hover:from-rose-800/50 dark:hover:to-purple-800/50",
                isTodayDate && "ring-2 ring-primary ring-inset",
              )}
            >
              {/* Row 1: Calorie count (always takes space) */}
              <span className={cn(
                "text-[10px]",
                hasEntries && isCurrentMonth 
                  ? "text-blue-500 dark:text-blue-400" 
                  : "invisible"
              )}>
                {hasEntries && isCurrentMonth 
                  ? (
                    <>
                      {`${Math.round(summary.totalCalories).toLocaleString()}cal`}
                      {(() => {
                        const target = getEffectiveDailyTarget(settings);
                        return !isTodayDate && target && target > 0 ? (
                          <span className={`text-[10px] ml-0.5 leading-none relative top-[-0.5px] ${getTargetDotColor(summary.totalCalories, target)}`}>●</span>
                        ) : null;
                      })()}
                    </>
                  )
                  : "\u00A0"}
              </span>
              
              {/* Row 2: Day number (always centered in middle row) */}
              <span
                className={cn(
                  "font-medium",
                  isTodayDate && "text-primary font-semibold",
                  !isCurrentMonth && "text-muted-foreground/30",
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Row 3: Exercise/custom log indicators (always takes space) */}
              <span className={cn(
                "h-3 flex items-center justify-center gap-0.5",
                !((hasWeights || hasCustomLogs) && isCurrentMonth) && "invisible"
              )}>
                {weightData?.hasLifting && <Dumbbell className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
                {weightData?.hasRunWalk && <Footprints className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
                {weightData?.hasCycling && <Bike className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
                {weightData?.hasOtherCardio && <Activity className="h-3 w-3 text-purple-500 dark:text-purple-400" />}
                {hasCustomLogs && <ClipboardList className="h-3 w-3 text-teal-500 dark:text-teal-400" />}
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
