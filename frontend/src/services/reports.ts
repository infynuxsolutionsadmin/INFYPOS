import { api } from './api';

export interface CategorySummaryItem {
  category: string;
  count: number;
}

export interface InventoryReportSummary {
  totalInventory: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface StoreSummaryItem {
  storeId: string;
  storeName: string;
  productsCount: number;
  totalStock: number;
}

export interface ActivityReportItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export const reportsService = {
  async getCategorySummary(): Promise<CategorySummaryItem[]> {
    const res = await api.get<any>('/reports/category-summary');
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async getInventorySummary(): Promise<InventoryReportSummary> {
    const res = await api.get<any>('/reports/inventory-summary');
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async getStoreSummary(): Promise<StoreSummaryItem[]> {
    const res = await api.get<any>('/reports/store-summary');
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async getActivity(): Promise<ActivityReportItem[]> {
    const res = await api.get<any>('/reports/activity');
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },
};
export default reportsService;
