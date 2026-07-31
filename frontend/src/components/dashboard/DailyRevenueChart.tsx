'use client';

import { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from './chart-config';

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
  transactions: number;
}

interface DailyRevenueChartProps {
  data: DailyRevenuePoint[];
}

function DailyRevenueChartInner({ data }: DailyRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="biRevenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
          tickFormatter={(val) => {
            if (!val) return '';
            const parts = val.split('-');
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
          }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
          tickFormatter={(val) => `£${val}`}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={{ stroke: 'hsl(142 71% 45% / 0.3)' }}
          formatter={(value: any, name: any) => [
            name === 'revenue' ? `£${Number(value).toFixed(2)}` : value,
            name === 'revenue' ? 'Revenue' : 'Transactions',
          ]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
          fill="url(#biRevenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(142 71% 45%)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const DailyRevenueChart = memo(DailyRevenueChartInner);
