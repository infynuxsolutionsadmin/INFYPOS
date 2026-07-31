export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED' | 'DELETED';

export interface ProductItem {
  id: string;
  tenantId: string;
  categoryId?: string | null;
  vatRateId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  unit: string;
  costPrice: number | string;
  sellingPrice: number | string;
  status: ProductStatus;
  trackInventory: boolean;
  minimumStock: number | string;
  maximumStock?: number | string | null;
  reorderLevel: number | string;
  weight?: number | string | null;
  dimensions?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  vatRate?: {
    id: string;
    name: string;
    percentage: number;
  } | null;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  vatRateId?: string;
  description?: string;
  brand?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  trackInventory?: boolean;
  minimumStock?: number;
  reorderLevel?: number;
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  vatRateId?: string;
  description?: string;
  brand?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  status?: ProductStatus;
  trackInventory?: boolean;
  minimumStock?: number;
  reorderLevel?: number;
}
