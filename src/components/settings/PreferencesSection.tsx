import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeightUnit } from '@/lib/weight-units';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { CalorieBurnDialog } from '@/components/CalorieBurnDialog';
import { CalorieTargetDialog } from '@/components/CalorieTargetDialog';
import type { UserSettings } from '@/hooks/useUserSettings';
import { getEffectiveDailyTarget } from '@/lib/calorie-target';

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

export function PreferencesSection({ settings, updateSettings }: PreferencesSectionProps) {
  const { theme, setTheme } = useTheme();
  const [mounted] = useState(true);
  const [calorieBurnDialogOpen, setCalorieBurnDialogOpen] = useState(false);
  const [calorieTargetDialogOpen, setCalorieTargetDialogOpen] = useState(false);

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    updateSettings({ theme: value });
  };

  const handleWeightUnitChange = (value: WeightUnit) => {
    updateSettings({ weightUnit: value });
  };

  const showWeights = settings.showWeights;
  const effectiveTarget = getEffectiveDailyTarget(settings);

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
              <p className="text-[10px] text-muted-foreground/70">
                {effectiveTarget != null
                  ? `${Math.round(effectiveTarget).toLocaleString()} cal/day (${settings.calorieTargetMode})`
                  : <>Show <span className="text-green-500 dark:text-green-400">●</span>{' '}
                    <span className="text-amber-500 dark:text-amber-400">●</span>{' '}
                    <span className="text-rose-500 dark:text-rose-400">●</span>{' '}
                    color indicators on calendar view</>
                }
              </p>
            </div>
            <button
              onClick={() => setCalorieTargetDialogOpen(true)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              {settings.calorieTargetEnabled ? 'Configure' : 'Set up'}
            </button>
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

      {calorieTargetDialogOpen && (
        <CalorieTargetDialog
          open={calorieTargetDialogOpen}
          onOpenChange={setCalorieTargetDialogOpen}
          settings={settings}
          updateSettings={updateSettings}
        />
      )}
    </>
  );
}
