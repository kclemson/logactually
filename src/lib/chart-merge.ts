import type { ChartSpec } from "@/components/trends/DynamicChart";

// Contrasting palette for Series B — picks the first that differs from Series A
const DUAL_SERIES_COLORS = ["#E11D48", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];

/** Simple hex → perceived brightness (0-255) */
function hexBrightness(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Pick a Series B color that contrasts with Series A */
function pickContrastColor(seriesAColor: string): string {
  const aBright = hexBrightness(seriesAColor);
  // Pick the color with the greatest brightness difference
  let best = DUAL_SERIES_COLORS[0];
  let bestDiff = 0;
  for (const c of DUAL_SERIES_COLORS) {
    const diff = Math.abs(hexBrightness(c) - aBright);
    // Also ensure it's not literally the same color
    if (c.toLowerCase() !== seriesAColor.toLowerCase() && diff > bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  // If all had zero diff (unlikely), just return first that isn't the same
  return best;
}

export interface MergeResult {
  mergedSpec: ChartSpec;
}

/**
 * Merge two independently-executed ChartSpec results into a single spec
 * with a `secondSeries` field for dual-axis rendering.
 *
 * Both specs must use date-based grouping (date or week).
 */
export function mergeChartSpecs(
  specA: ChartSpec,
  specB: ChartSpec,
  options?: { titleOverride?: string },
): ChartSpec {
  // Build lookup maps by rawDate (or label for weekly)
  const keyField = "rawDate";
  const mapA = new Map<string, Record<string, any>>();
  const mapB = new Map<string, Record<string, any>>();

  for (const d of specA.data) {
    const key = d[keyField] ?? d.label;
    mapA.set(key, d);
  }
  for (const d of specB.data) {
    const key = d[keyField] ?? d.label;
    mapB.set(key, d);
  }

  // Union of all date keys, sorted
  const allKeys = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();

  // Merge data
  const mergedData = allKeys.map((key) => {
    const a = mapA.get(key);
    const b = mapB.get(key);
    return {
      rawDate: key,
      label: a?.label ?? b?.label ?? key,
      value: a?.[specA.dataKey] ?? null,
      value2: b?.[specB.dataKey] ?? null,
    };
  }).filter(d => d.value != null && d.value2 != null);

  // Auto-detect whether to use dual axis
  const valuesA = mergedData.map((d) => d.value).filter((v): v is number => v != null && v !== 0);
  const valuesB = mergedData.map((d) => d.value2).filter((v): v is number => v != null && v !== 0);
  const maxA = valuesA.length > 0 ? Math.max(...valuesA) : 0;
  const maxB = valuesB.length > 0 ? Math.max(...valuesB) : 0;
  const ratio = maxA > 0 && maxB > 0 ? Math.max(maxA / maxB, maxB / maxA) : 1;
  const useRightAxis = ratio > 3;

  // Pick Series B color
  const colorB = pickContrastColor(specA.color);

  const title = options?.titleOverride ?? `${specA.title} vs ${specB.title}`;

  return {
    chartType: specA.chartType,
    title,
    xAxis: specA.xAxis,
    yAxis: specA.yAxis,
    color: specA.color,
    data: mergedData,
    dataKey: "value",
    valueFormat: specA.valueFormat,
    referenceLine: specA.referenceLine,
    dataSource: specA.dataSource !== specB.dataSource ? "mixed" : specA.dataSource,
    groupBy: specA.groupBy,
    secondSeries: {
      dataKey: "value2",
      chartType: specB.chartType,
      color: colorB,
      label: specB.yAxis?.label ?? specB.title,
      valueFormat: specB.valueFormat,
      useRightAxis,
    },
  };
}
