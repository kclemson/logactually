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
  formatInchesAsFeetInches,
  type ExerciseInput,
  type CalorieBurnSettings,
} from '@/lib/calorie-burn';
import type { WeightUnit } from '@/lib/weight-units';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EXERCISE_MUSCLE_GROUPS, getSubtypeDisplayName } from '@/lib/exercise-metadata';

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
  { exercise_key: 'cycling', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 30 },
];

const SAMPLE_STRENGTH: ExerciseInput[] = [
  { exercise_key: 'bench_press', sets: 3, reps: 10, weight_lbs: 135 },
  { exercise_key: 'squat', sets: 3, reps: 10, weight_lbs: 185 },
];

function exerciseLabel(ex: ExerciseInput, weightUnit: WeightUnit): string {
  const subtypeName = getSubtypeDisplayName(ex.exercise_subtype);
  const name = 'description' in ex && (ex as any).description
    ? (ex as any).description
    : subtypeName
      ?? ex.exercise_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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

  // Local unit for body weight input (defaults to app-wide setting)
  const [bodyWeightUnit, setBodyWeightUnit] = useState<WeightUnit>(settings.weightUnit);

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

  const handleToggle = () => {
    if (settings.calorieBurnEnabled) {
      updateSettings({
        calorieBurnEnabled: false,
        bodyWeightLbs: null,
        heightInches: null,
        age: null,
        bodyComposition: null,
        defaultIntensity: null,
      });
      setHeightDisplay('');
    } else {
      updateSettings({ calorieBurnEnabled: true });
    }
  };

  const handleWeightChange = (val: string) => {
    if (val === '') {
      updateSettings({ bodyWeightLbs: null });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const lbs = bodyWeightUnit === 'kg' ? num * 2.20462 : num;
      updateSettings({ bodyWeightLbs: Math.round(lbs) });
    }
  };

  const displayWeight = () => {
    if (settings.bodyWeightLbs == null) return '';
    if (bodyWeightUnit === 'kg') {
      return String(Math.round(settings.bodyWeightLbs * 0.453592));
    }
    return String(settings.bodyWeightLbs);
  };

  const handleBodyWeightUnitChange = (unit: WeightUnit) => {
    if (bodyWeightUnit === unit) return;
    setBodyWeightUnit(unit);
  };

  // ---------------------------------------------------------------------------
  // Feet+inches parsing & formatting helpers
  // ---------------------------------------------------------------------------

  /**
   * Parse user input like `5'1`, `5'1"`, `5' 1"`, `5 1`, or plain `61`
   * into total inches. Returns null if unparseable.
   */
  function parseFeetInchesInput(input: string): number | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Try feet'inches pattern: 5'1, 5'1", 5' 1", 5'
    const feetInchesMatch = trimmed.match(/^(\d+)\s*['′]\s*(\d*)\s*["″]?\s*$/);
    if (feetInchesMatch) {
      const feet = parseInt(feetInchesMatch[1], 10);
      const inches = feetInchesMatch[2] ? parseInt(feetInchesMatch[2], 10) : 0;
      if (inches >= 0 && inches < 12) {
        return feet * 12 + inches;
      }
      return null;
    }

    // Try "5 11" pattern (space-separated feet inches)
    const spaceSepMatch = trimmed.match(/^(\d+)\s+(\d+)$/);
    if (spaceSepMatch) {
      const feet = parseInt(spaceSepMatch[1], 10);
      const inches = parseInt(spaceSepMatch[2], 10);
      if (inches >= 0 && inches < 12) {
        return feet * 12 + inches;
      }
      return null;
    }

    // Plain number — treat as total inches
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) return num;

    return null;
  }

  // formatInchesAsFeetInches is now imported from @/lib/calorie-burn

  // Determine effective unit — treat legacy 'in' as 'ft'
  const effectiveHeightUnit = (settings.heightUnit === 'cm' ? 'cm' : 'ft') as 'ft' | 'cm';

  // Local display value for height in the user's preferred unit
  const [heightDisplay, setHeightDisplay] = useState<string>(() => {
    if (settings.heightInches == null) return '';
    if (effectiveHeightUnit === 'cm') {
      return String(Math.round(inchesToCm(settings.heightInches)));
    }
    return formatInchesAsFeetInches(settings.heightInches);
  });

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    if (val === '') {
      updateSettings({ heightInches: null });
      return;
    }
    if (effectiveHeightUnit === 'ft') {
      const inches = parseFeetInchesInput(val);
      if (inches != null) {
        updateSettings({ heightInches: Math.round(inches * 10) / 10 });
      }
    } else {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        const inches = cmToInches(num);
        updateSettings({ heightInches: Math.round(inches * 10) / 10 });
      }
    }
  };

  const handleHeightUnitChange = (unit: 'ft' | 'cm') => {
    if (effectiveHeightUnit === unit) return;

    if (effectiveHeightUnit === 'ft' && unit === 'cm') {
      const inches = parseFeetInchesInput(heightDisplay);
      if (inches != null && inches > 0) {
        setHeightDisplay(String(Math.round(inches * 2.54)));
      }
    } else if (effectiveHeightUnit === 'cm' && unit === 'ft') {
      const cm = parseFloat(heightDisplay);
      if (!isNaN(cm) && cm > 0) {
        const inches = cmToInches(cm);
        setHeightDisplay(formatInchesAsFeetInches(inches));
      }
    }
    updateSettings({ heightUnit: unit });
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
      <DialogContent className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your info</p>
                <p className="text-[11px] text-muted-foreground/70 -mt-1">These details help narrow the estimated calorie burn range.</p>

                {/* Body weight */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Body weight</p>
                    <p className="text-[10px] text-muted-foreground/70">Largest effect (~30-50%)</p>
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
                    <div className="flex gap-0.5">
                      {(['lbs', 'kg'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleBodyWeightUnitChange(unit)}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded transition-colors",
                            bodyWeightUnit === unit
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

                {/* Height */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Height</p>
                    <p className="text-[10px] text-muted-foreground/70">Moderate effect (~10-15%)</p>
                  </div>
                  <div className={rightColClass}>
                    <input
                      type={effectiveHeightUnit === 'ft' ? 'text' : 'number'}
                      placeholder={effectiveHeightUnit === 'ft' ? `5'7"` : '170'}
                      value={heightDisplay}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className={inputClass}
                      inputMode={effectiveHeightUnit === 'ft' ? undefined : 'numeric'}
                    />
                    <div className="flex gap-0.5">
                      {(['ft', 'cm'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => handleHeightUnitChange(unit)}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded transition-colors",
                            effectiveHeightUnit === unit
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
                    <p className="text-[10px] text-muted-foreground/70">Small effect (~5% per decade)</p>
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
                    <p className="text-sm">Metabolic profile</p>
                    <p className="text-[10px] text-muted-foreground/70">Moderate effect (~5-10%)</p>
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
                    <p className="text-[10px] text-muted-foreground/70">Assumed when effort isn't specified. Blank = full range.</p>
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
                  Each of the settings above helps calculate the estimated calorie burn,
                  with body weight and exercise intensity being the two biggest factors.
                  When you log your workouts, including details like "hard effort",
                  "8/10 intensity", or "12% incline" will help narrow the range. If your
                  device reports calories burned (e.g. Apple Watch), mention it and we'll
                  use that number directly.
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
