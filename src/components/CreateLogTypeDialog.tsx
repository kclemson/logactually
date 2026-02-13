import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ValueType } from '@/hooks/useCustomLogTypes';

interface CreateLogTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, valueType: ValueType, unit?: string) => void;
  isLoading?: boolean;
}

const VALUE_TYPE_OPTIONS: { value: 'numeric' | 'text_numeric' | 'text'; label: string; description: string }[] = [
  { value: 'numeric', label: 'Numeric', description: 'A single number (e.g. body weight)' },
  { value: 'text_numeric', label: 'Text + Numeric', description: 'A label and number (e.g. measurements)' },
  { value: 'text', label: 'Text only', description: 'Free-form text' },
];

export function CreateLogTypeDialog({ open, onOpenChange, onSubmit, isLoading }: CreateLogTypeDialogProps) {
  const [name, setName] = useState('');
  const [valueType, setValueType] = useState<'numeric' | 'text_numeric' | 'text'>('numeric');
  const [unit, setUnit] = useState('');
  const [textMultiline, setTextMultiline] = useState(false);

  const showUnit = valueType === 'numeric' || valueType === 'text_numeric';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalType: ValueType = valueType === 'text' && textMultiline ? 'text_multiline' : valueType;
    onSubmit(name.trim(), finalType, showUnit && unit.trim() ? unit.trim() : undefined);
    setName('');
    setValueType('numeric');
    setUnit('');
    setTextMultiline(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Custom Log Type</DialogTitle>
          <DialogDescription>Weight, measurements, mood, and more</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="log-type-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Body Weight"
            autoFocus
          />
          <div className="space-y-1">
              {VALUE_TYPE_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <label className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="radio"
                      name="value-type"
                      checked={valueType === opt.value}
                      onChange={() => setValueType(opt.value)}
                      className="accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium">{opt.label}</span>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </label>
                  {/* Inline unit input for numeric/text_numeric when selected */}
                  {(opt.value === 'numeric' || opt.value === 'text_numeric') && valueType === opt.value && (
                    <div className="ml-6 mt-1 mb-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Unit</span>
                      <Input
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="optional (e.g. lbs, in)"
                        className="h-7 text-xs"
                      />
                    </div>
                  )}
                  {/* Sub-options for text type */}
                  {opt.value === 'text' && valueType === 'text' && (
                    <div className="ml-6 mt-1 mb-1 space-y-0.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="text-mode"
                          checked={!textMultiline}
                          onChange={() => setTextMultiline(false)}
                          className="accent-primary"
                        />
                        <span className="text-xs text-muted-foreground">Single line (e.g. mood)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="text-mode"
                          checked={textMultiline}
                          onChange={() => setTextMultiline(true)}
                          className="accent-primary"
                        />
                        <span className="text-xs text-muted-foreground">Multi line (e.g. journal notes)</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          <Button type="submit" disabled={!name.trim() || isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
