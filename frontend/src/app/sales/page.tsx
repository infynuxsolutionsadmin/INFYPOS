'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { salesService, QuerySaleParams } from '@/services/sales';
import { storesService } from '@/services/stores';
import { customersService, CustomerItem } from '@/services/customers';
import { StoreItem } from '@/types/stores';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Search, RotateCcw, Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function SalesHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Authentication gate
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // States
  const [sales, setSales] = useState<any[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter conditions
  const [filters, setFilters] = useState<QuerySaleParams>({
    page: 1,
    limit: 10,
    search: '',
    storeId: '',
    customerId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const loadDropdownFilters = async () => {
    try {
      const storesRes = await storesService.getAll({ page: 1, limit: 100 });
      setStores(storesRes.data || []);
      
      const custRes = await customersService.getAll({ page: 1, limit: 100 });
      setCustomers(custRes.items);
    } catch (err) {
      console.warn('Fallback loading dropdown options:', err);
      setCustomers([]);
    }
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      // Clean undefined and empty strings out of filters
      const cleanParams: QuerySaleParams = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== undefined && val !== null) {
          cleanParams[key as keyof QuerySaleParams] = val as any;
        }
      });

      const res = await salesService.getAll(cleanParams);
      setSales(res.data || []);
      setTotalItems(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDropdownFilters();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSalesData();
    }
  }, [isAuthenticated, filters.page, filters.storeId, filters.customerId, filters.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchSalesData();
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      storeId: '',
      customerId: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales History"
        description="Monitor location transactions, inspect receipts, and manage refunds or void requests."
      />

      {/* Filters Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoice or receipt..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={filters.storeId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, storeId: e.target.value, page: 1 }))}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="VOIDED">VOIDED</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="PARKED">PARKED</option>
            </select>
          </div>

          <div>
            <select
              value={filters.customerId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value, page: 1 }))}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All Customers</option>
              {Array.isArray(customers) && customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName || ''} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Date From</span>
            </div>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="bg-background border border-input rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="bg-background border border-input rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="text-xs">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Filters
            </Button>
            <Button size="sm" onClick={fetchSalesData} className="text-xs">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Sales Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                <div className="h-5 w-1/6 bg-muted animate-pulse rounded" />
                <div className="h-5 w-1/5 bg-muted animate-pulse rounded" />
                <div className="h-5 w-1/12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            No sales logs found matching the current query criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-left font-medium">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Receipt No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Cashier</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-200">{sale.invoiceNumber}</td>
                    <td className="p-4 font-mono text-xs">{sale.receiptNumber}</td>
                    <td className="p-4">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      {sale.customer
                        ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`
                        : 'Guest'}
                    </td>
                    <td className="p-4">{sale.cashier?.firstName} {sale.cashier?.lastName || ''}</td>
                    <td className="p-4 text-xs">{sale.store?.name}</td>
                    <td className="p-4 font-bold font-mono text-slate-200">
                      £{Number(sale.total).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-400'
                            : sale.status === 'VOIDED'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/sales/${sale.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {filters.page} of {totalPages} ({totalItems} transactions)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={filters.page === totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
