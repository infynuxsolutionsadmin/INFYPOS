import { api } from './api';
import { ApiResponse } from '../types/auth';
import { CreateUserPayload, UpdateUserPayload, UserItem } from '../types/users';

export const usersService = {
  async getAll(): Promise<ApiResponse<UserItem[]>> {
    const res = await api.get<ApiResponse<UserItem[]>>('/users');
    return res.data;
  },

  async getById(id: string): Promise<ApiResponse<UserItem>> {
    const res = await api.get<ApiResponse<UserItem>>(`/users/${id}`);
    return res.data;
  },

  async create(payload: CreateUserPayload): Promise<ApiResponse<UserItem>> {
    const res = await api.post<ApiResponse<UserItem>>('/users', payload);
    return res.data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ApiResponse<UserItem>> {
    const res = await api.patch<ApiResponse<UserItem>>(`/users/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(`/users/${id}`);
    return res.data;
  },
};
