import { api } from './api';
import {
  AdminDashboardData,
  ApiResponse,
  AuthResponseData,
  LoginInput,
  RegisterInput,
  UserProfile,
} from '../types/auth';

export const authService = {
  async register(data: RegisterInput): Promise<ApiResponse<AuthResponseData>> {
    const res = await api.post<ApiResponse<AuthResponseData>>(
      '/auth/register',
      data,
    );
    return res.data;
  },

  async login(data: LoginInput): Promise<ApiResponse<AuthResponseData>> {
    const res = await api.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      data,
    );
    return res.data;
  },

  async refresh(refreshToken: string): Promise<ApiResponse<AuthResponseData>> {
    const res = await api.post<ApiResponse<AuthResponseData>>(
      '/auth/refresh',
      { refreshToken },
    );
    return res.data;
  },

  async logout(refreshToken: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      '/auth/logout',
      { refreshToken },
    );
    return res.data;
  },

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const res = await api.get<ApiResponse<UserProfile>>('/auth/profile');
    return res.data;
  },

  async getAdminDashboard(): Promise<ApiResponse<AdminDashboardData>> {
    const res = await api.get<ApiResponse<AdminDashboardData>>(
      '/admin/dashboard',
    );
    return res.data;
  },
};
