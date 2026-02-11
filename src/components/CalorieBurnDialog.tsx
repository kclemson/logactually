import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type UserSettings } from '@/hooks/useUserSettings';
import {
  cmToInches,
  inchesToCm,
  estimateCalorieBurn,
  formatCalorieBurnValue,
  type ExerciseInput,
  type CalorieBurnSettings,
} from '@/lib/calorie-burn';
import type { WeightUnit } from '@/lib/weight-units';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EXERCISE_MUSCLE_GROUPS } from '@/lib/exercise-metadata';

interface CalorieBurnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

// Build cardio keys from the single source of truth
const CARDIO_KEYS = Object.entries(EXERCISE_MUSCLE_GROUPS)
  .filter(([, v]) => v.isCardio)
  .map(([k]) => k);

// Fallback samples – split by type
const SAMPLE_CARDIO: ExerciseInput[] = [
  { exercise_key: 'walk_run', exercise_subtype: 'walking', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 25 },
  { exercise_key: 'walk_run', exercise_subtype: 'running', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 30 },
];

const SAMPLE_STRENGTH: ExerciseInput[] = [
  { exercise_key: 'lat_pulldown', sets: 3, reps: 10, weight_lbs: 60 },
  { exercise_key: 'leg_press', sets: 3, reps: 10, weight_lbs: 150 },
];

function exerciseLabel(ex: ExerciseInput, weightUnit: WeightUnit): string {
  const name = 'description' in ex && (ex as any).description
    ? (ex as any).description
    : ex.exercise_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const details: string[] = [];

  if (ex.duration_minutes && ex.duration_minutes > 0) {
    details.push(`${ex.duration_minutes} min`);
  }
  if (ex.distance_miles && ex.distance_miles > 0) {
    details.push(`${ex.distance_miles.toFixed(1)} mi`);
  }
  if (ex.sets > 0) {
    let s = `${ex.sets}x${ex.reps}`;
    if (ex.weight_lbs > 0) {
      const w = weightUnit === 'kg'
        ? Math.round(ex.weight_lbs * 0.453592)
        : ex.weight_lbs;
      s += ` @ ${w} ${weightUnit}`;
    }
    details.push(s);
  }

  return details.length ? `${name} (${details.join(', ')})` : name;
}

export function CalorieBurnDialog({
  open,
  onOpenChange,
  settings,
  updateSettings,
}: CalorieBurnDialogProps) {
  const { user } = useAuth();

  // Fetch user's top exercises via RPC (2 cardio + 2 strength by frequency)
  const { data: userExercises } = useQuery({
    queryKey: ['calorie-burn-preview-exercises', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_top_exercises', {
        p_user_id: user.id,
        p_cardio_keys: CARDIO_KEYS,
      });
      if (error || !data?.length) return [];
      return data as (ExerciseInput & { description: string; is_cardio: boolean; frequency: number })[];
    },
    enabled: !!user && open,
    staleTime: 60_000,
  });

  // Assemble 2 cardio + 2 strength, filling gaps with samples
  const { previewExercises, isUsingSamples } = useMemo(() => {
    const userCardio = (userExercises || []).filter(e => e.is_cardio);
    const userStrength = (userExercises || []).filter(e => !e.is_cardio);

    const cardio: ExerciseInput[] = [...userCardio];
    let usedSamples = false;
    for (let i = cardio.length; i < 2; i++) {
      cardio.push(SAMPLE_CARDIO[i]);
      usedSamples = true;
    }

    const strength: ExerciseInput[] = [...userStrength];
    for (let i = strength.length; i < 2; i++) {
      strength.push(SAMPLE_STRENGTH[i]);
      usedSamples = true;
    }

    return { previewExercises: [...cardio, ...strength], isUsingSamples: usedSamples };
  }, [userExercises]);

  // Compute live estimates from current settings
  const burnSettings: CalorieBurnSettings = useMemo(() => ({
    calorieBurnEnabled: settings.calorieBurnEnabled,
    bodyWeightLbs: settings.bodyWeightLbs,
    heightInches: settings.heightInches,
    age: settings.age,
    bodyComposition: settings.bodyComposition,
    defaultIntensity: settings.defaultIntensity,
  }), [settings.calorieBurnEnabled, settings.bodyWeightLbs, settings.heightInches, settings.age, settings.bodyComposition, settings.defaultIntensity]);

  const previews = useMemo(() => {
    return previewExercises.map((ex) => {
      const result = estimateCalorieBurn(ex, burnSettings);
      const label = exerciseLabel(ex, settings.weightUnit);
      const value = formatCalorieBurnValue(result);
      return { label, estimate: value ? `${value} cal` : '' };
    });
  }, [previewExercises, burnSettings, settings.weightUnit]);

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

  const inputClass = "w-16 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const rightColClass = "flex items-center gap-1 justify-start w-[8.5rem]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <div className="space-y-5">
          <DialogTitle className="text-sm font-medium sr-only">Calorie Burn Settings</DialogTitle>
          {/* Toggle on its own row below header */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm font-medium">Show estimated calorie burn</p>
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

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              settings.calorieBurnEnabled ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-5 pt-1">
              {/* Live preview */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isUsingSamples ? 'Preview (examples)' : 'Preview'}
                </p>
                {previews.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs truncate mr-3">{p.label}</span>
                    <span className="text-muted-foreground whitespace-nowrap text-xs">{p.estimate || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Your info section */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your info (narrows the range)</p>

                {/* Body weight */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Body weight</p>
                    <p className="text-[10px] text-muted-foreground/70">Biggest factor (~2-3x impact)</p>
                  </div>
                  <div className={rightColClass}>
                    <input
                      type="number"
                      placeholder="—"
                      value={displayWeight()}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className={inputClass}
                      min={50}
                      max={999}
                    />
                    <span className="text-xs text-muted-foreground w-8">{settings.weightUnit}</span>
                  </div>
                </div>

                {/* Height */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Height</p>
                    <p className="text-[10px] text-muted-foreground/70">Used for metabolic rate</p>
                  </div>
                  <div className={rightColClass}>
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
                  <div className={rightColClass}>
                    <input
                      type="number"
                      placeholder="—"
                      value={settings.age ?? ''}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className={inputClass}
                      min={10}
                      max={120}
                    />
                    <span className="w-8" />
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
                  <div className={rightColClass}>
                    <input
                      type="number"
                      placeholder="—"
                      value={settings.defaultIntensity ?? ''}
                      onChange={(e) => handleIntensityChange(e.target.value)}
                      className={inputClass}
                      min={1}
                      max={10}
                    />
                    <span className="text-xs text-muted-foreground w-8">/10</span>
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
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
