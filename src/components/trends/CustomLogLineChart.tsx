import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { useHasHover } from "@/hooks/use-has-hover";
import { cn } from "@/lib/utils";
import { CompactChartTooltip } from "./CompactChartTooltip";

interface CustomLogLineChartProps {
  title: string;
  chartData: Array<{
    rawDate: string;
    date: string;
    showLabel: boolean;
    [key: string]: any;
  }>;
  dataKey: string;
  color: string;
  onNavigate: (date: string) => void;
  height?: string;
  referenceLine?: { value: number; color?: string };
  subtitle?: string;
  labelFormatter?: (value: number) => string;
}

// Label renderer: show value above point only on flagged label points
const createLineLabelRenderer = (
  chartData: Array<{ showLabel: boolean }>,
  color: string,
  labelFormatter?: (value: number) => string,
) => (props: any) => {
  const { x, y, value, index } = props;
  if (!chartData[index]?.showLabel) return null;
  if (value == null || typeof x !== "number" || typeof y !== "number") return null;
  return (
    <text x={x} y={y - 6} fill={color} textAnchor="middle" fontSize={7} fontWeight={500}>
      {labelFormatter ? labelFormatter(value) : Math.round(value)}
    </text>
  );
};

export const CustomLogLineChart = ({
  title,
  chartData,
  dataKey,
  color,
  onNavigate,
  height = "h-24",
  referenceLine,
  subtitle,
  labelFormatter,
}: CustomLogLineChartProps) => {
  const isTouchDevice = !useHasHover();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [chartData]);

  const handleChartClick = (state: any) => {
    const index = state?.activeTooltipIndex;
    if (index == null) return;
    if (isTouchDevice) {
      setActiveIndex((prev) => (prev === index ? null : index));
    } else {
      const point = chartData[index];
      if (point?.rawDate) onNavigate(point.rawDate);
    }
  };

  const handleGoToDay = (date: string) => {
    setActiveIndex(null);
    onNavigate(date);
  };

  // Fitted y-domain from actual (non-null) values
  const values = chartData
    .map((d) => d[dataKey])
    .filter((v): v is number => typeof v === "number");
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 1;
  const range = dataMax - dataMin;
  const pad = range > 0 ? range * 0.15 : (Math.abs(dataMax) * 0.05 || 1);
  const domain: [number, number] = [dataMin - pad, dataMax + pad];

  return (
    <Card className={cn("border-0 shadow-none relative", isTouchDevice && activeIndex !== null && "z-50")}>
      {isTouchDevice && activeIndex !== null && (
        <div className="fixed inset-0 z-30" onClick={() => setActiveIndex(null)} />
      )}

      <div className="relative z-40">
        <CardHeader className="p-2 pb-1">
          <div className="flex flex-col gap-0.5">
            <ChartTitle>{title}</ChartTitle>
            {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className={height}>
            <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
              <LineChart
                data={chartData}
                margin={{ top: 14, right: 4, left: 4, bottom: 0 }}
                onClick={handleChartClick}
                className="cursor-pointer"
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
                <YAxis hide domain={domain} />
                {referenceLine && (
                  <ReferenceLine
                    y={referenceLine.value}
                    stroke={referenceLine.color || "hsl(var(--muted-foreground))"}
                    strokeDasharray="4 3"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                )}
                <Tooltip
                  wrapperStyle={{ pointerEvents: "auto", zIndex: 50 }}
                  active={isTouchDevice ? activeIndex !== null : undefined}
                  payload={isTouchDevice && activeIndex !== null ? [{ payload: chartData[activeIndex] }] : undefined}
                  label={isTouchDevice && activeIndex !== null ? chartData[activeIndex]?.date : undefined}
                  content={
                    <CompactChartTooltip
                      formatter={(value, name) =>
                        `${name}: ${labelFormatter ? labelFormatter(value as number) : Math.round(value as number)}`
                      }
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeIndex !== null ? chartData[activeIndex]?.rawDate : undefined}
                    />
                  }
                  offset={20}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: color }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={dataKey}
                    content={createLineLabelRenderer(chartData, color, labelFormatter)}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
