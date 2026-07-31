import { api } from './api';
import { ApiResponse } from '../types/auth';
import { TenantItem, UpdateTenantPayload } from '../types/tenants';

export const tenantsService = {
  async getCurrent(): Promise<ApiResponse<TenantItem>> {
    const res = await api.get<ApiResponse<TenantItem>>('/tenants/me');
    return res.data;
  },

  async updateCurrent(payload: UpdateTenantPayload): Promise<ApiResponse<TenantItem>> {
    const res = await api.patch<ApiResponse<TenantItem>>('/tenants/me', payload);
    return res.data;
  },
};
