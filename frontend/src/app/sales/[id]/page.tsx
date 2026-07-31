'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { salesService } from '@/services/sales';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Printer, RefreshCcw, ShieldAlert, ShoppingBag, FileText, UserCheck, Calendar } from 'lucide-react';

export default function SaleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, decoded } = useAuth();
  
  const id = params?.id as string;

  const [sale, setSale] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidModal, setShowVoidModal] = useState(false);

  // Authorization Check
  const hasVoidPermission = decoded?.permissions?.includes('sales:void') || false;

  const fetchSaleDetails = async () => {
    setIsLoading(true);
    try {
      const data = await salesService.getById(id);
      setSale(data);
    } catch (err) {
      toast.error('Failed to load transaction details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchSaleDetails();
    }
  }, [id, isAuthenticated]);

  const handleVoidTransaction = async () => {
    if (voidReason.length < 5) {
      toast.error('Specify a reason with at least 5 characters.');
      return;
    }
    setIsVoiding(true);
    try {
      await salesService.void(id, voidReason);
      toast.success('Sale voided successfully. Stock restored.');
      setShowVoidModal(false);
      setVoidReason('');
      fetchSaleDetails();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to void sale';
      toast.error(typeof msg === 'string' ? msg : 'Error voiding transaction.');
    } finally {
      setIsVoiding(false);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = document.getElementById('receipt-element')?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt Print</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; background: #fff; line-height: 1.4; font-size: 13px; }
            .receipt { max-width: 320px; margin: 0 auto; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .margin-y { margin: 5px 0; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="receipt">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading details...</div>;
  if (!sale) return <div className="p-8 text-center text-slate-400">Transaction record not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/sales')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to History
        </Button>
      </div>

      <PageHeader
        title={sale.invoiceNumber}
        description={`Processed on ${new Date(sale.createdAt).toLocaleString()} at ${sale.store?.name}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={printReceipt}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print Receipt
            </Button>
            {sale.status === 'COMPLETED' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowVoidModal(true)}
              >
                <ShieldAlert className="h-4 w-4 mr-1.5" />
                Void Transaction
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detail Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-border">
              <CardHeader className="p-4 pb-2 flex-row items-center gap-2 space-y-0">
                <UserCheck className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-sm font-semibold">Store Context</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs space-y-1">
                <div>Name: <strong>{sale.store?.name}</strong></div>
                <div>Code: <span className="font-mono text-slate-400">{sale.store?.code}</span></div>
                <div>Cashier: <strong>{sale.cashier?.firstName} {sale.cashier?.lastName}</strong></div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-border">
              <CardHeader className="p-4 pb-2 flex-row items-center gap-2 space-y-0">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold">Customer</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs space-y-1">
                {sale.customer ? (
                  <>
                    <div>Name: <strong>{sale.customer.firstName} {sale.customer.lastName || ''}</strong></div>
                    <div>Code: <span className="font-mono text-slate-400">{sale.customer.code}</span></div>
                    <div>Phone: <span>{sale.customer.phone || 'No Phone'}</span></div>
                  </>
                ) : (
                  <div className="text-slate-400 italic">Guest Checkout</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-border">
              <CardHeader className="p-4 pb-2 flex-row items-center gap-2 space-y-0">
                <Calendar className="h-4 w-4 text-purple-400" />
                <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs space-y-1">
                <div>Status: <span className="font-bold">{sale.status}</span></div>
                <div>Payment: <span className="font-bold">{sale.paymentStatus}</span></div>
                <div>Subtotal: <span className="font-mono">£{Number(sale.subtotal).toFixed(2)}</span></div>
              </CardContent>
            </Card>
          </div>

          {/* Items Sold */}
          <Card className="bg-slate-900 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <span>Items Sold</span>
              </CardTitle>
              <CardDescription>Products snapshot matching transaction logs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider border-b border-border">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.items.map((i: any) => (
                    <tr key={i.id} className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-slate-200">{i.productName}</td>
                      <td className="p-3 font-mono text-slate-400">{i.sku}</td>
                      <td className="p-3 font-bold">{i.quantity}</td>
                      <td className="p-3 font-mono">£{Number(i.unitPrice).toFixed(2)}</td>
                      <td className="p-3 font-mono text-red-400">
                        {Number(i.discountAmount) > 0 ? `-£${Number(i.discountAmount).toFixed(2)}` : '£0.00'}
                      </td>
                      <td className="p-3 text-right font-bold font-mono">£{Number(i.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Payments summary */}
          <Card className="bg-slate-900 border-border">
            <CardHeader>
              <CardTitle className="text-base">Payments Split Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sale.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-border/40 text-xs">
                  <div>
                    Method: <span className="font-bold">{p.method}</span>
                    {p.transactionRef && (
                      <span className="text-slate-500 font-mono ml-2">({p.transactionRef})</span>
                    )}
                  </div>
                  <div className="font-bold font-mono text-slate-200">£{Number(p.amount).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Receipt JSON Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span>Receipt Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Receipt Component */}
              <div
                id="receipt-element"
                className="bg-white text-slate-900 p-5 rounded-lg border border-slate-200 font-mono text-xs shadow-inner space-y-3"
              >
                <div className="center">
                  <div className="bold text-sm uppercase">{sale.store?.name}</div>
                  <div>Code: {sale.store?.code}</div>
                  {sale.store?.phone && <div>Tel: {sale.store.phone}</div>}
                  <div className="divider"></div>
                </div>

                <div className="space-y-1">
                  <div className="row">
                    <span>Invoice:</span>
                    <span className="bold">{sale.invoiceNumber}</span>
                  </div>
                  <div className="row">
                    <span>Receipt:</span>
                    <span className="bold">{sale.receiptNumber}</span>
                  </div>
                  <div className="row">
                    <span>Date:</span>
                    <span>{new Date(sale.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="row">
                    <span>Cashier:</span>
                    <span>{sale.cashier?.firstName}</span>
                  </div>
                  {sale.customer && (
                    <div className="row">
                      <span>Customer:</span>
                      <span>{sale.customer.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="divider"></div>

                {/* Items */}
                <div className="space-y-1.5">
                  {sale.items.map((i: any) => (
                    <div key={i.id} className="space-y-0.5">
                      <div className="bold">{i.productName}</div>
                      <div className="row text-[11px] text-slate-600">
                        <span>{i.quantity} x £{Number(i.unitPrice).toFixed(2)}</span>
                        <span>£{Number(i.total).toFixed(2)}</span>
                      </div>
                      {Number(i.discountAmount) > 0 && (
                        <div className="row text-[10px] text-red-500 italic">
                          <span>Discount:</span>
                          <span>-£{Number(i.discountAmount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="divider"></div>

                <div className="space-y-1">
                  <div className="row">
                    <span>Subtotal:</span>
                    <span>£{Number(sale.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="row">
                    <span>Tax (20% VAT):</span>
                    <span>£{Number(sale.taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="row bold text-sm border-t border-slate-200 pt-1 mt-1">
                    <span>Total:</span>
                    <span>£{Number(sale.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="space-y-1">
                  <div className="bold">Payments:</div>
                  {sale.payments.map((p: any) => (
                    <div key={p.id} className="row text-[11px]">
                      <span>{p.method}:</span>
                      <span>£{Number(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="divider"></div>
                <div className="center text-[10px] text-slate-500 italic">
                  Thank you for your purchase!
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Void Reason Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 text-slate-200">
            <h3 className="text-lg font-bold text-red-500">Void Transaction</h3>
            <p className="text-xs text-slate-400">Specify the justification details for auditing records. Stock balances will be restored.</p>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Voiding Reason (min 5 chars)</label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                placeholder="Clerk mistake / Customer return"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowVoidModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleVoidTransaction} disabled={isVoiding}>
                {isVoiding ? 'Voiding...' : 'Void Transaction'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
