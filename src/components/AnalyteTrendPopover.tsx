import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { DynamicChart } from "@/components/trends/DynamicChart";
import { supabase } from "@/integrations/supabase/client";
import { executeDSL } from "@/lib/chart-dsl";
import { fetchChartData } from "@/lib/chart-data";
import type { ChartDSL } from "@/lib/chart-types";

interface AnalyteTrendPopoverProps {
  canonicalKey: string;
  displayName: string;
  /** The element rendered as the tap target (the analyte name). */
  children: ReactNode;
}

/**
 * Wraps a bloodwork analyte's name so tapping it opens a popover with that
 * analyte's all-time trend chart. Data is fetched lazily on open and cached,
 * reusing the same client-side bloodwork chart path as pinned charts.
 */
export function AnalyteTrendPopover({
  canonicalKey,
  displayName,
  children,
}: AnalyteTrendPopoverProps) {
  const [open, setOpen] = useState(false);

  const { data: spec, isLoading } = useQuery({
    queryKey: ["analyte-trend", canonicalKey],
    enabled: open,
    staleTime: 60_000,
    queryFn: async () => {
      const dsl: ChartDSL = {
        chartType: "line",
        title: displayName,
        source: "bloodwork",
        metric: "value",
        groupBy: "date",
        aggregation: "sum",
        filter: { canonicalKey },
      };
      const data = await fetchChartData(supabase, dsl, 0);
      return executeDSL(dsl, data);
    },
  });

  const hasData = !!spec && spec.data.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[300px] p-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : hasData ? (
          <DynamicChart spec={spec!} />
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center px-2">
            <span className="text-sm font-medium truncate max-w-full">{displayName}</span>
            <span className="text-xs text-muted-foreground mt-1">No trend data yet</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
