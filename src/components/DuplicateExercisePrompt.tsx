import { format, parseISO } from "date-fns";
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
  onDismissGroup: (description: string) => void;
  isPending?: boolean;
}

const formatChartInfo = (exercises: ExerciseTrend[]) => {
  return exercises.map(ex => {
    const dates = ex.weightData.map(d => d.date);
    if (dates.length === 0) {
      return `${ex.sessionCount} ${ex.sessionCount === 1 ? 'session' : 'sessions'}`;
    }
    
    const firstDate = parseISO(dates[0]);
    const lastDate = parseISO(dates[dates.length - 1]);
    
    const dateStr = dates.length === 1 || dates[0] === dates[dates.length - 1]
      ? format(firstDate, 'MMM d')
      : `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d')}`;
    
    const sessionWord = ex.sessionCount === 1 ? 'session' : 'sessions';
    return `${ex.sessionCount} ${sessionWord} (${dateStr})`;
  }).join(', ');
};

export function DuplicateExercisePrompt({ 
  groups, 
  onMerge, 
  onDismissGroup,
  isPending 
}: DuplicateExercisePromptProps) {
  if (groups.length === 0) return null;

  return (
    <Card className="border-0 shadow-none bg-muted/30 rounded-md">
      <CardContent className="p-2">
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.description} className="flex flex-col gap-1">
              {/* Exercise name as title */}
              <p className="text-xs font-semibold leading-tight">
                {group.winner.description}
              </p>
              
              {/* Descriptive context */}
              <p className="text-[10px] text-muted-foreground">
                Found in {group.exercises.length} charts: {formatChartInfo(group.exercises)}
              </p>
              
              {/* Action buttons - grouped together */}
              <div className="flex items-center gap-2 mt-0.5">
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="h-5 text-[10px] px-2"
                  onClick={() => onMerge(group)}
                  disabled={isPending}
                >
                  <Merge className="h-2.5 w-2.5 mr-1" />
                  Merge into one chart
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => onDismissGroup(group.description)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
