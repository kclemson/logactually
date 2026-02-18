import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Pencil, ChevronDown } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface UnitToggleConfig {
  units: string[];
  storageUnit: string;
  convert: (value: number, from: string, to: string) => number;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  unit?: string;
  unitToggle?: UnitToggleConfig;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  optgroups?: { label: string; options: { value: string; label: string }[] }[];
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
  /** Default display units for unit-toggle fields, e.g. { distance_miles: 'km', weight_lbs: 'lbs' } */
  defaultUnits?: Record<string, string>;
  /** Custom grid column class for field grids (default: "grid-cols-2") */
  gridClassName?: string;

  // Multi-item mode (optional)
  items?: Record<string, any>[];
  onSaveItem?: (itemIndex: number, updates: Record<string, any>) => void;
  buildFields?: (item: Record<string, any>) => FieldConfig[];
  /** Fields to hide in view mode when value is 0/null */
  hideWhenZero?: Set<string>;
}

// ============================================================================
// Helpers
// ============================================================================

function displayValue(field: FieldConfig, activeValues: Record<string, any>, activeUnit?: string): string {
  const val = activeValues[field.key];
  if (val === null || val === undefined || val === '') return '—';
  if (field.type === 'select') {
    if (field.optgroups) {
      for (const group of field.optgroups) {
        const opt = group.options.find(o => o.value === String(val));
        if (opt) return opt.label;
      }
    }
    if (field.options) {
      const opt = field.options.find(o => o.value === String(val));
      return opt ? opt.label : String(val);
    }
  }
  // Unit toggle: convert value for display
  if (field.unitToggle && activeUnit && activeUnit !== field.unitToggle.storageUnit) {
    const converted = field.unitToggle.convert(Number(val), field.unitToggle.storageUnit, activeUnit);
    return String(Number(converted.toFixed(2)));
  }
  if (field.unit) return String(val);
  return String(val);
}

function UnitToggle({ field, activeUnit, onToggle }: { field: FieldConfig; activeUnit: string; onToggle: (unit: string) => void }) {
  if (!field.unitToggle) return null;
  return (
    <span className="flex items-center gap-0.5 ml-1 shrink-0">
      {field.unitToggle.units.map(u => (
        <button
          key={u}
          type="button"
          onClick={() => onToggle(u)}
          className={cn(
            "text-xs px-1.5 py-0.5 rounded transition-colors",
            u === activeUnit
              ? "bg-primary/10 text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {u}
        </button>
      ))}
    </span>
  );
}

function groupFieldsBySections(fields: FieldConfig[]): [string, FieldConfig[]][] {
  const sectionMap = new Map<string, FieldConfig[]>();
  for (const field of fields) {
    const section = field.section || '';
    if (!sectionMap.has(section)) sectionMap.set(section, []);
    sectionMap.get(section)!.push(field);
  }
  return Array.from(sectionMap.entries());
}

// ============================================================================
// Sub-components for field rendering
// ============================================================================

function FieldViewGrid({
  sections,
  activeValues,
  hideWhenZero,
  activeUnits,
  onToggleUnit,
  gridClassName = "grid-cols-2",
}: {
  sections: [string, FieldConfig[]][];
  activeValues: Record<string, any>;
  hideWhenZero?: Set<string>;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  gridClassName?: string;
}) {
  return (
    <>
      {sections.map(([sectionName, sectionFields], sectionIdx) => (
        <div key={sectionName || sectionIdx}>
          <div className={cn("grid gap-x-6 gap-y-1", gridClassName)}>
            {sectionFields
              .filter(field => {
                if (!hideWhenZero?.has(field.key)) return true;
                const val = activeValues[field.key];
                return val !== 0 && val !== null && val !== undefined && val !== '';
              })
              .map(field => (
              <div key={field.key} className={cn("flex items-center gap-2 py-0.5", field.type === 'text' && 'col-span-2')}>
                <span className="text-xs text-muted-foreground min-w-[6rem] shrink-0">
                  {field.label}{field.unitToggle ? ` (${activeUnits?.[field.key] || field.unitToggle.storageUnit})` : field.unit ? ` (${field.unit})` : ''}:
                </span>
                <span className="text-sm">
                  {displayValue(field, activeValues, activeUnits?.[field.key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function FieldEditGrid({
  sections,
  draft,
  updateDraft,
  activeUnits,
  onToggleUnit,
  gridClassName = "grid-cols-2",
}: {
  sections: [string, FieldConfig[]][];
  draft: Record<string, any>;
  updateDraft: (key: string, value: any) => void;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  gridClassName?: string;
}) {
  return (
    <>
      {sections.map(([sectionName, sectionFields], sectionIdx) => (
        <div key={sectionName || sectionIdx}>
          <div className={cn("grid gap-x-6 gap-y-1", gridClassName)}>
            {sectionFields.map(field => (
              <div key={field.key} className={cn("flex items-center gap-2", field.type === 'text' && 'col-span-2')}>
                <span className="text-xs text-muted-foreground shrink-0 min-w-[6rem]">
                  {field.label}{field.unitToggle ? ` (${activeUnits?.[field.key] || field.unitToggle.storageUnit})` : field.unit ? ` (${field.unit})` : ''}:
                </span>
                {field.readOnly ? (
                  <span className="text-sm text-muted-foreground">{displayValue(field, draft, activeUnits?.[field.key])}</span>
                ) : field.type === 'select' ? (
                  <select
                    value={String(draft[field.key] ?? '')}
                    onChange={e => updateDraft(field.key, e.target.value)}
                    className="flex h-6 flex-1 min-w-0 rounded-md border border-input bg-background px-1.5 py-0 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">—</option>
                    {field.optgroups ? (
                      field.optgroups.map(group => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </optgroup>
                      ))
                    ) : (
                      field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))
                    )}
                  </select>
                ) : (
                  <>
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
                      className="h-6 py-0 px-1.5 text-sm flex-1 min-w-0"
                    />
                    {field.unitToggle && (
                      <UnitToggle field={field} activeUnit={activeUnits?.[field.key] || field.unitToggle.storageUnit} onToggle={(u) => onToggleUnit?.(field.key, u)} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  fields,
  values,
  onSave,
  readOnly = false,
  defaultUnits,
  gridClassName,
  items,
  onSaveItem,
  buildFields,
  hideWhenZero,
}: DetailDialogProps) {
  // Single-item mode state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});

  // Multi-item mode state
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Per-field active display unit (initialized from defaultUnits)
  const [activeUnits, setActiveUnits] = useState<Record<string, string>>(() => defaultUnits || {});

  const isMultiItem = items && items.length > 1;

  const handleToggleUnit = (fieldKey: string, newUnit: string) => {
    // In edit mode, convert the draft value when toggling units
    if (editing || editingIndex !== null) {
      const allFields = editingIndex !== null && items && buildFields
        ? buildFields(items[editingIndex])
        : fields;
      const field = allFields.find(f => f.key === fieldKey);
      if (field?.unitToggle) {
        const oldUnit = activeUnits[fieldKey] || field.unitToggle.storageUnit;
        const currentVal = draft[fieldKey];
        if (currentVal !== '' && currentVal !== null && currentVal !== undefined) {
          const converted = field.unitToggle.convert(Number(currentVal), oldUnit, newUnit);
          setDraft(prev => ({ ...prev, [fieldKey]: Number(converted.toFixed(2)) }));
        }
      }
    }
    setActiveUnits(prev => ({ ...prev, [fieldKey]: newUnit }));
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditing(false);
      setDraft({});
      setExpandedIndices(new Set());
      setEditingIndex(null);
      setActiveUnits(defaultUnits || {});
    }
    onOpenChange(next);
  };

  // ---- Single-item mode handlers ----
  const enterEditMode = () => {
    // Convert storage values to display units for editing
    const d = { ...values };
    for (const field of fields) {
      if (field.unitToggle) {
        const displayUnit = activeUnits[field.key] || field.unitToggle.storageUnit;
        if (displayUnit !== field.unitToggle.storageUnit && d[field.key] != null && d[field.key] !== '') {
          d[field.key] = Number(field.unitToggle.convert(Number(d[field.key]), field.unitToggle.storageUnit, displayUnit).toFixed(2));
        }
      }
    }
    setDraft(d);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft({});
  };

  const handleSave = () => {
    const updates: Record<string, any> = {};
    for (const field of fields) {
      if (field.readOnly) continue;
      const edited = draft[field.key];
      if (edited === undefined) continue;
      // Convert back to storage unit if needed
      let saveVal = edited;
      if (field.unitToggle) {
        const displayUnit = activeUnits[field.key] || field.unitToggle.storageUnit;
        if (displayUnit !== field.unitToggle.storageUnit && saveVal !== '' && saveVal !== null) {
          saveVal = Number(field.unitToggle.convert(Number(saveVal), displayUnit, field.unitToggle.storageUnit).toFixed(4));
        }
      }
      const original = values[field.key];
      if (saveVal !== original) {
        updates[field.key] = saveVal;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setEditing(false);
    setDraft({});
    onOpenChange(false);
  };

  // ---- Multi-item mode handlers ----
  const toggleExpanded = (idx: number) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        if (editingIndex === idx) {
          setEditingIndex(null);
          setDraft({});
        }
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const enterItemEdit = (idx: number) => {
    const itemFields = buildFields ? buildFields(items![idx]) : fields;
    const d = { ...items![idx] };
    for (const field of itemFields) {
      if (field.unitToggle) {
        const displayUnit = activeUnits[field.key] || field.unitToggle.storageUnit;
        if (displayUnit !== field.unitToggle.storageUnit && d[field.key] != null && d[field.key] !== '') {
          d[field.key] = Number(field.unitToggle.convert(Number(d[field.key]), field.unitToggle.storageUnit, displayUnit).toFixed(2));
        }
      }
    }
    setDraft(d);
    setEditingIndex(idx);
    setExpandedIndices(new Set([idx]));
  };

  const cancelItemEdit = () => {
    setEditingIndex(null);
    setDraft({});
  };

  const saveItemEdit = () => {
    if (editingIndex === null || !items || !buildFields || !onSaveItem) return;
    const itemFields = buildFields(items[editingIndex]);
    const updates: Record<string, any> = {};
    for (const field of itemFields) {
      if (field.readOnly) continue;
      const edited = draft[field.key];
      if (edited === undefined) continue;
      let saveVal = edited;
      if (field.unitToggle) {
        const displayUnit = activeUnits[field.key] || field.unitToggle.storageUnit;
        if (displayUnit !== field.unitToggle.storageUnit && saveVal !== '' && saveVal !== null) {
          saveVal = Number(field.unitToggle.convert(Number(saveVal), displayUnit, field.unitToggle.storageUnit).toFixed(4));
        }
      }
      const original = items[editingIndex][field.key];
      if (saveVal !== original) {
        updates[field.key] = saveVal;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSaveItem(editingIndex, updates);
    }
    setEditingIndex(null);
    setDraft({});
  };

  const updateDraft = (key: string, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  // Group fields by section (for single-item mode)
  const sections = useMemo(() => groupFieldsBySections(fields), [fields]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[5%] translate-y-0 max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 mx-4 rounded-lg sm:max-w-md [&>button:last-child]:hidden">
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
          <DialogTitle className={cn("text-base", !isMultiItem && "sr-only")}>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {isMultiItem ? (
            /* Multi-item collapsible sections */
            <div className="space-y-0">
              {items.map((item, idx) => {
                const isExpanded = expandedIndices.has(idx);
                const isEditing = editingIndex === idx;
                const itemFields = buildFields ? buildFields(item) : fields;
                const itemSections = groupFieldsBySections(itemFields);

                return (
                  <div key={idx} className={cn("border-b last:border-b-0 border-border/50")}>
                    {/* Collapsible header */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(idx)}
                      className="w-full flex items-center justify-between py-2 text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
                    >
                      <span className="text-sm truncate min-w-0 flex-1">{item.description || `Item ${idx + 1}`}</span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-2 transition-transform duration-200',
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        )}
                      />
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="pb-2 pl-4">
                        {isEditing ? (
                          <>
                            <FieldEditGrid sections={itemSections} draft={draft} updateDraft={updateDraft} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} gridClassName={gridClassName} />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={cancelItemEdit}>Cancel</Button>
                              <Button size="sm" onClick={saveItemEdit}>Save</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <FieldViewGrid sections={itemSections.map(([name, fields]) => [name, fields.filter(f => f.key !== 'description')] as [string, FieldConfig[]]).filter(([, fields]) => fields.length > 0)} activeValues={item} hideWhenZero={hideWhenZero} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} gridClassName={gridClassName} />
                            {!readOnly && (
                              <div className="flex justify-end mt-1">
                                <Button variant="outline" size="sm" onClick={() => enterItemEdit(idx)} className="gap-1">
                                  <Pencil className="h-3 w-3" /> Edit
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single-item detail view */
            <>
              {editing ? (
                <FieldEditGrid sections={sections} draft={draft} updateDraft={updateDraft} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} gridClassName={gridClassName} />
              ) : (
                <FieldViewGrid sections={sections} activeValues={values} hideWhenZero={hideWhenZero} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} gridClassName={gridClassName} />
              )}
            </>
          )}
        </div>

        {/* Footer: only for single-item mode */}
        {!readOnly && !isMultiItem && (
          <DialogFooter className="px-4 py-3 flex-shrink-0">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                <Button size="sm" onClick={handleSave}>Save</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={enterEditMode} className="gap-1">
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Field config builders
// ============================================================================

export const FOOD_HIDE_WHEN_ZERO = new Set(['portion', 'fiber', 'sugar', 'saturated_fat', 'sodium', 'cholesterol']);

export const EXERCISE_HIDE_WHEN_EMPTY = new Set(
  KNOWN_METADATA_KEYS.map(mk => `_meta_${mk.key}`)
);

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
    { key: 'saturated_fat', label: 'Saturated Fat', type: 'number', unit: 'g', min: 0, section: 'Nutrition' },
    { key: 'sodium', label: 'Sodium', type: 'number', unit: 'mg', min: 0, section: 'Nutrition' },
    { key: 'cholesterol', label: 'Cholesterol', type: 'number', unit: 'mg', min: 0, section: 'Nutrition' },
  ];
}

import { EXERCISE_MUSCLE_GROUPS, EXERCISE_SUBTYPE_DISPLAY, isCardioExercise, KNOWN_METADATA_KEYS, EXERCISE_GROUPS, getExerciseDisplayName } from '@/lib/exercise-metadata';
import { convertWeight, convertDistance } from '@/lib/weight-units';

function buildExerciseKeyOptgroups(): { label: string; options: { value: string; label: string }[] }[] {
  const groups = EXERCISE_GROUPS.map(group => ({
    label: group.label,
    options: group.keys.map(key => ({
      value: key,
      label: getExerciseDisplayName(key),
    })),
  }));
  groups[groups.length - 1].options.push({ value: 'other', label: 'Other' });
  return groups;
}

function buildSubtypeOptions(exerciseKey: string): { value: string; label: string }[] | undefined {
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
    { key: 'description', label: 'Name', type: 'text' },
    { key: 'exercise_key', label: 'Exercise type', type: 'select', optgroups: buildExerciseKeyOptgroups() },
  ];

  if (subtypeOptions) {
    fields.push({ key: 'exercise_subtype', label: 'Subtype', type: 'select', options: subtypeOptions });
  }

  if (isCardio) {
    // Wider fields on left (odd positions), narrower on right
    fields.push(
      { key: 'distance_miles', label: 'Distance', type: 'number', unitToggle: { units: ['mi', 'km'], storageUnit: 'mi', convert: convertDistance }, min: 0, step: 0.01 },
      { key: 'duration_minutes', label: 'Duration', type: 'number', unit: 'min', min: 0, step: 0.5 },
    );

    // Explicitly ordered metadata pairs: wider-label left, narrower right
    const cardioMetaOrder = ['calories_burned', 'effort', 'speed_mph', 'heart_rate', 'incline_pct', 'cadence_rpm'];
    for (const metaKey of cardioMetaOrder) {
      const mk = KNOWN_METADATA_KEYS.find(m => m.key === metaKey);
      if (!mk) continue;
      if (mk.appliesTo !== 'both' && mk.appliesTo !== 'cardio') continue;
      fields.push({
        key: `_meta_${mk.key}`,
        label: mk.label,
        type: 'number',
        unit: mk.unit,
        min: mk.min,
        max: mk.max,
      });
    }
  } else {
    fields.push(
      { key: 'sets', label: 'Sets', type: 'number', min: 0 },
      { key: 'reps', label: 'Reps', type: 'number', min: 0 },
      { key: 'weight_lbs', label: 'Weight', type: 'number', unitToggle: { units: ['lbs', 'kg'], storageUnit: 'lbs', convert: convertWeight }, min: 0 },
    );

    // Strength metadata (effort, calories_burned, heart_rate)
    const strengthMetaKeys = KNOWN_METADATA_KEYS.filter(
      mk => mk.appliesTo === 'both' || mk.appliesTo === 'strength'
    );
    for (const mk of strengthMetaKeys) {
      fields.push({
        key: `_meta_${mk.key}`,
        label: mk.label,
        type: 'number',
        unit: mk.unit,
        min: mk.min,
        max: mk.max,
      });
    }
  }

  return fields;
}

export function flattenExerciseValues(item: Record<string, any>): Record<string, any> {
  const flat: Record<string, any> = { ...item };
  const metadata = item.exercise_metadata || {};
  for (const mk of KNOWN_METADATA_KEYS) {
    flat[`_meta_${mk.key}`] = metadata[mk.key] ?? null;
  }
  return flat;
}

export function processExerciseSaveUpdates(
  updates: Record<string, any>,
  currentMetadata: Record<string, number> | null
): { regularUpdates: Record<string, any>; newMetadata: Record<string, number> | null } {
  const regularUpdates: Record<string, any> = {};
  const metaChanges: Record<string, number | null> = {};
  let hasMetaChanges = false;

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('_meta_')) {
      const metaKey = key.slice(6);
      metaChanges[metaKey] = value === '' || value === null ? null : Number(value);
      hasMetaChanges = true;
    } else {
      regularUpdates[key] = value;
    }
  }

  if (!hasMetaChanges) {
    return { regularUpdates, newMetadata: currentMetadata };
  }

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
