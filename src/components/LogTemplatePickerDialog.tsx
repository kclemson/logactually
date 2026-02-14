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
}

export function LogTemplatePickerDialog({
  open, onOpenChange, onSelectTemplate, onCreateCustom, isLoading,
}: LogTemplatePickerDialogProps) {
  const { settings } = useUserSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a Log Type</DialogTitle>
          <DialogDescription>Pick a template to get started quickly.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {LOG_TEMPLATES.map((t) => {
            const Icon = ICON_MAP[t.icon];
            const unit = getTemplateUnit(t, settings.weightUnit);
            return (
              <button
                key={t.name}
                disabled={isLoading}
                onClick={() => onSelectTemplate({ name: t.name, value_type: t.valueType, unit })}
                className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                {Icon && <Icon className="h-5 w-5 text-teal-500" />}
                <span className="font-medium">{t.name}</span>
                {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCreateCustom}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          <Wrench className="h-3.5 w-3.5" />
          Create your own
        </button>
      </DialogContent>
    </Dialog>
  );
}
