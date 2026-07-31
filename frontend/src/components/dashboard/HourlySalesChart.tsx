'use client';

import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from './chart-config';

export interface HourlySalesPoint {
  hour: number;
  revenue: number;
  transactions: number;
}

interface HourlySalesChartProps {
  data: HourlySalesPoint[];
}

function HourlySalesChartInner({ data }: HourlySalesChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: `${String(d.hour).padStart(2, '0')}:00`,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formattedData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
          tickFormatter={(val) => `£${val}`}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: any, name: any) => [
            name === 'revenue' ? `£${Number(value).toFixed(2)}` : value,
            name === 'revenue' ? 'Revenue' : 'Transactions',
          ]}
        />
        <Bar
          dataKey="revenue"
          fill="hsl(221 83% 53%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const HourlySalesChart = memo(HourlySalesChartInner);
