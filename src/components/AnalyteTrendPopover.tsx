import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { DynamicChart } from "@/components/trends/DynamicChart";
import { AnalytePinButton, AnalyteLookupLink } from "@/components/bloodwork/AnalyteActions";
import { supabase } from "@/integrations/supabase/client";
import { executeDSL } from "@/lib/chart-dsl";
import { fetchChartData } from "@/lib/chart-data";
import { getAnalyteFullName } from "@/lib/bloodwork-canonical";
import type { ChartDSL } from "@/lib/chart-types";

interface AnalyteTrendPopoverProps {
  canonicalKey: string;
  displayName: string;
  isReadOnly: boolean;
  /** The element rendered as the tap target (the analyte name). */
  children: ReactNode;
}

/**
 * Wraps a bloodwork analyte's name so tapping it opens a popover with that
 * analyte's all-time trend chart. The popover header shows the analyte name
 * (with its expanded full name when known) plus the same pin and Google-lookup
 * actions available in the list row. Data is fetched lazily on open and cached,
 * reusing the same client-side bloodwork chart path as pinned charts.
 */
export function AnalyteTrendPopover({
  canonicalKey,
  displayName,
  isReadOnly,
  children,
}: AnalyteTrendPopoverProps) {
  const [open, setOpen] = useState(false);
  const fullName = getAnalyteFullName(canonicalKey);
  const showFullName = !!fullName && fullName.toLowerCase() !== displayName.toLowerCase();

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
  const ref = spec?.referenceRange;
  const rangeText =
    ref && ref.low != null && ref.high != null
      ? `(${ref.low}–${ref.high}${ref.unit ? ` ${ref.unit}` : ""})`
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[300px] p-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-1.5">
          <div className="flex items-center gap-1.5">
            <AnalytePinButton
              canonicalKey={canonicalKey}
              displayName={displayName}
              isReadOnly={isReadOnly}
              size="md"
            />
            <span className="text-sm font-semibold leading-tight truncate flex-1">
              {displayName}
              {rangeText && (
                <span className="font-normal text-muted-foreground"> {rangeText}</span>
              )}
            </span>
            <AnalyteLookupLink displayName={displayName} size="md" alwaysVisible />
          </div>
          {showFullName && (
            <span className="block text-[11px] text-muted-foreground leading-tight pl-[2.125rem]">
              {fullName}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : hasData ? (
          <DynamicChart spec={spec!} hideHeader />
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center px-2">
            <span className="text-xs text-muted-foreground">No trend data yet</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
