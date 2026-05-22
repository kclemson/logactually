import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { BloodworkPanel } from '@/hooks/useBloodworkPanels';

interface DuplicateBlockedDialogProps {
  open: boolean;
  existing: BloodworkPanel | null;
  onCancel: () => void;
  onUploadAnyway: () => void;
  onViewExisting: (panel: BloodworkPanel) => void;
}

export function DuplicateBlockedDialog({ open, existing, onCancel, onUploadAnyway, onViewExisting }: DuplicateBlockedDialogProps) {
  if (!existing) return null;
  const uploadedAt = existing.created_at ? format(new Date(existing.created_at), 'MMM d, yyyy') : null;
  const collectedAt = existing.collected_date ? format(new Date(existing.collected_date), 'MMM d, yyyy') : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="top-[5%] translate-y-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            You've uploaded this file before
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-1">
            <div>
              <span className="text-foreground font-medium">{existing.panel_title || existing.source_filename || 'Bloodwork'}</span>
            </div>
            <div className="text-xs">
              {collectedAt ? <>Collected <span className="text-foreground">{collectedAt}</span></> : <span className="italic">No collection date on record</span>}
              {uploadedAt && <> · Uploaded {uploadedAt}</>}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          {existing.collected_date && (
            <Button variant="default" onClick={() => onViewExisting(existing)}>
              View existing
            </Button>
          )}
          <Button variant="outline" onClick={onUploadAnyway}>
            Upload anyway
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
