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
  /** Human-readable time range label (e.g. "Last 30 days") */
  timeRange?: string;
  /** When set, title becomes inline-editable */
  onTitleChange?: (title: string) => void;
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
  timeRange,
  onTitleChange,
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
            <div className="flex flex-col gap-0 min-w-0">
              <ChartTitle>
                {onTitleChange ? (
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onBlur={(e) => {
                      const newTitle = (e.currentTarget.textContent ?? "").trim();
                      if (newTitle && newTitle !== title) onTitleChange(newTitle);
                      else e.currentTarget.textContent = title;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); }
                      if (e.key === "Escape") { e.preventDefault(); e.currentTarget.textContent = title; (e.target as HTMLElement).blur(); }
                    }}
                    className="outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary cursor-text"
                  >
                    {title}
                  </span>
                ) : title}
              </ChartTitle>
              {timeRange && (
                <span className="text-[10px] text-muted-foreground leading-tight">{timeRange}</span>
              )}
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
