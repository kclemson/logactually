import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LOG_TEMPLATES, TEMPLATE_GROUPS, getTemplateUnit } from '@/lib/log-templates';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Scale, Ruler, Percent, HeartPulse, Moon, Droplets, Wrench, ChevronRight, Pill, Images, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Scale, Ruler, Percent, HeartPulse, Moon, Droplets, Pill, Images,
};

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
  // No effect-based reset: the dialog is mounted conditionally by parents, so
  // this state resets naturally on close.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isAdded = (name: string) => lowerExisting.includes(name.toLowerCase());

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const newlySelected = [...selected].filter(name => !isAdded(name));

  const handleAddSelected = () => {
    const items = LOG_TEMPLATES
      .filter(t => selected.has(t.name) && !isAdded(t.name))
      .map(t => ({ name: t.name, value_type: t.valueType, unit: getTemplateUnit(t, settings.weightUnit) }));
    if (items.length === 0) return;
    if (onSelectTemplates) {
      onSelectTemplates(items);
    } else {
      for (const item of items) onSelectTemplate(item);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a Log Type</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {TEMPLATE_GROUPS.map(group => {
            const templates = LOG_TEMPLATES.filter(t => t.group === group.key);
            if (templates.length === 0) return null;
            return (
              <div key={group.key} className="flex flex-col">
                <p className="px-1 pb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                {templates.map(t => {
                  // Medication needs a dedicated setup step, so it is a
                  // chevron row rather than a batch-create checkbox.
                  if (t.valueType === 'medication' && onSelectMedication) {
                    const added = isAdded(t.name);
                    const Icon = ICON_MAP[t.icon];
                    return (
                      <button
                        key={t.name}
                        disabled={isLoading || added}
                        onClick={() => onSelectMedication()}
                        className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition-colors ${added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'} disabled:opacity-40`}
                      >
                        {Icon && <Icon className="h-4 w-4 text-teal-500" />}
                        <span className="font-medium">{t.name}</span>
                        {added
                          ? <span className="text-xs text-muted-foreground ml-auto">Added</span>
                          : <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
                      </button>
                    );
                  }

                  const added = isAdded(t.name);
                  const checked = added || selected.has(t.name);
                  const unit = getTemplateUnit(t, settings.weightUnit);
                  const Icon = ICON_MAP[t.icon];
                  return (
                    <label
                      key={t.name}
                      className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition-colors ${added ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={added || isLoading}
                        onChange={() => toggle(t.name)}
                        className="accent-teal-500 h-4 w-4"
                      />
                      {Icon && <Icon className="h-4 w-4 text-teal-500" />}
                      <span className="font-medium">{t.displayName || t.name}</span>
                      {unit && <span className="text-xs text-muted-foreground">({unit})</span>}
                      {added && <span className="text-xs text-muted-foreground ml-auto">Added</span>}
                    </label>
                  );
                })}
              </div>
            );
          })}

          <button
            disabled={isLoading || newlySelected.length === 0}
            onClick={handleAddSelected}
            className="w-full py-2 rounded-md bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {newlySelected.length > 0 ? `Add ${newlySelected.length} selected` : 'Add selected'}
          </button>

          <button
            onClick={onCreateCustom}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Wrench className="h-4 w-4" />
            <span className="font-medium">Create your own</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
