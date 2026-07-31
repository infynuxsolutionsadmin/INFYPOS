'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { salesService } from '@/services/sales';
import { api } from '@/services/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User, Phone, Mail, Award, Calendar, Receipt, ShoppingBag } from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  
  const id = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculated metrics
  const [metrics, setMetrics] = useState({
    lifetimeSpend: 0,
    averageOrderValue: 0,
    purchaseCount: 0,
    lastPurchaseDate: '—',
  });

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch customer details
      const custRes = await api.get<any>(`/customers/${id}`);
      // Backend envelope: { success, statusCode, data: <customer object> }
      setCustomer(custRes.data?.data ?? custRes.data);

      // 2. Fetch customer transaction records using existing sales API filtered by customerId
      const salesRes = await salesService.getAll({ customerId: id, page: 1, limit: 100 });
      const customerSales = Array.isArray(salesRes?.data?.data) ? salesRes.data.data
        : Array.isArray(salesRes?.data) ? salesRes.data : [];
      setSales(customerSales);

      // Calculate lifetime spend and stats
      const completedSales = customerSales.filter((s: any) => s.status === 'COMPLETED');
      const totalSpend = completedSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const count = completedSales.length;
      const avg = count > 0 ? totalSpend / count : 0;
      
      let lastDate = '—';
      if (completedSales.length > 0) {
        const sorted = [...completedSales].sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        lastDate = new Date(sorted[0].createdAt).toLocaleDateString();
      }

      setMetrics({
        lifetimeSpend: totalSpend,
        averageOrderValue: avg,
        purchaseCount: count,
        lastPurchaseDate: lastDate,
      });

    } catch (err) {
      toast.error('Failed to load customer profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchCustomerDetails();
    }
  }, [id, isAuthenticated, isMounted]);

  if (!isMounted || !isAuthenticated) return null;
  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading profile details...</div>;
  if (!customer) return <div className="p-8 text-center text-slate-400">Customer details not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
      </div>

      <PageHeader
        title={`${customer.firstName} ${customer.lastName || ''}`}
        description={`Customer profile details and loyalty spend ledger`}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Lifetime Spend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-slate-200">£{metrics.lifetimeSpend.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Average Ticket</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-slate-200">£{metrics.averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-200">{metrics.purchaseCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Last Purchase</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-slate-200">{metrics.lastPurchaseDate}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card details */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900 border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                <span>Contact Card</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-2 rounded-lg border border-border/40">
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Loyalty Balance</div>
                  <div className="text-sm font-bold text-slate-200">{customer.loyaltyPoints ?? 0} pts</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-2 rounded-lg border border-border/40">
                  <Mail className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Email Address</div>
                  <div className="text-xs font-mono text-slate-200">{customer.email || 'None'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-2 rounded-lg border border-border/40">
                  <Phone className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Contact Phone</div>
                  <div className="text-xs text-slate-200">{customer.phone || 'None'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-2 rounded-lg border border-border/40">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Profile Created</div>
                  <div className="text-xs text-slate-200">{new Date(customer.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-slate-900 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                <span>Purchase History</span>
              </CardTitle>
              <CardDescription>Transaction invoices associated with this profile</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {sales.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No transaction activity logged under this account.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-border">
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Processed Date</th>
                      <th className="p-3 text-right">Invoice Total</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-muted/10">
                        <td className="p-3 font-mono font-semibold text-slate-200">{sale.invoiceNumber}</td>
                        <td className="p-3">{new Date(sale.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-right font-bold font-mono">£{Number(sale.total).toFixed(2)}</td>
                        <td className="p-3">
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
                        <td className="p-3 text-right">
                          <Link href={`/sales/${sale.id}`}>
                            <Button size="sm" variant="outline" className="text-[10px] py-1 h-7">
                              Inspect Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
