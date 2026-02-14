import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LOG_TEMPLATES, getTemplateUnit } from '@/lib/log-templates';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Scale, Ruler, Percent, HeartPulse, Moon, Smile, BookOpen, Droplets, Wrench, type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Scale, Ruler, Percent, HeartPulse, Moon, Smile, BookOpen, Droplets,
};

interface LogTemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (params: { name: string; value_type: string; unit: string | null }) => void;
  onCreateCustom: () => void;
  isLoading: boolean;
  existingNames?: string[];
}

export function LogTemplatePickerDialog({
  open, onOpenChange, onSelectTemplate, onCreateCustom, isLoading, existingNames = [],
}: LogTemplatePickerDialogProps) {
  const { settings } = useUserSettings();
  const lowerExisting = existingNames.map(n => n.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a Log Type</DialogTitle>
          <DialogDescription>Pick a template to get started quickly.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          {LOG_TEMPLATES.map((t) => {
            const Icon = ICON_MAP[t.icon];
            const unit = getTemplateUnit(t, settings.weightUnit);
            const alreadyAdded = lowerExisting.includes(t.name.toLowerCase());
            return (
              <button
                key={t.name}
                disabled={isLoading || alreadyAdded}
                onClick={() => onSelectTemplate({ name: t.name, value_type: t.valueType, unit })}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'} disabled:opacity-40`}
              >
                {Icon && <Icon className="h-4 w-4 text-teal-500" />}
                <span className="font-medium">{t.name}</span>
                {alreadyAdded ? (
                  <span className="text-xs text-muted-foreground ml-1">Already added</span>
                ) : unit ? (
                  <span className="text-xs text-muted-foreground ml-1">{unit}</span>
                ) : null}
              </button>
            );
          })}

          <button
            onClick={onCreateCustom}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Wrench className="h-4 w-4 text-teal-500" />
            <span className="font-medium">Create your own</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
