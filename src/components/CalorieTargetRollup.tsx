import { useState } from 'react';
import { useDailyFoodTotals } from '@/hooks/useDailyFoodTotals';
import { getEffectiveDailyTarget, computeCalorieRollup, describeCalorieTarget, getCalorieTargetComponents } from '@/lib/calorie-target';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useHasHover } from '@/hooks/use-has-hover';
import type { UserSettings } from '@/hooks/useUserSettings';

interface CalorieTargetRollupProps {
  settings: UserSettings;
  burnByDate: Map<string, number>;
  usesBurns: boolean;
}

export function CalorieTargetRollup({ settings, burnByDate, usesBurns }: CalorieTargetRollupProps) {
  const { data: foodTotals = [] } = useDailyFoodTotals(30);
  const hasHover = useHasHover();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const baseTarget = getEffectiveDailyTarget(settings);
  if (baseTarget == null) return null;

  const r7 = computeCalorieRollup(foodTotals, 7, baseTarget, usesBurns, burnByDate);
  const r30 = computeCalorieRollup(foodTotals, 30, baseTarget, usesBurns, burnByDate);

  if (!r7 && !r30) return null;

  const components = getCalorieTargetComponents(settings);
  const targetDescription = !components ? describeCalorieTarget(settings) : null;

  const isExerciseAdjusted = components?.mode === 'exercise_adjusted';

  const isMultiplier = components?.mode === 'body_stats_multiplier';

  const renderEquationBlock = (periodLabel: string, avgBurn: number) => {
    if (isMultiplier) {
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
          <div className="text-right">{components!.tdee.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(total daily energy expenditure)</div>
          {components!.deficit > 0 && (
            <>
              <div className="text-right">- {components!.deficit.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(deficit configured in settings)</div>
              <div className="text-right border-t border-muted-foreground/30 pt-0.5">= {baseTarget!.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60 border-t border-muted-foreground/30 pt-0.5">daily calorie target</div>
            </>
          )}
        </div>
      );
    }

    const total = isExerciseAdjusted
      ? (components!.baseTarget ?? 0) + avgBurn
      : components!.tdee + avgBurn - components!.deficit;

    return (
      <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
        {isExerciseAdjusted ? (
          <>
            <div className="text-right">{components!.baseTarget!.toLocaleString()}</div>
            <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
            <div className="text-right">+ {avgBurn.toLocaleString()}</div>
            <div className="text-[9px] italic opacity-60">(avg calories burned {periodLabel})</div>
          </>
        ) : (
          <>
            <div className="text-right">{components!.tdee.toLocaleString()}</div>
            <div className="text-[9px] italic opacity-60">(total daily energy expenditure)</div>
            <div className="text-right">+ {avgBurn.toLocaleString()}</div>
            <div className="text-[9px] italic opacity-60">(avg calories burned {periodLabel})</div>
            {components!.deficit > 0 && (
              <>
                <div className="text-right">- {components!.deficit.toLocaleString()}</div>
                <div className="text-[9px] italic opacity-60">(deficit configured in settings)</div>
              </>
            )}
          </>
        )}
        <div className="text-right border-t border-muted-foreground/30 pt-0.5">= {Math.round(total).toLocaleString()}</div>
        <div className="text-[9px] italic opacity-60 border-t border-muted-foreground/30 pt-0.5">avg target {periodLabel}</div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
        <Tooltip
          open={hasHover ? undefined : tooltipOpen}
        >
        <TooltipTrigger asChild>
          <div
            className="flex items-center justify-center gap-6 text-xs text-muted-foreground cursor-default"
            tabIndex={0}
            role="button"
            onClick={hasHover ? undefined : () => setTooltipOpen(o => !o)}
          >
            {r7 && (
              <span>
                7 days: <span className="text-blue-500 dark:text-blue-400">{r7.avgIntake.toLocaleString()}</span> avg
                <span className={`ml-1 ${r7.dotColor}`}>●</span>
              </span>
            )}
            {r30 && (
              <span>
                30 days: <span className="text-blue-500 dark:text-blue-400">{r30.avgIntake.toLocaleString()}</span> avg
                <span className={`ml-1 ${r30.dotColor}`}>●</span>
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={5}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <div><span className="text-green-400">●</span> at or under target</div>
              <div><span className="text-amber-400">●</span> up to 5% over</div>
              <div><span className="text-rose-400">●</span> more than 5% over</div>
            </div>
            {components ? (
              <div className="space-y-2">
                {isMultiplier
                  ? renderEquationBlock('', 0)
                  : <>
                      {r7 && renderEquationBlock('last 7 days', r7.avgBurn)}
                      {r30 && renderEquationBlock('last 30 days', r30.avgBurn)}
                    </>
                }
              </div>
            ) : (
              <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
                <div className="text-right">{baseTarget.toLocaleString()}</div>
                <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}