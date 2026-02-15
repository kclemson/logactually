import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type UserSettings } from '@/hooks/useUserSettings';
import {
  estimateCalorieBurn,
  formatCalorieBurnValue,
  type ExerciseInput,
  type CalorieBurnSettings,
} from '@/lib/calorie-burn';
import type { WeightUnit } from '@/lib/weight-units';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EXERCISE_MUSCLE_GROUPS, getSubtypeDisplayName } from '@/lib/exercise-metadata';
import { BiometricsInputs } from '@/components/BiometricsInputs';

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
    } else {
      updateSettings({ calorieBurnEnabled: true });
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

                <BiometricsInputs settings={settings} updateSettings={updateSettings} />
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
