export interface RegisterInput {
  tenantName: string;
  tenantSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status?: string;
  plan?: string;
  currency?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tenant?: TenantInfo;
  user?: UserInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  message?: string | string[];
}

export interface DecodedJwt {
  sub?: string;
  email?: string;
  tenantId?: string;
  roleId?: string;
  roleName?: string;
  permissions?: string[];
  exp?: number;
  iat?: number;
}

export interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  tenant?: TenantInfo;
  permissions?: string[];
  stores?: Array<{
    id: string;
    name: string;
    code: string;
    isMain: boolean;
    isDefault: boolean;
  }>;
}

export interface AdminDashboardMetrics {
  message: string;
  systemHealth: string;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalStores: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  }>;
  timestamp: string;
}

export type AdminDashboardData = AdminDashboardMetrics;
