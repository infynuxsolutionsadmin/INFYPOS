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
  ReferenceLine,
} from 'recharts';
import { CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from './chart-config';

export interface SalesDataPoint {
  name: string;
  Sales: number;
  Revenue: number;
}

interface SalesAreaChartProps {
  data: SalesDataPoint[];
}

function SalesAreaChartInner({ data }: SalesAreaChartProps) {
  const hasAnySales = data.some((d) => d.Sales > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={hasAnySales ? 0.25 : 0.08} />
            <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }}
          domain={[0, hasAnySales ? 'auto' : 1]}
          tickCount={hasAnySales ? undefined : 2}
        />
        {!hasAnySales && (
          <ReferenceLine
            y={0}
            stroke="hsl(221 83% 53% / 0.3)"
            strokeDasharray="6 3"
          />
        )}
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          cursor={{ stroke: 'hsl(221 83% 53% / 0.3)' }}
          formatter={(value: any) => [value ?? 0, 'Transactions']}
        />
        <Area
          type="monotone"
          dataKey="Sales"
          stroke={hasAnySales ? 'hsl(221 83% 53%)' : 'hsl(221 83% 53% / 0.4)'}
          strokeWidth={hasAnySales ? 2 : 1}
          strokeDasharray={hasAnySales ? undefined : '5 3'}
          fill="url(#salesGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(221 83% 53%)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const SalesAreaChart = memo(SalesAreaChartInner);
