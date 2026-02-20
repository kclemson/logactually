import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, ChartTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  isTooltipActive: boolean;
  isTouchDevice: boolean;
  onDismiss: () => void;
  children: ReactNode;
  /** Optional content below the chart (e.g. aiNote) */
  footer?: ReactNode;
  /** Optional action in header (e.g. delete button) */
  headerAction?: ReactNode;
  /** Right-click / long-press context menu handler */
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function ChartCard({
  title,
  isTooltipActive,
  isTouchDevice,
  onDismiss,
  children,
  footer,
  headerAction,
  onContextMenu,
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        "border-0 shadow-none relative",
        isTouchDevice && isTooltipActive && "z-50"
      )}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e);
        }
      }}
    >
      {isTouchDevice && isTooltipActive && (
        <div className="fixed inset-0 z-30" onClick={onDismiss} />
      )}

      <div className="relative z-20">
        <CardHeader className="p-2 pb-1">
          <div className="flex items-start justify-between gap-1">
            <div className="flex flex-col gap-0.5 min-w-0">
              <ChartTitle>{title}</ChartTitle>
            </div>
            {headerAction}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {children}
          {footer}
        </CardContent>
      </div>
    </Card>
  );
}
