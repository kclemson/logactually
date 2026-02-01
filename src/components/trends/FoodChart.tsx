import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, ChartTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

// Density-based spacing helpers
const getFoodLabelOffsetPx = (dataLength: number): number =>
  dataLength > 35 ? 11 : dataLength > 21 ? 8 : 4;

const getFoodChartMarginTop = (dataLength: number): number =>
  dataLength > 35 ? 22 : dataLength > 21 ? 18 : 12;

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
  isMobile?: boolean;
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
  isMobile,
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
      {isMobile && onGoToDay && rawDate && (
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
}

export const FoodChart = ({
  title,
  chartData,
  dataKey,
  color,
  onNavigate,
  useFullWidthLabels = false,
  height = "h-24",
}: FoodChartProps) => {
  const isMobile = useIsMobile();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Reset active bar when chart data changes
  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isMobile) {
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
      {isMobile && activeBarIndex !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveBarIndex(null)}
        />
      )}
      
      <div className="relative z-20">
        <CardHeader className="p-2 pb-1">
          <ChartTitle>{title}</ChartTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className={height}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval="preserveStartEnd"
                  tickMargin={2}
                  height={16}
                />
                <Tooltip
                  active={isMobile ? activeBarIndex !== null : undefined}
                  payload={isMobile && activeBarIndex !== null 
                    ? [{ payload: chartData[activeBarIndex] }] 
                    : undefined}
                  label={isMobile && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      isMobile={isMobile}
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
  formatter?: (value: any, name: string) => string;
  totalKey?: string;
  totalLabel?: string;
  totalColor?: string;
  labelDataKey?: string;
  labelColor?: string;
  height?: string;
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
}: StackedMacroChartProps) => {
  const isMobile = useIsMobile();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isMobile) {
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
      {isMobile && activeBarIndex !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveBarIndex(null)}
        />
      )}
      
      <div className="relative z-20">
        <CardHeader className="p-2 pb-1">
          <ChartTitle>{title}</ChartTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className={height}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ 
                  top: labelDataKey ? getFoodChartMarginTop(chartData.length) : 4, 
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
                <Tooltip
                  active={isMobile ? activeBarIndex !== null : undefined}
                  payload={isMobile && activeBarIndex !== null 
                    ? bars.map(bar => ({ 
                        payload: chartData[activeBarIndex],
                        dataKey: bar.dataKey,
                        name: bar.name,
                        value: chartData[activeBarIndex]?.[bar.dataKey],
                        color: bar.color,
                      }))
                    : undefined}
                  label={isMobile && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      formatter={formatter}
                      totalKey={totalKey}
                      totalLabel={totalLabel}
                      totalColor={totalColor}
                      isMobile={isMobile}
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
                    stackId="stack"
                    fill={bar.color}
                    radius={bar.isTop ? [2, 2, 0, 0] : undefined}
                    onClick={(data, index) => handleBarClick(data, index)}
                    className="cursor-pointer"
                  >
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
  chartData,
  color,
  unit,
  onNavigate,
}: VolumeChartProps) => {
  const isMobile = useIsMobile();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveBarIndex(null);
  }, [chartData]);

  const handleBarClick = (data: any, index: number) => {
    if (isMobile) {
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
      {isMobile && activeBarIndex !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveBarIndex(null)}
        />
      )}
      
      <div className="relative z-20">
        <CardHeader className="p-2 pb-1">
          <ChartTitle>{title}</ChartTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
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
                  active={isMobile ? activeBarIndex !== null : undefined}
                  payload={isMobile && activeBarIndex !== null 
                    ? [{ payload: chartData[activeBarIndex] }] 
                    : undefined}
                  label={isMobile && activeBarIndex !== null 
                    ? chartData[activeBarIndex]?.date 
                    : undefined}
                  content={
                    <CompactTooltip
                      formatter={(value: number) => `${value.toLocaleString()} ${unit}`}
                      isMobile={isMobile}
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
