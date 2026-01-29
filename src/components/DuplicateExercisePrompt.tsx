import { AlertTriangle, Merge, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ExerciseTrend } from "@/hooks/useWeightTrends";

export interface DuplicateGroup {
  description: string;
  exercises: ExerciseTrend[];
  winner: ExerciseTrend;
  losers: ExerciseTrend[];
}

interface DuplicateExercisePromptProps {
  groups: DuplicateGroup[];
  onMerge: (group: DuplicateGroup) => void;
  onDismiss: () => void;
  isPending?: boolean;
}

export function DuplicateExercisePrompt({ 
  groups, 
  onMerge, 
  onDismiss,
  isPending 
}: DuplicateExercisePromptProps) {
  if (groups.length === 0) return null;

  const firstGroup = groups[0];
  const totalDuplicates = groups.length;

  return (
    <Card className="border-warning bg-warning/10">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-foreground">
              {totalDuplicates === 1 
                ? "1 exercise may have duplicates"
                : `${totalDuplicates} exercises may have duplicates`
              }
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              "{firstGroup.winner.description}" appears under {firstGroup.exercises.length} different entries
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="default"
                className="h-7 text-xs"
                onClick={() => onMerge(firstGroup)}
                disabled={isPending}
              >
                <Merge className="h-3 w-3 mr-1" />
                {isPending ? "Merging..." : "Merge"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 text-xs"
                onClick={onDismiss}
                disabled={isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
