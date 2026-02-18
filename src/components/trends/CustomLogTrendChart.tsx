import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { FoodChart, StackedMacroChart } from "@/components/trends/FoodChart";
import { type CustomLogTrendSeries } from "@/hooks/useCustomLogTrends";
import { getLabelInterval } from "@/lib/chart-label-interval";

const TEAL_PALETTE = ['#14b8a6', '#0d9488', '#2dd4bf', '#0f766e', '#5eead4'];

interface CustomLogTrendChartProps {
  trend: CustomLogTrendSeries;
  onNavigate: (date: string) => void;
  days?: number;
}

export const CustomLogTrendChart = ({ trend, onNavigate, days }: CustomLogTrendChartProps) => {
  const chartData = useMemo(() => {
    const isTextType = trend.valueType === 'text' || trend.valueType === 'text_multiline';

    let dates: string[];
    if (isTextType && days) {
      const today = startOfDay(new Date());
      dates = [];
      for (let i = days - 1; i >= 0; i--) {
        dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
      }
    } else {
      const dateSet = new Set<string>();
      trend.series.forEach(s => s.data.forEach(d => dateSet.add(d.date)));
      dates = Array.from(dateSet).sort();
    }

    const dataLength = dates.length;
    const labelInterval = getLabelInterval(dataLength);

    return dates.map((date, index) => {
      const distanceFromEnd = dataLength - 1 - index;
      const point: { rawDate: string; date: string; showLabel: boolean; showLabelFullWidth: boolean; [key: string]: any } = {
        rawDate: date,
        date: format(new Date(`${date}T12:00:00`), "MMM d"),
        showLabel: distanceFromEnd % labelInterval === 0,
        showLabelFullWidth: distanceFromEnd % labelInterval === 0,
      };
      trend.series.forEach(s => {
        const match = s.data.find(d => d.date === date);
        point[s.label] = match ? match.value : 0;
        if (match?.textLabel) point.textPreview = match.textLabel;
      });
      return point;
    });
  }, [trend, days]);

  const labelFormatter = useMemo(() => {
    if (trend.series.length !== 1) return undefined;
    const hasDecimals = trend.series[0].data.some(d => d.value % 1 !== 0);
    return hasDecimals ? (v: number) => v.toFixed(1) : undefined;
  }, [trend]);

  if (trend.valueType === 'text' || trend.valueType === 'text_multiline') {
    return (
      <StackedMacroChart
        title={trend.logTypeName}
        subtitle="entries per day"
        chartData={chartData}
        bars={[{
          dataKey: trend.series[0].label,
          name: trend.series[0].label,
          color: TEAL_PALETTE[0],
          isTop: true,
        }]}
        onNavigate={onNavigate}
        formatter={(value, name, entry) => {
          const preview = entry?.payload?.textPreview;
          const count = Math.round(value as number);
          const lines = [`${count} ${count === 1 ? 'entry' : 'entries'}`];
          if (preview) lines.push(preview.length > 60 ? preview.substring(0, 60) + '...' : preview);
          return lines;
        }}
      />
    );
  }

  if (trend.series.length === 1) {
    return (
      <FoodChart
        title={trend.logTypeName}
        chartData={chartData}
        dataKey={trend.series[0].label}
        color={TEAL_PALETTE[0]}
        onNavigate={onNavigate}
        useFullWidthLabels
        labelFormatter={labelFormatter}
      />
    );
  }

  // Multi-series: stacked bar chart (e.g., dual_numeric like Blood Pressure)
  const bars = trend.series.map((s, i) => ({
    dataKey: s.label,
    name: s.label,
    color: TEAL_PALETTE[i % TEAL_PALETTE.length],
    isTop: i === trend.series.length - 1,
  }));

  return (
    <StackedMacroChart
      title={trend.logTypeName}
      chartData={chartData}
      bars={bars}
      onNavigate={onNavigate}
      formatter={(value, name) => `${name}: ${value}`}
      grouped
      height="h-24"
    />
  );
};
