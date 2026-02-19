import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreateMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    name: string;
    default_dose: number;
    unit: string;
    doses_per_day: number;
    dose_times: string[];
    description: string | null;
  }) => void;
  isLoading: boolean;
  existingNames?: string[];
}

const DOSE_TIME_DEFAULTS: Record<number, string[]> = {
  1: ['morning'],
  2: ['morning', 'evening'],
  3: ['8am', '12pm', '4pm'],
  4: ['8am', '12pm', '4pm', '8pm'],
};

export function CreateMedicationDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  existingNames = [],
}: CreateMedicationDialogProps) {
  const [name, setName] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState('');
  const [dosesPerDay, setDosesPerDay] = useState(0);
  const [doseTimes, setDoseTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const lowerExisting = existingNames.map(n => n.toLowerCase());
  const isDuplicate = name.trim() && lowerExisting.includes(name.trim().toLowerCase());
  const parsedAmount = parseFloat(doseAmount);
  const canSubmit =
    name.trim() &&
    !isDuplicate &&
    doseAmount.trim() &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    doseUnit.trim();

  const handleDosesPerDayChange = (count: number) => {
    setDosesPerDay(count);
    if (count === 0) {
      setDoseTimes([]);
    } else {
      setDoseTimes(DOSE_TIME_DEFAULTS[count] ?? []);
    }
  };

  const handleDoseTimeChange = (index: number, value: string) => {
    setDoseTimes(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      default_dose: parsedAmount,
      unit: doseUnit.trim(),
      doses_per_day: dosesPerDay,
      dose_times: dosesPerDay > 0 ? doseTimes : [],
      description: notes.trim() || null,
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setName('');
      setDoseAmount('');
      setDoseUnit('');
      setDosesPerDay(0);
      setDoseTimes([]);
      setNotes('');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="med-name" className="text-sm">
              Medication name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tylenol, Lisinopril"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
            />
            {isDuplicate && (
              <p className="text-xs text-destructive">A log type with this name already exists.</p>
            )}
          </div>

          {/* Standard dose: amount + unit side by side */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Standard dose <span className="text-destructive">*</span>
            </Label>
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="med-notes" className="text-sm">Notes</Label>
            <Textarea
              id="med-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Max 4000mg/day, take with food"
              className="min-h-[72px] resize-y text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleSubmit}
              disabled={!canSubmit || isLoading}
            >
              Add Medication
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
