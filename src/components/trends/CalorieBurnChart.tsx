import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { useHasHover } from "@/hooks/use-has-hover";

export interface CalorieBurnChartData {
  rawDate: string;
  date: string;
  low: number;
  high: number;
  midpoint: number;
}

interface CalorieBurnChartProps {
  title: string;
  subtitle?: string;
  chartData: CalorieBurnChartData[];
  color: string;
  onNavigate: (date: string) => void;
}

const BurnTooltip = ({
  active,
  payload,
  label,
  isTouchDevice,
  onGoToDay,
  rawDate,
  color,
}: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const { low, high, midpoint } = data;
  const isWide = high > low * 1.5;
  const rangeText = isWide ? `~${midpoint} cal (range: ${low}-${high})` : `~${midpoint} cal`;

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      <p className="text-[10px] font-semibold" style={{ color }}>
        {rangeText}
      </p>
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

  return (
    <Card className="border-0 shadow-none relative">
      {isTouchDevice && activeBarIndex !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveBarIndex(null)}
        />
      )}

      <div className="relative z-20">
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
                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
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
                  wrapperStyle={{ pointerEvents: "auto", zIndex: 50 }}
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
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
