export interface PermissionItem {
  id: string;
  code: string;
  module: string;
  action?: string;
  description?: string | null;
  createdAt?: string;
}

export interface RolePermissionItem {
  id: string;
  roleId: string;
  permissionId: string;
  permission: PermissionItem;
}

export interface RoleItem {
  id: string;
  tenantId?: string | null;
  name: string;
  description?: string | null;
  isSystem: boolean;
  rank: number;
  createdAt: string;
  updatedAt?: string;
  rolePermissions?: RolePermissionItem[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  rank?: number;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  rank?: number;
}
