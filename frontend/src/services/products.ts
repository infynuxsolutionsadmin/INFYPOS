import { api } from './api';
import { ApiResponse } from '../types/auth';
import { CreateProductPayload, ProductItem, UpdateProductPayload } from '../types/products';
import { PaginatedResponse } from '../types/stores';

export interface QueryProductParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
}

export const productsService = {
  // Required Integration Naming
  async getProducts(params?: QueryProductParams): Promise<PaginatedResponse<ProductItem>> {
    const res = await api.get<any>('/products', { params });
    // Unwrap the global NestJS TransformInterceptor wrapper
    return res.data.data;
  },

  async getProduct(id: string): Promise<ApiResponse<ProductItem>> {
    const res = await api.get<any>(`/products/${id}`);
    return res.data.data;
  },

  async createProduct(payload: CreateProductPayload): Promise<ApiResponse<ProductItem>> {
    const res = await api.post<any>('/products', payload);
    return res.data.data;
  },

  async updateProduct(id: string, payload: UpdateProductPayload): Promise<ApiResponse<ProductItem>> {
    const res = await api.patch<any>(`/products/${id}`, payload);
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.delete<any>(`/products/${id}`);
    return res.data.data;
  },

  // Backward Compatibility Aliases
  async getAll(params?: QueryProductParams): Promise<PaginatedResponse<ProductItem>> {
    return this.getProducts(params);
  },

  async getById(id: string): Promise<ApiResponse<ProductItem>> {
    return this.getProduct(id);
  },

  async create(payload: CreateProductPayload): Promise<ApiResponse<ProductItem>> {
    return this.createProduct(payload);
  },

  async update(id: string, payload: UpdateProductPayload): Promise<ApiResponse<ProductItem>> {
    return this.updateProduct(id, payload);
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.deleteProduct(id);
  },
};
export default productsService;
