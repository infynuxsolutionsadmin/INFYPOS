import { api } from './api';

export interface VatRateItem {
  id: string;
  tenantId: string;
  taxId: string;
  name: string;
  percentage: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const vatService = {
  async getVatRates(): Promise<VatRateItem[]> {
    const res = await api.get<any>('/vat/rates');
    // Global TransformInterceptor unwraps payload inside res.data.data
    return res.data.data ?? [];
  },

  async getVatRate(id: string): Promise<VatRateItem> {
    const res = await api.get<any>(`/vat/rates/${id}`);
    return res.data.data;
  },
};

export default vatService;
