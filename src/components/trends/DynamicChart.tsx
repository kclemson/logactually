import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LabelList, ReferenceLine, ComposedChart, Legend,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { CompactChartTooltip } from "./CompactChartTooltip";
import { useChartInteraction } from "@/hooks/useChartInteraction";
import { getLabelInterval } from "@/lib/chart-label-interval";
import { type ReactNode } from "react";

/** Turn snake_case metric keys into readable labels */
function humanizeLabel(key: string): string {
  const MAP: Record<string, string> = {
    heart_rate: "heart rate",
    duration_minutes: "duration (min)",
    distance_miles: "distance (mi)",
    calories_burned: "calories burned",
    calories_burned_estimate: "est. calories burned",
    weight_lbs: "weight (lbs)",
    saturated_fat: "saturated fat",
    unique_exercises: "unique exercises",
  };
  return MAP[key] ?? key.replace(/_/g, " ");
}

function MultiLineTick({ x, y, payload }: any) {
  const words = String(payload?.value ?? "").split(" ");
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8} fill="hsl(var(--muted-foreground))">
      {words.map((w: string, i: number) => (
        <tspan x={x} dy={i === 0 ? 4 : 10} key={i}>{w}</tspan>
      ))}
    </text>
  );
}

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
  groupBy?: "date" | "dayOfWeek" | "hourOfDay" | "weekdayVsWeekend" | "week" | "item" | "category" | "dayClassification";
  verification?: {
    type: "daily" | "aggregate";
    source: "food" | "exercise";
    field: string;
    method?: "sum" | "average" | "count" | "max" | "min";
    breakdown?: Array<{ label: string; dates: string[] }>;
  } | null;
  secondSeries?: {
    dataKey: string;
    chartType: "bar" | "line";
    color: string;
    label: string;
    valueFormat?: "integer" | "decimal1" | "duration_mmss" | "none";
    useRightAxis: boolean;
  };
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
  timeRangeSuffix?: string;
  onTitleChange?: (title: string) => void;
  onAiNoteChange?: (note: string) => void;
}

function periodLabel(days?: number): string | undefined {
  if (days === 0) return "All time";
  if (!days) return undefined;
  if (days === 365) return "Last year";
  if (days === 180) return "Last 6 months";
  return `Last ${days} days`;
}

export function DynamicChart({ spec, onNavigate, headerAction, onContextMenu, period, timeRangeSuffix, onTitleChange, onAiNoteChange }: DynamicChartProps) {
  const { data, dataKey, color, chartType, xAxis, valueFormat, referenceLine, secondSeries } = spec;
  const isCategorical = spec.groupBy === "item" || spec.groupBy === "category";
  const isDualSeries = !!secondSeries;

  const interaction = useChartInteraction({
    dataLength: data.length,
    onNavigate: isCategorical ? undefined : onNavigate,
  });

  const labelInterval = getLabelInterval(data.length);

  // Add showLabel to data
  const chartData = data.map((d, i) => ({
    ...d,
    _showLabel: (data.length - 1 - i) % labelInterval === 0,
  }));

  const makeLabelRenderer = (seriesColor: string, seriesDataKey: string, seriesFormat?: string) => {
    const barRenderer = (props: any) => {
      const { x, y, width, height, value, index } = props;
      if (!chartData[index]?._showLabel) return null;
      if (value == null || typeof x !== "number" || typeof width !== "number") return null;
      return (
        <text
          x={x + width / 2}
          y={Math.min(y, y + height) - 4}
          fill={seriesColor}
          textAnchor="middle"
          fontSize={7}
          fontWeight={500}
        >
          {formatValue(Number(value), seriesFormat)}
        </text>
      );
    };

    const lineRenderer = (props: any) => {
      const { viewBox, value, index } = props;
      if (!chartData[index]?._showLabel) return null;
      if (value == null || value === 0) return null;
      const { x, y, width } = viewBox ?? {};
      if (typeof x !== "number" || typeof y !== "number") return null;
      return (
        <text
          x={x + (width ?? 0) / 2}
          y={y - 4}
          fill={seriesColor}
          textAnchor="middle"
          fontSize={7}
          fontWeight={500}
        >
          {formatValue(Number(value), seriesFormat)}
        </text>
      );
    };

    return { barRenderer, lineRenderer };
  };

  const seriesA = makeLabelRenderer(color, dataKey, valueFormat);
  const seriesB = secondSeries ? makeLabelRenderer(secondSeries.color, secondSeries.dataKey, secondSeries.valueFormat) : null;

  const tooltipContent = (
    <CompactChartTooltip
      formatter={(v, name) => {
        if (typeof v !== "number") return `${name}: ${String(v)}`;
        // Determine format based on which series this value belongs to
        const fmt = (secondSeries && name === humanizeLabel(secondSeries.label))
          ? secondSeries.valueFormat
          : valueFormat;
        return `${name}: ${formatValue(v, fmt)}`;
      }}
      isTouchDevice={interaction.isTouchDevice}
      onGoToDay={interaction.handleGoToDay}
      rawDate={
        interaction.activeBarIndex !== null
          ? (chartData[interaction.activeBarIndex] as any)?.rawDate
          : undefined
      }
    />
  );

  const touchPayload: any[] | undefined =
    interaction.isTouchDevice && interaction.activeBarIndex !== null
      ? [
          { payload: chartData[interaction.activeBarIndex], name: humanizeLabel(spec.yAxis.label), value: chartData[interaction.activeBarIndex]?.[dataKey], color },
          ...(secondSeries ? [{
            payload: chartData[interaction.activeBarIndex],
            name: humanizeLabel(secondSeries.label),
            value: chartData[interaction.activeBarIndex]?.[secondSeries.dataKey],
            color: secondSeries.color,
          }] : []),
        ]
      : undefined;

  const sharedTooltipProps = {
    wrapperStyle: { pointerEvents: "auto" as const, zIndex: 50, userSelect: "none" as const },
    active: interaction.isTouchDevice ? interaction.isTooltipActive : undefined,
    payload: touchPayload,
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
    tick: isCategorical ? <MultiLineTick /> : { fontSize: 8 },
    stroke: "hsl(var(--muted-foreground))",
    interval: isCategorical ? (0 as const) : ("preserveStartEnd" as const),
    tickMargin: 2,
    height: isCategorical ? 20 : 16,
  };

  const footer = spec.aiNote || onAiNoteChange ? (
    onAiNoteChange ? (
      <p
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={(e) => {
          const newNote = (e.currentTarget.textContent ?? "").trim();
          if (newNote !== (spec.aiNote ?? "")) onAiNoteChange(newNote || undefined as any);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); }
          if (e.key === "Escape") { e.preventDefault(); e.currentTarget.textContent = spec.aiNote ?? ""; (e.target as HTMLElement).blur(); }
        }}
        className="text-[10px] italic text-muted-foreground mt-1 px-0.5 leading-tight outline-none border-b border-dashed border-muted-foreground/30 focus:border-primary cursor-text"
      >
        {spec.aiNote || "Add a note..."}
      </p>
    ) : (
      <p className="text-[10px] italic text-muted-foreground mt-1 px-0.5 leading-tight">
        {spec.aiNote}
      </p>
    )
  ) : undefined;

  // Compact legend for dual-series
  const dualLegend = isDualSeries ? (
    <div className="flex items-center justify-center gap-3 mt-0.5">
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        {humanizeLabel(spec.yAxis.label)}
      </span>
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: secondSeries!.color }} />
        {humanizeLabel(secondSeries!.label)}
      </span>
    </div>
  ) : undefined;

  const combinedFooter = dualLegend || footer ? (
    <>
      {dualLegend}
      {footer}
    </>
  ) : undefined;

  const handleChartClick = (state: any) => {
    if (state?.activeTooltipIndex != null && state?.activePayload?.[0]?.payload) {
      interaction.handleBarClick(state.activePayload[0].payload, state.activeTooltipIndex);
    }
  };

  const referenceLineEl = referenceLine ? (
    <ReferenceLine
      y={referenceLine.value}
      stroke="hsl(var(--muted-foreground))"
      strokeDasharray="4 3"
      strokeWidth={1}
      ifOverflow="extendDomain"
    />
  ) : null;

  // Render Series A element
  const renderSeriesA = () => {
    const yAxisId = isDualSeries ? "left" : undefined;
    if (chartType === "line") {
      return (
        <>
          {isDualSeries && (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(var(--card))"
              strokeWidth={4}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
              name=""
              connectNulls
              yAxisId={yAxisId}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            name={humanizeLabel(spec.yAxis.label)}
            stroke={color}
            strokeWidth={1.5}
            dot={(props: any) => {
              const val = props.payload?.[dataKey];
              if (val == null || val === 0) return <g key={props.key} />;
              return <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={color} stroke="hsl(var(--card))" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 3 }}
            connectNulls
            className="cursor-pointer"
            yAxisId={yAxisId}
          >
            {!isDualSeries && <LabelList dataKey={dataKey} content={seriesA.lineRenderer} />}
          </Line>
        </>
      );
    }
    return (
      <Bar
        dataKey={dataKey}
        name={humanizeLabel(spec.yAxis.label)}
        fill={color}
        radius={[2, 2, 0, 0]}
        onClick={(data: any, index: number) => interaction.handleBarClick(data, index)}
        className="cursor-pointer"
        yAxisId={yAxisId}
      >
        {!isDualSeries && <LabelList dataKey={dataKey} content={seriesA.barRenderer} />}
      </Bar>
    );
  };

  // Render Series B element
  const renderSeriesB = () => {
    if (!secondSeries) return null;
    const yAxisId = secondSeries.useRightAxis ? "right" : "left";
    if (secondSeries.chartType === "line") {
      return (
        <>
          <Line
            type="monotone"
            dataKey={secondSeries.dataKey}
            stroke="hsl(var(--card))"
            strokeWidth={4}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
            name=""
            connectNulls
            yAxisId={yAxisId}
          />
          <Line
            type="monotone"
            dataKey={secondSeries.dataKey}
            name={humanizeLabel(secondSeries.label)}
            stroke={secondSeries.color}
            strokeWidth={1.5}
            dot={(props: any) => {
              const val = props.payload?.[secondSeries.dataKey];
              if (val == null || val === 0) return <g key={props.key} />;
              return <circle key={props.key} cx={props.cx} cy={props.cy} r={2} fill={secondSeries.color} stroke="hsl(var(--card))" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 3 }}
            connectNulls
            className="cursor-pointer"
            yAxisId={yAxisId}
          />
        </>
      );
    }
    return (
      <Bar
        dataKey={secondSeries.dataKey}
        name={humanizeLabel(secondSeries.label)}
        fill={secondSeries.color}
        radius={[2, 2, 0, 0]}
        onClick={(data: any, index: number) => interaction.handleBarClick(data, index)}
        className="cursor-pointer"
        yAxisId={yAxisId}
      />
    );
  };

  return (
    <ChartCard
      title={spec.title}
      isTooltipActive={interaction.isTooltipActive}
      isTouchDevice={interaction.isTouchDevice}
      onDismiss={interaction.dismiss}
      footer={combinedFooter}
      headerAction={headerAction}
      onContextMenu={onContextMenu}
      timeRange={[periodLabel(period), timeRangeSuffix].filter(Boolean).join(" ")}
      onTitleChange={onTitleChange}
    >
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: "visible" }}>
          {isDualSeries ? (
            <ComposedChart data={chartData} margin={{ top: 16, right: secondSeries!.useRightAxis ? 24 : 4, left: 0, bottom: 0 }} onClick={handleChartClick}>
              <XAxis {...sharedXAxisProps} />
              <YAxis yAxisId="left" hide />
              {secondSeries!.useRightAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 7 }}
                  stroke={secondSeries!.color}
                  width={28}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              {!secondSeries!.useRightAxis && <YAxis yAxisId="right" hide />}
              {referenceLineEl}
              <Tooltip {...sharedTooltipProps} />
              {chartType === "line" ? renderSeriesB() : renderSeriesA()}
              {chartType === "line" ? renderSeriesA() : renderSeriesB()}
            </ComposedChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData} margin={{ top: 16, right: 4, left: 0, bottom: 0 }} onClick={handleChartClick}>
              <XAxis {...sharedXAxisProps} />
              {referenceLineEl}
              <Tooltip {...sharedTooltipProps} />
              {renderSeriesA()}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
              <XAxis {...sharedXAxisProps} />
              {referenceLineEl}
              <Tooltip {...sharedTooltipProps} />
              <Bar
                dataKey={dataKey}
                name={humanizeLabel(spec.yAxis.label)}
                fill={color}
                radius={[2, 2, 0, 0]}
                onClick={(data: any, index: number) => interaction.handleBarClick(data, index)}
                className="cursor-pointer"
              >
                <LabelList dataKey={dataKey} content={seriesA.barRenderer} />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
