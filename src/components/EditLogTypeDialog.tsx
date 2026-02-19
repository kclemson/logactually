import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';

interface EditLogTypeDialogProps {
  logType: CustomLogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, params: {
    description: string | null;
    unit?: string | null;
    default_dose?: number | null;
    doses_per_day?: number;
    dose_times?: string[] | null;
  }) => void;
  isLoading?: boolean;
}

const DOSE_TIME_DEFAULTS: Record<number, string[]> = {
  1: ['morning'],
  2: ['morning', 'evening'],
  3: ['8am', '12pm', '4pm'],
  4: ['8am', '12pm', '4pm', '8pm'],
};

export function EditLogTypeDialog({
  logType,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: EditLogTypeDialogProps) {
  const isMedication = logType.value_type === 'medication';

  const [description, setDescription] = useState(logType.description ?? '');
  const [doseAmount, setDoseAmount] = useState(
    logType.default_dose != null ? String(logType.default_dose) : ''
  );
  const [doseUnit, setDoseUnit] = useState(logType.unit ?? '');
  const [dosesPerDay, setDosesPerDay] = useState(logType.doses_per_day ?? 0);
  const [doseTimes, setDoseTimes] = useState<string[]>(logType.dose_times ?? []);

  const handleDosesPerDayChange = (count: number) => {
    setDosesPerDay(count);
    if (count === 0) {
      setDoseTimes([]);
    } else if (count > doseTimes.length) {
      // Extend with defaults for new slots
      const defaults = DOSE_TIME_DEFAULTS[count] ?? [];
      setDoseTimes(prev => {
        const next = [...prev];
        while (next.length < count) next.push(defaults[next.length] ?? '');
        return next.slice(0, count);
      });
    } else {
      setDoseTimes(prev => prev.slice(0, count));
    }
  };

  const handleDoseTimeChange = (index: number, value: string) => {
    setDoseTimes(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = () => {
    if (isMedication) {
      const parsedAmount = parseFloat(doseAmount);
      onSave(logType.id, {
        description: description.trim() || null,
        unit: doseUnit.trim() || null,
        default_dose: !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
        doses_per_day: dosesPerDay,
        dose_times: dosesPerDay > 0 ? doseTimes : [],
      });
    } else {
      onSave(logType.id, { description: description.trim() || null });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{logType.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isMedication && (
            <>
              {/* Standard dose */}
              <div className="space-y-1.5">
                <Label className="text-sm">Standard dose</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                    placeholder="325"
                    className="w-24 text-sm"
                    min="0"
                  />
                  <Input
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value)}
                    placeholder="mg, tablets, ml…"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>

              {/* How often per day */}
              <div className="space-y-1.5">
                <Label className="text-sm">How often per day?</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleDosesPerDayChange(count)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                        dosesPerDay === count
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-background text-foreground border-border hover:bg-accent'
                      )}
                    >
                      {count === 0 ? 'As needed' : count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dose time inputs */}
              {dosesPerDay > 0 && (
                <div className="space-y-2">
                  {Array.from({ length: dosesPerDay }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-14 shrink-0">
                        Dose {i + 1}
                      </Label>
                      <Input
                        value={doseTimes[i] ?? ''}
                        onChange={(e) => handleDoseTimeChange(i, e.target.value)}
                        placeholder="e.g. morning, 8am, with dinner"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notes / instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-sm">
              {isMedication ? 'Notes' : 'Description / notes'}
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isMedication
                  ? 'e.g. Max 4000mg/day, take with food'
                  : 'Optional notes about this log type'
              }
              className="min-h-[80px] resize-y text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleSave}
              disabled={isLoading}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
