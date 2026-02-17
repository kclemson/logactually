import { useDailyFoodTotals } from '@/hooks/useDailyFoodTotals';
import { getEffectiveDailyTarget, computeCalorieRollup } from '@/lib/calorie-target';
import type { UserSettings } from '@/hooks/useUserSettings';

interface CalorieTargetRollupProps {
  settings: UserSettings;
  burnByDate: Map<string, number>;
  usesBurns: boolean;
}

export function CalorieTargetRollup({ settings, burnByDate, usesBurns }: CalorieTargetRollupProps) {
  const { data: foodTotals = [] } = useDailyFoodTotals(30);

  const baseTarget = getEffectiveDailyTarget(settings);
  if (baseTarget == null) return null;

  const r7 = computeCalorieRollup(foodTotals, 7, baseTarget, usesBurns, burnByDate);
  const r30 = computeCalorieRollup(foodTotals, 30, baseTarget, usesBurns, burnByDate);

  if (!r7 && !r30) return null;

  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
      {r7 && (
        <span>
          7 days: {r7.avgIntake.toLocaleString()} avg
          <span className={`ml-1 ${r7.dotColor}`}>●</span>
        </span>
      )}
      {r30 && (
        <span>
          30 days: {r30.avgIntake.toLocaleString()} avg
          <span className={`ml-1 ${r30.dotColor}`}>●</span>
        </span>
      )}
    </div>
  );
}
