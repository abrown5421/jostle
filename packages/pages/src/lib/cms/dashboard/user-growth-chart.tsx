import { Box, Button, Text } from '@inithium/ui';
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TimeRange, useUserGrowthChart } from './use-user-growth-data';

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const UserGrowthChart: React.FC = () => {
  const { range, setRange, chartData } = useUserGrowthChart();

  return (
    <Box color="surface3-contrast" flex direction="col" padding="md" className="rounded-xl w-full">
      <Box flex direction="row" align="center" justify="between" className="w-full mb-4">
        <Text variant="h6" color="surface" decoration={{ bold: true }}>
          User Growth
        </Text>
        <Box flex direction="row" className="gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              color={range === opt.value ? "primary" : "surface"}
              variant={range === opt.value ? "solid" : "ghost"}
              size="sm"
              rounded
            >
              {opt.label}
            </Button>
          ))}
        </Box>
      </Box>

      {chartData.length === 0 ? (
        <Box flex direction="col" align="center" padding="lg">
          <Text variant="body2" color="surface2-contrast" overrideClassName="opacity-70">
            No users joined in this period.
          </Text>
        </Box>
      ) : (
        <div className="w-full h-72 relative min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={288}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#115e7a" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#115e7a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any, name: any) => [
                  value,
                  name === 'cumulative' ? 'Total Users' : 'New Users',
                ]}
              />
              <Area type="monotone" dataKey="cumulative" stroke="#115e7a" fill="url(#userGrowthGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Box>
  );
};

export default UserGrowthChart;