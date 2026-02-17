import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/hooks/useUserSettings';
import { computeAbsoluteBMR, formatInchesAsFeetInches } from '@/lib/calorie-burn';
import {
  computeTDEE,
  suggestActivityLevel,
  getTargetDotColor,
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  TARGET_MODE_OPTIONS,
  usesActualExerciseBurns,
  type ActivityLevel,
  type MultiplierActivityLevel,
  type CalorieTargetMode,
} from '@/lib/calorie-target';
import { useDailyCalorieBurn } from '@/hooks/useDailyCalorieBurn';
import { useDailyFoodTotals } from '@/hooks/useDailyFoodTotals';
import { BiometricsInputs } from '@/components/BiometricsInputs';
import { buildBiometricsClearUpdates } from '@/lib/biometrics-clear';
import { format, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CalorieTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

const activityLevelKeys: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'logged'];

export function CalorieTargetDialog({
  open,
  onOpenChange,
  settings,
  updateSettings,
}: CalorieTargetDialogProps) {
  const { data: dailyBurnData } = useDailyCalorieBurn(30, { force: true });
  const { data: dailyFoodData = [] } = useDailyFoodTotals(30);

  const activityHint = useMemo(() => {
    if (dailyBurnData.length === 0) return null;
    const totalMidpoints = dailyBurnData.reduce((sum, d) => sum + (d.low + d.high) / 2, 0);
    const activeDays = dailyBurnData.length;
    const avgDailyBurn = Math.round(totalMidpoints / activeDays);
    const suggested = suggestActivityLevel(avgDailyBurn);
    return { avgDailyBurn, suggested, label: ACTIVITY_LABELS[suggested].label, activeDays };
  }, [dailyBurnData]);

  const exampleData = useMemo(() => {
    if (!settings.dailyCalorieTarget || dailyBurnData.length === 0 || dailyFoodData.length === 0) return null;

    const burnByDate = new Map(dailyBurnData.map(d => [d.date, d]));

    // dailyFoodData is sorted descending; skip today since it's incomplete
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    for (const food of dailyFoodData) {
      if (food.date >= todayStr) continue;
      const burn = burnByDate.get(food.date);
      if (burn) {
        const burnCals = Math.round((burn.low + burn.high) / 2);
        const net = food.totalCalories - burnCals;
        const dotColorClass = getTargetDotColor(net, settings.dailyCalorieTarget);
        const dateFormatted = format(parseISO(food.date), 'MMMM do');
        return { dateFormatted, foodCals: food.totalCalories, burnCals, dotColorClass };
      }
    }
    return null;
  }, [dailyBurnData, dailyFoodData, settings.dailyCalorieTarget]);

  const equationData = useMemo(() => {
    if (settings.calorieTargetMode !== 'body_stats') return null;

    const isLogged = settings.activityLevel === 'logged';

    // Display weight in user's preferred unit
    const weightDisplay = settings.bodyWeightLbs
      ? settings.weightUnit === 'kg'
        ? `${Math.round(settings.bodyWeightLbs * 0.453592)} kg`
        : `${Math.round(settings.bodyWeightLbs)} lbs`
      : null;

    // Display height in user's preferred unit
    const heightDisplay = settings.heightInches
      ? settings.heightUnit === 'cm'
        ? `${Math.round(settings.heightInches * 2.54)} cm`
        : formatInchesAsFeetInches(settings.heightInches)
      : null;

    const age = settings.age;
    const profile = settings.bodyComposition;
    const bmr = computeAbsoluteBMR(settings);
    // For 'logged' mode, hardcode sedentary multiplier (1.2) as baseline
    const multiplier = isLogged
      ? ACTIVITY_MULTIPLIERS.sedentary
      : (settings.activityLevel ? ACTIVITY_MULTIPLIERS[settings.activityLevel as MultiplierActivityLevel] : null);
    const deficit = settings.dailyDeficit ?? 0;
    const tdee = bmr != null && multiplier != null ? Math.round(bmr * multiplier) : null;
    const target = isLogged
      ? tdee // for logged, the base target is just the sedentary TDEE (exercise added downstream)
      : (tdee != null ? Math.round(tdee - deficit) : null);

    return {
      isLogged,
      weightDisplay, heightDisplay, age, profile,
      bmr: bmr != null ? Math.round(bmr) : null,
      multiplier, deficit,
      tdee: tdee != null ? Math.round(tdee) : null,
      target: target != null && target > 0 ? target : null,
    };
  }, [settings]);

  const loggedExerciseExamples = useMemo(() => {
    if (!equationData?.isLogged || equationData.tdee == null) return [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const deficit = equationData.deficit ?? 0;
    return dailyBurnData
      .filter(d => d.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(d => {
        const burnCals = Math.round((d.low + d.high) / 2);
        const total = equationData.tdee! + burnCals - deficit;
        return {
          dateFormatted: format(parseISO(d.date), 'MMMM do'),
          burnCals,
          total,
        };
      });
  }, [equationData, dailyBurnData]);

  const handleToggle = () => {
    if (settings.calorieTargetEnabled) {
      updateSettings({
        calorieTargetEnabled: false,
        dailyCalorieTarget: null,
        calorieTargetMode: 'static',
        activityLevel: null,
        dailyDeficit: null,
        ...buildBiometricsClearUpdates(settings, 'target'),
      });
      onOpenChange(false);
    } else {
      updateSettings({ calorieTargetEnabled: true });
    }
  };

  const inputClass = "w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="left-2 right-2 top-12 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="space-y-5">
          <DialogTitle className="text-sm font-medium sr-only">Daily Calorie Target</DialogTitle>

          {/* Enable toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium">Daily calorie target</p>
              <p className="text-[10px] text-muted-foreground/70">
                Show <span className="text-green-500 dark:text-green-400">●</span>{' '}
                <span className="text-amber-500 dark:text-amber-400">●</span>{' '}
                <span className="text-rose-500 dark:text-rose-400">●</span>{' '}
                color indicators on calendar view
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border",
                settings.calorieTargetEnabled ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.calorieTargetEnabled
                    ? "translate-x-6 bg-primary-foreground"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>

          {/* Config body – animated expand/collapse */}
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              settings.calorieTargetEnabled ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 p-1">
                {/* Mode dropdown */}
                <div className="flex items-center justify-between overflow-visible">
                  <p className="text-xs text-muted-foreground">Mode</p>
                  <Select
                    value={settings.calorieTargetMode}
                    onValueChange={(val) => updateSettings({ calorieTargetMode: val as CalorieTargetMode })}
                  >
                    <SelectTrigger className="w-[280px] h-auto py-1.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_MODE_OPTIONS.map(({ value, label, description }) => (
                        <SelectItem key={value} value={value} className="py-2">
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium">{label}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Static mode: number input */}
                {settings.calorieTargetMode === 'static' && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Not set"
                        value={settings.dailyCalorieTarget ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          updateSettings({ dailyCalorieTarget: val });
                        }}
                        className={inputClass}
                        min={0}
                        max={99999}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">cal/day</span>
                    </div>
                  </div>
                )}

                {/* Body stats mode */}
                {settings.calorieTargetMode === 'body_stats' && (
                  <div className="space-y-3">
                    {/* Activity level */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Activity level</p>
                      <Select
                        value={settings.activityLevel ?? ''}
                        onValueChange={(val) => updateSettings({ activityLevel: val as ActivityLevel })}
                      >
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activityLevelKeys.map((key) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <span>{ACTIVITY_LABELS[key].label}</span>
                              {key !== 'logged' && (
                                <span className="text-muted-foreground ml-1">×{ACTIVITY_MULTIPLIERS[key as MultiplierActivityLevel]}</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Activity hint (hide for 'logged' mode) */}
                    {activityHint && settings.activityLevel !== 'logged' && (
                      <p className="text-[10px] text-muted-foreground/70 italic">
                        Your logged exercise burned an average of ~{activityHint.avgDailyBurn} calories/day over {activityHint.activeDays} active days. This is closest to "{activityHint.label}."
                      </p>
                    )}

                    {/* Calorie burn disabled warning for 'logged' mode */}
                    {settings.activityLevel === 'logged' && !settings.calorieBurnEnabled && (
                      <p className="text-[10px] text-amber-500 dark:text-amber-400 italic">
                        Exercise calorie burn estimation is currently disabled. Enable it in Estimated Calorie Burn settings for this mode to work.
                      </p>
                    )}

                    <BiometricsInputs settings={settings} updateSettings={updateSettings} showEffectHints={false} />

                    {/* Daily deficit */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Target deficit</p>
                      <div className="flex items-center gap-1 justify-start w-[11rem]">
                        <span className="text-xs text-muted-foreground">minus</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={settings.dailyDeficit ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            updateSettings({ dailyDeficit: val });
                          }}
                          className="w-16 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          min={0}
                          max={9999}
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">cal/day</span>
                      </div>
                    </div>

                    {/* Equation breakdown */}
                    {equationData && (
                      <div className="text-xs text-muted-foreground space-y-1.5">
                        <div>
                          <p className="font-medium">Base metabolic rate (BMR):</p>
                          <p>
                            {equationData.weightDisplay ?? <em className="not-italic text-muted-foreground/50">weight</em>}
                            , {equationData.heightDisplay ?? <em className="not-italic text-muted-foreground/50">height</em>}
                            , {equationData.age != null ? `${equationData.age} years` : <em className="not-italic text-muted-foreground/50">age</em>}
                            {equationData.profile != null && <>, {equationData.profile === 'male' ? 'Male' : 'Female'}</>}
                            {equationData.bmr != null && <> = {equationData.bmr.toLocaleString()}</>}
                          </p>
                        </div>
                        {equationData.isLogged ? (
                          <>
                            <div>
                              <p className="font-medium">Total daily energy expenditure (TDEE):</p>
                              <p>
                                {equationData.bmr != null ? equationData.bmr.toLocaleString() : <em className="not-italic text-muted-foreground/50">BMR</em>}
                                {' '}× {equationData.multiplier}
                                {' '}= {equationData.tdee != null ? equationData.tdee.toLocaleString() : '…'}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Daily calorie target:</p>
                              <p>
                                {equationData.tdee != null ? equationData.tdee.toLocaleString() : <em className="not-italic text-muted-foreground/50">TDEE</em>}
                                {' '}+ calories burned from exercise logs
                                {' '}- {equationData.deficit != null && equationData.deficit !== 0
                                  ? equationData.deficit
                                  : <em className="not-italic text-muted-foreground/50">deficit</em>}
                              </p>
                            </div>
                            {loggedExerciseExamples.length > 0 && (
                              <div>
                                <p className="font-medium">Examples:</p>
                                {loggedExerciseExamples.map((ex) => (
                                  <p key={ex.dateFormatted}>
                                    {ex.dateFormatted}: {equationData.tdee!.toLocaleString()} + {ex.burnCals.toLocaleString()}
                                    {' '}- {equationData.deficit != null && equationData.deficit !== 0
                                      ? equationData.deficit
                                      : <em className="not-italic text-muted-foreground/50">deficit</em>}
                                    {' '}= {ex.total.toLocaleString()} cal
                                  </p>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium">Total daily energy expenditure (TDEE):</p>
                              <p>
                                {equationData.bmr != null ? equationData.bmr.toLocaleString() : <em className="not-italic text-muted-foreground/50">BMR</em>}
                                {' '}× {equationData.multiplier != null ? equationData.multiplier : <em className="not-italic text-muted-foreground/50">activity level</em>}
                                {' '}= {equationData.tdee != null ? equationData.tdee.toLocaleString() : '…'}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Daily calorie target:</p>
                              <p>
                                {equationData.tdee != null ? equationData.tdee.toLocaleString() : <em className="not-italic text-muted-foreground/50">TDEE</em>}
                                {' '}− {equationData.deficit != null && equationData.deficit !== 0 ? equationData.deficit : <em className="not-italic text-muted-foreground/50">deficit</em>}
                                {' '}= {equationData.target != null ? `${equationData.target.toLocaleString()} cal/day` : '…'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Exercise adjusted mode */}
                {settings.calorieTargetMode === 'exercise_adjusted' && (
                  <div className="space-y-3">
                    {!settings.calorieBurnEnabled ? (
                      <p className="text-[10px] text-amber-500 dark:text-amber-400 italic">
                        Exercise calorie burn estimation is currently disabled. Enable it in Estimated Calorie Burn settings for this mode to work.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="Not set"
                              value={settings.dailyCalorieTarget ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                updateSettings({ dailyCalorieTarget: val });
                              }}
                              className={inputClass}
                              min={0}
                              max={99999}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">cal/day</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground/70">
                          Calories burned from logged exercises are subtracted from your food intake before comparing to this target — so active days give you more room.
                        </p>

                        {exampleData && settings.dailyCalorieTarget && (
                          <p className="text-[10px] text-muted-foreground/70">
                            For example, on {exampleData.dateFormatted} you logged{' '}
                            {exampleData.foodCals.toLocaleString()} calories in food and
                            burned ~{exampleData.burnCals.toLocaleString()} calories
                            exercising, which would show up{' '}
                            <span className={exampleData.dotColorClass}>●</span> with a
                            daily calorie target of{' '}
                            {settings.dailyCalorieTarget.toLocaleString()} calories.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
