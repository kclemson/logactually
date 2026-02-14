import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle, ChartSubtitle } from "@/components/ui/card";
import { useHasHover } from "@/hooks/use-has-hover";

// Density-based spacing helpers
const getFoodLabelOffsetPx = (dataLength: number): number =>
  dataLength > 35 ? 11 : dataLength > 21 ? 8 : 4;

const getFoodChartMarginTop = (dataLength: number): number =>
  dataLength > 35 ? 22 : dataLength > 21 ? 18 : 12;

// Helper to create grouped bar label renderer (numeric value above, text name inside bar)
const createGroupedBarLabelRenderer = (
  barName: string,
  color: string,
) => (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  const cx = x + width / 2;
  const barHeight = typeof height === 'number' ? height : 0;
  return (
    <g>
      {/* Numeric value just above bar */}
      <text x={cx} y={y - 4} fill={color} textAnchor="middle" fontSize={7} fontWeight={500}>
        {Math.round(value)}
      </text>
      {/* Rotated text label inside the bar, white */}
      {barHeight > 14 && (
        <text x={cx} y={y + barHeight - 6} fill="white" textAnchor="start" dominantBaseline="central" fontSize={7} fontWeight={500}
          transform={`rotate(-90, ${cx}, ${y + barHeight - 6})`}>
          {barName}
        </text>
      )}
    </g>
  );
};

// Helper to create food chart label renderer
const createFoodLabelRenderer = (
  chartData: Array<{ showLabel: boolean; showLabelFullWidth?: boolean }>,
  color: string,
  yOffsetPx: number = 4,
  useFullWidthLabels: boolean = false
) => (props: any) => {
  const { x, y, width, value, index } = props;
  
  const dataPoint = chartData[index];
  const shouldShow = useFullWidthLabels ? dataPoint?.showLabelFullWidth : dataPoint?.showLabel;
  if (!shouldShow) return null;
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - yOffsetPx}
      fill={color}
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {Math.round(value)}
    </text>
  );
};

interface CompactTooltipProps {
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
}

const CompactTooltip = ({ 
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
}: CompactTooltipProps) => {
  if (!active || !payload?.length) return null;

  const totalValue = totalKey && payload[0]?.payload?.[totalKey];

  return (
    <div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
      <p className="text-[10px] font-medium text-slate-900 dark:text-slate-100 mb-0.5">{label}</p>
      {totalValue !== undefined && (
        <p className="text-[10px] font-semibold mb-0.5" style={{ color: totalColor || '#2563EB' }}>
          {totalLabel || 'Total'}: {Math.round(totalValue)} cal
        </p>
      )}
      {payload
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

interface FoodChartProps {
  title: string;
  chartData: Array<{
    rawDate: string;
    date: string;
    showLabel: boolean;
    showLabelFullWidth?: boolean;
    [key: string]: any;
  }>;
  dataKey: string;
  color: string;
  onNavigate: (date: string) => void;
  useFullWidthLabels?: boolean;
  height?: string;
  referenceLine?: { value: number; color?: string };
  subtitle?: string;
}

export const FoodChart = ({
  title,
  chartData,
  dataKey,
  color,
  onNavigate,
  useFullWidthLabels = false,
  height = "h-24",
  referenceLine,
  subtitle,
}: FoodChartProps) => {
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Reset active bar when chart data changes
  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isTouchDevice) {
      setActiveBarIndex(prev => prev === index ? null : index);
    } else {
      onNavigate(data.rawDate);
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
          <div className={height}>
            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
              <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
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
                  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
                  active={isTouchDevice ? activeBarIndex !== null : undefined}
                  payload={isTouchDevice && activeBarIndex !== null 
                    ? [{ payload: chartData[activeBarIndex] }] 
                    : undefined}
                  label={isTouchDevice && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                    />
                  }
                  offset={20}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar 
                  dataKey={dataKey} 
                  fill={color} 
                  radius={[2, 2, 0, 0]}
                  onClick={(data, index) => handleBarClick(data, index)}
                  className="cursor-pointer"
                >
                  <LabelList 
                    dataKey={dataKey} 
                    content={createFoodLabelRenderer(
                      chartData, 
                      color, 
                      getFoodLabelOffsetPx(chartData.length), 
                      useFullWidthLabels
                    )} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

interface StackedMacroChartProps {
  title: string;
  chartData: Array<{
    rawDate: string;
    date: string;
    [key: string]: any;
  }>;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
    isTop?: boolean;
  }>;
  onNavigate: (date: string) => void;
  formatter?: (value: any, name: string, entry?: any) => string | string[];
  totalKey?: string;
  totalLabel?: string;
  totalColor?: string;
  labelDataKey?: string;
  labelColor?: string;
  height?: string;
  referenceLine?: { value: number; color?: string };
  subtitle?: string;
  grouped?: boolean;
}

export const StackedMacroChart = ({
  title,
  chartData,
  bars,
  onNavigate,
  formatter,
  totalKey,
  totalLabel,
  totalColor,
  labelDataKey,
  labelColor,
  height = "h-24",
  referenceLine,
  subtitle,
  grouped,
}: StackedMacroChartProps) => {
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isTouchDevice) {
      setActiveBarIndex(prev => prev === index ? null : index);
    } else {
      onNavigate(data.rawDate);
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
          <div className={height}>
            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
              <BarChart 
                data={chartData} 
                margin={{ 
                  top: grouped ? 40 : (labelDataKey ? getFoodChartMarginTop(chartData.length) : 4), 
                  right: 0, 
                  left: 0, 
                  bottom: 0 
                }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
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
                  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
                  active={isTouchDevice ? activeBarIndex !== null : undefined}
                  payload={isTouchDevice && activeBarIndex !== null 
                    ? bars.map(bar => ({ 
                        payload: chartData[activeBarIndex],
                        dataKey: bar.dataKey,
                        name: bar.name,
                        value: chartData[activeBarIndex]?.[bar.dataKey],
                        color: bar.color,
                      }))
                    : undefined}
                  label={isTouchDevice && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      formatter={formatter}
                      totalKey={totalKey}
                      totalLabel={totalLabel}
                      totalColor={totalColor}
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                    />
                  }
                  offset={20}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                {bars.map((bar, idx) => (
                  <Bar
                    key={bar.dataKey}
                    dataKey={bar.dataKey}
                    name={bar.name}
                    stackId={grouped ? undefined : "stack"}
                    fill={bar.color}
                    radius={(grouped || bar.isTop) ? [2, 2, 0, 0] : undefined}
                    onClick={(data, index) => handleBarClick(data, index)}
                    className="cursor-pointer"
                  >
                    {grouped && (
                      <LabelList
                        dataKey={bar.dataKey}
                        content={createGroupedBarLabelRenderer(bar.name, bar.color)}
                      />
                    )}
                    {bar.isTop && labelDataKey && labelColor && (
                      <LabelList 
                        dataKey={labelDataKey} 
                        content={createFoodLabelRenderer(
                          chartData as any, 
                          labelColor, 
                          getFoodLabelOffsetPx(chartData.length), 
                          true
                        )} 
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

interface VolumeChartProps {
  title: string;
  subtitle?: string;
  chartData: Array<{
    rawDate: string;
    date: string;
    volume: number;
    label: string;
    showLabelFullWidth: boolean;
  }>;
  color: string;
  unit: string;
  onNavigate: (date: string) => void;
}

export const VolumeChart = ({
  title,
  subtitle,
  chartData,
  color,
  unit,
  onNavigate,
}: VolumeChartProps) => {
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isTouchDevice) {
      setActiveBarIndex(prev => prev === index ? null : index);
    } else {
      onNavigate(data.rawDate);
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
            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
              <BarChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
                <Tooltip
                  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
                  active={isTouchDevice ? activeBarIndex !== null : undefined}
                  payload={isTouchDevice && activeBarIndex !== null 
                    ? [{ payload: chartData[activeBarIndex] }] 
                    : undefined}
                  label={isTouchDevice && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      formatter={(value: number) => `${value.toLocaleString()} ${unit}`}
                      isTouchDevice={isTouchDevice}
                      onGoToDay={handleGoToDay}
                      rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                    />
                  }
                  offset={20}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar 
                  dataKey="volume" 
                  fill={color} 
                  radius={[2, 2, 0, 0]}
                  onClick={(data, index) => handleBarClick(data, index)}
                  className="cursor-pointer"
                >
                  <LabelList 
                    dataKey="label" 
                    content={(props: any) => {
                      const { x, y, width, value, index } = props;
                      const dataPoint = chartData[index];
                      if (!dataPoint?.showLabelFullWidth) return null;
                      if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
                      
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 4}
                          fill={color}
                          textAnchor="middle"
                          fontSize={7}
                          fontWeight={500}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
