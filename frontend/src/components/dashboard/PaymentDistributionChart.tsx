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
  Cell,
} from 'recharts';
import { CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from './chart-config';

export interface PaymentDistPoint {
  method: string;
  revenue: number;
  count: number;
  percentage: number;
}

interface PaymentDistributionChartProps {
  data: PaymentDistPoint[];
}

const COLORS = [
  'hsl(142 71% 45%)',
  'hsl(221 83% 53%)',
  'hsl(262 83% 58%)',
  'hsl(31 90% 55%)',
  'hsl(199 89% 48%)',
];

function PaymentDistributionChartInner({ data }: PaymentDistributionChartProps) {
  const activeData = data.filter((d) => d.revenue > 0);
  const displayData = activeData.length > 0 ? activeData : data;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={displayData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
          tickFormatter={(val) => `£${val}`}
        />
        <YAxis
          dataKey="method"
          type="category"
          width={90}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={(value: any, name: any, item: any) => [
            `£${Number(value).toFixed(2)} (${Number(item.payload.percentage).toFixed(1)}%)`,
            'Revenue',
          ]}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {displayData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const PaymentDistributionChart = memo(PaymentDistributionChartInner);
