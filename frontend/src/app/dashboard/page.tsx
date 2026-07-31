'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardFilters } from '@/services/dashboard';
import {
  TrendingUp,
  Percent,
  Receipt,
  ShoppingBag,
  Store,
  Boxes,
  AlertTriangle,
  Users,
  UserCheck,
  Plus,
  Shield,
  FileText,
  DollarSign,
  PackageCheck,
  ChevronRight,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Activity,
  Tag,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartSkeleton, Skeleton } from '@/components/ui/skeleton';

// Dynamic Chart Component Imports
const RevenueGrossProfitChart = dynamic(
  () => import('@/components/dashboard/RevenueGrossProfitChart').then((m) => m.RevenueGrossProfitChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const DailyRevenueChart = dynamic(
  () => import('@/components/dashboard/DailyRevenueChart').then((m) => m.DailyRevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const HourlySalesChart = dynamic(
  () => import('@/components/dashboard/HourlySalesChart').then((m) => m.HourlySalesChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const PaymentDistributionChart = dynamic(
  () => import('@/components/dashboard/PaymentDistributionChart').then((m) => m.PaymentDistributionChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const CategoryBarChart = dynamic(
  () => import('@/components/dashboard/CategoryBarChart').then((m) => m.CategoryBarChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

const QUICK_ACTIONS = [
  { href: '/products', icon: Boxes, label: 'Products', desc: 'Catalog management', color: 'text-cyan-400' },
  { href: '/roles', icon: Shield, label: 'Roles', desc: 'RBAC permissions', color: 'text-amber-400' },
  { href: '/reports', icon: FileText, label: 'Reports', desc: 'BI Analytics', color: 'text-violet-400' },
  { href: '/stores', icon: Store, label: 'Stores', desc: 'Store locations', color: 'text-blue-400' },
] as const;

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'year' },
];

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const { profile, userRole } = useAuth();
  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Global Dashboard Filter State
  const [filters, setFilters] = useState<DashboardFilters>({
    preset: '30days',
  });

  // Real Executive BI Query with 30-second Auto-Refresh
  const { data: biData, isLoading, isFetching } = useQuery({
    queryKey: ['executive-bi-dashboard', filters],
    queryFn: () => dashboardService.getExecutiveDashboard(filters),
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const summary = biData?.summary;
  const inventory = biData?.inventory;
  const customers = biData?.customers;
  const vat = biData?.vat;
  const alerts = biData?.alerts || [];
  const activityFeed = biData?.activityFeed || [];
  const charts = biData?.charts;

  // Currency & Percentage Helpers
  const fmtGbp = (val?: number) => `£${Number(val || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (val?: number) => `${Number(val || 0).toFixed(1)}%`;

  // CSV Export Trigger
  const handleExportCsv = () => {
    if (!summary) return;
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Revenue', fmtGbp(summary.revenue)],
      ['Gross Profit', fmtGbp(summary.grossProfit)],
      ['Gross Margin %', fmtPct(summary.grossMargin)],
      ['Transactions Count', summary.transactions],
      ['Average Basket', fmtGbp(summary.averageBasket)],
      ['Today Revenue', fmtGbp(summary.todayRevenue)],
      ['Current Month Revenue', fmtGbp(summary.currentMonthRevenue)],
      ['Previous Month Revenue', fmtGbp(summary.previousMonthRevenue)],
      ['Month Growth %', fmtPct(summary.growthPercentage)],
      ['Products Sold Count', summary.productsSold],
      ['Average Items Per Basket', summary.avgItemsPerBasket.toFixed(1)],
      ['Average Discount Per Sale', fmtGbp(summary.avgDiscount)],
      ['Refund Amount Total', fmtGbp(summary.refundAmount)],
      ['Voided Sales Count', summary.voidedCount],
      ['Top Payment Method', summary.topPaymentMethod],
      ['Inventory Cost Value', fmtGbp(inventory?.inventoryCostValue)],
      ['Inventory Retail Value', fmtGbp(inventory?.inventoryRetailValue)],
      ['Low Stock Items Count', inventory?.lowStock || 0],
      ['Out of Stock Items Count', inventory?.outOfStock || 0],
      ['Total VAT Collected', fmtGbp(vat?.vatCollected)],
    ].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `INFYPOS_Executive_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Executive Page Header */}
      <PageHeader
        title={`Executive Control Center — ${profile?.tenant?.name || 'INFYPOS'}`}
        description="Real-time production Business Intelligence aggregated directly from your PostgreSQL database."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            {isFetching && (
              <Badge variant="secondary" className="animate-pulse text-[11px] text-primary border-primary/30">
                Live Refreshing...
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={isLoading}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            {isOwner && (
              <Link href="/dev/sales-test">
                <Button size="sm" variant="default">
                  <Plus className="h-4 w-4" />
                  <span>Dev Sales Tool</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Global Executive Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>Dashboard Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setFilters((prev) => ({ ...prev, preset: preset.value }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filters.preset === preset.value
                  ? 'bg-primary text-primary-foreground font-bold shadow'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Key Financial BI KPIs (Clickable Drill-Down) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Total Revenue"
            value={isLoading ? 0 : fmtGbp(summary?.revenue)}
            loading={isLoading}
            icon={TrendingUp}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            footer={`Today's Revenue: ${fmtGbp(summary?.todayRevenue)}`}
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Gross Profit"
            value={isLoading ? 0 : fmtGbp(summary?.grossProfit)}
            loading={isLoading}
            icon={DollarSign}
            iconClassName="bg-blue-500/10 text-blue-400"
            footer="SUM((Taxable Net - Cost) × Qty)"
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Gross Margin %"
            value={isLoading ? 0 : fmtPct(summary?.grossMargin)}
            loading={isLoading}
            icon={Percent}
            iconClassName="bg-purple-500/10 text-purple-400"
            footer={`MoM Growth: ${fmtPct(summary?.growthPercentage)}`}
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Transactions"
            value={isLoading ? 0 : (summary?.transactions ?? 0).toLocaleString()}
            loading={isLoading}
            icon={ShoppingBag}
            iconClassName="bg-cyan-500/10 text-cyan-400"
            footer={`Average Basket: ${fmtGbp(summary?.averageBasket)}`}
          />
        </div>
      </div>

      {/* Row 2: Secondary Operational KPIs (Clickable Drill-Down) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="UK VAT Collected"
            value={isLoading ? 0 : fmtGbp(vat?.vatCollected)}
            loading={isLoading}
            icon={Receipt}
            iconClassName="bg-amber-500/10 text-amber-400"
            footer={`${vat?.breakdown?.length || 0} active tax bands`}
          />
        </div>

        <div onClick={() => router.push('/products')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Inventory Cost Value"
            value={isLoading ? 0 : fmtGbp(inventory?.inventoryCostValue)}
            loading={isLoading}
            icon={Boxes}
            iconClassName="bg-indigo-500/10 text-indigo-400"
            footer={`Retail Value: ${fmtGbp(inventory?.inventoryRetailValue)}`}
          />
        </div>

        <div onClick={() => router.push('/products')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Low Stock Alert"
            value={isLoading ? 0 : inventory?.lowStock ?? 0}
            loading={isLoading}
            icon={AlertTriangle}
            iconClassName="bg-amber-500/10 text-amber-400"
            valueClassName="text-amber-400"
            footer={`${inventory?.outOfStock ?? 0} items strictly out of stock`}
          />
        </div>

        <div onClick={() => router.push('/products')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Products Sold"
            value={isLoading ? 0 : summary?.productsSold ?? 0}
            loading={isLoading}
            icon={PackageCheck}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            footer={`Avg ${summary?.avgItemsPerBasket?.toFixed(1) || 0} items / basket`}
          />
        </div>
      </div>

      {/* Row 3: Additional Business Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => router.push('/customers')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Total Customers"
            value={isLoading ? 0 : customers?.totalCustomers ?? 0}
            loading={isLoading}
            icon={Users}
            iconClassName="bg-blue-500/10 text-blue-400"
            footer={`${customers?.returningCustomers ?? 0} returning multi-buyers`}
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Top Payment Method"
            value={isLoading ? '-' : summary?.topPaymentMethod || 'CASH'}
            loading={isLoading}
            icon={Tag}
            iconClassName="bg-purple-500/10 text-purple-400"
            footer={`Avg Discount: ${fmtGbp(summary?.avgDiscount)}`}
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Refunds Processed"
            value={isLoading ? 0 : fmtGbp(summary?.refundAmount)}
            loading={isLoading}
            icon={RotateCcw}
            iconClassName="bg-red-500/10 text-red-400"
            valueClassName="text-red-400"
            footer={`${summary?.voidedCount ?? 0} voided sales`}
          />
        </div>

        <div onClick={() => router.push('/reports')} className="cursor-pointer transition hover:opacity-90">
          <KpiCard
            label="Current Month Sales"
            value={isLoading ? 0 : fmtGbp(summary?.currentMonthRevenue)}
            loading={isLoading}
            icon={TrendingUp}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            footer={`Prev Month: ${fmtGbp(summary?.previousMonthRevenue)}`}
          />
        </div>
      </div>

      {/* Row 4: Primary Chart — Revenue & Gross Profit Trend (Replaces demo/hardcoded chart) */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Revenue & Gross Profit</CardTitle>
            <CardDescription>Daily Revenue and Gross Profit Trend (Last 30 Days)</CardDescription>
          </div>
          <Badge variant="secondary" className="text-emerald-400 border-emerald-500/20">
            Live PostgreSQL Aggregates
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <RevenueGrossProfitChart data={charts?.revenueProfitTrend || []} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Row 5: 30-Day Daily Revenue & 24h Hourly Sales Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>30-Day Daily Revenue Trend</CardTitle>
              <CardDescription>Continuous daily revenue timeline with zero-filled missing dates</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <DailyRevenueChart data={charts?.dailyRevenue || []} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>24-Hour Sales Distribution</CardTitle>
            <CardDescription>Hourly transaction breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <HourlySalesChart data={charts?.hourlySales || []} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Category Performance & Payment Methods */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Real sales revenue grouped by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <CategoryBarChart
                  data={(charts?.categoryPerformance || []).map((c) => ({
                    name: c.category,
                    Sales: c.revenue,
                  }))}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>Cash, Card, UPI, Store Credit & Custom tender breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <PaymentDistributionChart data={charts?.paymentDistribution || []} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Executive Alerts Panel & Recent Activity Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Executive Alerts Widget */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <CardTitle>Executive Alerts</CardTitle>
            </div>
            <CardDescription>Actionable store & catalog warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              ) : alerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                  <span>No operational alerts! Catalog & inventory are healthy.</span>
                </div>
              ) : (
                alerts.map((al) => (
                  <Link
                    key={al.id}
                    href={al.actionUrl}
                    className="block p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-xs text-amber-400">{al.title}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{al.message}</p>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Activity Feed Widget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Recent Audit Activity Feed</CardTitle>
            </div>
            <CardDescription>Live operational movements stream across stores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))
              ) : activityFeed.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  No activity logs recorded yet.
                </div>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 text-xs border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{act.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        By <span className="font-semibold text-foreground">{act.user}</span> • {act.store} • {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 8: Top Products & UK VAT Breakdown Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top 10 Products Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Top Selling Catalog Items</CardTitle>
              <CardDescription>Ranked by total quantity sold with Gross Profit</CardDescription>
            </div>
            <Link href="/products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View Catalog <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2 text-right">Units Sold</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-2.5"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-2.5"><Skeleton className="h-3 w-16" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (charts?.topProducts || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                        No products sold yet. Process sales in the dev panel to populate real BI data.
                      </td>
                    </tr>
                  ) : (
                    charts?.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition">
                        <td className="py-2.5 font-medium text-foreground">{p.product}</td>
                        <td className="py-2.5 font-mono text-muted-foreground">{p.sku}</td>
                        <td className="py-2.5 text-right font-bold text-foreground">{p.quantitySold}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">{fmtGbp(p.revenue)}</td>
                        <td className="py-2.5 text-right font-bold text-blue-400">{fmtGbp(p.grossProfit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* UK VAT Collection Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>UK VAT Tax Band Breakdown</CardTitle>
            <CardDescription>Net taxable sales and VAT collected by tax rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="pb-2">VAT Category</th>
                    <th className="pb-2">Rate %</th>
                    <th className="pb-2 text-right">Taxable Net</th>
                    <th className="pb-2 text-right">VAT Collected</th>
                    <th className="pb-2 text-right">Gross Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-2.5"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-2.5"><Skeleton className="h-4 w-10" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="py-2.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (vat?.breakdown || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                        No VAT data available.
                      </td>
                    </tr>
                  ) : (
                    vat?.breakdown.map((vb, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition">
                        <td className="py-2.5 font-medium text-foreground">{vb.vatRateName}</td>
                        <td className="py-2.5 font-bold text-primary">{vb.vatPercentage}%</td>
                        <td className="py-2.5 text-right text-muted-foreground">{fmtGbp(vb.taxableSales)}</td>
                        <td className="py-2.5 text-right font-bold text-amber-400">{fmtGbp(vb.vatCollected)}</td>
                        <td className="py-2.5 text-right font-bold text-foreground">{fmtGbp(vb.grossSales)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 9: Quick Navigation Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Operational Navigation</CardTitle>
          <CardDescription>Direct jump to management modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-accent/40 transition text-center space-y-1.5"
                >
                  <Icon className={`h-6 w-6 ${action.color}`} />
                  <p className="text-xs font-bold text-foreground">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
