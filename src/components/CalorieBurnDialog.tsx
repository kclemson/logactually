import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type UserSettings } from '@/hooks/useUserSettings';
import {
  cmToInches,
  inchesToCm,
  estimateCalorieBurn,
  formatCalorieBurn,
  type ExerciseInput,
  type CalorieBurnSettings,
} from '@/lib/calorie-burn';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CalorieBurnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

// Fallback sample exercises when user has none logged
const SAMPLE_EXERCISES: ExerciseInput[] = [
  { exercise_key: 'walk_run', exercise_subtype: 'walking', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 25 },
  { exercise_key: 'walk_run', exercise_subtype: 'running', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 30 },
  { exercise_key: 'elliptical', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 20 },
  { exercise_key: 'bench_press', sets: 3, reps: 10, weight_lbs: 135 },
];

const SAMPLE_LABELS: Record<string, string> = {
  'walk_run/walking': 'Walking 25 min',
  'walk_run/running': 'Running 30 min',
  'elliptical/': 'Elliptical 20 min',
  'bench_press/': 'Bench Press 3×10 @135',
};

function exerciseLabel(ex: ExerciseInput): string {
  const key = `${ex.exercise_key}/${ex.exercise_subtype || ''}`;
  if (SAMPLE_LABELS[key]) return SAMPLE_LABELS[key];
  // Build from data
  const desc = ex.exercise_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (ex.duration_minutes && ex.duration_minutes > 0) {
    return `${desc} ${ex.duration_minutes} min`;
  }
  if (ex.sets > 0) {
    const parts = [desc, `${ex.sets}×${ex.reps}`];
    if (ex.weight_lbs > 0) parts.push(`@${ex.weight_lbs}`);
    return parts.join(' ');
  }
  return desc;
}

export function CalorieBurnDialog({
  open,
  onOpenChange,
  settings,
  updateSettings,
}: CalorieBurnDialogProps) {
  const { user } = useAuth();

  // Fetch user's recent distinct exercises for preview
  const { data: userExercises } = useQuery({
    queryKey: ['calorie-burn-preview-exercises', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('weight_sets')
        .select('exercise_key, exercise_subtype, sets, reps, weight_lbs, duration_minutes, distance_miles, exercise_metadata, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data?.length) return [];

      // Deduplicate by exercise_key
      const seen = new Set<string>();
      const result: (ExerciseInput & { description: string })[] = [];
      for (const row of data) {
        if (seen.has(row.exercise_key)) continue;
        seen.add(row.exercise_key);
        result.push({
          exercise_key: row.exercise_key,
          exercise_subtype: row.exercise_subtype,
          sets: row.sets,
          reps: row.reps,
          weight_lbs: row.weight_lbs,
          duration_minutes: row.duration_minutes,
          distance_miles: row.distance_miles,
          exercise_metadata: row.exercise_metadata as Record<string, number> | null,
          description: row.description,
        });
        if (result.length >= 5) break;
      }
      return result;
    },
    enabled: !!user && open,
    staleTime: 60_000,
  });

  const previewExercises = userExercises?.length ? userExercises : SAMPLE_EXERCISES;
  const isUsingSamples = !userExercises?.length;

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
      const label = 'description' in ex && (ex as any).description
        ? (ex as any).description
        : exerciseLabel(ex);
      return { label, estimate: formatCalorieBurn(result) };
    });
  }, [previewExercises, burnSettings]);

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

  const inputClass = "w-20 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md">
        <div className="space-y-5">
          {/* Toggle as header */}
          <div className="flex items-center justify-between">
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

          {settings.calorieBurnEnabled && (
            <>
              {/* Live preview */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                {isUsingSamples && (
                  <p className="text-[10px] text-muted-foreground/70 mb-1">Example exercises</p>
                )}
                {previews.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate mr-3">{p.label}</span>
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
