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
  const displayBurn = r7?.avgBurn ?? r30?.avgBurn ?? 0;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip
        open={hasHover ? undefined : tooltipOpen}
        onOpenChange={hasHover ? undefined : setTooltipOpen}
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
          sideOffset={5}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="space-y-1.5">
            {components ? (
              <div className="space-y-0.5">
                <div>Daily calorie target:</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
                  <div className="text-right">{components.tdee.toLocaleString()}</div>
                  <div>(total daily energy expenditure)</div>
                  <div className="text-right">+ {displayBurn.toLocaleString()}</div>
                  <div>(avg calories burned from logged exercise)</div>
                  {components.deficit > 0 && (
                    <>
                      <div className="text-right">- {components.deficit.toLocaleString()}</div>
                      <div>(deficit configured in settings)</div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              targetDescription && <div>{targetDescription}</div>
            )}
            <div className="border-t border-primary-foreground/20 pt-1.5 space-y-0.5">
              <div><span className="text-green-400">●</span> at or under target</div>
              <div><span className="text-amber-400">●</span> up to 5% over</div>
              <div><span className="text-rose-400">●</span> more than 5% over</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}