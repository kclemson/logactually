import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  unit?: string;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  section?: string;
}

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  values: Record<string, any>;
  onSave: (updates: Record<string, any>) => void;
  readOnly?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DetailDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  onSave,
  readOnly = false,
}: DetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});

  // Reset state when dialog opens/closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditing(false);
      setDraft({});
    }
    onOpenChange(next);
  };

  const enterEditMode = () => {
    setDraft({ ...values });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft({});
  };

  const handleSave = () => {
    // Compute diff: only changed fields
    const updates: Record<string, any> = {};
    for (const field of fields) {
      if (field.readOnly) continue;
      const original = values[field.key];
      const edited = draft[field.key];
      if (edited !== undefined && edited !== original) {
        updates[field.key] = edited;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setEditing(false);
    setDraft({});
    onOpenChange(false);
  };

  const updateDraft = (key: string, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  // Group fields by section
  const sections = useMemo(() => {
    const sectionMap = new Map<string, FieldConfig[]>();
    for (const field of fields) {
      const section = field.section || '';
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push(field);
    }
    return Array.from(sectionMap.entries());
  }, [fields]);

  const displayValue = (field: FieldConfig) => {
    const val = values[field.key];
    if (val === null || val === undefined || val === '') return '—';
    if (field.type === 'select' && field.options) {
      const opt = field.options.find(o => o.value === String(val));
      return opt ? opt.label : String(val);
    }
    if (field.unit) return `${val} ${field.unit}`;
    return String(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[5%] translate-y-0 max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 sm:max-w-md">
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">{title}</DialogTitle>
            {!editing && !readOnly && (
              <Button variant="ghost" size="sm" onClick={enterEditMode} className="h-7 gap-1 text-xs">
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {sections.map(([sectionName, sectionFields]) => (
            <div key={sectionName} className="mb-3">
              {sectionName && (
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 mt-1">{sectionName}</h4>
              )}
              {editing ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {sectionFields.map(field => (
                    <div key={field.key} className={cn(field.type === 'text' && 'col-span-2')}>
                      <Label className="text-xs text-muted-foreground mb-0.5 block">
                        {field.label}{field.unit ? ` (${field.unit})` : ''}
                      </Label>
                      {field.readOnly ? (
                        <span className="text-sm text-muted-foreground">{displayValue(field)}</span>
                      ) : field.type === 'select' ? (
                        <select
                          value={String(draft[field.key] ?? '')}
                          onChange={e => updateDraft(field.key, e.target.value)}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">—</option>
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={field.type}
                          value={draft[field.key] ?? ''}
                          onChange={e => {
                            const v = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                            updateDraft(field.key, v);
                          }}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {sectionFields.map(field => (
                    <div key={field.key} className={cn("flex justify-between py-0.5", field.type === 'text' && 'col-span-2')}>
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium text-right">{displayValue(field)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <DialogFooter className="px-4 py-3 border-t flex-shrink-0">
            <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Field config builders
// ============================================================================

export function buildFoodDetailFields(item: Record<string, any>): FieldConfig[] {
  return [
    { key: 'description', label: 'Name', type: 'text', section: 'Basic' },
    { key: 'portion', label: 'Portion', type: 'text', section: 'Basic' },
    { key: 'calories', label: 'Calories', type: 'number', unit: 'cal', min: 0, section: 'Nutrition' },
    { key: 'protein', label: 'Protein', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'carbs', label: 'Carbs', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'fiber', label: 'Fiber', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'sugar', label: 'Sugar', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'fat', label: 'Fat', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'saturated_fat', label: 'Sat Fat', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'sodium', label: 'Sodium', type: 'number', unit: 'mg', min: 0, section: 'Nutrition' },
    { key: 'cholesterol', label: 'Cholesterol', type: 'number', unit: 'mg', min: 0, section: 'Nutrition' },
  ];
}

import { EXERCISE_MUSCLE_GROUPS, EXERCISE_SUBTYPE_DISPLAY, isCardioExercise, KNOWN_METADATA_KEYS } from '@/lib/exercise-metadata';

function buildExerciseKeyOptions(): { value: string; label: string }[] {
  const opts = Object.keys(EXERCISE_MUSCLE_GROUPS).map(key => ({
    value: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));
  opts.push({ value: 'other', label: 'Other' });
  return opts;
}

function buildSubtypeOptions(exerciseKey: string): { value: string; label: string }[] | undefined {
  // Only certain exercise keys have subtypes
  const subtypeMap: Record<string, string[]> = {
    walk_run: ['walking', 'running', 'hiking'],
    cycling: ['indoor', 'outdoor'],
    swimming: ['pool', 'open_water'],
  };
  const subtypes = subtypeMap[exerciseKey];
  if (!subtypes) return undefined;
  return subtypes.map(s => ({
    value: s,
    label: EXERCISE_SUBTYPE_DISPLAY[s] || s.charAt(0).toUpperCase() + s.slice(1),
  }));
}

export function buildExerciseDetailFields(item: Record<string, any>): FieldConfig[] {
  const exerciseKey = item.exercise_key || '';
  const isCardio = isCardioExercise(exerciseKey);
  const subtypeOptions = buildSubtypeOptions(exerciseKey);

  const fields: FieldConfig[] = [
    { key: 'description', label: 'Name', type: 'text', section: 'Basic' },
    { key: 'exercise_key', label: 'Exercise Type', type: 'select', options: buildExerciseKeyOptions(), section: 'Basic' },
  ];

  if (subtypeOptions) {
    fields.push({ key: 'exercise_subtype', label: 'Subtype', type: 'select', options: subtypeOptions, section: 'Basic' });
  }

  if (isCardio) {
    fields.push(
      { key: 'duration_minutes', label: 'Duration', type: 'number', unit: 'min', min: 0, step: 0.5, section: 'Performance' },
      { key: 'distance_miles', label: 'Distance', type: 'number', unit: 'mi', min: 0, step: 0.01, section: 'Performance' },
    );
  } else {
    fields.push(
      { key: 'sets', label: 'Sets', type: 'number', min: 0, section: 'Performance' },
      { key: 'reps', label: 'Reps', type: 'number', min: 0, section: 'Performance' },
      { key: 'weight_lbs', label: 'Weight', type: 'number', unit: 'lbs', min: 0, section: 'Performance' },
    );
  }

  // Metadata fields based on type
  const metadataKeys = KNOWN_METADATA_KEYS.filter(
    mk => mk.appliesTo === 'both' || mk.appliesTo === (isCardio ? 'cardio' : 'strength')
  );
  for (const mk of metadataKeys) {
    fields.push({
      key: `_meta_${mk.key}`,
      label: mk.label,
      type: 'number',
      unit: mk.unit,
      min: mk.min,
      max: mk.max,
      section: 'Metadata',
    });
  }

  return fields;
}

/**
 * Flatten exercise item values for DetailDialog, including metadata keys.
 */
export function flattenExerciseValues(item: Record<string, any>): Record<string, any> {
  const flat: Record<string, any> = { ...item };
  const metadata = item.exercise_metadata || {};
  for (const mk of KNOWN_METADATA_KEYS) {
    flat[`_meta_${mk.key}`] = metadata[mk.key] ?? null;
  }
  return flat;
}

/**
 * Process exercise detail dialog save: separate regular fields from metadata fields.
 * Returns { regularUpdates, metadataUpdates } where metadataUpdates should be merged into exercise_metadata.
 */
export function processExerciseSaveUpdates(
  updates: Record<string, any>,
  currentMetadata: Record<string, number> | null
): { regularUpdates: Record<string, any>; newMetadata: Record<string, number> | null } {
  const regularUpdates: Record<string, any> = {};
  const metaChanges: Record<string, number | null> = {};
  let hasMetaChanges = false;

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('_meta_')) {
      const metaKey = key.slice(6); // strip '_meta_'
      metaChanges[metaKey] = value === '' || value === null ? null : Number(value);
      hasMetaChanges = true;
    } else {
      regularUpdates[key] = value;
    }
  }

  if (!hasMetaChanges) {
    return { regularUpdates, newMetadata: currentMetadata };
  }

  // Merge metadata changes with existing
  const merged: Record<string, number> = { ...(currentMetadata || {}) };
  for (const [key, value] of Object.entries(metaChanges)) {
    if (value === null || value === 0 || !isFinite(value)) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  return {
    regularUpdates,
    newMetadata: Object.keys(merged).length > 0 ? merged : null,
  };
}
