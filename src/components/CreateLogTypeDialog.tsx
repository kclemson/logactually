import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ValueType } from '@/hooks/useCustomLogTypes';

interface CreateLogTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, valueType: ValueType, unit?: string) => void;
  isLoading?: boolean;
}

const VALUE_TYPE_OPTIONS: { value: ValueType; label: string; description: string }[] = [
  { value: 'numeric', label: 'Numeric', description: 'A single number (e.g. body weight)' },
  { value: 'text_numeric', label: 'Text + Numeric', description: 'A label and number (e.g. measurements)' },
  { value: 'text', label: 'Text only', description: 'Free-form text (e.g. journal notes)' },
];

export function CreateLogTypeDialog({ open, onOpenChange, onSubmit, isLoading }: CreateLogTypeDialogProps) {
  const [name, setName] = useState('');
  const [valueType, setValueType] = useState<ValueType>('numeric');
  const [unit, setUnit] = useState('');

  const showUnit = valueType === 'numeric' || valueType === 'text_numeric';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), valueType, showUnit && unit.trim() ? unit.trim() : undefined);
    setName('');
    setValueType('numeric');
    setUnit('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Custom Log Type</DialogTitle>
          <DialogDescription>Weight, measurements, mood, and more</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="log-type-name" className="shrink-0">Name</Label>
            <Input
              id="log-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Body Weight"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="space-y-1">
              {VALUE_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-2 py-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="value-type"
                    checked={valueType === opt.value}
                    onChange={() => setValueType(opt.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {showUnit && (
            <div className="flex items-center gap-3">
              <Label htmlFor="log-type-unit" className="shrink-0">Unit</Label>
              <Input
                id="log-type-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="optional (e.g. lbs, in, mmHg)"
              />
            </div>
          )}
          <Button type="submit" disabled={!name.trim() || isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
