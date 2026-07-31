import { api } from './api';
import { ApiResponse } from '../types/auth';
import { PaginatedResponse } from '../types/stores';

export interface Category {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
}

export interface CreateCategoryInput {
  name: string;
  parentId?: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: string;
  description?: string;
}

export interface QueryCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const categoriesService = {
  async getAll(params?: QueryCategoryParams): Promise<PaginatedResponse<Category>> {
    const res = await api.get<any>('/categories', { params });
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async getOne(id: string): Promise<ApiResponse<Category>> {
    const res = await api.get<any>(`/categories/${id}`);
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async create(payload: CreateCategoryInput): Promise<ApiResponse<Category>> {
    const res = await api.post<any>('/categories', payload);
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async update(id: string, payload: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    const res = await api.patch<any>(`/categories/${id}`, payload);
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.delete<any>(`/categories/${id}`);
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },
};
export default categoriesService;
