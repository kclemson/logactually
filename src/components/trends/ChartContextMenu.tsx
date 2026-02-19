import { Pencil, Trash2 } from "lucide-react";

interface ChartContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChartContextMenu({ x, y, isOpen, onClose, onEdit, onDelete }: ChartContextMenuProps) {
  if (!isOpen) return null;

  // Clamp to viewport so menu doesn't overflow off-screen
  const clampedX = Math.min(x, window.innerWidth - 140);
  const clampedY = Math.min(y, window.innerHeight - 90);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onMouseDown={onClose}
        onTouchStart={onClose}
      />

      {/* Menu */}
      <div
        className="fixed z-50 min-w-[130px] rounded-md border bg-popover text-popover-foreground shadow-md py-1"
        style={{ left: clampedX, top: clampedY }}
      >
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          onMouseDown={(e) => { e.stopPropagation(); onEdit(); onClose(); }}
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          Edit
        </button>
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent transition-colors"
          onMouseDown={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </>
  );
}
