import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/hooks/useUserSettings';
import type { WeightUnit } from '@/lib/weight-units';
import {
  cmToInches,
  inchesToCm,
  formatInchesAsFeetInches,
} from '@/lib/calorie-burn';

interface BiometricsInputsProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  showEffectHints?: boolean;
}

/**
 * Parse user input like `5'1`, `5'1"`, `5' 1"`, `5 1`, or plain `61`
 * into total inches. Returns null if unparseable.
 */
function parseFeetInchesInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const feetInchesMatch = trimmed.match(/^(\d+)\s*['′]\s*(\d*)\s*["″]?\s*$/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inches = feetInchesMatch[2] ? parseInt(feetInchesMatch[2], 10) : 0;
    if (inches >= 0 && inches < 12) {
      return feet * 12 + inches;
    }
    return null;
  }

  const spaceSepMatch = trimmed.match(/^(\d+)\s+(\d+)$/);
  if (spaceSepMatch) {
    const feet = parseInt(spaceSepMatch[1], 10);
    const inches = parseInt(spaceSepMatch[2], 10);
    if (inches >= 0 && inches < 12) {
      return feet * 12 + inches;
    }
    return null;
  }

  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0) return num;

  return null;
}

const compositionOptions: { value: 'female' | 'male' | null; label: string }[] = [
  { value: null, label: 'Average' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export function BiometricsInputs({ settings, updateSettings, showEffectHints = true }: BiometricsInputsProps) {
  const [bodyWeightUnit, setBodyWeightUnit] = useState<WeightUnit>(settings.weightUnit);

  const effectiveHeightUnit = (settings.heightUnit === 'cm' ? 'cm' : 'ft') as 'ft' | 'cm';

  const [heightDisplay, setHeightDisplay] = useState<string>(() => {
    if (settings.heightInches == null) return '';
    if (effectiveHeightUnit === 'cm') {
      return String(Math.round(inchesToCm(settings.heightInches)));
    }
    return formatInchesAsFeetInches(settings.heightInches);
  });

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
    updateSettings({ weightUnit: unit });
  };

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

  const inputClass = "w-16 h-8 text-center text-sm rounded-md border border-input bg-background px-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const rightColClass = "flex items-center gap-1 justify-start w-[8.5rem]";

  return (
    <div className="space-y-3">
      {/* Body weight */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Body weight</p>
          {showEffectHints && <p className="text-[10px] text-muted-foreground/70">Largest effect (~30-50%)</p>}
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
          <p className="text-xs text-muted-foreground">Height</p>
          {showEffectHints && <p className="text-[10px] text-muted-foreground/70">Moderate effect (~10-15%)</p>}
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
          <p className="text-xs text-muted-foreground">Age</p>
          {showEffectHints && <p className="text-[10px] text-muted-foreground/70">Small effect (~5% per decade)</p>}
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
          <span className="text-xs text-muted-foreground">years</span>
        </div>
      </div>

      {/* Metabolic profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Metabolic profile</p>
          {showEffectHints && <p className="text-[10px] text-muted-foreground/70">Moderate effect (~5-10%)</p>}
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
  );
}
