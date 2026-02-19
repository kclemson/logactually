import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';

interface EditLogTypeDialogProps {
  logType: CustomLogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, description: string | null) => void;
  isLoading?: boolean;
}

export function EditLogTypeDialog({
  logType,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: EditLogTypeDialogProps) {
  const [description, setDescription] = useState(logType.description ?? '');

  const handleSave = () => {
    onSave(logType.id, description.trim() || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{logType.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-sm">
              {logType.value_type === 'medication' ? 'Instructions / notes' : 'Description / notes'}
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                logType.value_type === 'medication'
                  ? 'e.g. Take with food, morning and evening'
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
