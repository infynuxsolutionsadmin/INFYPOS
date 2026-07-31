import { api } from './api';

export interface CustomerItem {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  code?: string;
  loyaltyPoints?: number;
}

export interface CustomerListResponse {
  items: CustomerItem[];
  total: number;
  totalPages: number;
}

export const customersService = {
  // Returns { items, total, totalPages } from the paginated endpoint
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<CustomerListResponse> {
    const res = await api.get<any>('/customers', { params });
    // Backend envelope: res.data = { success, statusCode, data: { data: [...], meta: {...} } }
    const payload = res.data?.data ?? {};
    const items: CustomerItem[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const meta = payload?.meta ?? {};
    return {
      items,
      total: meta.total ?? items.length,
      totalPages: meta.totalPages ?? 1,
    };
  },

  async getOne(id: string): Promise<CustomerItem | null> {
    const res = await api.get<any>(`/customers/${id}`);
    return res.data?.data ?? null;
  },

  async create(data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  }): Promise<CustomerItem> {
    const res = await api.post<any>('/customers', data);
    return res.data?.data ?? res.data;
  },

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  }>): Promise<CustomerItem> {
    const res = await api.patch<any>(`/customers/${id}`, data);
    return res.data?.data ?? res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

export default customersService;
