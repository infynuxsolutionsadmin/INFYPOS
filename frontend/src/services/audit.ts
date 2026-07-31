import { api } from './api';
import { ApiResponse } from '../types/auth';

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  table: string;
  recordId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface QueryAuditLogParams {
  page?: number;
  limit?: number;
  search?: string;
  table?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditService = {
  async getLogs(params?: QueryAuditLogParams): Promise<PaginatedResponse<AuditLogItem>> {
    const res = await api.get<any>('/audit', { params });
    return res.data.data;
  },

  async getLog(id: string): Promise<ApiResponse<AuditLogItem>> {
    const res = await api.get<any>(`/audit/${id}`);
    return res.data.data;
  },
};
export default auditService;
