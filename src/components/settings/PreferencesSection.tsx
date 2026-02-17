import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeightUnit } from '@/lib/weight-units';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { CalorieBurnDialog } from '@/components/CalorieBurnDialog';
import { CalorieTargetDialog } from '@/components/CalorieTargetDialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { UserSettings } from '@/hooks/useUserSettings';


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

  return (
    <>
      <CollapsibleSection title="Preferences" icon={Settings2} storageKey="settings-preferences" iconClassName="text-zinc-500 dark:text-zinc-400">
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Theme</p>
            <Select value={theme} onValueChange={(v) => handleThemeChange(v as 'light' | 'dark' | 'system')}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily Calorie Target */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
              <p className="text-[10px] text-muted-foreground/70">
                Show <span className="text-green-500 dark:text-green-400">●</span>{' '}
                <span className="text-amber-500 dark:text-amber-400">●</span>{' '}
                <span className="text-rose-500 dark:text-rose-400">●</span>{' '}
                color indicators on calendar view
              </p>
            </div>
            <button
              onClick={() => setCalorieTargetDialogOpen(true)}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              {settings.calorieTargetEnabled ? 'Edit' : 'Set up'}
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

          {/* Calorie Burn Estimates */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Show estimated calorie burn</p>
              <button
                onClick={() => setCalorieBurnDialogOpen(true)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                {settings.calorieBurnEnabled ? 'Edit' : 'Set up'}
              </button>
            </div>
          )}

          {/* Weight Units */}
          {showWeights && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Weight Units</p>
              <Select value={settings.weightUnit} onValueChange={(v) => handleWeightUnitChange(v as WeightUnit)}>
                <SelectTrigger className="w-[100px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weightUnitOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* First day of week */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">First day of week</p>
            <Select value={String(settings.weekStartDay)} onValueChange={(v) => updateSettings({ weekStartDay: Number(v) as UserSettings['weekStartDay'] })}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
