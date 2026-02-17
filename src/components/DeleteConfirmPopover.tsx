import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DeleteConfirmPopoverProps {
  id: string;
  label: string;
  description: string;
  onDelete: () => void;
  openPopoverId: string | null;
  setOpenPopoverId: (id: string | null) => void;
}

export function DeleteConfirmPopover({
  id,
  label,
  description,
  onDelete,
  openPopoverId,
  setOpenPopoverId,
}: DeleteConfirmPopoverProps) {
  return (
    <Popover
      open={openPopoverId === id}
      onOpenChange={(open) => setOpenPopoverId(open ? id : null)}
    >
      <PopoverTrigger asChild>
        <button className="p-1.5 hover:bg-muted rounded" title="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" side="top" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenPopoverId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                setOpenPopoverId(null);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
