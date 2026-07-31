export interface StoreAssignment {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
  isDefault?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface UserItem {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  role?: UserRole;
  stores?: StoreAssignment[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
  storeIds?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId?: string;
  storeIds?: string[];
}
