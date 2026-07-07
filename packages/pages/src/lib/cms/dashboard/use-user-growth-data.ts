import { useMemo, useState } from 'react';
import { useReadUserGrowthStatsQuery } from '@inithium/store';

export type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

const formatLabel = (bucket: string, range: TimeRange): string => {
  if (bucket.length === 7) {
    const [year, month] = bucket.split('-');
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    });
  }
  return new Date(bucket).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const useUserGrowthChart = () => {
  const [range, setRange] = useState<TimeRange>('month');
  const { data, isLoading, isFetching } = useReadUserGrowthStatsQuery({ range });

  const chartData = useMemo(() => {
    if (!data) return [];
    let cumulative = data.baselineCount;
    return data.data.map((point) => { 
      cumulative += point.count;
      return { date: point.bucket, label: formatLabel(point.bucket, range), count: point.count, cumulative };
    });
  }, [data, range]);

  return { range, setRange, chartData, isLoading: isLoading || isFetching };
};