import {
  BarChart, Bar, LineChart, Line, XAxis, Tooltip, ResponsiveContainer,
  LabelList, ReferenceLine,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { CompactChartTooltip } from "./CompactChartTooltip";
import { useChartInteraction } from "@/hooks/useChartInteraction";
import { getLabelInterval } from "@/lib/chart-label-interval";
import { type ReactNode } from "react";

export interface ChartSpec {
  chartType: "bar" | "line";
  title: string;
  aiNote?: string;
  xAxis: { field: string; label: string };
  yAxis: { label: string };
  color: string;
  data: Array<Record<string, any>>;
  dataKey: string;
  valueFormat?: "integer" | "decimal1" | "duration_mmss" | "none";
  referenceLine?: { value: number; label?: string };
  dataSource?: "food" | "exercise" | "custom" | "mixed";
  verification?: {
    type: "daily" | "aggregate";
    source: "food" | "exercise";
    field: string;
    method?: "sum" | "average" | "count" | "max" | "min";
    breakdown?: Array<{ label: string; dates: string[] }>;
  } | null;
}

function formatValue(value: number, format?: string): string {
  switch (format) {
    case "decimal1":
      return value.toFixed(1);
    case "duration_mmss": {
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    case "none":
      return String(value);
    case "integer":
    default:
      return Math.round(value).toString();
  }
}

interface DynamicChartProps {
  spec: ChartSpec;
  onNavigate?: (date: string) => void;
  headerAction?: ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
  period?: number;
}

function periodLabel(days?: number): string | undefined {
  if (!days) return undefined;
  if (days === 365) return "Last year";
  if (days === 180) return "Last 6 months";
  return `Last ${days} days`;
}

export function DynamicChart({ spec, onNavigate, headerAction, onContextMenu, period }: DynamicChartProps) {
  const { data, dataKey, color, chartType, xAxis, valueFormat, referenceLine } = spec;

  const interaction = useChartInteraction({
    dataLength: data.length,
    onNavigate,
  });

  const labelInterval = getLabelInterval(data.length);

  // Add showLabel to data
  const chartData = data.map((d, i) => ({
    ...d,
    _showLabel: (data.length - 1 - i) % labelInterval === 0,
  }));

  const barLabelRenderer = (props: any) => {
    const { x, y, width, value, index } = props;
    if (!chartData[index]?._showLabel) return null;
    if (value == null || typeof x !== "number" || typeof width !== "number") return null;
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill={color}
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {formatValue(Number(value), valueFormat)}
      </text>
    );
  };

  const lineLabelRenderer = (props: any) => {
    const { viewBox, value, index } = props;
    if (!chartData[index]?._showLabel) return null;
    if (value == null || value === 0) return null;
    const { x, y, width } = viewBox ?? {};
    if (typeof x !== "number" || typeof y !== "number") return null;
    return (
      <text
        x={x + (width ?? 0) / 2}
        y={y - 4}
        fill={color}
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {formatValue(Number(value), valueFormat)}
      </text>
    );
  };

  const tooltipFormatter = (value: any) => {
    if (typeof value !== "number") return String(value);
    return formatValue(value, valueFormat);
  };

  const tooltipContent = (
    <CompactChartTooltip
      formatter={(v, name) => `${name}: ${tooltipFormatter(v)}`}
      isTouchDevice={interaction.isTouchDevice}
      onGoToDay={interaction.handleGoToDay}
      rawDate={
        interaction.activeBarIndex !== null
          ? ((chartData[interaction.activeBarIndex] as any)?.rawDate ?? chartData[interaction.activeBarIndex]?.[xAxis.field])
          : undefined
      }
    />
  );

  const sharedTooltipProps = {
    wrapperStyle: { pointerEvents: "auto" as const, zIndex: 50 },
    active: interaction.isTouchDevice ? interaction.isTooltipActive : undefined,
    payload:
      interaction.isTouchDevice && interaction.activeBarIndex !== null
        ? [{ payload: chartData[interaction.activeBarIndex], name: spec.yAxis.label, value: chartData[interaction.activeBarIndex]?.[dataKey], color }]
        : undefined,
    label:
      interaction.isTouchDevice && interaction.activeBarIndex !== null
        ? chartData[interaction.activeBarIndex]?.[xAxis.field]
        : undefined,
    content: tooltipContent,
    offset: 20,
    cursor: { fill: "hsl(var(--muted)/0.3)" },
  };

  const sharedXAxisProps = {
    dataKey: xAxis.field,
    tick: { fontSize: 8 },
    stroke: "hsl(var(--muted-foreground))",
    interval: "preserveStartEnd" as const,
    tickMargin: 2,
    height: 16,
  };

  const footer = spec.aiNote ? (
    <p className="text-[10px] italic text-muted-foreground mt-1 px-0.5 leading-tight">
      {spec.aiNote}
    </p>
  ) : undefined;

  return (
    <ChartCard
      title={spec.title}
      isTooltipActive={interaction.isTooltipActive}
      isTouchDevice={interaction.isTouchDevice}
      onDismiss={interaction.dismiss}
      footer={footer}
      headerAction={headerAction}
      onContextMenu={onContextMenu}
      timeRange={periodLabel(period)}
    >
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
          {chartType === "line" ? (
            <LineChart data={chartData} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
              <XAxis {...sharedXAxisProps} />
              {referenceLine && (
                <ReferenceLine
                  y={referenceLine.value}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip {...sharedTooltipProps} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.5}
                dot={{ r: 2, fill: color }}
                activeDot={{ r: 3 }}
                className="cursor-pointer"
              >
                <LabelList dataKey={dataKey} content={lineLabelRenderer} />
              </Line>
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
              <XAxis {...sharedXAxisProps} />
              {referenceLine && (
                <ReferenceLine
                  y={referenceLine.value}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip {...sharedTooltipProps} />
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[2, 2, 0, 0]}
                onClick={(data: any, index: number) => interaction.handleBarClick(data, index)}
                className="cursor-pointer"
              >
                <LabelList dataKey={dataKey} content={barLabelRenderer} />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
