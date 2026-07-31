'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { storesService } from '../../../services/stores';
import { productsService } from '../../../services/products';
import { customersService, CustomerItem } from '../../../services/customers';
import { salesService } from '../../../services/sales';
import { StoreItem } from '../../../types/stores';
import { ProductItem } from '../../../types/products';
import { toast } from 'react-hot-toast';

// Feature Flag Configuration
export const FEATURES = {
  customers: true,
};

const DEV_MODE = true;

interface CartItem {
  product: ProductItem;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

interface PaymentLeg {
  method: string;
  amount: number;
}

export default function DevSalesTestPage() {
  const router = useRouter();
  const { userRole, isAuthenticated, profile, decoded } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Role gate: Only authenticated OWNER users can access this developer helper page
  useEffect(() => {
    if (!isMounted) return;

    console.log('[DevSalesTestPage] Auth Status check triggered:', {
      isAuthenticated,
      userRole,
      profile,
      decoded,
      DEV_MODE,
      localAccessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    });

    if (!isAuthenticated) {
      console.log('[DevSalesTestPage] Redirecting to /login because isAuthenticated is false.');
      router.push('/login');
    } else if (!DEV_MODE) {
      const isOwnerRole = 
        userRole === 'OWNER' || 
        profile?.role?.name?.toUpperCase() === 'OWNER' ||
        decoded?.roleName?.toUpperCase() === 'OWNER';

      if (!isOwnerRole) {
        console.log('[DevSalesTestPage] Redirecting to /dashboard: Access denied. Not an OWNER.');
        toast.error('Access denied. Dev Sales Test tool is restricted to OWNER roles.');
        router.push('/dashboard');
      }
    }
  }, [isMounted, isAuthenticated, userRole, profile, decoded, router]);

  // States
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Cart and Payment States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentLeg[]>([{ method: 'CASH', amount: 0 }]);

  // Dev metrics and debug panel states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestPayload, setRequestPayload] = useState<any>(null);
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [activeSaleDetail, setActiveSaleDetail] = useState<any>(null);

  // Void confirmation state
  const [voidingSaleId, setVoidingSaleId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  // Load Initial Data
  const loadInitialData = async () => {
    try {
      const storesRes = await storesService.getAll({ page: 1, limit: 100 });
      setStores(storesRes.data || []);
      if (storesRes.data && storesRes.data.length > 0) {
        setSelectedStoreId(storesRes.data[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load stores:', err);
    }

    if (FEATURES.customers) {
      try {
        const custRes = await customersService.getAll({ page: 1, limit: 100 });
        setCustomers(custRes.items);
      } catch (custErr) {
        console.warn('Customer module GET endpoint is not implemented yet. Guest mode only.');
        setCustomers([]);
      }
    } else {
      setCustomers([]);
    }

    try {
      await refreshProductsAndSales();
    } catch (err) {
      console.warn('Failed to load products/sales:', err);
    }
  };

  const refreshProductsAndSales = async () => {
    try {
      const prodRes = await productsService.getProducts({ page: 1, limit: 100 });
      setProducts(prodRes.data || []);
    } catch (err) {
      console.warn('Failed to load products:', err);
    }

    try {
      const salesRes = await salesService.getAll({ page: 1, limit: 10 });
      setRecentSales(salesRes.data || []);
    } catch (err) {
      console.warn('Failed to load recent sales:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Cart Mechanics
  const addToCart = (product: ProductItem) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updateCartQty(product.id, existing.quantity + 1);
    } else {
      setCart([...cart, { product, quantity: 1, unitPrice: Number(product.sellingPrice), discountAmount: 0 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const updateCartDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, discountAmount: Math.max(0, discount) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Financial calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.quantity * item.unitPrice - item.discountAmount;
      const lineSubtotalBounded = Math.max(0, lineSubtotal);
      subtotal += lineSubtotalBounded;

      // Extract VAT rate percentage dynamically from the product's resolved database properties
      const vatPercent = item.product?.vatRate?.percentage 
        ? Number(item.product.vatRate.percentage) 
        : 0;
      
      if (vatPercent > 0) {
        tax += (lineSubtotalBounded * vatPercent) / 100;
      }
    });

    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Keep single payment total aligned to grand total when not split
  useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ method: payments[0].method, amount: Number(total.toFixed(2)) }]);
    }
  }, [total]);

  // Payment splits mechanics
  const handleSplitChange = (index: number, field: 'method' | 'amount', value: any) => {
    const newPayments = [...payments];
    if (field === 'method') {
      newPayments[index].method = value;
    } else {
      newPayments[index].amount = Math.max(0, Number(value));
    }
    setPayments(newPayments);
  };

  const addPaymentLeg = () => {
    const currentSum = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, Number((total - currentSum).toFixed(2)));
    setPayments([...payments, { method: 'CARD', amount: remaining }]);
  };

  const removePaymentLeg = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const autoBalancePayments = () => {
    if (payments.length <= 1) return;
    const currentLegs = [...payments];
    const sumExceptLast = currentLegs.slice(0, -1).reduce((acc, p) => acc + p.amount, 0);
    currentLegs[currentLegs.length - 1].amount = Math.max(0, Number((total - sumExceptLast).toFixed(2)));
    setPayments(currentLegs);
  };

  // Handle Search Filtering
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  });

  // Complete Sale
  const handleCompleteSale = async () => {
    if (!selectedStoreId) {
      toast.error('Please select a store.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    const payload = {
      storeId: selectedStoreId,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
      })),
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
      })),
      customerId: selectedCustomerId || undefined,
      notes: notes || undefined,
    };

    setRequestPayload(payload);
    setResponsePayload(null);
    setValidationErrors([]);
    setHttpStatus(null);
    setExecutionTime(null);
    setIsSubmitting(true);

    const startTime = performance.now();

    try {
      const res = await salesService.create(payload);
      const endTime = performance.now();
      
      setExecutionTime(Math.round(endTime - startTime));
      setHttpStatus(201);
      setResponsePayload(res);
      toast.success('Sale Created Successfully!');

      // Reset
      setCart([]);
      setPayments([{ method: 'CASH', amount: 0 }]);
      setNotes('');
      setSelectedCustomerId('');
      refreshProductsAndSales();
    } catch (err: any) {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      
      const status = err.response?.status || 500;
      setHttpStatus(status);

      const errData = err.response?.data;
      setResponsePayload(errData || err.message);

      if (errData && errData.message) {
        if (Array.isArray(errData.message)) {
          setValidationErrors(errData.message);
        } else {
          setValidationErrors([errData.message]);
        }
        toast.error(`Error: ${errData.error || 'Failed to create sale'}`);
      } else {
        setValidationErrors([err.message || 'Unknown error occurred']);
        toast.error('Connection or internal server error.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Void Sale
  const handleVoidSale = async () => {
    if (!voidingSaleId) return;
    if (voidReason.length < 5) {
      toast.error('Please specify a reason containing at least 5 characters.');
      return;
    }

    try {
      await salesService.void(voidingSaleId, voidReason);
      toast.success('Sale voided successfully. Stock restored.');
      setVoidingSaleId(null);
      setVoidReason('');
      refreshProductsAndSales();
      if (activeSaleDetail && activeSaleDetail.id === voidingSaleId) {
        setActiveSaleDetail(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to void sale';
      toast.error(typeof msg === 'string' ? msg : 'Error voiding sale');
    }
  };

  const fetchSaleDetail = async (id: string) => {
    try {
      const res = await salesService.getById(id);
      setActiveSaleDetail(res);
    } catch (err) {
      toast.error('Failed to load sale details.');
    }
  };

  if (!isMounted || !isAuthenticated || userRole !== 'OWNER') {
    return <div className="p-8 text-center text-slate-400">Loading Developer Sales Testing Panel...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8 px-4 text-slate-100">
      {/* Header and Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-500 tracking-tight">Developer Sales Testing</h1>
          <p className="text-slate-400 text-sm mt-1">Direct integration interface for validation of Sales and Inventory Transaction Engines.</p>
        </div>
        <div className="mt-4 md:mt-0 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-3 py-1.5 rounded-md flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Internal Development Tool:</strong> Interacts with the real database. Do not use in production.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Setup & Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Store & Customer Selection */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Session Parameters</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Store</label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {FEATURES.customers && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Selection</label>
                      {selectedCustomerId && (
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId('')}
                          className="text-[10px] text-red-500 hover:text-red-400 font-bold"
                        >
                          ✕ Guest Checkout
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium"
                    >
                      <option value="">Guest checkout (Default)</option>
                      {Array.isArray(customers) && customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName || ''} ({c.code} — {c.phone || 'No Phone'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {FEATURES.customers && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search customers by name, phone, or code..."
                    onChange={async (e) => {
                      const query = e.target.value;
                      try {
                        const custRes = await customersService.getAll({ search: query, page: 1, limit: 100 });
                        setCustomers(custRes.items);
                      } catch (err) {
                        console.error('Failed search:', err);
                        setCustomers([]);
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Product Search */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-2 gap-4">
              <h2 className="text-lg font-bold text-slate-200">Catalog Registry</h2>
              <input
                type="text"
                placeholder="Search catalog by name, sku, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 pr-1">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No products found. Re-check tenant catalog.</div>
              ) : (
                filteredProducts.map((p) => {
                  const hasStock = p.trackInventory ? Number(p.minimumStock) > 0 : true; // visual guidance
                  return (
                    <div key={p.id} className="flex justify-between items-center py-3 group gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          SKU: <span className="text-slate-400 font-mono">{p.sku}</span> | Unit: {p.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-slate-200">£{Number(p.sellingPrice).toFixed(2)}</div>
                          <div className="text-xs text-slate-400">
                            Stock: {p.trackInventory ? <span className="font-semibold">{Number(p.minimumStock)}</span> : 'Unlimited'}
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-blue-650 hover:bg-blue-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Shopping Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
            <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 flex justify-between">
              <span>Shopping Cart</span>
              <span className="text-xs text-slate-400 font-normal self-center">{cart.length} item(s)</span>
            </h2>

            {/* Cart Table */}
            {cart.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg">
                Cart is empty. Add products from the catalog to begin checkout simulation.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{item.product.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold">
                            {item.product.vatRate ? `${item.product.vatRate.name} (${Number(item.product.vatRate.percentage)}%)` : 'No VAT'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-400 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 hover:bg-slate-800 rounded flex items-center justify-center font-bold text-slate-400"
                          >
                            -
                          </button>
                          <span className="px-2 text-slate-200 font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 hover:bg-slate-800 rounded flex items-center justify-center font-bold text-slate-400"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex gap-2 items-center">
                          <span className="text-slate-500">Disc:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountAmount || ''}
                            onChange={(e) => updateCartDiscount(item.product.id, Number(e.target.value))}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200"
                            placeholder="£0.00"
                          />
                        </div>

                        <div className="text-right font-bold text-slate-300">
                          £{Math.max(0, item.quantity * item.unitPrice - item.discountAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs space-y-2 font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated VAT (Dynamic)</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-bold text-sm border-t border-slate-800 pt-2 mt-1">
                    <span>Estimated Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Split Payments Leg */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payments Split</span>
                    <button
                      type="button"
                      onClick={addPaymentLeg}
                      className="text-xs text-blue-500 hover:text-blue-400"
                    >
                      + Add Payment Leg
                    </button>
                  </div>

                  <div className="space-y-2">
                    {payments.map((p, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={p.method}
                          onChange={(e) => handleSplitChange(idx, 'method', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI</option>
                        </select>
                        <input
                          type="number"
                          value={p.amount || ''}
                          onChange={(e) => handleSplitChange(idx, 'amount', e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 flex-1"
                          placeholder="Amount"
                        />
                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePaymentLeg(idx)}
                            className="text-red-500 text-xs px-2 hover:bg-slate-800 rounded"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {payments.length > 1 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={autoBalancePayments}
                        className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 px-3 py-1.5 rounded-lg flex-1 transition"
                      >
                        Auto-Balance Payments
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Enter customer requests, shipping info, or dev comments..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing Transaction...' : 'Complete Sale & Decrement Stock'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEVELOPER METRICS & DEBUG PANEL */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Dev Debug Drawer</h2>
        
        {/* Error Output Panel */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-xs space-y-1.5 font-mono">
            <div className="font-bold">❌ Backend Rejected Transaction:</div>
            <ul className="list-disc list-inside">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 block mb-1">HTTP STATUS</span>
            <span className={`font-bold text-sm ${httpStatus === 201 ? 'text-green-400' : httpStatus ? 'text-red-400' : 'text-slate-400'}`}>
              {httpStatus ?? 'Awaiting Request'}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 block mb-1">EXECUTION TIME</span>
            <span className="font-bold text-sm text-blue-400">
              {executionTime !== null ? `${executionTime}ms` : '—'}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 block mb-1">PAYLOAD READY</span>
            <span className="font-bold text-sm text-yellow-400">
              {requestPayload ? 'COMPRESSED DTO' : 'EMPTY'}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 block mb-1">VALIDATION FILTER</span>
            <span className="font-bold text-sm text-purple-400">Prisma Guard (OK)</span>
          </div>
        </div>

        {/* Collapsible Request/Response Details */}
        {(requestPayload || responsePayload) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {requestPayload && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold">Outgoing CreateSaleDto JSON:</span>
                <pre className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-60 overflow-y-auto text-slate-300">
                  {JSON.stringify(requestPayload, null, 2)}
                </pre>
              </div>
            )}
            {responsePayload && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold">Backend Engine Response Payload:</span>
                <pre className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-60 overflow-y-auto text-slate-300">
                  {JSON.stringify(responsePayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RECENT SALES & VOID UTILITY */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Sales Registry Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Receipt Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/50">
                  <td className="p-3 font-mono font-bold text-slate-200">{s.invoiceNumber}</td>
                  <td className="p-3 font-mono">{s.receiptNumber}</td>
                  <td className="p-3">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3">{s.cashier?.firstName} {s.cashier?.lastName}</td>
                  <td className="p-3 font-bold text-slate-200 font-mono">£{Number(s.total).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => fetchSaleDetail(s.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
                    >
                      View Details
                    </button>
                    {s.status === 'COMPLETED' && (
                      <button
                        onClick={() => setVoidingSaleId(s.id)}
                        className="bg-red-950 hover:bg-red-900 text-red-400 px-2 py-1 rounded transition"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {activeSaleDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-blue-500 font-mono">{activeSaleDetail.invoiceNumber}</h3>
              <button onClick={() => setActiveSaleDetail(null)} className="text-slate-400 hover:text-slate-200 text-sm">✕ Close</button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span>{new Date(activeSaleDetail.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Receipt No:</span><span className="font-mono">{activeSaleDetail.receiptNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Store:</span><span>{activeSaleDetail.store?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Cashier:</span><span>{activeSaleDetail.cashier?.firstName} {activeSaleDetail.cashier?.lastName}</span></div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Snapshot Items</h4>
              <div className="divide-y divide-slate-800/60 bg-slate-950 p-2.5 rounded-lg border border-slate-850 max-h-40 overflow-y-auto">
                {activeSaleDetail.items.map((i: any) => (
                  <div key={i.id} className="py-2 flex justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-300">{i.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{i.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300">{i.quantity} × £{Number(i.unitPrice).toFixed(2)}</div>
                      <div className="text-slate-500 text-[10px]">{i.discountAmount > 0 ? `Disc: -£${Number(i.discountAmount).toFixed(2)}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400">Grand Total:</span>
              <span className="font-extrabold text-sm text-slate-200 font-mono">£{Number(activeSaleDetail.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Void Reason Dialog */}
      {voidingSaleId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-red-500">Void Sale Transaction</h3>
            <p className="text-xs text-slate-400">This action will restore stock balances and generate RETURN movements. Specify a reason for audit tracking.</p>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Reason (Min 5 characters)</label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                placeholder="Returned by customer / Clerk error"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setVoidingSaleId(null); setVoidReason(''); }}
                className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidSale}
                className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition font-bold"
              >
                Void Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
