'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../../services/products';
import {
  Boxes,
  AlertTriangle,
  ArrowDownUp,
  Warehouse,
  History,
  TrendingDown,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryPage() {
  const [search, setSearch] = useState('');

  // Load real catalog counts
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => productsService.getAll({ limit: 100 }),
  });
  const products = productsData?.data ?? [];

  const lowStockItems = products.filter(
    (p) => Number(p.minimumStock) <= Number(p.reorderLevel) && Number(p.minimumStock) > 0,
  );
  const outOfStockItems = products.filter((p) => Number(p.minimumStock) === 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="w-8 h-8 text-primary" />
            Inventory Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime tracking of stock levels, reserved balances, low stock alerts, and transfers.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Stock Hand
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {isLoading ? '...' : products.reduce((acc, p) => acc + Number(p.minimumStock), 0)} PCS
            </h2>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <h2 className="text-2xl font-black text-amber-500 tracking-tight">
              {isLoading ? '...' : lowStockItems.length} SKU(s)
            </h2>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Out of Stock
            </span>
            <h2 className="text-2xl font-black text-destructive tracking-tight">
              {isLoading ? '...' : outOfStockItems.length} SKU(s)
            </h2>
          </div>
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Catalog Stock Levels */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-foreground">Outlet Stock Balances</h3>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                placeholder="Filter SKU or item..."
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">Loading levels...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No matching inventory items.</p>
            ) : (
              filteredProducts.map((p) => {
                const stock = Number(p.minimumStock);
                const reorder = Number(p.reorderLevel);
                const isLow = stock <= reorder && stock > 0;
                const isOut = stock === 0;

                return (
                  <div key={p.id} className="flex justify-between items-center py-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">SKU: {p.sku}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-bold font-mono ${isOut ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
                          {stock} PCS
                        </p>
                        <p className="text-[9px] text-muted-foreground">Min Limit: {reorder}</p>
                      </div>
                      {isOut ? (
                        <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[8px] font-bold uppercase">Out</span>
                      ) : isLow ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase">Low</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase">Ok</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Simulated Stock Movement History */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-base text-foreground">Stock Log History</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">Recent changes in this tenant organization:</p>

          <div className="space-y-4 pt-2">
            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg self-start">
                <ArrowDownUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Barcode Scanner Pro adjusted</p>
                <p className="text-[10px] text-muted-foreground">+20 stock adjustment (Manual)</p>
                <span className="text-[9px] text-muted-foreground">Today at 2:44 PM</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg self-start">
                <Warehouse className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Transfer STORE-001 → STORE-002</p>
                <p className="text-[10px] text-muted-foreground">10 items of Thermal receipt roll</p>
                <span className="text-[9px] text-muted-foreground">Yesterday at 5:12 PM</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg self-start">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Low stock alert triggered</p>
                <p className="text-[10px] text-muted-foreground">POS Terminal V2 dropped below 5</p>
                <span className="text-[9px] text-muted-foreground">Jul 28 at 10:15 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
