import { api } from './api';
import { ApiResponse } from '../types/auth';
import { CreateRolePayload, PermissionItem, RoleItem, UpdateRolePayload } from '../types/roles';

export const rolesService = {
  async getAll(): Promise<ApiResponse<RoleItem[]>> {
    const res = await api.get<ApiResponse<RoleItem[]>>('/rbac/roles');
    return res.data;
  },

  async getPermissions(): Promise<ApiResponse<PermissionItem[]>> {
    const res = await api.get<ApiResponse<PermissionItem[]>>('/rbac/permissions');
    return res.data;
  },

  async create(payload: CreateRolePayload): Promise<ApiResponse<RoleItem>> {
    const res = await api.post<ApiResponse<RoleItem>>('/rbac/roles', payload);
    return res.data;
  },

  async update(id: string, payload: UpdateRolePayload): Promise<ApiResponse<RoleItem>> {
    const res = await api.patch<ApiResponse<RoleItem>>(`/rbac/roles/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.delete<ApiResponse<{ success: boolean; message: string }>>(`/rbac/roles/${id}`);
    return res.data;
  },
};
