import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { useHasHover } from "@/hooks/use-has-hover";
import { cn } from "@/lib/utils";

export interface CalorieBurnChartData {
  rawDate: string;
  date: string;
  low: number;
  high: number;
  midpoint: number;
  showLabel: boolean;
  exerciseCount: number;
  cardioCount: number;
  strengthCount: number;
}

interface CalorieBurnChartProps {
  title: string;
  subtitle?: string;
  chartData: CalorieBurnChartData[];
  color: string;
  onNavigate: (date: string) => void;
  sedentaryTDEE?: number | null;
}

const BurnTooltip = ({
  active,
  payload,
  label,
  isTouchDevice,
  onGoToDay,
  rawDate,
  color,
  sedentaryTDEE,
}: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const { low, high, midpoint, exerciseCount, cardioCount, strengthCount } = data;
  const rangeText = low === high ? `~${midpoint} cal` : `~${midpoint} cal (range: ${low}-${high})`;

  // Build exercise breakdown
  const parts: string[] = [];
  if (cardioCount > 0) parts.push(`${cardioCount} cardio`);
  if (strengthCount > 0) parts.push(`${strengthCount} strength`);
  const exerciseText = exerciseCount > 0
    ? `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} (${parts.join(', ')})`
    : null;

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-3 py-1 shadow-md w-max">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      <p className="text-[10px] font-semibold" style={{ color }}>
        {rangeText}
      </p>
      {exerciseText && (
        <p className="text-[9px] text-muted-foreground">{exerciseText}</p>
      )}
      {sedentaryTDEE != null && midpoint > 0 && (
        <div className="grid grid-cols-[auto_1fr] gap-x-2 tabular-nums text-[10px] mt-1 pt-1 border-t border-border/30 opacity-75">
          <div className="text-right">{sedentaryTDEE.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(total daily energy expenditure)</div>
          <div className="text-right">+ {midpoint.toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60">(exercise burn estimate)</div>
          <div className="text-right border-t border-border/30 pt-0.5 font-medium">= {(sedentaryTDEE + midpoint).toLocaleString()}</div>
          <div className="text-[9px] italic opacity-60 border-t border-border/30 pt-0.5">(est. total incl. exercise)</div>
        </div>
      )}
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

export const CalorieBurnChart = ({
  title,
  subtitle,
  chartData,
  color,
  onNavigate,
  sedentaryTDEE,
}: CalorieBurnChartProps) => {
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const handleBarClick = (_data: any, index: number) => {
    if (isTouchDevice) {
      setActiveBarIndex((prev) => (prev === index ? null : index));
    } else {
      onNavigate(chartData[index]?.rawDate);
    }
  };

  const handleGoToDay = (date: string) => {
    setActiveBarIndex(null);
    onNavigate(date);
  };

  const renderLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const dataPoint = chartData[index];
    if (!dataPoint?.showLabel) return null;
    if (!value || typeof x !== "number" || typeof width !== "number") return null;

    return (
      <text x={x + width / 2} y={y - 4} fill={color} textAnchor="middle" fontSize={7} fontWeight={500}>
        {value}
      </text>
    );
  };

  return (
    <Card className={cn("border-0 shadow-none relative", isTouchDevice && activeBarIndex !== null && "z-50")}>
      {isTouchDevice && activeBarIndex !== null && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setActiveBarIndex(null)}
        />
      )}

      <div className="relative z-40">
        <CardHeader className="p-2 pb-1">
          <div className="flex flex-col gap-0.5">
            <ChartTitle>{title}</ChartTitle>
            {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
                <YAxis domain={[0, 'dataMax + 20']} hide />
                <Tooltip
                  wrapperStyle={{ pointerEvents: "auto", zIndex: 9999 }}
                  active={isTouchDevice ? activeBarIndex !== null : undefined}
                  payload={
                    isTouchDevice && activeBarIndex !== null
                      ? [{ payload: chartData[activeBarIndex] }]
                      : undefined
                  }
                  label={
                    isTouchDevice && activeBarIndex !== null
                      ? chartData[activeBarIndex]?.date
                      : undefined
                  }
                  content={
                    <BurnTooltip
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      color={color}
                      sedentaryTDEE={sedentaryTDEE}
                      rawDate={
                        activeBarIndex !== null
                          ? chartData[activeBarIndex]?.rawDate
                          : undefined
                      }
                    />
                  }
                  offset={20}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar
                  dataKey="midpoint"
                  fill={color}
                  radius={[2, 2, 0, 0]}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  <LabelList dataKey="midpoint" content={renderLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
