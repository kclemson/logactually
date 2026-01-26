import { Button } from '@/components/ui/button';
import { SimilarMealMatch } from '@/lib/text-similarity';

interface SimilarMealPromptProps {
  match: SimilarMealMatch;
  onUseSaved: () => void;
  onKeepThis: () => void;
  onSaveAsNew: () => void;
  isLoading?: boolean;
}

export function SimilarMealPrompt({
  match,
  onUseSaved,
  onKeepThis,
  onSaveAsNew,
  isLoading,
}: SimilarMealPromptProps) {
  const matchPercent = Math.round(match.score * 100);
  
  return (
    <div className="rounded-md border bg-muted/50 p-3 space-y-3">
      <p className="text-sm">
        This looks like <span className="font-medium">"{match.meal.name}"</span>{' '}
        <span className="text-muted-foreground">({matchPercent}% match)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onUseSaved}
          disabled={isLoading}
        >
          Use Saved
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onKeepThis}
          disabled={isLoading}
        >
          Keep This
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSaveAsNew}
          disabled={isLoading}
        >
          Save as New
        </Button>
      </div>
    </div>
  );
}
