import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type UserSettings } from '@/hooks/useUserSettings';
import { cmToInches, inchesToCm } from '@/lib/calorie-burn';

interface CalorieBurnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

export function CalorieBurnDialog({
  open,
  onOpenChange,
  settings,
  updateSettings,
}: CalorieBurnDialogProps) {
  // Local display value for height in the user's preferred unit
  const [heightDisplay, setHeightDisplay] = useState<string>(() => {
    if (settings.heightInches == null) return '';
    if (settings.heightUnit === 'cm') {
      return String(Math.round(inchesToCm(settings.heightInches)));
    }
    return String(settings.heightInches);
  });

  const handleToggle = () => {
    updateSettings({ calorieBurnEnabled: !settings.calorieBurnEnabled });
  };

  const handleWeightChange = (val: string) => {
    if (val === '') {
      updateSettings({ bodyWeightLbs: null });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      // If user's weight unit is kg, convert to lbs for storage
      const lbs = settings.weightUnit === 'kg' ? num * 2.20462 : num;
      updateSettings({ bodyWeightLbs: Math.round(lbs) });
    }
  };

  const displayWeight = () => {
    if (settings.bodyWeightLbs == null) return '';
    if (settings.weightUnit === 'kg') {
      return String(Math.round(settings.bodyWeightLbs * 0.453592));
    }
    return String(settings.bodyWeightLbs);
  };

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    if (val === '') {
      updateSettings({ heightInches: null });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const inches = settings.heightUnit === 'cm' ? cmToInches(num) : num;
      updateSettings({ heightInches: Math.round(inches * 10) / 10 });
    }
  };

  const handleHeightUnitChange = (unit: 'in' | 'cm') => {
    updateSettings({ heightUnit: unit });
    // Update display value
    if (settings.heightInches != null) {
      if (unit === 'cm') {
        setHeightDisplay(String(Math.round(inchesToCm(settings.heightInches))));
      } else {
        setHeightDisplay(String(settings.heightInches));
      }
    }
  };

  const handleAgeChange = (val: string) => {
    if (val === '') {
      updateSettings({ age: null });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num < 150) {
      updateSettings({ age: num });
    }
  };

  const handleIntensityChange = (val: string) => {
    if (val === '') {
      updateSettings({ defaultIntensity: null });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      updateSettings({ defaultIntensity: num });
    }
  };

  const compositionOptions: { value: 'female' | 'male' | null; label: string }[] = [
    { value: null, label: 'Average' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
  ];

  const inputClass = "w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-title">Calorie Burn Estimates</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Description + toggle */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Estimate how many calories each workout burns, shown as a range.
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm">Show calorie burn estimates</p>
              <button
                onClick={handleToggle}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative border",
                  settings.calorieBurnEnabled ? "bg-primary border-primary" : "bg-muted border-border"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                    settings.calorieBurnEnabled
                      ? "translate-x-6 bg-primary-foreground"
                      : "translate-x-0.5 bg-white"
                  )}
                />
              </button>
            </div>
          </div>

          {settings.calorieBurnEnabled && (
            <>
              {/* Your info section */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your info (narrows the range)</p>

                {/* Body weight */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Body weight</p>
                    <p className="text-[10px] text-muted-foreground/70">Biggest factor (~2-3x impact)</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="—"
                      value={displayWeight()}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className={inputClass}
                      min={50}
                      max={999}
                    />
                    <span className="text-xs text-muted-foreground w-6">{settings.weightUnit}</span>
                  </div>
                </div>

                {/* Height */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Height</p>
                    <p className="text-[10px] text-muted-foreground/70">Used for metabolic rate</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="—"
                      value={heightDisplay}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className={inputClass}
                      min={1}
                      max={300}
                    />
                    <div className="flex gap-0.5">
                      {(['in', 'cm'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleHeightUnitChange(unit)}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded transition-colors",
                            settings.heightUnit === unit
                              ? "bg-primary/10 text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Age */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Age</p>
                    <p className="text-[10px] text-muted-foreground/70">~5% per decade</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="—"
                      value={settings.age ?? ''}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className={inputClass}
                      min={10}
                      max={120}
                    />
                    <span className="text-xs text-muted-foreground w-6"></span>
                  </div>
                </div>

                {/* Body composition */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Body composition</p>
                    <p className="text-[10px] text-muted-foreground/70">~5-10% difference</p>
                  </div>
                  <div className="flex gap-1">
                    {compositionOptions.map(({ value, label }) => (
                      <button
                        key={label}
                        onClick={() => updateSettings({ bodyComposition: value })}
                        className={cn(
                          "text-xs px-2 py-1.5 rounded-md border transition-colors",
                          settings.bodyComposition === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workout defaults */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workout defaults</p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Default intensity</p>
                    <p className="text-[10px] text-muted-foreground/70">Used when you don't log effort. Blank = full range.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="—"
                      value={settings.defaultIntensity ?? ''}
                      onChange={(e) => handleIntensityChange(e.target.value)}
                      className={cn(inputClass, "w-14")}
                      min={1}
                      max={10}
                    />
                    <span className="text-xs text-muted-foreground w-6">/10</span>
                  </div>
                </div>
              </div>

              {/* What affects your estimates */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What affects your estimates</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The biggest factors are your body weight and exercise intensity.
                  Include details like "hard effort", "8/10 intensity", or "12% incline"
                  when logging workouts to get narrower ranges. If your device reports
                  calories burned (e.g. Apple Watch), mention it and we'll use that
                  number directly.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
