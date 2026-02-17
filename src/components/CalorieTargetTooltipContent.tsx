import { getTargetDotColor, type CalorieTargetComponents } from '@/lib/calorie-target';

interface CalorieTargetTooltipContentProps {
  label: string;
  intake: number;
  target: number;
  burn: number;
  targetComponents: CalorieTargetComponents | null;
}

export function CalorieTargetTooltipContent({
  label,
  intake,
  target,
  burn,
  targetComponents,
}: CalorieTargetTooltipContentProps) {
  const dotColor = getTargetDotColor(intake, target);

  if (targetComponents) {
    const isExerciseAdjusted = targetComponents.mode === 'exercise_adjusted';
    const isMultiplier = targetComponents.mode === 'body_stats_multiplier';
    return (
      <div className="space-y-1">
        <div className="font-medium">{label}</div>
        <div className="space-y-0.5">
          <div><span className="text-green-400">●</span> within 2.5% of target</div>
          <div><span className="text-amber-400">●</span> up to 10% over</div>
          <div><span className="text-rose-400">●</span> more than 10% over</div>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
          {isExerciseAdjusted ? (
            <>
              <div className="text-right">{targetComponents.baseTarget!.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
              <div className="text-right">+ {burn.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60">(calories burned from exercise)</div>
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
              <div className="text-[9px] italic opacity-60">(calories burned from exercise)</div>
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
              <div className="text-right border-t border-primary-foreground/20 pt-0.5">= {target.toLocaleString()}</div>
              <div className="text-[9px] italic opacity-60 border-t border-primary-foreground/20 pt-0.5">{isExerciseAdjusted ? 'adjusted daily calorie target' : 'daily calorie target'}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="font-medium">{label}</div>
      <div className="space-y-0.5">
        <div><span className="text-green-400">●</span> within 2.5% of target</div>
        <div><span className="text-amber-400">●</span> up to 10% over</div>
        <div><span className="text-rose-400">●</span> more than 10% over</div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
        <div className="text-right">{target.toLocaleString()}</div>
        <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
      </div>
    </div>
  );
}
