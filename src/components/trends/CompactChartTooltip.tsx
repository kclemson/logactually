export interface CompactChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string, entry: any, index: number, payload: any) => string | string[];
  totalKey?: string;
  totalLabel?: string;
  totalColor?: string;
  isTouchDevice?: boolean;
  onGoToDay?: (date: string) => void;
  rawDate?: string;
  renderRows?: (payload: any[]) => React.ReactNode;
}

export const CompactChartTooltip = ({ 
  active, 
  payload, 
  label, 
  formatter, 
  totalKey, 
  totalLabel, 
  totalColor,
  isTouchDevice,
  onGoToDay,
  rawDate,
  renderRows,
}: CompactChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  const totalValue = totalKey && payload[0]?.payload?.[totalKey];

  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 shadow-md w-max">
      <p className="text-[10px] font-medium mb-0.5">{label}</p>
      {totalValue !== undefined && (
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: totalColor || '#2563EB' }}>
          {totalLabel || 'Total'}: {Math.round(totalValue)} cal
        </p>
      )}
      {renderRows
        ? renderRows(payload.slice().reverse())
        : payload
          .slice()
          .reverse()
          .map((entry: any, index: number) => {
            const displayValue = formatter
              ? formatter(entry.value, entry.name, entry, index, entry.payload)
              : `${entry.name}: ${Math.round(entry.value)}`;
            
            if (Array.isArray(displayValue)) {
              return displayValue.map((line: string, lineIndex: number) => (
                <p key={`${entry.dataKey || index}-${lineIndex}`} className="text-[10px]" style={{ color: entry.color }}>
                  {line}
                </p>
              ));
            }
            
            return (
              <p key={entry.dataKey || index} className="text-[10px]" style={{ color: entry.color }}>
                {displayValue}
              </p>
            );
          })}
      {isTouchDevice && onGoToDay && rawDate && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onGoToDay(rawDate);
          }}
          className="mt-1.5 w-full text-left text-[10px] text-primary hover:underline"
        >
          Go to day →
        </button>
      )}
    </div>
  );
};
