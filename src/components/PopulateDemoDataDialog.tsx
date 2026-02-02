import { useState } from "react";
import { format, subDays, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePopulateDemoData, PopulateDemoDataParams } from "@/hooks/usePopulateDemoData";

interface PopulateDemoDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PopulateDemoDataDialog({ open, onOpenChange }: PopulateDemoDataDialogProps) {
  const { populate, isLoading, result, reset } = usePopulateDemoData();

  // Default: 90 days ago to 30 days from now
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 90));
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
  const [clearExisting, setClearExisting] = useState(false);
  const [generateFood, setGenerateFood] = useState(true);
  const [generateWeights, setGenerateWeights] = useState(true);
  const [savedMealsCount, setSavedMealsCount] = useState(5);
  const [savedRoutinesCount, setSavedRoutinesCount] = useState(4);

  const handleSubmit = async () => {
    const params: PopulateDemoDataParams = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      clearExisting,
      generateFood,
      generateWeights,
      generateSavedMeals: savedMealsCount,
      generateSavedRoutines: savedRoutinesCount,
    };
    await populate(params);
  };

  const handleRegenerateSavedOnly = async () => {
    const params: PopulateDemoDataParams = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      clearExisting: true,
      generateFood: false,
      generateWeights: false,
      generateSavedMeals: savedMealsCount,
      generateSavedRoutines: savedRoutinesCount,
    };
    await populate(params);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Populate Demo Data</DialogTitle>
          <DialogDescription>Generate realistic demo entries for the demo account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date Range</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Existing */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="rounded border-input"
              />
              <span>Clear existing data in range</span>
            </label>
            {clearExisting && (
              <p className="text-xs text-destructive ml-6">⚠ This will delete existing entries first</p>
            )}
          </div>

          {/* Generate options */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Options</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generateFood}
                  onChange={(e) => setGenerateFood(e.target.checked)}
                  className="rounded border-input"
                />
                <span>Generate Food</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generateWeights}
                  onChange={(e) => setGenerateWeights(e.target.checked)}
                  className="rounded border-input"
                />
                <span>Generate Weights</span>
              </label>
            </div>
          </div>

          {/* Saved items counts */}
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label htmlFor="savedMeals" className="text-xs text-muted-foreground">
                Saved Meals
              </Label>
              <Input
                id="savedMeals"
                type="number"
                min={0}
                max={20}
                value={savedMealsCount}
                onChange={(e) => setSavedMealsCount(Number(e.target.value))}
                className="w-20 h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="savedRoutines" className="text-xs text-muted-foreground">
                Saved Routines
              </Label>
              <Input
                id="savedRoutines"
                type="number"
                min={0}
                max={20}
                value={savedRoutinesCount}
                onChange={(e) => setSavedRoutinesCount(Number(e.target.value))}
                className="w-20 h-8"
              />
            </div>
          </div>

          {/* Result display */}
          {result && (
            <div
              className={cn(
                "text-xs p-2 rounded border",
                result.success
                  ? result.status === 'processing'
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
                    : "bg-green-500/10 border-green-500/30 text-green-600"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}
            >
              {result.success ? (
                result.status === 'processing' ? (
                  <div className="space-y-1">
                    <p className="font-medium">⏳ Processing in background</p>
                    <p>{result.message}</p>
                    <p className="text-muted-foreground mt-1">You can close this dialog.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium">✓ Done!</p>
                    {result.summary && (
                      <ul className="list-disc list-inside">
                        {result.summary.deleted?.foodEntries != null && (
                          <li>Deleted {result.summary.deleted.foodEntries} food entries</li>
                        )}
                        {result.summary.deleted?.weightSets != null && (
                          <li>Deleted {result.summary.deleted.weightSets} weight sets</li>
                        )}
                        {result.summary.foodEntries != null && <li>Created {result.summary.foodEntries} food entries</li>}
                        {result.summary.weightSets != null && <li>Created {result.summary.weightSets} weight sets</li>}
                        {result.summary.savedMeals != null && <li>Created {result.summary.savedMeals} saved meals</li>}
                        {result.summary.savedRoutines != null && (
                          <li>Created {result.summary.savedRoutines} saved routines</li>
                        )}
                      </ul>
                    )}
                  </div>
                )
              ) : (
                <p>Error: {result.error}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            {result?.success ? "Close" : "Cancel"}
          </Button>
          {!result?.success && !result?.status && (
            <>
              <Button 
                variant="outline" 
                onClick={handleRegenerateSavedOnly} 
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Saved Only"}
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Starting...
                  </>
                ) : (
                  "Populate All"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
