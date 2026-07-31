export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  plan?: string;
  currency?: string;
  status?: string;
}
