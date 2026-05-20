import { useCustomLogTrendSingle } from '@/hooks/useCustomLogTrendSingle';
import { CustomLogTrendChart } from '@/components/trends/CustomLogTrendChart';
import type { CustomLogType } from '@/hooks/useCustomLogTypes';

interface CustomLogGroupTrendProps {
  logType: CustomLogType;
}

/**
 * Inline all-time trend chart rendered beneath a chartable custom log group
 * on the day's log page. Reuses the same chart shown under the entry dialog.
 * Renders nothing for non-chartable types or when there's no data.
 */
export function CustomLogGroupTrend({ logType }: CustomLogGroupTrendProps) {
  const { data: trend } = useCustomLogTrendSingle(
    logType.id,
    logType.name,
    logType.value_type,
  );

  if (!trend) return null;

  return (
    <div className="mt-2 border-t border-border/50 pt-2">
      <CustomLogTrendChart trend={trend} onNavigate={() => {}} />
    </div>
  );
}
