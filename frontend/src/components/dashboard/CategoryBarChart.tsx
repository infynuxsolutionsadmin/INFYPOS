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

export interface CategoryChartItem {
  name: string;
  Sales: number;
}

interface CategoryBarChartProps {
  data: CategoryChartItem[];
}

function CategoryBarChartInner({ data }: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 11 }}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={88}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(0 0% 55%)', fontSize: 10 }}
        />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }} />
        <Bar
          dataKey="Sales"
          fill="hsl(221 83% 53%)"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CategoryBarChart = memo(CategoryBarChartInner);
