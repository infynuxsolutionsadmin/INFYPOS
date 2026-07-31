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
  Legend,
} from 'recharts';
import { CHART_GRID_STROKE } from './chart-config';

export interface RevenueProfitTrendPoint {
  period: string;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
}

interface RevenueGrossProfitChartProps {
  data: RevenueProfitTrendPoint[];
}

function RevenueGrossProfitChartInner({ data }: RevenueGrossProfitChartProps) {
  const formattedData = data.map((d) => {
    let dateStr = d.period;
    if (d.period && d.period.includes('-')) {
      const parts = d.period.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      }
    }
    return {
      ...d,
      displayDate: dateStr,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueBlueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGreenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="displayDate"
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
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const item = payload[0].payload as RevenueProfitTrendPoint & { displayDate: string };
            return (
              <div className="rounded-lg border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-md space-y-1.5 min-w-[170px]">
                <p className="font-bold text-foreground border-b border-border/50 pb-1">
                  {item.period}
                </p>
                <div className="flex justify-between items-center text-blue-400 font-medium">
                  <span>Revenue:</span>
                  <span className="font-mono font-bold">£{item.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400 font-medium">
                  <span>Gross Profit:</span>
                  <span className="font-mono font-bold">£{item.grossProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-purple-400 font-medium border-t border-border/30 pt-1">
                  <span>Gross Margin:</span>
                  <span className="font-mono font-bold">{item.grossMargin.toFixed(1)}%</span>
                </div>
              </div>
            );
          }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
        />

        <Area
          name="Revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#revenueBlueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />

        <Area
          name="Gross Profit"
          type="monotone"
          dataKey="grossProfit"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#profitGreenGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const RevenueGrossProfitChart = memo(RevenueGrossProfitChartInner);
