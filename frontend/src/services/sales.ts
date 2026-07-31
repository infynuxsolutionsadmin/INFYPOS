import { api } from './api';

export interface CreateSaleItemPayload {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
  vatRateId?: string;
}

export interface CreatePaymentPayload {
  method: string;
  amount: number;
  transactionRef?: string;
}

export interface CreateSalePayload {
  storeId: string;
  items: CreateSaleItemPayload[];
  payments: CreatePaymentPayload[];
  customerId?: string;
  discountId?: string;
  notes?: string;
}

export interface QuerySaleParams {
  page?: number;
  limit?: number;
  search?: string;
  storeId?: string;
  cashierId?: string;
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const salesService = {
  async create(payload: CreateSalePayload) {
    const res = await api.post<any>('/sales', payload);
    return res.data.data;
  },

  async getAll(params?: QuerySaleParams) {
    const res = await api.get<any>('/sales', { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get<any>(`/sales/${id}`);
    return res.data.data;
  },

  async getSummary(params?: { storeId?: string; dateFrom?: string; dateTo?: string }) {
    const res = await api.get<any>('/sales/summary', { params });
    return res.data.data;
  },

  async void(id: string, reason: string) {
    const res = await api.post<any>(`/sales/${id}/void`, { reason });
    return res.data.data;
  },
};

export default salesService;
