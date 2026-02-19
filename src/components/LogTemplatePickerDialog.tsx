import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LOG_TEMPLATES, MEASUREMENT_TEMPLATES, getTemplateUnit } from '@/lib/log-templates';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Scale, Ruler, Percent, HeartPulse, Moon, Smile, BookOpen, Droplets, Wrench, ChevronDown, ChevronRight, Pill, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Scale, Ruler, Percent, HeartPulse, Moon, Smile, BookOpen, Droplets, Pill,
};

// Templates shown in the primary list (always visible)
const PRIMARY_NAMES = ['Body Weight', 'Body Fat %', 'Blood Pressure', 'Medication'];
// Templates hidden under "More options"
const MORE_NAMES = ['Sleep', 'Water Intake', 'Mood', 'Journal'];

interface LogTemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (params: { name: string; value_type: string; unit: string | null }) => void;
  onSelectTemplates?: (params: { name: string; value_type: string; unit: string | null }[]) => void;
  onCreateCustom: () => void;
  onSelectMedication?: () => void;
  isLoading: boolean;
  existingNames?: string[];
}

export function LogTemplatePickerDialog({
  open, onOpenChange, onSelectTemplate, onSelectTemplates, onCreateCustom, onSelectMedication, isLoading, existingNames = [],
}: LogTemplatePickerDialogProps) {
  const { settings } = useUserSettings();
  const lowerExisting = existingNames.map(n => n.toLowerCase());
  const [measurementExpanded, setMeasurementExpanded] = useState(false);
  const [selectedMeasurements, setSelectedMeasurements] = useState<Set<string>>(new Set());
  const [moreExpanded, setMoreExpanded] = useState(false);

  const allMeasurementsAdded = MEASUREMENT_TEMPLATES.every(t => lowerExisting.includes(t.name.toLowerCase()));
  const newlySelected = [...selectedMeasurements].filter(name => !lowerExisting.includes(name.toLowerCase()));

  const handleToggleMeasurement = (name: string) => {
    setSelectedMeasurements(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const handleAddSelected = () => {
    const items = MEASUREMENT_TEMPLATES
      .filter(t => selectedMeasurements.has(t.name) && !lowerExisting.includes(t.name.toLowerCase()))
      .map(t => ({ name: t.name, value_type: t.valueType, unit: getTemplateUnit(t, settings.weightUnit) }));
    if (items.length === 0) return;
    if (onSelectTemplates) {
      onSelectTemplates(items);
    } else {
      for (const item of items) onSelectTemplate(item);
    }
    setSelectedMeasurements(new Set());
    setMeasurementExpanded(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setMeasurementExpanded(false);
      setSelectedMeasurements(new Set());
      setMoreExpanded(false);
    }
    onOpenChange(val);
  };

  const bodyWeightTemplate = LOG_TEMPLATES.find(t => t.name === 'Body Weight');
  const primaryTemplates = LOG_TEMPLATES.filter(t => PRIMARY_NAMES.includes(t.name));
  const moreTemplates = LOG_TEMPLATES.filter(t => MORE_NAMES.includes(t.name));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a Log Type</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Body Weight */}
          {bodyWeightTemplate && (
            <TemplateRow
              template={bodyWeightTemplate}
              unit={getTemplateUnit(bodyWeightTemplate, settings.weightUnit)}
              alreadyAdded={lowerExisting.includes(bodyWeightTemplate.name.toLowerCase())}
              isLoading={isLoading}
              onSelect={onSelectTemplate}
            />
          )}

          {/* Body Measurement group */}
          <button
            disabled={isLoading || allMeasurementsAdded}
            onClick={() => setMeasurementExpanded(prev => !prev)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${allMeasurementsAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'} disabled:opacity-40`}
          >
            <Ruler className="h-4 w-4 text-teal-500" />
            <span className="font-medium">Body Measurement</span>
            {allMeasurementsAdded ? (
              <span className="text-xs text-muted-foreground ml-1">Already added</span>
            ) : (
              measurementExpanded
                ? <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                : <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
            )}
          </button>

          {measurementExpanded && !allMeasurementsAdded && (
            <div className="pl-10 pr-3 pb-2 space-y-1">
              {MEASUREMENT_TEMPLATES.map(t => {
                const alreadyAdded = lowerExisting.includes(t.name.toLowerCase());
                const checked = alreadyAdded || selectedMeasurements.has(t.name);
                const unit = getTemplateUnit(t, settings.weightUnit);
                return (
                  <label
                    key={t.name}
                    className={`flex items-center gap-2 py-1 text-sm ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={alreadyAdded}
                      onChange={() => handleToggleMeasurement(t.name)}
                      className="accent-teal-500 h-3.5 w-3.5"
                    />
                    <span>{t.displayName || t.name}</span>
                    {unit && <span className="text-xs text-muted-foreground">({unit})</span>}
                    {alreadyAdded && <span className="text-xs text-muted-foreground ml-auto">Added</span>}
                  </label>
                );
              })}
              {newlySelected.length > 0 && (
                <button
                  disabled={isLoading}
                  onClick={handleAddSelected}
                  className="mt-2 w-full py-1.5 rounded-md bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  Add {newlySelected.length} selected
                </button>
              )}
            </div>
          )}

          {/* Primary templates: Body Fat %, Blood Pressure, Medication */}
          {primaryTemplates.map((t) => {
            const unit = getTemplateUnit(t, settings.weightUnit);
            const alreadyAdded = lowerExisting.includes(t.name.toLowerCase());
            return (
              <TemplateRow
                key={t.name}
                template={t}
                unit={unit}
                alreadyAdded={alreadyAdded}
                isLoading={isLoading}
                onSelect={t.name === 'Medication' && onSelectMedication
                  ? () => onSelectMedication()
                  : onSelectTemplate}
              />
            );
          })}

          {/* More options expando */}
          <button
            onClick={() => setMoreExpanded(prev => !prev)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-muted-foreground"
          >
            <Wrench className="h-4 w-4 text-teal-500" />
            <span className="font-medium text-foreground">More options</span>
            {moreExpanded
              ? <ChevronDown className="h-3 w-3 ml-auto" />
              : <ChevronRight className="h-3 w-3 ml-auto" />}
          </button>

          {moreExpanded && (
            <>
              {moreTemplates.map((t) => {
                const unit = getTemplateUnit(t, settings.weightUnit);
                const alreadyAdded = lowerExisting.includes(t.name.toLowerCase());
                return (
                  <TemplateRow
                    key={t.name}
                    template={t}
                    unit={unit}
                    alreadyAdded={alreadyAdded}
                    isLoading={isLoading}
                    onSelect={onSelectTemplate}
                  />
                );
              })}

              <button
                onClick={onCreateCustom}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Wrench className="h-4 w-4 text-teal-500" />
                <span className="font-medium">Create your own</span>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateRow({ template, unit, alreadyAdded, isLoading, onSelect }: {
  template: typeof LOG_TEMPLATES[number];
  unit: string | null;
  alreadyAdded: boolean;
  isLoading: boolean;
  onSelect: ((params: { name: string; value_type: string; unit: string | null }) => void) | (() => void);
}) {
  const Icon = ICON_MAP[template.icon];
  return (
    <button
      disabled={isLoading || alreadyAdded}
      onClick={() => {
        if (onSelect.length === 0) {
          (onSelect as () => void)();
        } else {
          (onSelect as (params: { name: string; value_type: string; unit: string | null }) => void)(
            { name: template.name, value_type: template.valueType, unit }
          );
        }
      }}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'} disabled:opacity-40`}
    >
      {Icon && <Icon className="h-4 w-4 text-teal-500" />}
      <span className="font-medium">{template.name}</span>
      {alreadyAdded ? (
        <span className="text-xs text-muted-foreground ml-1">Already added</span>
      ) : unit ? (
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      ) : null}
    </button>
  );
}
