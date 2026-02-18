import { useState, useCallback, useEffect } from "react";
import { useHasHover } from "@/hooks/use-has-hover";

interface UseChartInteractionOptions {
  dataLength: number;
  onNavigate?: (date: string) => void;
}

export function useChartInteraction({ dataLength, onNavigate }: UseChartInteractionOptions) {
  const isTouchDevice = !useHasHover();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Reset active bar when data changes
  useEffect(() => {
    setActiveBarIndex(null);
  }, [dataLength]);

  const handleBarClick = useCallback(
    (data: any, index: number) => {
      if (isTouchDevice) {
        setActiveBarIndex((prev) => (prev === index ? null : index));
      } else if (onNavigate) {
        onNavigate(data.rawDate);
      }
    },
    [isTouchDevice, onNavigate]
  );

  const handleGoToDay = useCallback(
    (date: string) => {
      setActiveBarIndex(null);
      onNavigate?.(date);
    },
    [onNavigate]
  );

  const dismiss = useCallback(() => setActiveBarIndex(null), []);

  return {
    isTouchDevice,
    activeBarIndex,
    handleBarClick,
    handleGoToDay,
    dismiss,
    isTooltipActive: activeBarIndex !== null,
  };
}
