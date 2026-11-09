import { Button } from '@/components/ui/button';

interface WrongTabPromptProps {
  message: string;
  onYes: () => void;
  onNo: () => void;
}

/** Inline question offering to log mis-tabbed text on the other tab. */
export function WrongTabPrompt({ message, onYes, onNo }: WrongTabPromptProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-md bg-muted p-3 text-sm text-foreground">
      <span className="min-w-0 flex-1">{message}</span>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={onYes}>Yes</Button>
        <Button size="sm" variant="outline" onClick={onNo}>No</Button>
      </div>
    </div>
  );
}
