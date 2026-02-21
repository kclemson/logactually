import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Pencil, ChevronDown } from 'lucide-react';
import { applyCategoryChange } from '@/lib/exercise-metadata';

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
  maxWidth?: 'sm';
}

export interface FieldLayout {
  fullWidth: FieldConfig[];  // e.g. Name — spans both columns
  left: FieldConfig[];       // Metrics column
  right: FieldConfig[];      // Classification column
}

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[] | FieldLayout;
  values: Record<string, any>;
  onSave: (updates: Record<string, any>) => void;
  readOnly?: boolean;
  defaultUnits?: Record<string, string>;
  gridClassName?: string;
  labelClassName?: string;
  items?: Record<string, any>[];
  onSaveItem?: (itemIndex: number, updates: Record<string, any>) => void;
  buildFields?: (item: Record<string, any>) => FieldConfig[] | FieldLayout;
  hideWhenZero?: Set<string>;
}

// ============================================================================
// Layout helpers
// ============================================================================

function isFieldLayout(f: FieldConfig[] | FieldLayout): f is FieldLayout {
  return !Array.isArray(f) && 'fullWidth' in f;
}

/** Normalize a flat field array into a FieldLayout for consistent rendering.
 *  Text fields go fullWidth; remaining fields auto-flow left/right (preserving
 *  the existing interleaved order used by food detail fields). */
function normalizeToLayout(f: FieldConfig[] | FieldLayout): FieldLayout {
  if (isFieldLayout(f)) return f;
  const fullWidth: FieldConfig[] = [];
  const rest: FieldConfig[] = [];
  for (const field of f) {
    if (field.type === 'text') fullWidth.push(field);
    else rest.push(field);
  }
  const left: FieldConfig[] = [];
  const right: FieldConfig[] = [];
  rest.forEach((field, i) => {
    if (i % 2 === 0) left.push(field);
    else right.push(field);
  });
  return { fullWidth, left, right };
}

/** Get all fields from a layout as a flat array (for iteration in save/edit logic). */
function allFieldsFlat(layout: FieldLayout): FieldConfig[] {
  return [...layout.fullWidth, ...layout.left, ...layout.right];
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
    <span className="flex items-center shrink-0">
      {field.unitToggle.units.map((u, i) => (
        <button
          key={u}
          type="button"
          onClick={() => onToggle(u)}
          className={cn(
            "text-xs py-0.5 rounded transition-colors",
            i === 0 ? "pl-0 pr-1" : "px-1",
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

// ============================================================================
// Shared per-field renderers (extracted so both columns use identical markup)
// ============================================================================

function FieldViewItem({
  field,
  activeValues,
  hideWhenZero,
  activeUnits,
  onToggleUnit,
  labelClassName,
}: {
  field: FieldConfig;
  activeValues: Record<string, any>;
  hideWhenZero?: Set<string>;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  labelClassName?: string;
}) {
  if (hideWhenZero?.has(field.key)) {
    const val = activeValues[field.key];
    if (val === 0 || val === null || val === undefined || val === '') return null;
  }
  return (
    <div className={cn("flex items-center gap-1.5 py-0.5 min-w-0", field.type === 'text' && 'col-span-2')}>
      <span className={cn("text-[11px] sm:text-xs text-muted-foreground shrink-0", labelClassName)}>
        {field.label}:
      </span>
      <span className="text-sm min-w-0 truncate min-w-[2rem]">
        {displayValue(field, activeValues, activeUnits?.[field.key])}
      </span>
      {field.unitToggle && (
        <UnitToggle field={field} activeUnit={activeUnits?.[field.key] || field.unitToggle.storageUnit} onToggle={(u) => onToggleUnit?.(field.key, u)} />
      )}
      {field.unit && !field.unitToggle && (
        <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
      )}
    </div>
  );
}

function FieldEditItem({
  field,
  draft,
  updateDraft,
  activeUnits,
  onToggleUnit,
  labelClassName,
}: {
  field: FieldConfig;
  draft: Record<string, any>;
  updateDraft: (key: string, value: any) => void;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  labelClassName?: string;
}) {
  // Dynamically filter exercise_key optgroups based on draft category
  const effectiveField = field.key === 'exercise_key' && field.optgroups && draft._exercise_category
    ? {
        ...field,
        optgroups: field.optgroups.filter(g => {
          if (g.label === 'Other') return true;
          return draft._exercise_category === 'cardio'
            ? g.label === 'Cardio'
            : g.label !== 'Cardio';
        }),
      }
    : field;

  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", field.type === 'text' && 'col-span-2')}>
      <span className={cn("text-[11px] sm:text-xs text-muted-foreground shrink-0", labelClassName)}>
        {field.label}:
      </span>
      {field.readOnly ? (
        <span className="text-sm text-muted-foreground">{displayValue(field, draft, activeUnits?.[field.key])}</span>
      ) : field.type === 'select' ? (
        <select
          value={String(draft[effectiveField.key] ?? '')}
          onChange={e => {
            if (effectiveField.key === '_exercise_category') {
              const patch = applyCategoryChange(e.target.value as any);
              updateDraft('_exercise_category', e.target.value);
              updateDraft('exercise_key', patch.exercise_key);
              return;
            }
            updateDraft(effectiveField.key, e.target.value);
          }}
          className="flex h-6 w-[7.5rem] min-w-0 rounded-md border border-input bg-background px-1.5 py-0 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">—</option>
          {effectiveField.optgroups ? (
            effectiveField.optgroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))
          ) : (
            effectiveField.options?.map(opt => (
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
            autoComplete="off"
            className={cn("h-6 py-0 px-1.5 text-sm", field.type === 'number' ? "w-12" : cn("flex-1 min-w-0", field.maxWidth === 'sm' && "max-w-[12rem]"))}
          />
          {field.unitToggle && (
            <UnitToggle field={field} activeUnit={activeUnits?.[field.key] || field.unitToggle.storageUnit} onToggle={(u) => onToggleUnit?.(field.key, u)} />
          )}
          {field.unit && !field.unitToggle && (
            <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Layout-based grid components
// ============================================================================

function FieldViewGrid({
  layout,
  activeValues,
  hideWhenZero,
  activeUnits,
  onToggleUnit,
  labelClassName,
}: {
  layout: FieldLayout;
  activeValues: Record<string, any>;
  hideWhenZero?: Set<string>;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  labelClassName?: string;
}) {
  const sharedProps = { activeValues, hideWhenZero, activeUnits, onToggleUnit, labelClassName };
  return (
    <div className="flex flex-col gap-y-1">
      {/* Full-width fields (e.g. Name) */}
      {layout.fullWidth.map(field => (
        <FieldViewItem key={field.key} field={field} {...sharedProps} />
      ))}
      {/* Two-column layout */}
      {(layout.left.length > 0 || layout.right.length > 0) && (
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex flex-col gap-y-1">
            {layout.left.map(field => (
              <FieldViewItem key={field.key} field={field} {...sharedProps} />
            ))}
          </div>
          <div className="flex flex-col gap-y-1">
            {layout.right.map(field => (
              <FieldViewItem key={field.key} field={field} {...sharedProps} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldEditGrid({
  layout,
  draft,
  updateDraft,
  activeUnits,
  onToggleUnit,
  labelClassName,
}: {
  layout: FieldLayout;
  draft: Record<string, any>;
  updateDraft: (key: string, value: any) => void;
  activeUnits?: Record<string, string>;
  onToggleUnit?: (key: string, unit: string) => void;
  labelClassName?: string;
}) {
  const sharedProps = { draft, updateDraft, activeUnits, onToggleUnit, labelClassName };
  return (
    <div className="flex flex-col gap-y-1">
      {/* Full-width fields */}
      {layout.fullWidth.map(field => (
        <FieldEditItem key={field.key} field={field} {...sharedProps} />
      ))}
      {/* Two-column layout */}
      {(layout.left.length > 0 || layout.right.length > 0) && (
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex flex-col gap-y-1">
            {layout.left.map(field => (
              <FieldEditItem key={field.key} field={field} {...sharedProps} />
            ))}
          </div>
          <div className="flex flex-col gap-y-1">
            {layout.right.map(field => (
              <FieldEditItem key={field.key} field={field} {...sharedProps} />
            ))}
          </div>
        </div>
      )}
    </div>
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
  labelClassName,
}: DetailDialogProps) {
  // Single-item mode state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  

  // Multi-item mode state
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Per-field active display unit (initialized from defaultUnits)
  const [activeUnits, setActiveUnits] = useState<Record<string, string>>(() => defaultUnits || {});

  const isMultiItem = items && items.length > 1;

  // Normalize fields prop to layout
  const fieldsLayout = useMemo(() => normalizeToLayout(fields), [fields]);
  const fieldsFlat = useMemo(() => allFieldsFlat(fieldsLayout), [fieldsLayout]);

  const handleToggleUnit = (fieldKey: string, newUnit: string) => {
    if (editing || editingIndex !== null) {
      const allFields = editingIndex !== null && items && buildFields
        ? allFieldsFlat(normalizeToLayout(buildFields(items[editingIndex])))
        : fieldsFlat;
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditing(false);
      setDraft({});
      setDirtyKeys(new Set());
      setExpandedIndices(new Set());
      setEditingIndex(null);
      setActiveUnits(defaultUnits || {});
    }
    onOpenChange(next);
  };

  // ---- Single-item mode handlers ----
  const enterEditMode = () => {
    const d = { ...values };
    for (const field of fieldsFlat) {
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
    setDirtyKeys(new Set());
  };

  const handleSave = () => {
    const updates: Record<string, any> = {};
    for (const field of fieldsFlat) {
      if (field.readOnly) continue;
      if (!dirtyKeys.has(field.key)) continue;
      const edited = draft[field.key];
      if (edited === undefined) continue;
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
    // Capture real-column keys injected into draft by side-effect handlers
    // (e.g. applyCategoryChange sets exercise_key when _exercise_category changes)
    for (const [key, val] of Object.entries(draft)) {
      if (key.startsWith('_')) continue;
      if (!dirtyKeys.has(key)) continue;
      if (updates[key] !== undefined) continue;
      if (val !== values[key]) {
        updates[key] = val;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    setEditing(false);
    setDraft({});
    setDirtyKeys(new Set());
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
          setDirtyKeys(new Set());
        }
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const enterItemEdit = (idx: number) => {
    const itemFieldsFlat = buildFields ? allFieldsFlat(normalizeToLayout(buildFields(items![idx]))) : fieldsFlat;
    const d = { ...items![idx] };
    for (const field of itemFieldsFlat) {
      if (field.unitToggle) {
        const displayUnit = activeUnits[field.key] || field.unitToggle.storageUnit;
        if (displayUnit !== field.unitToggle.storageUnit && d[field.key] != null && d[field.key] !== '') {
          d[field.key] = Number(field.unitToggle.convert(Number(d[field.key]), field.unitToggle.storageUnit, displayUnit).toFixed(2));
        }
      }
    }
    setDraft(d);
    setDirtyKeys(new Set());
    setEditingIndex(idx);
    setExpandedIndices(new Set([idx]));
  };

  const cancelItemEdit = () => {
    setEditingIndex(null);
    setDraft({});
    setDirtyKeys(new Set());
  };

  const saveItemEdit = () => {
    if (editingIndex === null || !items || !buildFields || !onSaveItem) return;
    const itemFieldsFlat = allFieldsFlat(normalizeToLayout(buildFields(items[editingIndex])));
    const updates: Record<string, any> = {};
    for (const field of itemFieldsFlat) {
      if (field.readOnly) continue;
      if (!dirtyKeys.has(field.key)) continue;
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
    setDirtyKeys(new Set());
  };

  const updateDraft = (key: string, value: any) => {
    setDirtyKeys(prev => new Set(prev).add(key));
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="left-2 right-2 top-[5%] translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 rounded-lg">
        <DialogHeader className="px-4 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className={cn("text-base", !isMultiItem && "sr-only")}>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {isMultiItem ? (
            <div className="space-y-0">
              {items.map((item, idx) => {
                const isExpanded = expandedIndices.has(idx);
                const isEditing = editingIndex === idx;
                const fieldSource = (isEditing && buildFields) ? { ...item, ...draft } : item;
                const itemLayout = normalizeToLayout(buildFields ? buildFields(fieldSource) : fields);
                // For view mode, filter out description from left/right (shown in header)
                const viewLayout: FieldLayout = {
                  fullWidth: itemLayout.fullWidth.filter(f => f.key !== 'description'),
                  left: itemLayout.left.filter(f => f.key !== 'description'),
                  right: itemLayout.right.filter(f => f.key !== 'description'),
                };

                return (
                  <div key={idx} className={cn("border-b last:border-b-0 border-border/50")}>
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

                    {isExpanded && (
                      <div className="pb-2 pl-4">
                        {isEditing ? (
                          <>
                            <FieldEditGrid layout={itemLayout} draft={draft} updateDraft={updateDraft} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} labelClassName={labelClassName} />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={cancelItemEdit}>Cancel</Button>
                              <Button size="sm" onClick={saveItemEdit}>Save</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <FieldViewGrid layout={viewLayout} activeValues={item} hideWhenZero={hideWhenZero} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} labelClassName={labelClassName} />
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
            <div>
              {editing ? (
                <FieldEditGrid layout={fieldsLayout} draft={draft} updateDraft={updateDraft} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} labelClassName={labelClassName} />
              ) : (
                <FieldViewGrid layout={fieldsLayout} activeValues={values} hideWhenZero={hideWhenZero} activeUnits={activeUnits} onToggleUnit={handleToggleUnit} labelClassName={labelClassName} />
              )}
            </div>
          )}
        </div>

        {!readOnly && !isMultiItem && (
          <DialogFooter className="px-4 py-3 flex-shrink-0 gap-2">
            {editing ? (
              <>
                <p className="text-[10px] italic text-muted-foreground/70 w-full sm:w-auto sm:mr-auto sm:self-end sm:mb-0.5">
                  Values aren't validated — please double-check your edits.
                </p>
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

import { EXERCISE_MUSCLE_GROUPS, EXERCISE_SUBTYPE_DISPLAY, isCardioExercise, KNOWN_METADATA_KEYS, EXERCISE_GROUPS, getExerciseDisplayName } from '@/lib/exercise-metadata';
import { convertWeight, convertDistance, convertSpeed } from '@/lib/weight-units';

export const FOOD_HIDE_WHEN_ZERO = new Set(['portion', 'fiber', 'sugar', 'saturated_fat', 'sodium', 'cholesterol']);

export const EXERCISE_HIDE_WHEN_EMPTY = new Set(
  KNOWN_METADATA_KEYS.map(mk => `_meta_${mk.key}`)
);

export function buildFoodDetailFields(item: Record<string, any>): FieldConfig[] {
  return [
    { key: 'description', label: 'Name', type: 'text', maxWidth: 'sm' },
    { key: 'portion', label: 'Portion', type: 'text', maxWidth: 'sm' },
    { key: 'calories', label: 'Calories', type: 'number', unit: 'cal', min: 0 },
    { key: 'sodium', label: 'Sodium', type: 'number', unit: 'mg', min: 0 },
    { key: 'protein', label: 'Protein', type: 'number', unit: 'g', min: 0 },
    { key: 'fiber', label: 'Fiber', type: 'number', unit: 'g', min: 0 },
    { key: 'carbs', label: 'Carbs', type: 'number', unit: 'g', min: 0 },
    { key: 'sugar', label: 'Sugar', type: 'number', unit: 'g', min: 0 },
    { key: 'fat', label: 'Fat', type: 'number', unit: 'g', min: 0 },
    { key: 'cholesterol', label: 'Cholesterol', type: 'number', unit: 'mg', min: 0 },
    { key: 'saturated_fat', label: 'Sat. Fat', type: 'number', unit: 'g', min: 0 },
  ];
}

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

/** Helper to build a metadata FieldConfig */
function metaField(metaKey: string): FieldConfig | null {
  const mk = KNOWN_METADATA_KEYS.find(m => m.key === metaKey);
  if (!mk) return null;
  return {
    key: `_meta_${mk.key}`,
    label: mk.label,
    type: 'number',
    unit: mk.unit,
    min: mk.min,
    max: mk.max,
  };
}

export function buildExerciseDetailFields(item: Record<string, any>): FieldLayout {
  const exerciseKey = item.exercise_key || '';
  const category: string = item._exercise_category
    || (isCardioExercise(exerciseKey) ? 'cardio' : (EXERCISE_MUSCLE_GROUPS[exerciseKey] ? 'strength' : 'other'));

  const fullWidth: FieldConfig[] = [
    { key: 'description', label: 'Name', type: 'text' },
  ];

  const categoryField: FieldConfig = {
    key: '_exercise_category', label: 'Category', type: 'select',
    options: [
      { value: 'strength', label: 'Strength' },
      { value: 'cardio', label: 'Cardio' },
      { value: 'other', label: 'Other' },
    ],
  };

  const exerciseTypeField: FieldConfig = {
    key: 'exercise_key', label: 'Type', type: 'select',
    optgroups: buildExerciseKeyOptgroups(),
  };

  const subtypeOptions = buildSubtypeOptions(exerciseKey);
  const subtypeField: FieldConfig | null = subtypeOptions
    ? { key: 'exercise_subtype', label: 'Subtype', type: 'select', options: subtypeOptions }
    : null;

  // Common metadata fields (always on left column)
  const calBurned = metaField('calories_burned')!;
  const heartRate = metaField('heart_rate')!;
  const effort = metaField('effort')!;

  if (category === 'cardio') {
    const left: FieldConfig[] = [
      { key: 'duration_minutes', label: 'Duration', type: 'number', unit: 'min', min: 0, step: 0.5 },
      { key: 'distance_miles', label: 'Distance', type: 'number', unitToggle: { units: ['mi', 'km'], storageUnit: 'mi', convert: convertDistance }, min: 0, step: 0.01 },
      calBurned,
      heartRate,
      effort,
      { key: '_meta_speed_mph', label: 'Speed', type: 'number', unitToggle: { units: ['mph', 'km/h'], storageUnit: 'mph', convert: convertSpeed }, min: 0.1 },
    ];
    const right: FieldConfig[] = [
      categoryField,
      exerciseTypeField,
      ...(subtypeField ? [subtypeField] : []),
      metaField('incline_pct')!,
      metaField('cadence_rpm')!,
    ];
    return { fullWidth, left, right };
  }

  if (category === 'strength') {
    const left: FieldConfig[] = [
      { key: 'sets', label: 'Sets', type: 'number', min: 0 },
      { key: 'reps', label: 'Reps', type: 'number', min: 0 },
      { key: 'weight_lbs', label: 'Weight', type: 'number', unitToggle: { units: ['lbs', 'kg'], storageUnit: 'lbs', convert: convertWeight }, min: 0 },
      calBurned,
      heartRate,
      effort,
    ];
    const right: FieldConfig[] = [
      categoryField,
      exerciseTypeField,
      ...(subtypeField ? [subtypeField] : []),
    ];
    return { fullWidth, left, right };
  }

  // Other
  const left: FieldConfig[] = [calBurned, heartRate, effort];
  const right: FieldConfig[] = [categoryField];
  return { fullWidth, left, right };
}

export function flattenExerciseValues(item: Record<string, any>): Record<string, any> {
  const flat: Record<string, any> = { ...item };
  flat._exercise_category = isCardioExercise(item.exercise_key)
    ? 'cardio'
    : (EXERCISE_MUSCLE_GROUPS[item.exercise_key] ? 'strength' : 'other');
  // Read from promoted top-level fields first, fall back to exercise_metadata
  const metadata = item.exercise_metadata || {};
  for (const mk of KNOWN_METADATA_KEYS) {
    const columnName = META_KEY_TO_COLUMN[mk.key] || mk.key;
    flat[`_meta_${mk.key}`] = item[columnName] ?? metadata[mk.key] ?? null;
  }
  return flat;
}

/**
 * Map from _meta_ virtual field keys to their promoted DB column names.
 * 'calories_burned' in JSONB maps to 'calories_burned_override' as a column.
 */
const META_KEY_TO_COLUMN: Record<string, string> = {
  calories_burned: 'calories_burned_override',
  effort: 'effort',
  heart_rate: 'heart_rate',
  incline_pct: 'incline_pct',
  cadence_rpm: 'cadence_rpm',
  speed_mph: 'speed_mph',
};

export function processExerciseSaveUpdates(
  updates: Record<string, any>,
  currentMetadata: Record<string, number> | null
): { regularUpdates: Record<string, any>; metadataColumnUpdates: Record<string, any> } {
  const regularUpdates: Record<string, any> = {};
  const metadataColumnUpdates: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key.startsWith('_')) {
      if (key.startsWith('_meta_')) {
        const metaKey = key.slice(6);
        const columnName = META_KEY_TO_COLUMN[metaKey];
        const numVal = value === '' || value === null ? null : Number(value);
        if (columnName) {
          // Write to promoted column
          metadataColumnUpdates[columnName] = numVal === 0 || (numVal !== null && !isFinite(numVal)) ? null : numVal;
        }
      }
      // Other virtual fields (like _exercise_category) are handled via
      // applyCategoryChange in FieldEditItem and produce real keys (exercise_key)
      // in the draft, so they arrive here as regular updates.
    } else {
      regularUpdates[key] = value;
    }
  }

  return { regularUpdates, metadataColumnUpdates };
}
