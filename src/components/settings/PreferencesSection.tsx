import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeightUnit } from '@/lib/weight-units';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { CalorieBurnDialog } from '@/components/CalorieBurnDialog';
import type { UserSettings } from '@/hooks/useUserSettings';
import { computeAbsoluteBMR } from '@/lib/calorie-burn';
import {
  getEffectiveDailyTarget,
  computeTDEE,
  suggestActivityLevel,
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  type ActivityLevel,
} from '@/lib/calorie-target';
import { useDailyCalorieBurn } from '@/hooks/useDailyCalorieBurn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PreferencesSectionProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  isLoading: boolean;
}

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const weightUnitOptions: { value: WeightUnit; label: string }[] = [
  { value: 'lbs', label: 'Lbs' },
  { value: 'kg', label: 'Kg' },
];

const targetModeOptions = [
  { value: 'static' as const, label: 'Static' },
  { value: 'deficit' as const, label: 'Deficit' },
];

const activityLevelKeys: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];

export function PreferencesSection({ settings, updateSettings }: PreferencesSectionProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(true);
  const [calorieBurnDialogOpen, setCalorieBurnDialogOpen] = useState(false);

  // Fetch 30-day average burn for activity hint
  const { data: dailyBurnData } = useDailyCalorieBurn(30);

  const activityHint = useMemo(() => {
    if (dailyBurnData.length === 0) return null;
    const totalMidpoints = dailyBurnData.reduce((sum, d) => sum + (d.low + d.high) / 2, 0);
    // Average across all 30 days (not just days with data) for true daily average
    const avgDailyBurn = Math.round(totalMidpoints / 30);
    const suggested = suggestActivityLevel(avgDailyBurn);
    return { avgDailyBurn, suggested, label: ACTIVITY_LABELS[suggested].label };
  }, [dailyBurnData]);

  // Computed TDEE summary for deficit mode
  const tdeeSummary = useMemo(() => {
    if (settings.calorieTargetMode !== 'deficit') return null;
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

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    updateSettings({ theme: value });
  };

  const handleWeightUnitChange = (value: WeightUnit) => {
    updateSettings({ weightUnit: value });
  };

  const showWeights = settings.showWeights;
  const hasBiometrics = settings.bodyWeightLbs != null && settings.bodyWeightLbs > 0;

  return (
    <>
      <CollapsibleSection title="Preferences" icon={Settings2} storageKey="settings-preferences" iconClassName="text-zinc-500 dark:text-zinc-400">
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Theme</p>
            <div className="flex gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                    mounted && theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Calorie Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
                <p className="text-[10px] text-muted-foreground/70">Show <span className="text-green-500 dark:text-green-400">●</span> <span className="text-amber-500 dark:text-amber-400">●</span> <span className="text-rose-500 dark:text-rose-400">●</span> color indicators on calendar view</p>
              </div>
              <div className="flex gap-2">
                {targetModeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ calorieTargetMode: value })}
                    className={cn(
                      "flex items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                      settings.calorieTargetMode === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Static mode: number input */}
            {settings.calorieTargetMode === 'static' && (
              <div className="flex justify-end">
                <input
                  type="number"
                  placeholder="Not set"
                  value={settings.dailyCalorieTarget ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    updateSettings({ dailyCalorieTarget: val });
                  }}
                  className="w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  min={0}
                  max={99999}
                />
              </div>
            )}

            {/* Deficit mode */}
            {settings.calorieTargetMode === 'deficit' && (
              <div className="space-y-2 pl-2 border-l-2 border-border">
                {!hasBiometrics && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Set your body stats in{' '}
                    <button
                      onClick={() => setCalorieBurnDialogOpen(true)}
                      className="underline hover:no-underline"
                    >
                      Show estimated calorie burn
                    </button>
                    {' '}to enable this.
                  </p>
                )}

                {hasBiometrics && (
                  <>
                    {/* Activity level */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">Activity level</p>
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
                        Based on your last 30 days: avg ~{activityHint.avgDailyBurn} cal/day burned — closest to "{activityHint.label}"
                      </p>
                    )}

                    {/* Daily deficit */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground">Daily deficit (cal)</p>
                      <input
                        type="number"
                        placeholder="0"
                        value={settings.dailyDeficit ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          updateSettings({ dailyDeficit: val });
                        }}
                        className="w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        min={0}
                        max={9999}
                      />
                    </div>

                    {/* Computed summary */}
                    {tdeeSummary && (
                      <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                        BMR ~{tdeeSummary.bmr.toLocaleString()} × {tdeeSummary.multiplier} = ~{tdeeSummary.tdee.toLocaleString()} TDEE
                        {tdeeSummary.deficit > 0 && <> − {tdeeSummary.deficit} = <strong className="text-foreground">{tdeeSummary.target.toLocaleString()} cal/day</strong></>}
                        {tdeeSummary.deficit === 0 && <> = <strong className="text-foreground">{tdeeSummary.target.toLocaleString()} cal/day</strong></>}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Enable Custom logging toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Enable Custom logging</p>
              <p className="text-[10px] text-muted-foreground/70">Use the Custom tab to log weight, blood pressure, and more</p>
            </div>
            <button
              onClick={() => updateSettings({ showCustomLogs: !settings.showCustomLogs })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border flex-shrink-0",
                settings.showCustomLogs ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.showCustomLogs
                    ? "translate-x-6 bg-primary-foreground"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>

          {/* Enable Exercise logging toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Enable Exercise logging</p>
              <p className="text-[10px] text-muted-foreground/70">Use the Exercise tab to log weight training, cardio and more</p>
            </div>
            <button
              onClick={() => updateSettings({ showWeights: !settings.showWeights })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border flex-shrink-0",
                settings.showWeights ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.showWeights
                    ? "translate-x-6 bg-primary-foreground"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>

          {/* Weight Units */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Weight Units</p>
              <div className="flex gap-2">
                {weightUnitOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleWeightUnitChange(value)}
                    className={cn(
                      "flex items-center justify-center rounded-lg border px-3 py-2 transition-colors",
                      settings.weightUnit === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calorie Burn Estimates */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Show estimated calorie burn</p>
              <button
                onClick={() => setCalorieBurnDialogOpen(true)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                {settings.calorieBurnEnabled ? 'Configure' : 'Set up'}
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {calorieBurnDialogOpen && (
        <CalorieBurnDialog
          open={calorieBurnDialogOpen}
          onOpenChange={setCalorieBurnDialogOpen}
          settings={settings}
          updateSettings={updateSettings}
        />
      )}
    </>
  );
}
