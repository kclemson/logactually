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

interface DeleteGroupDialogProps {
  /** Items in the group, used to show a bullet list in the confirmation */
  items: { uid: string; description: string }[];
  onConfirm: () => void;
}

/**
 * "Delete this group (N items)" link with a confirmation AlertDialog
 * listing all items that will be deleted. Used in the expanded metadata
 * panel of both FoodItemsTable and WeightItemsTable.
 */
export function DeleteGroupDialog({ items, onConfirm }: DeleteGroupDialogProps) {
  const count = items.length;
  if (count < 2) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-xs text-destructive underline">
          Delete this group ({count} items)
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this group?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {count} items:
            <ul className="list-disc list-inside mt-2 text-xs text-left">
              {items.map(item => <li key={item.uid}>{item.description}</li>)}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
