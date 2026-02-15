import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/hooks/useUserSettings';
import { computeAbsoluteBMR } from '@/lib/calorie-burn';
import {
  computeTDEE,
  suggestActivityLevel,
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  TARGET_MODE_OPTIONS,
  type ActivityLevel,
  type CalorieTargetMode,
} from '@/lib/calorie-target';
import { useDailyCalorieBurn } from '@/hooks/useDailyCalorieBurn';
import { BiometricsInputs } from '@/components/BiometricsInputs';
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

const activityLevelKeys: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];

export function CalorieTargetDialog({
  open,
  onOpenChange,
  settings,
  updateSettings,
}: CalorieTargetDialogProps) {
  const { data: dailyBurnData } = useDailyCalorieBurn(30);

  const activityHint = useMemo(() => {
    if (dailyBurnData.length === 0) return null;
    const totalMidpoints = dailyBurnData.reduce((sum, d) => sum + (d.low + d.high) / 2, 0);
    const activeDays = dailyBurnData.length;
    const avgDailyBurn = Math.round(totalMidpoints / activeDays);
    const suggested = suggestActivityLevel(avgDailyBurn);
    return { avgDailyBurn, suggested, label: ACTIVITY_LABELS[suggested].label, activeDays };
  }, [dailyBurnData]);

  const tdeeSummary = useMemo(() => {
    if (settings.calorieTargetMode !== 'body_stats') return null;
    const bmr = computeAbsoluteBMR(settings);
    if (bmr == null || !settings.activityLevel) return null;
    const multiplier = ACTIVITY_MULTIPLIERS[settings.activityLevel];
    const tdee = computeTDEE(bmr, settings.activityLevel);
    const deficit = settings.dailyDeficit ?? 0;
    const target = Math.round(tdee - deficit);
    return {
      bmr: Math.round(bmr),
      multiplier,
      tdee: Math.round(tdee),
      deficit,
      target: target > 0 ? target : 0,
    };
  }, [settings]);

  const handleToggle = () => {
    if (settings.calorieTargetEnabled) {
      updateSettings({
        calorieTargetEnabled: false,
        dailyCalorieTarget: null,
        calorieTargetMode: 'static',
        activityLevel: null,
        dailyDeficit: null,
        exerciseAdjustedBase: null,
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
        className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"
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
              <div className="space-y-4 pt-1">
                {/* Mode dropdown */}
                <div className="flex items-center justify-between overflow-visible">
                  <p className="text-xs text-muted-foreground">Mode</p>
                  <Select
                    value={settings.calorieTargetMode}
                    onValueChange={(val) => updateSettings({ calorieTargetMode: val as CalorieTargetMode })}
                  >
                    <SelectTrigger className="w-[240px] h-auto py-1.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_MODE_OPTIONS.map(({ value, label, description }) => (
                        <SelectItem key={value} value={value} className="py-2">
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium">{label}</span>
                            <span className="text-[10px] text-muted-foreground">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Static mode: number input */}
                {settings.calorieTargetMode === 'static' && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Target (cal/day)</p>
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
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activityLevelKeys.map((key) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <span>{ACTIVITY_LABELS[key].label}</span>
                              <span className="text-muted-foreground ml-1">×{ACTIVITY_MULTIPLIERS[key]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Activity hint */}
                    {activityHint && (
                      <p className="text-[10px] text-muted-foreground/70 italic">
                        Average ~{activityHint.avgDailyBurn} calories/day burned over {activityHint.activeDays} active days. This is closest to "{activityHint.label}."
                      </p>
                    )}

                    <BiometricsInputs settings={settings} updateSettings={updateSettings} showEffectHints={false} />

                    {/* Daily deficit */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Daily deficit (cal)</p>
                      <input
                        type="number"
                        placeholder="0"
                        value={settings.dailyDeficit ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          updateSettings({ dailyDeficit: val });
                        }}
                        className={inputClass}
                        min={0}
                        max={9999}
                      />
                    </div>

                    {/* Computed summary */}
                    {tdeeSummary && (
                      <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                        Base metabolic rate ~{tdeeSummary.bmr.toLocaleString()} × {tdeeSummary.multiplier} = ~{tdeeSummary.tdee.toLocaleString()} daily energy expenditure
                        {tdeeSummary.deficit > 0 && <> − {tdeeSummary.deficit} = <strong className="text-foreground">{tdeeSummary.target.toLocaleString()} cal/day</strong></>}
                        {tdeeSummary.deficit === 0 && <> = <strong className="text-foreground">{tdeeSummary.target.toLocaleString()} cal/day</strong></>}
                      </p>
                    )}
                  </div>
                )}

                {/* Exercise adjusted mode */}
                {settings.calorieTargetMode === 'exercise_adjusted' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Base goal (cal/day)</p>
                      <input
                        type="number"
                        placeholder="Not set"
                        value={settings.exerciseAdjustedBase ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          updateSettings({ exerciseAdjustedBase: val });
                        }}
                        className={inputClass}
                        min={0}
                        max={99999}
                      />
                    </div>

                    <p className="text-[10px] text-muted-foreground/70">
                      Your daily target increases by calories burned from logged exercises.
                    </p>

                    <BiometricsInputs settings={settings} updateSettings={updateSettings} showEffectHints={false} />

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
