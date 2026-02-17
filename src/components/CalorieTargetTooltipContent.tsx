import { getTargetDotColor, getRollupDotColor, type CalorieTargetComponents, type RollupResult } from '@/lib/calorie-target';

interface CalorieTargetTooltipContentProps {
  label: string;
  intake: number;
  target: number;
  burn: number;
  targetComponents: CalorieTargetComponents | null;
  weekLabel?: string;
  weekRollup?: RollupResult | null;
}

export function CalorieTargetTooltipContent({
  label,
  intake,
  target,
  burn,
  targetComponents,
  weekLabel,
  weekRollup,
}: CalorieTargetTooltipContentProps) {
  const dotColor = getTargetDotColor(intake, target);

  return (
    <div className="space-y-1">
      {/* Daily dot legend */}
      <div className="space-y-0.5">
        <div><span className="text-green-400">●</span> within 2.5% of target</div>
        <div><span className="text-amber-400">●</span> up to 10% over</div>
        <div><span className="text-rose-400">●</span> more than 10% over</div>
      </div>

      {/* Day header with intake and dot */}
      {label && (
        <div className="opacity-75">
          {label}: <span className="text-blue-400">{intake.toLocaleString()}</span> cal <span className={dotColor}>●</span>
        </div>
      )}

      {/* Daily target equation */}
      {targetComponents ? (
        <TargetEquation targetComponents={targetComponents} target={target} burn={burn} />
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
          <div className="text-right">{target.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
        </div>
      )}

      {/* Weekly section */}
      {weekRollup && weekLabel && (
        <>
          <div className="border-t border-muted-foreground/30 my-1" />
          <div className="opacity-75">
            {weekLabel}: <span className="text-blue-400">{weekRollup.avgIntake.toLocaleString()}</span> avg <span className={weekRollup.dotColor}>●</span>
          </div>
          {targetComponents ? (
            <TargetEquation targetComponents={targetComponents} target={target} burn={weekRollup.avgBurn} isWeekly />
          ) : (
            <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
              <div className="text-right">{target.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Shared equation block for both daily and weekly sections */
function TargetEquation({
  targetComponents,
  target,
  burn,
  isWeekly,
}: {
  targetComponents: CalorieTargetComponents;
  target: number;
  burn: number;
  isWeekly?: boolean;
}) {
  const isExerciseAdjusted = targetComponents.mode === 'exercise_adjusted';
  const isMultiplier = targetComponents.mode === 'body_stats_multiplier';
  const burnLabel = isWeekly ? '(avg calories burned from exercise)' : '(calories burned from exercise)';
  const targetLabel = isWeekly
    ? (isExerciseAdjusted ? 'avg adjusted daily calorie target' : 'avg daily calorie target')
    : (isExerciseAdjusted ? 'adjusted daily calorie target' : 'daily calorie target');

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
      {isExerciseAdjusted ? (
        <>
          <div className="text-right">{targetComponents.baseTarget!.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
          <div className="text-right">+ {burn.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">{burnLabel}</div>
        </>
      ) : isMultiplier ? (
        <>
          <div className="text-right">{targetComponents.tdee.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(total daily energy expenditure)</div>
          {targetComponents.deficit > 0 && (
            <>
              <div className="text-right">- {targetComponents.deficit.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(deficit configured in settings)</div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="text-right">{targetComponents.tdee.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(total daily energy expenditure)</div>
          <div className="text-right">+ {burn.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">{burnLabel}</div>
          {targetComponents.deficit > 0 && (
            <>
              <div className="text-right">- {targetComponents.deficit.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(deficit configured in settings)</div>
            </>
          )}
        </>
      )}
      {(isExerciseAdjusted || !isMultiplier || targetComponents.deficit > 0) && (
        <>
          <div className="text-right border-t border-muted-foreground/30 pt-0.5">= {target.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60 border-t border-muted-foreground/30 pt-0.5">{targetLabel}</div>
        </>
      )}
    </div>
  );
}
