import { api } from './api';
import { ApiResponse } from '../types/auth';
import {
  CreateStorePayload,
  PaginatedResponse,
  StoreItem,
  UpdateStorePayload,
} from '../types/stores';

export interface QueryStoreParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const storesService = {
  async getAll(params?: QueryStoreParams): Promise<PaginatedResponse<StoreItem>> {
    const res = await api.get<any>('/stores', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<ApiResponse<StoreItem>> {
    const res = await api.get<any>(`/stores/${id}`);
    return res.data.data;
  },

  async create(payload: CreateStorePayload): Promise<ApiResponse<StoreItem>> {
    const res = await api.post<any>('/stores', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateStorePayload): Promise<ApiResponse<StoreItem>> {
    const res = await api.patch<any>(`/stores/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.delete<any>(`/stores/${id}`);
    return res.data.data;
  },
};
