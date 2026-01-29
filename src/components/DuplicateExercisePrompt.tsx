import { Merge, X } from "lucide-react";
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

  const totalDuplicates = groups.length;

  return (
    <Card className="border-0 shadow-none bg-muted/30 rounded-md">
      <CardContent className="p-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold leading-tight">
              {totalDuplicates === 1 
                ? "1 exercise may have duplicates"
                : `${totalDuplicates} exercises may have duplicates`
              }
            </p>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={onDismiss}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-1">
            {groups.map((group) => (
              <div key={group.description} className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted-foreground truncate flex-1">
                  "{group.winner.description}" ({group.exercises.length} entries)
                </p>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="h-5 text-[10px] px-2 shrink-0"
                  onClick={() => onMerge(group)}
                  disabled={isPending}
                >
                  <Merge className="h-2.5 w-2.5 mr-1" />
                  Merge
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
