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
  differenceInDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Dumbbell, Footprints, Bike, Activity, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { isCardioExercise } from '@/lib/exercise-metadata';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHasHover } from '@/hooks/use-has-hover';
import { getTargetDotColor, getEffectiveDailyTarget, getExerciseAdjustedTarget, usesActualExerciseBurns, getCalorieTargetComponents, computeWeekRollup } from '@/lib/calorie-target';
import { useDailyCalorieBurn } from '@/hooks/useDailyCalorieBurn';
import { CalorieTargetRollup } from '@/components/CalorieTargetRollup';
import { CalorieTargetTooltipContent } from '@/components/CalorieTargetTooltipContent';

import { useUserSettings } from '@/hooks/useUserSettings';
import { setStoredDate } from '@/lib/selected-date';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useState as useAnimState } from 'react';

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

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  lifting: Dumbbell,
  runwalk: Footprints,
  cycling: Bike,
  othercardio: Activity,
};

const History = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hasHover = useHasHover();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [rollupTooltipOpen, setRollupTooltipOpen] = useState(false);

  const dismissAllTooltips = () => {
    setActiveDayIndex(null);
    setRollupTooltipOpen(false);
  };
  const { settings } = useUserSettings();
  const showWeights = settings.showWeights;
  const showCustomLogs = settings.showCustomLogs;

  // Fetch entries for the visible month range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const usesBurns = usesActualExerciseBurns(settings);
  const burnDays = useMemo(() => differenceInDays(monthEnd, monthStart) + 1, [monthStart, monthEnd]);
  const { data: dailyBurnData } = useDailyCalorieBurn(
    usesBurns ? burnDays + 30 : 0
  );

  // Build a Map<dateStr, midpointBurn> for exercise burn modes
  const burnByDate = useMemo(() => {
    const map = new Map<string, number>();
    if (!usesBurns) return map;
    dailyBurnData.forEach((d) => {
      map.set(d.date, Math.round((d.low + d.high) / 2));
    });
    return map;
  }, [dailyBurnData, usesBurns]);
  
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
    const wso = settings.weekStartDay ?? 0;
    const start = startOfWeek(monthStart, { weekStartsOn: wso });
    const end = endOfWeek(monthEnd, { weekStartsOn: wso });
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

  const navigateToDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStoredDate(dateStr);
    
    if (dateStr === todayStr) {
      navigate('/');
    } else {
      navigate(`/?date=${dateStr}`);
    }
  };

  const handleDayClick = (day: Date, index: number) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const summary = summaryByDate.get(dateStr);
    const baseTarget = getEffectiveDailyTarget(settings);
    const isTodayDate = isToday(day);
    const hasDot = !!summary && baseTarget != null && baseTarget > 0;

    // Desktop: always navigate directly
    if (hasHover) {
      navigateToDay(day);
      return;
    }

    // Mobile: if this day has a calorie dot, show tooltip instead
    setRollupTooltipOpen(false);
    if (hasDot) {
      setActiveDayIndex(prev => prev === index ? null : index);
    } else {
      setActiveDayIndex(null);
      navigateToDay(day);
    }
  };

  const goToPreviousMonth = () => { setSlideDir('right'); setCurrentMonth(subMonths(currentMonth, 1)); };
  const goToNextMonthGuarded = () => {
    if (isSameMonth(currentMonth, new Date())) return;
    setSlideDir('left');
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const allWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wsd = settings.weekStartDay ?? 0;
  const weekDays = [...allWeekDays.slice(wsd), ...allWeekDays.slice(0, wsd)];

  const targetComponents = useMemo(() => getCalorieTargetComponents(settings), [settings]);

  /** Build tooltip content for a day cell */
  const buildDayTooltip = (day: Date, summary: DaySummary) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const baseTarget = getEffectiveDailyTarget(settings);
    if (!baseTarget || baseTarget <= 0) return null;

    const burn = usesBurns ? (burnByDate.get(dateStr) ?? 0) : 0;
    const target = usesBurns ? getExerciseAdjustedTarget(baseTarget, burn) : baseTarget;
    const intake = Math.round(summary.totalCalories);
    const dayLabel = format(day, 'EEE, MMM d');

    // Compute week rollup for this day
    const wso = (settings.weekStartDay ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const ws = startOfWeek(day, { weekStartsOn: wso });
    const we = endOfWeek(day, { weekStartsOn: wso });
    const weekStartStr = format(ws, 'yyyy-MM-dd');
    const weekEndStr = format(we, 'yyyy-MM-dd');

    const foodTotals = daySummaries.map(s => ({ date: s.date, totalCalories: s.totalCalories }));
    const weekRollup = computeWeekRollup(foodTotals, weekStartStr, weekEndStr, baseTarget, usesBurns, burnByDate);
    const weekLabel = weekRollup ? `Week of ${format(ws, 'MMM d')}-${format(we, 'd')}` : undefined;

    return (
      <CalorieTargetTooltipContent
        label={dayLabel}
        intake={intake}
        target={target}
        burn={burn}
        targetComponents={targetComponents}
        weekLabel={weekLabel}
        weekRollup={weekRollup}
      />
    );
  };

  const swipeHandlers = useSwipeNavigation(goToNextMonthGuarded, goToPreviousMonth);

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
          onClick={goToNextMonthGuarded}
          disabled={isSameMonth(currentMonth, new Date())}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Rolling calorie target summary */}
      {settings.calorieTargetEnabled && isSameMonth(currentMonth, new Date()) && (
        <CalorieTargetRollup
          settings={settings}
          burnByDate={burnByDate}
          usesBurns={usesBurns}
          tooltipOpen={rollupTooltipOpen}
          onTooltipToggle={() => {
            setActiveDayIndex(null);
            setRollupTooltipOpen(o => !o);
          }}
        />
      )}

      {/* Swipe zone: calendar grid (swipe left = next month, swipe right = prev month) */}
      <div {...swipeHandlers}>
        <div
          key={format(currentMonth, 'yyyy-MM')}
          className={cn(
            slideDir === 'left' && 'animate-slide-in-from-right',
            slideDir === 'right' && 'animate-slide-in-from-left',
            !slideDir && 'animate-fade-in',
          )}
        >
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
        <TooltipProvider delayDuration={150}>
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

              const baseTarget = getEffectiveDailyTarget(settings);
              const hasDot = hasEntries && baseTarget != null && baseTarget > 0;
              const showTooltip = hasDot && isCurrentMonth;

              const tooltipContent = showTooltip && summary ? buildDayTooltip(day, summary) : null;
              const isActive = activeDayIndex === index;

              const cellContent = (
                <button
                  key={index}
                  onClick={() => !isFutureDate && handleDayClick(day, index)}
                  disabled={isFutureDate}
                  className={cn(
                    "grid grid-rows-3 content-center items-center justify-items-center p-1.5 min-h-[64px] rounded-xl transition-colors relative z-auto",
                    isFutureDate && "bg-muted/20 text-muted-foreground/50 cursor-default",
                    !isCurrentMonth && !isFutureDate && "bg-muted/30 hover:bg-muted/50 text-muted-foreground/60 cursor-pointer",
                    isCurrentMonth && !isFutureDate && !hasEntries && !hasWeights && "bg-muted/40 hover:bg-muted/60 cursor-pointer",
                    hasEntries && !hasWeights && !isFutureDate && "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800/50",
                    hasWeights && !hasEntries && !isFutureDate && "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-800/50",
                    hasWeights && hasEntries && !isFutureDate && "bg-gradient-to-br from-rose-100 to-purple-100 hover:from-rose-200 hover:to-purple-200 dark:from-rose-900/40 dark:to-purple-900/40 dark:hover:from-rose-800/50 dark:hover:to-purple-800/50",
                    isTodayDate && "ring-2 ring-primary ring-inset",
                  )}
                >
                  {/* Row 1: Calorie count */}
                  <span className={cn(
                    "text-[10px]",
                    hasEntries && isCurrentMonth 
                      ? "text-blue-500 dark:text-blue-400" 
                      : "invisible"
                  )}>
                    {hasEntries && isCurrentMonth 
                      ? (
                        <>
                          {`${Math.round(summary.totalCalories).toLocaleString()}`}
                          {(() => {
                            const target = usesBurns && baseTarget
                              ? getExerciseAdjustedTarget(baseTarget, burnByDate.get(dateStr) ?? 0)
                              : baseTarget;
                            return target && target > 0 ? (
                              <span className={`text-[10px] leading-none relative top-[-0.5px] ${getTargetDotColor(summary.totalCalories, target)}`}>●</span>
                            ) : null;
                          })()}
                        </>
                      )
                      : "\u00A0"}
                  </span>
                  
                  {/* Row 2: Day number */}
                  <span
                    className={cn(
                      "font-medium",
                      isTodayDate && "text-primary font-semibold",
                      !isCurrentMonth && "text-muted-foreground/30",
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Row 3: Exercise/custom log indicators */}
                  <span className={cn(
                    "h-3 flex items-center justify-center gap-0.5",
                    !((hasWeights || hasCustomLogs) && isCurrentMonth) && "invisible"
                  )}>
                    {(() => {
                      const maxIcons = isMobile ? 3 : 4;
                      const exerciseKeys: string[] = [];
                      if (weightData?.hasLifting) exerciseKeys.push('lifting');
                      if (weightData?.hasRunWalk) exerciseKeys.push('runwalk');
                      if (weightData?.hasCycling) exerciseKeys.push('cycling');
                      if (weightData?.hasOtherCardio) exerciseKeys.push('othercardio');
                      const hasExercise = exerciseKeys.length > 0;
                      const exerciseSlots = (hasCustomLogs && hasExercise) ? maxIcons - 1 : maxIcons;
                      const visible = exerciseKeys.slice(0, exerciseSlots);
                      return (
                        <>
                          {visible.map((key) => {
                            const Icon = ICON_MAP[key];
                            return <Icon key={key} className="h-3 w-3 text-purple-500 dark:text-purple-400" />;
                          })}
                          {hasCustomLogs && <ClipboardList className="h-3 w-3 text-teal-500 dark:text-teal-400" />}
                        </>
                      );
                    })()}
                  </span>
                </button>
              );

              // Wrap in tooltip when applicable
              if (tooltipContent) {
                if (hasHover) {
                  // Desktop: hover tooltip, click still navigates
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        {cellContent}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={5}>
                        {tooltipContent}
                      </TooltipContent>
                    </Tooltip>
                  );
                } else {
                  // Mobile: controlled tooltip via activeDayIndex
                  return (
                    <Tooltip key={index} open={isActive} onOpenChange={(open) => {
                      if (!open) setActiveDayIndex(null);
                    }}>
                      <TooltipTrigger asChild>
                        {cellContent}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={5} onPointerDownOutside={() => setActiveDayIndex(null)}>
                        {tooltipContent}
                        <button
                          className="mt-1.5 text-primary-foreground/80 underline underline-offset-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDayIndex(null);
                            navigateToDay(day);
                          }}
                        >
                          Go to day →
                        </button>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
              }

              return cellContent;
            })}
          </div>
        </TooltipProvider>

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        </div>{/* end keyed animated wrapper */}
      </div>
    </div>
  );
};

export default History;
