import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteAllDialogProps {
  /** The noun used in the confirmation text, e.g. "food entries" or "exercises" */
  itemLabel: string;
  onConfirm: () => void;
}

/**
 * Trash icon button with a confirmation AlertDialog for "Delete all [items] for today?"
 * Used in the totals row of both FoodItemsTable and WeightItemsTable.
 */
export function DeleteAllDialog({ itemLabel, onConfirm }: DeleteAllDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          aria-label={`Delete all ${itemLabel}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete all {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove all {itemLabel} for today.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
