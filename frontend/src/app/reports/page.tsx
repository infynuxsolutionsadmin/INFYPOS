'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Boxes,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reports';
import { dashboardService } from '../../services/dashboard';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';

const RevenueGrossProfitChart = dynamic(
  () => import('@/components/dashboard/RevenueGrossProfitChart').then((m) => m.RevenueGrossProfitChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  // 1. Live Executive BI Data Query
  const { data: biData, isLoading: loadingBi } = useQuery({
    queryKey: ['reports-executive-bi'],
    queryFn: () => dashboardService.getExecutiveDashboard(),
  });

  // 2. Store stock distribution query
  const { data: storeSummaryData, isLoading: loadingStores } = useQuery({
    queryKey: ['report-store-summary'],
    queryFn: () => reportsService.getStoreSummary(),
  });

  // 3. Category distribution query
  const { data: categorySummaryData, isLoading: loadingCategories } = useQuery({
    queryKey: ['report-category-summary'],
    queryFn: () => reportsService.getCategorySummary(),
  });

  // 4. Inventory stock status summary query
  const { data: inventorySummaryData } = useQuery({
    queryKey: ['report-inventory-summary'],
    queryFn: () => reportsService.getInventorySummary(),
  });

  const handleExport = (format: string) => {
    toast.success(`Exporting financials as ${format}...`);
  };

  // Format store performance from live data
  const storeList = Array.isArray(storeSummaryData)
    ? storeSummaryData
    : Array.isArray((storeSummaryData as any)?.data)
      ? (storeSummaryData as any).data
      : [];
  const totalStock = storeList.reduce((acc: number, s: any) => acc + (s.totalStock || 0), 0);
  const storePerformance = storeList.map((s: any) => ({
    name: s.storeName,
    value: totalStock > 0 ? Math.round(((s.totalStock || 0) / totalStock) * 100) : 0,
  }));

  const categories = Array.isArray(categorySummaryData)
    ? categorySummaryData
    : Array.isArray((categorySummaryData as any)?.data)
      ? (categorySummaryData as any).data
      : [];

  const inventorySummary = (inventorySummaryData as any)?.data && !('totalInventory' in (inventorySummaryData as any))
    ? (inventorySummaryData as any).data
    : inventorySummaryData || {};

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Reports & Financial Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time Gross Profit margins, store inventory distribution, and category analytics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('PDF')}
            className="inline-flex items-center space-x-1.5 bg-accent text-accent-foreground font-semibold px-3 py-2 rounded-xl text-xs hover:bg-accent/80 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="inline-flex items-center space-x-1.5 bg-primary text-primary-foreground font-semibold px-3 py-2 rounded-xl text-xs hover:bg-primary/95 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Stock Units
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {inventorySummary?.totalInventory ?? 0} PCS
            </h2>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Low Stock Items
            </span>
            <h2 className="text-2xl font-black text-emerald-500 tracking-tight">
              {inventorySummary?.lowStock ?? 0}
            </h2>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Out of Stock Items
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {inventorySummary?.outOfStock ?? 0}
            </h2>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Live Revenue & Gross Profit Chart */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Revenue & Gross Profit</h3>
            <p className="text-xs text-muted-foreground">Daily Revenue and Gross Profit Trend (Last 30 Days)</p>
          </div>
          <div className="h-72 w-full pt-4">
            {loadingBi ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              <RevenueGrossProfitChart data={biData?.charts?.revenueProfitTrend || []} />
            )}
          </div>
        </div>

        {/* Store Share */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Stock Share by Store</h3>
            <p className="text-xs text-muted-foreground">Gross contribution share percentage</p>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            {loadingStores ? (
              <p className="text-xs text-muted-foreground italic">Loading stores...</p>
            ) : storePerformance.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No store data found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={storePerformance} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {storePerformance.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1 text-xs">
            {storePerformance.map((store: any, index: number) => (
              <div key={store.name} className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{store.name}</span>
                </div>
                <span className="font-bold">{store.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Category Stock Distribution</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-muted-foreground font-bold">
                <th className="p-3">Category Name</th>
                <th className="p-3 text-right">Products Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {loadingCategories ? (
                <tr>
                  <td colSpan={2} className="p-3 text-center text-muted-foreground italic">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-3 text-center text-muted-foreground italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c: any) => (
                  <tr key={c.category} className="hover:bg-muted/10 transition">
                    <td className="p-3 font-semibold">{c.category}</td>
                    <td className="p-3 text-right font-mono font-bold">{c.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
