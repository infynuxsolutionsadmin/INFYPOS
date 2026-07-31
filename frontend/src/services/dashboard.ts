import { api } from './api';

export interface DashboardOverview {
  totalProducts: number;
  totalStores: number;
  totalUsers: number;
  totalInventory: number;
  lowStock: number;
  outOfStock: number;
}

export interface CategoryShare {
  category: string;
  count: number;
}

export interface InventorySummary {
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  productName: string;
  sku: string;
  storeName: string;
  currentStock: number;
  reorderLevel: number;
}

export interface SalesPerformancePoint {
  name: string;
  Sales: number;
  Revenue: number;
}

export interface ExecutiveDashboardBIResponse {
  summary: {
    revenue: number;
    grossProfit: number;
    grossMargin: number;
    transactions: number;
    averageBasket: number;
    todayRevenue: number;
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    growthPercentage: number;
    productsSold: number;
    avgItemsPerBasket: number;
    avgDiscount: number;
    refundAmount: number;
    voidedCount: number;
    topPaymentMethod: string;
  };
  inventory: {
    inventoryCostValue: number;
    inventoryRetailValue: number;
    lowStock: number;
    outOfStock: number;
    inactiveProducts: number;
    productsMissingVat: number;
  };
  customers: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    guestCheckouts: number;
    averageSpend: number;
    topCustomer: { name: string; code: string; totalSpend: number } | null;
  };
  vat: {
    vatCollected: number;
    breakdown: Array<{
      vatRateName: string;
      vatPercentage: number;
      taxableSales: number;
      vatCollected: number;
      grossSales: number;
      transactions: number;
    }>;
  };
  alerts: Array<{
    id: string;
    severity: 'high' | 'medium' | 'info';
    title: string;
    message: string;
    actionUrl: string;
  }>;
  activityFeed: Array<{
    id: string;
    type: string;
    message: string;
    user: string;
    store: string;
    createdAt: string;
  }>;
  charts: {
    revenueProfitTrend: Array<{ period: string; revenue: number; grossProfit: number; grossMargin: number }>;
    dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
    hourlySales: Array<{ hour: number; revenue: number; transactions: number }>;
    topProducts: Array<{ product: string; sku: string; quantitySold: number; revenue: number; grossProfit: number }>;
    categoryPerformance: Array<{ category: string; revenue: number; itemsSold: number }>;
    paymentDistribution: Array<{ method: string; revenue: number; count: number; percentage: number }>;
    vatBreakdown: Array<{ vatRateName: string; vatPercentage: number; taxableSales: number; vatCollected: number; grossSales: number }>;
    inventoryStatus: Array<{ status: string; count: number }>;
    customerActivity: Array<{ type: string; count: number }>;
  };
}

export interface DashboardFilters {
  storeId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  preset?: string;
}

export const dashboardService = {
  async getExecutiveDashboard(filters?: DashboardFilters): Promise<ExecutiveDashboardBIResponse> {
    const res = await api.get<any>('/reports/dashboard', { params: filters });
    return res.data.data;
  },

  async getOverview(): Promise<DashboardOverview> {
    const res = await api.get<any>('/dashboard/overview');
    return res.data.data;
  },

  async getCategoryDistribution(): Promise<CategoryShare[]> {
    const res = await api.get<any>('/dashboard/category-distribution');
    return res.data.data ?? [];
  },

  async getInventorySummary(): Promise<InventorySummary> {
    const res = await api.get<any>('/dashboard/inventory-summary');
    return res.data.data;
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    const res = await api.get<any>('/dashboard/recent-activity');
    return res.data.data ?? [];
  },

  async getLowStock(): Promise<LowStockItem[]> {
    const res = await api.get<any>('/dashboard/low-stock');
    return res.data.data ?? [];
  },

  async getSalesPerformance(): Promise<SalesPerformancePoint[]> {
    const res = await api.get<any>('/dashboard/sales-performance');
    return res.data.data ?? [];
  },
};

export default dashboardService;
